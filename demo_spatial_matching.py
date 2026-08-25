"""
Real Spatial Parcel Matching Demonstration.
Demonstrates matching land parcels between a Cadastral layer and a Survey layer
using spatial indexing, CRS harmonization, explainable scoring, and one-to-many candidate returns.
"""

from pathlib import Path
import geopandas as gpd
from shapely.geometry import Polygon

from gis_engine.spatial_matcher import SpatialMatcher
from utils.geometry_utils import export_geospatial_file, load_geospatial_file


def run_spatial_matching_demo():
    input_dir = Path("./data/input")
    output_dir = Path("./data/output")
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Create sample Cadastral layer (EPSG:4326)
    p_cad_1 = Polygon([(77.200, 28.610), (77.205, 28.610), (77.205, 28.615), (77.200, 28.615), (77.200, 28.610)])
    cadastral_gdf = gpd.GeoDataFrame({
        "cadastral_id": ["CAD-101"],
        "owner": ["Rajesh Sharma"]
    }, geometry=[p_cad_1], crs="EPSG:4326")

    # 2. Create sample Survey layer (EPSG:32643 - UTM Zone 43N)
    # First reproject cadastral to UTM to get base metric coordinates
    cad_utm = cadastral_gdf.to_crs(epsg=32643)
    base_geom = cad_utm.geometry.iloc[0]

    # Create slightly shifted and split survey polygons in UTM meters
    bounds = base_geom.bounds
    minx, miny, maxx, maxy = bounds
    width = maxx - minx
    height = maxy - miny

    # Survey parcel 1: 95% match with minor offset
    poly_surv_1 = Polygon([
        (minx + 5, miny + 2),
        (maxx + 5, miny + 2),
        (maxx + 5, maxy + 2),
        (minx + 5, maxy + 2),
        (minx + 5, miny + 2)
    ])

    survey_gdf = gpd.GeoDataFrame({
        "survey_no": ["SURV-2026-A"],
        "surveyor": ["V. Kumar"]
    }, geometry=[poly_surv_1], crs="EPSG:32643")

    # Save to disk
    cad_file = export_geospatial_file(cadastral_gdf, input_dir / "demo_cadastral.geojson")
    surv_file = export_geospatial_file(survey_gdf, input_dir / "demo_survey.geojson")

    print("Loaded input datasets:")
    print(f" - Cadastral: {cad_file} (CRS: {cadastral_gdf.crs})")
    print(f" - Survey:    {surv_file} (CRS: {survey_gdf.crs})")

    # 3. Perform Spatial Matching using SpatialMatcher
    matcher = SpatialMatcher()
    results = matcher.match_parcels(
        gdf_a=cadastral_gdf,
        gdf_b=survey_gdf,
        id_col_a="cadastral_id",
        id_col_b="survey_no",
        mode="spatial_only"
    )

    print(f"\nMatching Results Found: {len(results)} candidate match pairs")
    for r in results:
        print(f"\nMatch Pair: Cadastral '{r['dataset_a_id']}' <---> Survey '{r['dataset_b_id']}'")
        print(f" - Classification:        {r['classification']}")
        print(f" - Composite Score:        {r['score']}")
        print(f" - Polygon IoU:            {r['iou']}")
        print(f" - Area Similarity:        {r['area_similarity']*100:.1f}%")
        print(f" - Centroid Distance:      {r['centroid_distance_m']} meters")
        print(f" - Calculation Metric CRS: {r['calculation_crs']}")
        print(f" - Explainable Reasons:")
        for reason in r["reasons"]:
            print(f"    * {reason}")


if __name__ == "__main__":
    run_spatial_matching_demo()
