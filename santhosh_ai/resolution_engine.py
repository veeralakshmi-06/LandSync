"""
Critical Conflict Resolution Engine for Land Records.
------------------------------------------------------
Role: Santhosh – AI Conflict & Change Detection Lead

Provides authoritative resolution recommendations and coordinate extraction
for land conflicts classified as CRITICAL, strictly adhering to the rules:
1. Never generate, guess, or invent land coordinates.
2. Coordinates must come only from the official survey document or verified authoritative document.
3. If document does not contain usable coordinates, return 'OFFICIAL_COORDINATES_NOT_AVAILABLE'.
4. Do not automatically modify official land records; output recommendations for human review.
"""

from typing import List, Dict, Any, Optional, Tuple
from .models import (
    ConflictItem,
    ChangeItem,
    SeverityLevel,
    ConflictType,
    CriticalResolution,
    OfficialDocumentReference
)
from .geometry_utils import (
    parse_geojson_geometry,
    polygon_area_m2,
    hausdorff_distance_m
)


class CriticalConflictResolver:
    """
    Evaluates parcels with CRITICAL (and HIGH) conflicts to generate
    authoritative document-backed resolutions and coordinate comparisons.
    """

    # Authority rank weights (higher = more authoritative)
    AUTHORITY_RANKS = {
        "SURVEY_SETTLEMENT_AND_LAND_RECORDS": 100,
        "SURVEY_OF_INDIA": 95,
        "REVENUE_DEPARTMENT_BHOOMI": 80,
        "REGISTRATION_DEPARTMENT_KAVERI": 70,
        "TOWN_PLANNING_AUTHORITY": 60,
        "PRIVATE_LICENSED_SURVEYOR": 40,
        "UNKNOWN": 10
    }

    def resolve_parcel(
        self,
        parcel_id: str,
        survey_number: str,
        owners: List[str],
        conflicts: List[ConflictItem],
        changes: List[ChangeItem],
        overall_severity: str,
        conflicting_geometry: Optional[Dict[str, Any]],
        official_documents: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[CriticalResolution]:
        """
        Generates resolution and authoritative coordinate extraction.
        Triggered when severity is CRITICAL or HIGH.
        """
        # If severity is LOW or MEDIUM, resolution structure is not required
        if overall_severity not in [SeverityLevel.CRITICAL.value, SeverityLevel.HIGH.value]:
            return None

        # 1. Select the most authoritative official survey document
        selected_doc, selection_rationale = self._select_authoritative_document(
            official_documents=official_documents or [],
            parcel_id=parcel_id,
            survey_number=survey_number
        )

        # 2. Extract official coordinates from the selected document
        official_coords, coord_source_str, doc_ref = self._extract_official_coordinates(selected_doc)

        # 3. Extract conflicting coordinates
        conflicting_coords = self._format_coordinates(conflicting_geometry)

        # 4. Compute spatial difference if both coordinates are usable
        coord_comparison_result, spatial_diff = self._compare_coordinates(
            conflicting_geom=conflicting_geometry,
            official_doc=selected_doc,
            official_coords=official_coords
        )

        # 5. Determine primary conflict type by highest severity
        critical_conflicts = [c for c in conflicts if c.severity == SeverityLevel.CRITICAL.value]
        high_conflicts = [c for c in conflicts if c.severity == SeverityLevel.HIGH.value]

        if len(critical_conflicts) > 1:
            primary_conflict_type = "MULTIPLE_CRITICAL_CONFLICTS"
        elif len(critical_conflicts) == 1:
            primary_conflict_type = critical_conflicts[0].type
        elif high_conflicts:
            primary_conflict_type = high_conflicts[0].type
        elif conflicts:
            primary_conflict_type = conflicts[0].type
        else:
            primary_conflict_type = "CRITICAL_SPATIAL_OR_RECORD_ANOMALY"

        # 6. Generate tailored recommended solution based on conflict types
        recommended_solution, required_action = self._generate_solution_and_action(
            conflicts=conflicts,
            changes=changes,
            overall_severity=overall_severity,
            official_coords_available=(official_coords != "OFFICIAL_COORDINATES_NOT_AVAILABLE"),
            selected_doc=selected_doc,
            doc_ref_str=coord_source_str,
            spatial_diff=spatial_diff
        )

        resolution = CriticalResolution(
            parcel_id=parcel_id,
            survey_number=survey_number,
            owners=owners,
            conflict_type=primary_conflict_type,
            severity=overall_severity,
            conflicting_coordinates=conflicting_coords,
            official_survey_coordinates=official_coords,
            coordinate_source=coord_source_str,
            source_document=doc_ref,
            coordinate_comparison_result=coord_comparison_result,
            recommended_solution=recommended_solution,
            required_action=required_action,
            status="PENDING_REVIEW",
            spatial_difference=spatial_diff,
            official_geometry=selected_doc.get("geometry") if selected_doc else None
        )

        return resolution

    def _select_authoritative_document(
        self,
        official_documents: List[Dict[str, Any]],
        parcel_id: str,
        survey_number: str
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """
        Selects the most authoritative official survey document based on:
        1. Authority tier / statutory department
        2. Verification status
        3. Recency of document date
        4. Parcel & survey number match
        """
        if not official_documents:
            return None, "No official survey documents are linked to this parcel in the system."

        # Filter docs matching survey number or parcel ID if specified
        matching_docs = []
        for doc in official_documents:
            doc_sn = str(doc.get("survey_number", "")).strip()
            doc_pid = str(doc.get("parcel_id", "")).strip()
            if not doc_sn and not doc_pid:
                matching_docs.append(doc)
            elif doc_sn == survey_number or doc_pid == parcel_id:
                matching_docs.append(doc)
            elif doc_sn in survey_number or survey_number in doc_sn:
                matching_docs.append(doc)

        candidate_docs = matching_docs if matching_docs else official_documents

        def doc_score(d: Dict[str, Any]) -> Tuple[int, int, str]:
            auth_key = str(d.get("authority_type", d.get("authority", "UNKNOWN"))).upper().replace(" ", "_")
            auth_rank = self.AUTHORITY_RANKS.get(auth_key, 50)
            verified_rank = 1 if d.get("verified", True) else 0
            doc_date = str(d.get("date", d.get("doc_date", "1900-01-01")))
            return (auth_rank, verified_rank, doc_date)

        # Sort candidate documents by authority rank desc, verification desc, and date desc
        best_doc = max(candidate_docs, key=doc_score)

        doc_name = best_doc.get("doc_name", best_doc.get("name", "Official Survey Document"))
        doc_no = best_doc.get("doc_id", best_doc.get("document_number", "REF-UNKNOWN"))
        auth = best_doc.get("authority", "Survey Settlement & Land Records Dept")
        date_str = best_doc.get("date", best_doc.get("doc_date", "Recent"))

        rationale = (
            f"Selected '{doc_name}' ({doc_no}) issued by '{auth}' (dated {date_str}) "
            f"as the highest-tier verified statutory authority for Survey No. {survey_number}."
        )

        return best_doc, rationale

    def _extract_official_coordinates(
        self,
        doc: Optional[Dict[str, Any]]
    ) -> Tuple[Any, str, Optional[OfficialDocumentReference]]:
        """
        Extracts verified coordinates from document. If none exist, returns OFFICIAL_COORDINATES_NOT_AVAILABLE.
        """
        if not doc:
            return (
                "OFFICIAL_COORDINATES_NOT_AVAILABLE",
                "Official Survey Document – Not Available in System",
                None
            )

        doc_name = doc.get("doc_name", doc.get("name", "Official Survey Document"))
        doc_no = doc.get("doc_id", doc.get("document_number", "DOC-REF"))
        auth = doc.get("authority", "Survey Settlement & Land Records Dept")
        doc_date = str(doc.get("date", doc.get("doc_date", "N/A")))

        source_str = f"Official Survey Document – {doc_name} [{doc_no}, {auth}, Date: {doc_date}]"

        doc_ref = OfficialDocumentReference(
            doc_id=doc_no,
            doc_name=doc_name,
            authority=auth,
            date=doc_date,
            verified=bool(doc.get("verified", True)),
            notes=doc.get("notes", "Statutory cadastral record")
        )

        # Extract coordinates from document geometry or coordinates field
        geom = doc.get("geometry")
        coords = doc.get("coordinates")

        if geom and "coordinates" in geom and geom["coordinates"]:
            return (geom["coordinates"], source_str, doc_ref)
        elif coords and isinstance(coords, list) and len(coords) > 0:
            return (coords, source_str, doc_ref)
        else:
            return (
                "OFFICIAL_COORDINATES_NOT_AVAILABLE",
                source_str,
                doc_ref
            )

    def _format_coordinates(self, geometry: Optional[Dict[str, Any]]) -> Any:
        """Formats geometry coordinates cleanly."""
        if not geometry:
            return "NO_COORDINATES_IN_RECORD"
        return geometry.get("coordinates", "NO_COORDINATES_IN_RECORD")

    def _compare_coordinates(
        self,
        conflicting_geom: Optional[Dict[str, Any]],
        official_doc: Optional[Dict[str, Any]],
        official_coords: Any
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Calculates and formats the quantitative spatial deviation between
        the conflicting geometry and the authoritative survey document.
        """
        if official_coords == "OFFICIAL_COORDINATES_NOT_AVAILABLE" or not official_doc:
            return (
                "OFFICIAL_COORDINATES_NOT_AVAILABLE – Official document does not contain usable boundary coordinates. Physical ground survey verification is required.",
                {"status": "OFFICIAL_COORDINATES_NOT_AVAILABLE"}
            )

        doc_geom = official_doc.get("geometry", {"type": "Polygon", "coordinates": official_coords if isinstance(official_coords, list) else []})
        rings_conf = parse_geojson_geometry(conflicting_geom) if conflicting_geom else []
        rings_off = parse_geojson_geometry(doc_geom)

        if not rings_conf or not rings_off:
            return (
                "Spatial coordinate comparison could not be completed due to incomplete polygon ring definition in one of the layers.",
                {"status": "INCOMPLETE_RINGS"}
            )

        poly_conf = rings_conf[0]
        poly_off = rings_off[0]

        h_dist = hausdorff_distance_m(poly_conf, poly_off)
        area_conf_m2 = polygon_area_m2(poly_conf)
        area_off_m2 = polygon_area_m2(poly_off)
        area_diff_m2 = abs(area_conf_m2 - area_off_m2)

        area_conf_acres = area_conf_m2 / 4046.86
        area_off_acres = area_off_m2 / 4046.86

        spatial_diff = {
            "max_boundary_deviation_meters": round(h_dist, 2),
            "conflicting_area_acres": round(area_conf_acres, 4),
            "official_survey_area_acres": round(area_off_acres, 4),
            "area_difference_acres": round(abs(area_conf_acres - area_off_acres), 4),
            "area_difference_m2": round(area_diff_m2, 2)
        }

        if h_dist < 0.5 and area_diff_m2 < 5.0:
            comparison_text = "Official survey coordinates match the recorded geometry within acceptable tolerance (< 0.5m deviation)."
        else:
            comparison_text = (
                f"Significant spatial deviation detected: Maximum boundary vertex shift of {h_dist:.2f} meters "
                f"and area discrepancy of {spatial_diff['area_difference_acres']:.3f} acres ({area_diff_m2:.1f} m²) "
                f"between the conflicting record ({area_conf_acres:.3f} acres) and official survey document ({area_off_acres:.3f} acres)."
            )

        return comparison_text, spatial_diff

    def _generate_solution_and_action(
        self,
        conflicts: List[ConflictItem],
        changes: List[ChangeItem],
        overall_severity: str,
        official_coords_available: bool,
        selected_doc: Optional[Dict[str, Any]],
        doc_ref_str: str,
        spatial_diff: Dict[str, Any]
    ) -> Tuple[str, str]:
        """
        Constructs tailored recommended resolution and required action based on conflict types.
        """
        c_types = [c.type for c in conflicts]
        has_owner_mismatch = ConflictType.OWNER_MISMATCH.value in c_types
        has_boundary_mismatch = ConflictType.BOUNDARY_MISMATCH.value in c_types
        has_overlap = ConflictType.PARCEL_OVERLAP.value in c_types
        has_area_mismatch = ConflictType.AREA_MISMATCH.value in c_types or ConflictType.GEOMETRY_AREA_MISMATCH.value in c_types
        has_survey_mismatch = ConflictType.SURVEY_NUMBER_MISMATCH.value in c_types

        solutions: List[str] = []
        action = "MANUAL_SURVEY_VERIFICATION_REQUIRED"

        # Multiple Critical Conflicts (takes highest priority)
        if len([c for c in conflicts if c.severity == SeverityLevel.CRITICAL.value]) >= 2:
            solution = "Escalate the parcel for multi-departmental manual expert review."
            return solution, "MANUAL_EXPERT_REVIEW_REQUIRED"

        # Owner Mismatch (Legal Title dispute)
        if has_owner_mismatch:
            solution = "Verify ownership using the authoritative land/registration document."
            action = "LEGAL_DOCUMENT_VERIFICATION_REQUIRED"
            return solution, action

        # Check if missing coordinates for spatial issues
        if not official_coords_available:
            solution = "Verify boundary using official survey geometry. Official coordinates not available in current repository; manual ground survey required."
            return solution, "MANUAL_SURVEY_VERIFICATION_REQUIRED"

        # Boundary Mismatch
        if has_boundary_mismatch:
            solution = "Compare the conflicting boundary with the official survey coordinates and perform manual survey verification."
            action = "MANUAL_SURVEY_VERIFICATION_REQUIRED"
            return solution, action

        # Parcel Overlap
        if has_overlap:
            solution = "Inspect boundary overlap against authoritative survey map and perform joint field verification."
            action = "MANUAL_SURVEY_VERIFICATION_REQUIRED"
            return solution, action

        # Area Mismatch
        if has_area_mismatch:
            solution = "Verify the area using the official survey geometry and recalculate the parcel area."
            action = "MANUAL_REVIEW_REQUIRED"
            return solution, action

        # Survey Number Mismatch
        if has_survey_mismatch:
            solution = "Verify the survey number against the authoritative survey record."
            action = "MANUAL_REVIEW_REQUIRED"
            return solution, action

        # Default Fallback for CRITICAL
        solution = "Compare the conflicting boundary with the official survey coordinates and perform manual survey verification."
        return solution, action
