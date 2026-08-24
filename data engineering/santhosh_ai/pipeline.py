"""
Pipeline Controller: Master Conflict & Change Detection Engine for Santhosh's AI Module.
Integrates Data Conflict, Spatial Conflict, Temporal Change Detection, Severity Scoring,
Critical Conflict Resolution with Authoritative Official Documents, and Explanation Generation.
"""

from typing import List, Dict, Any, Optional, Union
from .models import (
    ConflictItem,
    ChangeItem,
    SeverityLevel,
    ParcelAnalysisResult
)
from .data_conflict_detector import DataConflictDetector
from .spatial_conflict_detector import SpatialConflictDetector
from .change_detector import ChangeDetector
from .severity_classifier import SeverityClassifier
from .explainer import ConflictExplainer
from .resolution_engine import CriticalConflictResolver


class ConflictAndChangeDetector:
    """
    Main entry point for Santhosh's AI Conflict & Change Detection Module.
    """

    def __init__(
        self,
        area_tolerance_pct: float = 1.5,
        min_overlap_area_m2: float = 5.0,
        max_boundary_deviation_m: float = 2.0,
        min_shape_iou: float = 0.85
    ):
        self.data_detector = DataConflictDetector(area_tolerance_pct=area_tolerance_pct)
        self.spatial_detector = SpatialConflictDetector(
            min_overlap_area_m2=min_overlap_area_m2,
            max_boundary_deviation_m=max_boundary_deviation_m,
            min_shape_iou=min_shape_iou
        )
        self.change_detector = ChangeDetector()
        self.severity_classifier = SeverityClassifier()
        self.explainer = ConflictExplainer()
        self.resolver = CriticalConflictResolver()

    def analyze_parcel(
        self,
        parcel_id: str,
        matched_records: Optional[List[Dict[str, Any]]] = None,
        cadastral_geometry: Optional[Dict[str, Any]] = None,
        survey_geometry: Optional[Dict[str, Any]] = None,
        temporal_snapshots: Optional[List[Dict[str, Any]]] = None,
        official_documents: Optional[List[Dict[str, Any]]] = None,
        extra_conflicts: Optional[List[ConflictItem]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ParcelAnalysisResult:
        """
        Runs comprehensive data conflict, spatial conflict, temporal change detection,
        and authoritative critical conflict resolution for a single parcel.
        """
        conflicts: List[ConflictItem] = []
        changes: List[ChangeItem] = []

        # Extract survey numbers and owners from matched_records & metadata
        survey_number = ""
        owners: List[str] = []

        if matched_records:
            for rec in matched_records:
                # Survey number extraction
                sn = rec.get("survey_number")
                if sn and not survey_number:
                    survey_number = str(sn).strip()
                
                # Owner extraction
                ow = rec.get("owner_name", rec.get("owner"))
                if ow is not None:
                    ow_str = str(ow).strip()
                    if ow_str and ow_str.lower() not in ["none", "null", "missing", "nan", "na", "unknown"]:
                        if ow_str not in owners:
                            owners.append(ow_str)

        if not survey_number and metadata:
            sn = metadata.get("survey_number")
            if sn:
                survey_number = str(sn).strip()

        if not owners and metadata:
            ow = metadata.get("owner_name", metadata.get("owner"))
            if ow is not None:
                ow_str = str(ow).strip()
                if ow_str and ow_str.lower() not in ["none", "null", "missing", "nan", "na", "unknown"]:
                    if ow_str not in owners:
                        owners.append(ow_str)

        if not survey_number:
            survey_number = parcel_id

        # 1. Data Conflicts
        if matched_records:
            data_conflicts = self.data_detector.detect_conflicts(matched_records)
            conflicts.extend(data_conflicts)

        # 2. Spatial Geometry Conflicts
        rec_area_acres = None
        if matched_records and len(matched_records) > 0:
            rec_area_acres, _ = DataConflictDetector.parse_area_value(matched_records[0].get("area"))

        if cadastral_geometry or survey_geometry:
            spatial_conflicts = self.spatial_detector.detect_single_parcel_geometry_conflicts(
                cadastral_geom=cadastral_geometry,
                survey_geom=survey_geometry,
                recorded_area_acres=rec_area_acres
            )
            conflicts.extend(spatial_conflicts)

        # Add any injected extra conflicts (e.g. from neighboring parcel overlap scanning)
        if extra_conflicts:
            conflicts.extend(extra_conflicts)

        # 3. Temporal Change Detection (e.g. 2024 -> 2025 -> 2026)
        if temporal_snapshots:
            detected_changes = self.change_detector.detect_parcel_changes(temporal_snapshots)
            changes.extend(detected_changes)

        # 4. Severity Classification
        overall_severity = self.severity_classifier.classify_overall_severity(conflicts, changes)
        conflict_detected = len(conflicts) > 0 or len(changes) > 0

        # 5. Critical Conflict Resolution & Document Coordinate Extraction
        primary_geom = cadastral_geometry or (
            temporal_snapshots[0].get("geometry") if temporal_snapshots else None
        )
        resolution = self.resolver.resolve_parcel(
            parcel_id=parcel_id,
            survey_number=survey_number,
            owners=owners,
            conflicts=conflicts,
            changes=changes,
            overall_severity=overall_severity,
            conflicting_geometry=primary_geom,
            official_documents=official_documents or [],
            metadata=metadata
        )

        # 6. Natural Language Explanation
        summary = self.explainer.generate_parcel_explanation(
            parcel_id=parcel_id,
            conflicts=conflicts,
            changes=changes,
            overall_severity=overall_severity
        )

        return ParcelAnalysisResult(
            parcel_id=parcel_id,
            conflict_detected=conflict_detected,
            survey_number=survey_number,
            owners=owners,
            conflicts=conflicts,
            changes=changes,
            overall_severity=overall_severity,
            summary=summary,
            resolution=resolution,
            metadata=metadata or {}
        )

    def analyze_dataset(
        self,
        dataset: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Analyzes an entire collection of parcels from a comprehensive dataset JSON structure.
        Performs global inter-parcel spatial overlap scanning, then parcel-level analysis.
        Returns list of results formatted as dicts.
        """
        parcels_data = dataset.get("parcels", [])
        if not parcels_data and isinstance(dataset, list):
            parcels_data = dataset

        # Pre-scan adjacent parcel spatial overlaps
        spatial_scan_parcels = []
        for p in parcels_data:
            geom = p.get("cadastral_geometry") or p.get("geometry") or (
                p.get("temporal_snapshots", [{}])[0].get("geometry") if p.get("temporal_snapshots") else None
            )
            spatial_scan_parcels.append({
                "parcel_id": p.get("parcel_id", "Unknown"),
                "geometry": geom
            })

        overlap_map = self.spatial_detector.detect_adjacent_parcel_conflicts(spatial_scan_parcels)

        # Pre-scan splits/merges across temporal layers if parent/child groups exist
        all_splits_merges: Dict[str, List[ChangeItem]] = {}
        if "temporal_layers" in dataset:
            layers = dataset.get("temporal_layers", {})
            for y_from_str, y_to_str in [("2024", "2025"), ("2025", "2026"), ("2024", "2026")]:
                if y_from_str in layers and y_to_str in layers:
                    sm_changes = self.change_detector.detect_parcel_split_or_merge(
                        parent_parcels=layers[y_from_str],
                        child_parcels=layers[y_to_str],
                        from_year=int(y_from_str),
                        to_year=int(y_to_str)
                    )
                    for sm in sm_changes:
                        target = sm.details.get("parent_parcel") or sm.details.get("merged_parcel")
                        if target:
                            all_splits_merges.setdefault(target, []).append(sm)

        results = []
        for p in parcels_data:
            p_id = p.get("parcel_id", "Unknown")
            extra_conf = overlap_map.get(p_id, [])
            
            # Combine temporal snapshots
            snaps = p.get("temporal_snapshots", [])
            docs = p.get("official_documents", [])
            
            res = self.analyze_parcel(
                parcel_id=p_id,
                matched_records=p.get("matched_records"),
                cadastral_geometry=p.get("cadastral_geometry") or p.get("geometry"),
                survey_geometry=p.get("survey_geometry"),
                temporal_snapshots=snaps,
                official_documents=docs,
                extra_conflicts=extra_conf,
                metadata=p.get("metadata", {})
            )

            # Ingest global split/merge changes if any
            if p_id in all_splits_merges:
                for sm_item in all_splits_merges[p_id]:
                    if sm_item not in res.changes:
                        res.changes.append(sm_item)
                res.conflict_detected = len(res.conflicts) > 0 or len(res.changes) > 0
                res.overall_severity = self.severity_classifier.classify_overall_severity(res.conflicts, res.changes)
                
                # Re-evaluate resolution if severity elevated
                res.resolution = self.resolver.resolve_parcel(
                    parcel_id=p_id,
                    survey_number=res.survey_number,
                    owners=res.owners,
                    conflicts=res.conflicts,
                    changes=res.changes,
                    overall_severity=res.overall_severity,
                    conflicting_geometry=p.get("cadastral_geometry") or p.get("geometry"),
                    official_documents=docs,
                    metadata=p.get("metadata", {})
                )

                res.summary = self.explainer.generate_parcel_explanation(
                    parcel_id=p_id,
                    conflicts=res.conflicts,
                    changes=res.changes,
                    overall_severity=res.overall_severity
                )

            results.append(res.to_dict())

        return results
