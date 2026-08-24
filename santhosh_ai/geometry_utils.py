"""
Geometry Utilities for Spatial Conflict & Change Detection.
Provides pure Python computational geometry algorithms (Polygon area, IoU,
overlap approximation, Hausdorff distance, sliver gap calculation) with
seamless fallback / optional Shapely integration.
"""

import math
from typing import List, Tuple, Dict, Any, Optional

try:
    from shapely.geometry import shape, Polygon, MultiPolygon
    from shapely.ops import unary_union
    HAS_SHAPELY = True
except ImportError:
    HAS_SHAPELY = False


Point = Tuple[float, float]
PolygonCoords = List[Point]


def polygon_area_m2(coords: PolygonCoords) -> float:
    """
    Calculate geodesic / planar polygon area using the Shoelace formula.
    Assumes coordinates are [ [lng, lat], ... ] or [ [x, y], ... ].
    If degrees (lat/lng approx ~12-13N in India), scales to square meters.
    """
    if len(coords) < 3:
        return 0.0
    
    # Check if coords are in lat/lng (degrees)
    xs = [p[0] for p in coords]
    ys = [p[1] for p in coords]
    
    is_lat_lng = all(-180 <= x <= 180 for x in xs) and all(-90 <= y <= 90 for y in ys)
    
    if is_lat_lng:
        # Convert lat/lng to approximate local planar meters
        # 1 deg lat ~ 110,574 meters
        # 1 deg lng ~ 111,320 * cos(lat) meters
        avg_lat = sum(ys) / len(ys)
        lat_m = 110574.0
        lng_m = 111320.0 * math.cos(math.radians(avg_lat))
        
        m_coords = [(p[0] * lng_m, p[1] * lat_m) for p in coords]
    else:
        m_coords = coords

    # Shoelace formula
    n = len(m_coords)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += m_coords[i][0] * m_coords[j][1]
        area -= m_coords[j][0] * m_coords[i][1]
    return abs(area) / 2.0


def polygon_perimeter_m(coords: PolygonCoords) -> float:
    """Calculate polygon perimeter in meters."""
    if len(coords) < 2:
        return 0.0
    
    xs = [p[0] for p in coords]
    ys = [p[1] for p in coords]
    is_lat_lng = all(-180 <= x <= 180 for x in xs) and all(-90 <= y <= 90 for y in ys)
    
    avg_lat = sum(ys) / len(ys) if is_lat_lng else 0
    lat_m = 110574.0 if is_lat_lng else 1.0
    lng_m = (111320.0 * math.cos(math.radians(avg_lat))) if is_lat_lng else 1.0

    perimeter = 0.0
    for i in range(len(coords)):
        j = (i + 1) % len(coords)
        dx = (coords[j][0] - coords[i][0]) * lng_m
        dy = (coords[j][1] - coords[i][1]) * lat_m
        perimeter += math.sqrt(dx * dx + dy * dy)
    return perimeter


def point_in_polygon(point: Point, polygon: PolygonCoords) -> bool:
    """Ray casting algorithm for point in polygon."""
    x, y = point
    inside = False
    n = len(polygon)
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def point_distance_m(p1: Point, p2: Point, is_lat_lng: bool = True) -> float:
    """Euclidean distance in meters between two points."""
    if is_lat_lng:
        lat_m = 110574.0
        avg_lat = (p1[1] + p2[1]) / 2.0
        lng_m = 111320.0 * math.cos(math.radians(avg_lat))
        dx = (p2[0] - p1[0]) * lng_m
        dy = (p2[1] - p1[1]) * lat_m
    else:
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
    return math.sqrt(dx * dx + dy * dy)


def compute_bounding_box(coords: PolygonCoords) -> Tuple[float, float, float, float]:
    """Returns (min_x, min_y, max_x, max_y)."""
    xs = [p[0] for p in coords]
    ys = [p[1] for p in coords]
    return (min(xs), min(ys), max(xs), max(ys))


def bounding_box_overlap(bb1: Tuple[float, float, float, float], bb2: Tuple[float, float, float, float]) -> bool:
    """Check if two bounding boxes overlap."""
    return not (bb1[2] < bb2[0] or bb1[0] > bb2[2] or bb1[3] < bb2[1] or bb1[1] > bb2[3])


def hausdorff_distance_m(coords1: PolygonCoords, coords2: PolygonCoords) -> float:
    """
    Computes bidirectional Hausdorff distance (maximum deviation between boundary vertices) in meters.
    """
    if not coords1 or not coords2:
        return 0.0

    def directed_hausdorff(c1, c2):
        max_min_dist = 0.0
        for p1 in c1:
            min_dist = min(point_distance_m(p1, p2) for p2 in c2)
            if min_dist > max_min_dist:
                max_min_dist = min_dist
        return max_min_dist

    return max(directed_hausdorff(coords1, coords2), directed_hausdorff(coords2, coords1))


def calculate_polygon_overlap_area(coords1: PolygonCoords, coords2: PolygonCoords) -> float:
    """
    Computes overlap (intersection) area in m² between two polygons.
    Uses Shapely if available, otherwise uses high-resolution raster grid sampling.
    """
    if HAS_SHAPELY:
        try:
            p1 = Polygon(coords1)
            p2 = Polygon(coords2)
            if not p1.is_valid:
                p1 = p1.buffer(0)
            if not p2.is_valid:
                p2 = p2.buffer(0)
            inter = p1.intersection(p2)
            if inter.is_empty:
                return 0.0
            
            # If coordinates are in degrees, approximate meter scale
            xs = [p[0] for p in coords1]
            ys = [p[1] for p in coords1]
            avg_lat = sum(ys) / len(ys)
            lat_m = 110574.0
            lng_m = 111320.0 * math.cos(math.radians(avg_lat))
            scale = lat_m * lng_m
            return inter.area * scale
        except Exception:
            pass

    # Pure Python grid approximation
    bb1 = compute_bounding_box(coords1)
    bb2 = compute_bounding_box(coords2)
    if not bounding_box_overlap(bb1, bb2):
        return 0.0

    inter_min_x = max(bb1[0], bb2[0])
    inter_min_y = max(bb1[1], bb2[1])
    inter_max_x = min(bb1[2], bb2[2])
    inter_max_y = min(bb1[3], bb2[3])

    if inter_min_x >= inter_max_x or inter_min_y >= inter_max_y:
        return 0.0

    # Grid sampling in intersection bounding box
    steps = 40
    dx = (inter_max_x - inter_min_x) / steps
    dy = (inter_max_y - inter_min_y) / steps
    
    avg_lat = (inter_min_y + inter_max_y) / 2.0
    lat_m = 110574.0
    lng_m = 111320.0 * math.cos(math.radians(avg_lat))
    cell_area_m2 = (dx * lng_m) * (dy * lat_m)

    inside_count = 0
    for i in range(steps):
        for j in range(steps):
            sample_pt = (inter_min_x + (i + 0.5) * dx, inter_min_y + (j + 0.5) * dy)
            if point_in_polygon(sample_pt, coords1) and point_in_polygon(sample_pt, coords2):
                inside_count += 1

    return inside_count * cell_area_m2


def compute_iou(coords1: PolygonCoords, coords2: PolygonCoords) -> float:
    """
    Intersection-over-Union (Jaccard Index) between two polygon boundaries [0.0 to 1.0].
    """
    area1 = polygon_area_m2(coords1)
    area2 = polygon_area_m2(coords2)
    if area1 <= 0 or area2 <= 0:
        return 0.0
    
    inter_area = calculate_polygon_overlap_area(coords1, coords2)
    union_area = area1 + area2 - inter_area
    if union_area <= 0:
        return 0.0
    return min(1.0, max(0.0, inter_area / union_area))


def parse_geojson_geometry(geometry: Any) -> List[PolygonCoords]:
    """
    Extract coordinate rings from a GeoJSON geometry, Feature dict, or raw coordinate list.
    Returns list of coordinate rings [[(x,y), ...], ...].
    """
    if not geometry:
        return []

    # Handle GeoJSON Feature
    if isinstance(geometry, dict) and geometry.get("type") == "Feature" and "geometry" in geometry:
        geometry = geometry["geometry"]

    # Handle Dict with sub-geometry key
    if isinstance(geometry, dict) and "geometry" in geometry and isinstance(geometry["geometry"], dict):
        geometry = geometry["geometry"]

    # Handle raw coordinate list
    if isinstance(geometry, list):
        if not geometry:
            return []
        # Case: [[[x, y], ...]]
        if isinstance(geometry[0], list) and len(geometry[0]) > 0 and isinstance(geometry[0][0], (list, tuple)):
            if isinstance(geometry[0][0][0], (int, float)):
                return [[(float(p[0]), float(p[1])) for p in ring] for ring in geometry if len(ring) >= 3]
            elif isinstance(geometry[0][0], (list, tuple)) and isinstance(geometry[0][0][0], (list, tuple)):
                # MultiPolygon list
                rings = []
                for poly in geometry:
                    for ring in poly:
                        if len(ring) >= 3:
                            rings.append([(float(p[0]), float(p[1])) for p in ring])
                return rings
        # Case: [[x, y], [x, y], ...]
        elif isinstance(geometry[0], (list, tuple)) and len(geometry[0]) >= 2 and isinstance(geometry[0][0], (int, float)):
            return [[(float(p[0]), float(p[1])) for p in geometry]]

    if not isinstance(geometry, dict):
        return []

    geom_type = geometry.get("type", "")
    coords = geometry.get("coordinates", [])

    rings = []
    if geom_type == "Polygon":
        if coords and len(coords) > 0:
            rings.append([(float(p[0]), float(p[1])) for p in coords[0] if len(p) >= 2])
    elif geom_type == "MultiPolygon":
        for poly in coords:
            if poly and len(poly) > 0:
                rings.append([(float(p[0]), float(p[1])) for p in poly[0] if len(p) >= 2])
    return rings
