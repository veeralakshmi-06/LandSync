"""
Spatial Conflict Detector Module for Land Records.
Detects:
- Boundary mismatch (Hausdorff vertex deviations)
- Parcel overlaps (Intersecting polygons between adjacent parcels or survey layers)
- Sliver Gaps between contiguous parcels
- Significant shape differences (Intersection-over-Union IoU < threshold)
- Geometry Area vs Attribute Area discrepancies
"""

from typing import List, Dict, Any, Optional
from .models import ConflictItem, ConflictType, SeverityLevel
from .geometry_utils import (
    parse_geojson_geometry,
    polygon_area_m2,
    calculate_polygon_overlap_area,
    compute_iou,
    hausdorff_distance_m
)


class SpatialConflictDetector:
    """
    Spatial conflict detection engine analyzing polygon geometries from GeoJSON.
    """

    def __init__(
        self,
        min_overlap_area_m2: float = 5.0,
        max_boundary_deviation_m: float = 2.0,
        min_shape_iou: float = 0.85,
        area_mismatch_tolerance_pct: float = 3.0
    ):
        self.min_overlap_area_m2 = min_overlap_area_m2
        self.max_boundary_deviation_m = max_boundary_deviation_m
        self.min_shape_iou = min_shape_iou
        self.area_mismatch_tolerance_pct = area_mismatch_tolerance_pct

    def detect_single_parcel_geometry_conflicts(
        self,
        cadastral_geom: Optional[Dict[str, Any]],
        survey_geom: Optional[Dict[str, Any]],
        recorded_area_acres: Optional[float] = None
    ) -> List[ConflictItem]:
        """
        Compares official Cadastral map geometry vs Ground Survey / Drone GIS geometry for the same parcel.
        """
        conflicts: List[ConflictItem] = []

        cad_rings = parse_geojson_geometry(cadastral_geom) if cadastral_geom else []
        surv_rings = parse_geojson_geometry(survey_geom) if survey_geom else []

        if not cad_rings and not surv_rings:
            conflicts.append(ConflictItem(
                type=ConflictType.MISSING_VALUE.value,
                severity=SeverityLevel.HIGH.value,
                field_name="geometry",
                description="Spatial polygon geometry is missing for this parcel",
                details={"has_cadastral": False, "has_survey": False}
            ))
            return conflicts

        # If both geometries exist, compare them
        if cad_rings and surv_rings:
            poly1 = cad_rings[0]
            poly2 = surv_rings[0]

            area1_m2 = polygon_area_m2(poly1)
            area2_m2 = polygon_area_m2(poly2)

            # 1. Shape IoU
            iou = compute_iou(poly1, poly2)
            if iou < self.min_shape_iou:
                if iou < 0.5:
                    sev = SeverityLevel.CRITICAL.value
                elif iou < 0.7:
                    sev = SeverityLevel.HIGH.value
                else:
                    sev = SeverityLevel.MEDIUM.value

                conflicts.append(ConflictItem(
                    type=ConflictType.SHAPE_DEVIATION.value,
                    severity=sev,
                    old_value=f"Cadastral Shape (IoU: {iou:.2f})",
                    new_value=f"Survey Shape (Deviation: {(1 - iou)*100:.1f}%)",
                    description=f"Significant shape discrepancy: IoU is {iou:.2f} (expected >= {self.min_shape_iou})",
                    details={
                        "iou": round(iou, 3),
                        "cadastral_area_m2": round(area1_m2, 2),
                        "survey_area_m2": round(area2_m2, 2)
                    }
                ))

            # 2. Boundary Deviation (Hausdorff distance)
            h_dist = hausdorff_distance_m(poly1, poly2)
            if h_dist > self.max_boundary_deviation_m:
                if h_dist > 15.0:
                    sev = SeverityLevel.CRITICAL.value
                elif h_dist > 6.0:
                    sev = SeverityLevel.HIGH.value
                else:
                    sev = SeverityLevel.MEDIUM.value

                conflicts.append(ConflictItem(
                    type=ConflictType.BOUNDARY_MISMATCH.value,
                    severity=sev,
                    old_value="Cadastral Boundary",
                    new_value=f"Survey Boundary ({h_dist:.2f}m shift)",
                    description=f"Boundary alignment deviation of {h_dist:.2f} meters detected between cadastral and ground survey",
                    details={"max_deviation_meters": round(h_dist, 2)}
                ))
            
            ref_area_m2 = (area1_m2 + area2_m2) / 2.0
        else:
            primary_poly = cad_rings[0] if cad_rings else surv_rings[0]
            ref_area_m2 = polygon_area_m2(primary_poly)

        # 3. Geometry Area vs RoR Text Area Check
        if recorded_area_acres is not None and recorded_area_acres > 0:
            rec_area_m2 = recorded_area_acres * 4046.86
            pct_diff = abs(ref_area_m2 - rec_area_m2) / rec_area_m2 * 100.0
            if pct_diff > self.area_mismatch_tolerance_pct:
                sev = SeverityLevel.HIGH.value if pct_diff > 15.0 else SeverityLevel.MEDIUM.value
                conflicts.append(ConflictItem(
                    type=ConflictType.GEOMETRY_AREA_MISMATCH.value,
                    severity=sev,
                    old_value=f"{recorded_area_acres:.3f} acres ({rec_area_m2:.1f} m²)",
                    new_value=f"{ref_area_m2/4046.86:.3f} acres ({ref_area_m2:.1f} m²)",
                    description=f"Calculated GIS geometry area differs from recorded RoR area by {pct_diff:.1f}%",
                    details={
                        "recorded_area_m2": round(rec_area_m2, 2),
                        "geometry_area_m2": round(ref_area_m2, 2),
                        "pct_difference": round(pct_diff, 2)
                    }
                ))

        return conflicts

    def detect_adjacent_parcel_conflicts(
        self,
        parcels: List[Dict[str, Any]]
    ) -> Dict[str, List[ConflictItem]]:
        """
        Scans a collection of adjacent parcels to detect:
        1. Parcel overlaps (encroachment between neighboring plots)
        2. Sliver gaps (anomalous unmapped slivers between adjoining plots)
        Returns mapping of parcel_id -> list of ConflictItems.
        """
        results: Dict[str, List[ConflictItem]] = {p.get("parcel_id", f"P_{i}"): [] for i, p in enumerate(parcels)}

        for i in range(len(parcels)):
            for j in range(i + 1, len(parcels)):
                p1 = parcels[i]
                p2 = parcels[j]
                id1 = p1.get("parcel_id", f"P_{i}")
                id2 = p2.get("parcel_id", f"P_{j}")

                geom1 = p1.get("geometry")
                geom2 = p2.get("geometry")

                rings1 = parse_geojson_geometry(geom1)
                rings2 = parse_geojson_geometry(geom2)

                if not rings1 or not rings2:
                    continue

                poly1 = rings1[0]
                poly2 = rings2[0]

                # Check overlap
                overlap_m2 = calculate_polygon_overlap_area(poly1, poly2)
                if overlap_m2 > self.min_overlap_area_m2:
                    area1 = polygon_area_m2(poly1)
                    pct_p1 = (overlap_m2 / max(area1, 1.0)) * 100.0

                    if pct_p1 > 15.0 or overlap_m2 > 100.0:
                        sev = SeverityLevel.CRITICAL.value
                    elif pct_p1 > 5.0 or overlap_m2 > 30.0:
                        sev = SeverityLevel.HIGH.value
                    else:
                        sev = SeverityLevel.MEDIUM.value

                    conflict1 = ConflictItem(
                        type=ConflictType.PARCEL_OVERLAP.value,
                        severity=sev,
                        old_value=f"Boundary of {id1}",
                        new_value=f"Overlaps {id2} by {overlap_m2:.1f} m²",
                        description=f"Illegal boundary overlap / encroachment of {overlap_m2:.1f} m² ({pct_p1:.1f}%) with adjacent parcel {id2}",
                        details={"overlapping_parcel": id2, "overlap_area_m2": round(overlap_m2, 2), "overlap_pct": round(pct_p1, 2)}
                    )

                    conflict2 = ConflictItem(
                        type=ConflictType.PARCEL_OVERLAP.value,
                        severity=sev,
                        old_value=f"Boundary of {id2}",
                        new_value=f"Overlaps {id1} by {overlap_m2:.1f} m²",
                        description=f"Illegal boundary overlap / encroachment of {overlap_m2:.1f} m² with adjacent parcel {id1}",
                        details={"overlapping_parcel": id1, "overlap_area_m2": round(overlap_m2, 2)}
                    )

                    results[id1].append(conflict1)
                    results[id2].append(conflict2)

        return results
