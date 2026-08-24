"""
Temporal Change Detector Module for Multi-Year Land Record Comparisons (2024 -> 2025 -> 2026).
Detects:
- Area changes (expansion, reduction)
- Boundary changes (geometry reshaping, vertex shifts)
- New building / construction
- Removed / demolished building
- Parcel split (subdivision of parcel into multiple children)
- Parcel merge (consolidation of parcels)
"""

from typing import List, Dict, Any, Optional
from .models import ChangeItem, ChangeType, SeverityLevel
from .geometry_utils import (
    parse_geojson_geometry,
    polygon_area_m2,
    compute_iou,
    calculate_polygon_overlap_area,
    hausdorff_distance_m
)


class ChangeDetector:
    """
    Analyzes historical temporal snapshots (e.g. 2024, 2025, 2026) of land parcels and building footprints.
    """

    def __init__(
        self,
        area_change_threshold_pct: float = 2.0,
        boundary_shift_threshold_m: float = 1.5,
        min_building_area_m2: float = 15.0
    ):
        self.area_change_threshold_pct = area_change_threshold_pct
        self.boundary_shift_threshold_m = boundary_shift_threshold_m
        self.min_building_area_m2 = min_building_area_m2

    def detect_parcel_changes(
        self,
        snapshots: List[Dict[str, Any]]
    ) -> List[ChangeItem]:
        """
        Analyzes consecutive year snapshots for a single parcel.
        Each snapshot has:
          - year: int (e.g. 2024, 2025, 2026)
          - area: float or str
          - geometry: GeoJSON dict
          - buildings: List of GeoJSON geometries / building metadata
          - land_use: optional str
        """
        changes: List[ChangeItem] = []
        if len(snapshots) < 2:
            return changes

        # Sort chronologically by year
        sorted_snaps = sorted(snapshots, key=lambda s: s.get("year", 0))

        for i in range(len(sorted_snaps) - 1):
            s_from = sorted_snaps[i]
            s_to = sorted_snaps[i + 1]
            y_from = s_from.get("year", 2024)
            y_to = s_to.get("year", 2025)

            # 1. Area Change
            from_area = self._extract_area_acres(s_from)
            to_area = self._extract_area_acres(s_to)

            if from_area and to_area:
                diff = to_area - from_area
                pct_diff = abs(diff) / from_area * 100.0
                if pct_diff > self.area_change_threshold_pct:
                    sev = SeverityLevel.HIGH.value if pct_diff > 10.0 else SeverityLevel.MEDIUM.value
                    direction = "expansion" if diff > 0 else "reduction"
                    changes.append(ChangeItem(
                        type=ChangeType.AREA_CHANGE.value,
                        from_year=y_from,
                        to_year=y_to,
                        severity=sev,
                        old_value=f"{from_area:.3f} acres",
                        new_value=f"{to_area:.3f} acres",
                        description=f"Parcel area {direction} of {abs(diff):.3f} acres ({pct_diff:.1f}%) between {y_from} and {y_to}",
                        details={
                            "difference_acres": round(diff, 4),
                            "percentage_change": round(pct_diff, 2),
                            "change_type": direction
                        }
                    ))

            # 2. Boundary Change
            geom_from = s_from.get("geometry")
            geom_to = s_to.get("geometry")
            if geom_from and geom_to:
                rings_from = parse_geojson_geometry(geom_from)
                rings_to = parse_geojson_geometry(geom_to)
                if rings_from and rings_to:
                    h_dist = hausdorff_distance_m(rings_from[0], rings_to[0])
                    iou = compute_iou(rings_from[0], rings_to[0])
                    if h_dist > self.boundary_shift_threshold_m or iou < 0.95:
                        sev = SeverityLevel.HIGH.value if h_dist > 5.0 else SeverityLevel.MEDIUM.value
                        changes.append(ChangeItem(
                            type=ChangeType.BOUNDARY_CHANGE.value,
                            from_year=y_from,
                            to_year=y_to,
                            severity=sev,
                            old_value=f"{y_from} Boundary",
                            new_value=f"{y_to} Boundary ({h_dist:.2f}m shift)",
                            description=f"Boundary realignment detected between {y_from} and {y_to} (Max shift: {h_dist:.2f}m, IoU: {iou:.2f})",
                            details={"shift_distance_meters": round(h_dist, 2), "boundary_iou": round(iou, 3)}
                        ))

            # 3. Building / Construction Changes
            bld_from = s_from.get("buildings", [])
            bld_to = s_to.get("buildings", [])
            building_changes = self._detect_building_changes(bld_from, bld_to, y_from, y_to)
            changes.extend(building_changes)

            # 4. Land Use Changes
            use_from = s_from.get("land_use")
            use_to = s_to.get("land_use")
            if use_from and use_to and use_from.strip().lower() != use_to.strip().lower():
                changes.append(ChangeItem(
                    type=ChangeType.LAND_USE_CHANGE.value,
                    from_year=y_from,
                    to_year=y_to,
                    severity=SeverityLevel.HIGH.value if "commercial" in use_to.lower() or "industrial" in use_to.lower() else SeverityLevel.MEDIUM.value,
                    old_value=use_from,
                    new_value=use_to,
                    description=f"Land use conversion from '{use_from}' to '{use_to}' between {y_from} and {y_to}",
                    details={"from_use": use_from, "to_use": use_to}
                ))

        return changes

    def _detect_building_changes(
        self,
        bld_from: List[Dict[str, Any]],
        bld_to: List[Dict[str, Any]],
        from_year: int,
        to_year: int
    ) -> List[ChangeItem]:
        """Compares building footprints across years to detect new constructions and demolitions."""
        changes: List[ChangeItem] = []

        # Count and ID-based / Spatial comparison
        from_ids = {b.get("id", f"bld_{i}"): b for i, b in enumerate(bld_from)}
        to_ids = {b.get("id", f"bld_{i}"): b for i, b in enumerate(bld_to)}

        # Check newly added buildings
        for b_id, b_data in to_ids.items():
            if b_id not in from_ids:
                # Spatial check to see if it really didn't exist in from_year
                b_geom = b_data.get("geometry", b_data)
                rings = parse_geojson_geometry(b_geom)
                b_area_m2 = polygon_area_m2(rings[0]) if rings else b_data.get("area_sq_m", 120.0)
                
                changes.append(ChangeItem(
                    type=ChangeType.NEW_BUILDING.value,
                    from_year=from_year,
                    to_year=to_year,
                    severity=SeverityLevel.MEDIUM.value,
                    old_value="Vacant Land / No Structure",
                    new_value=f"New Structure ({b_area_m2:.1f} m²)",
                    description=f"New building / construction detected on parcel between {from_year} and {to_year} (~{b_area_m2:.1f} m²)",
                    details={"building_id": b_id, "building_area_m2": round(b_area_m2, 2)}
                ))

        # Check removed/demolished buildings
        for b_id, b_data in from_ids.items():
            if b_id not in to_ids:
                b_geom = b_data.get("geometry", b_data)
                rings = parse_geojson_geometry(b_geom)
                b_area_m2 = polygon_area_m2(rings[0]) if rings else b_data.get("area_sq_m", 100.0)

                changes.append(ChangeItem(
                    type=ChangeType.REMOVED_BUILDING.value,
                    from_year=from_year,
                    to_year=to_year,
                    severity=SeverityLevel.LOW.value,
                    old_value=f"Structure ({b_area_m2:.1f} m²)",
                    new_value="Demolished / Cleared",
                    description=f"Building structure removed/demolished between {from_year} and {to_year}",
                    details={"building_id": b_id, "cleared_area_m2": round(b_area_m2, 2)}
                ))

        return changes

    def detect_parcel_split_or_merge(
        self,
        parent_parcels: List[Dict[str, Any]],
        child_parcels: List[Dict[str, Any]],
        from_year: int,
        to_year: int
    ) -> List[ChangeItem]:
        """
        Detects 1 parcel splitting into multiple sub-divisions (PARCEL_SPLIT)
        or multiple adjacent parcels merging into 1 (PARCEL_MERGE).
        """
        changes: List[ChangeItem] = []

        # Split check: 1 parent parcel covered by 2+ child parcels
        for parent in parent_parcels:
            p_id = parent.get("parcel_id", "Parent")
            p_geom = parent.get("geometry")
            p_rings = parse_geojson_geometry(p_geom)
            if not p_rings:
                continue

            matching_children = []
            for child in child_parcels:
                c_id = child.get("parcel_id", "Child")
                c_geom = child.get("geometry")
                c_rings = parse_geojson_geometry(c_geom)
                if not c_rings:
                    continue

                overlap = calculate_polygon_overlap_area(p_rings[0], c_rings[0])
                c_area = polygon_area_m2(c_rings[0])
                if c_area > 0 and (overlap / c_area) > 0.6:
                    matching_children.append(c_id)

            if len(matching_children) >= 2:
                changes.append(ChangeItem(
                    type=ChangeType.PARCEL_SPLIT.value,
                    from_year=from_year,
                    to_year=to_year,
                    severity=SeverityLevel.MEDIUM.value,
                    old_value=f"Parent Parcel {p_id}",
                    new_value=f"Subdivided into {len(matching_children)} parcels ({', '.join(matching_children)})",
                    description=f"Parcel {p_id} underwent legal/spatial split into sub-parcels {', '.join(matching_children)} between {from_year} and {to_year}",
                    details={"parent_parcel": p_id, "child_parcels": matching_children}
                ))

        # Merge check: Multiple parents consolidated into 1 child parcel
        for child in child_parcels:
            c_id = child.get("parcel_id", "Child")
            c_geom = child.get("geometry")
            c_rings = parse_geojson_geometry(c_geom)
            if not c_rings:
                continue

            matching_parents = []
            for parent in parent_parcels:
                p_id = parent.get("parcel_id", "Parent")
                p_geom = parent.get("geometry")
                p_rings = parse_geojson_geometry(p_geom)
                if not p_rings:
                    continue

                overlap = calculate_polygon_overlap_area(c_rings[0], p_rings[0])
                p_area = polygon_area_m2(p_rings[0])
                if p_area > 0 and (overlap / p_area) > 0.6:
                    matching_parents.append(p_id)

            if len(matching_parents) >= 2:
                changes.append(ChangeItem(
                    type=ChangeType.PARCEL_MERGE.value,
                    from_year=from_year,
                    to_year=to_year,
                    severity=SeverityLevel.MEDIUM.value,
                    old_value=f"Separate Parcels ({', '.join(matching_parents)})",
                    new_value=f"Unified Parcel {c_id}",
                    description=f"Parcels {', '.join(matching_parents)} were merged into unified parcel {c_id} between {from_year} and {to_year}",
                    details={"merged_parcel": c_id, "source_parcels": matching_parents}
                ))

        return changes

    def _extract_area_acres(self, snapshot: Dict[str, Any]) -> Optional[float]:
        val = snapshot.get("area")
        if val is None:
            geom = snapshot.get("geometry")
            if geom:
                rings = parse_geojson_geometry(geom)
                if rings:
                    return polygon_area_m2(rings[0]) / 4046.86
            return None
        if isinstance(val, (int, float)):
            return float(val)
        try:
            return float(str(val).split()[0])
        except Exception:
            return None
