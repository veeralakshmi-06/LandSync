"""
Real CRS Transformation & Harmonization Example.
Demonstrates loading a real GeoJSON cadastral dataset, validating its CRS,
selecting the optimal UTM projected CRS based on geographic location,
reprojecting to metric coordinates, and exporting the harmonized dataset.
"""

from pathlib import Path
import geopandas as gpd
from shapely.geometry import Polygon
from gis_engine.crs_harmonizer import CRSHarmonizer
from utils.geometry_utils import load_geospatial_file, export_geospatial_file

def run_crs_harmonization_demo():
    input_path = Path("./data/input/sample_delhi_parcels.geojson")
    output_path = Path("./data/output/sample_delhi_parcels_utm.geojson")

    # 1. Create sample GeoJSON file if not present
    input_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    poly1 = Polygon([(77.200, 28.610), (77.205, 28.610), (77.205, 28.615), (77.200, 28.615), (77.200, 28.610)])
    poly2 = Polygon([(77.206, 28.610), (77.210, 28.610), (77.210, 28.615), (77.206, 28.615), (77.206, 28.610)])
    
    sample_gdf = gpd.GeoDataFrame({
        "parcel_id": ["P-101", "P-102"],
        "owner": ["Aarav Sharma", "Meera Patel"],
        "locality": ["Connaught Place", "Barakhamba Road"],
        "claimed_area_sq_m": [25000.0, 20000.0]
    }, geometry=[poly1, poly2], crs="EPSG:4326")

    export_geospatial_file(sample_gdf, input_path)
    print(f"Created sample GeoJSON input file: {input_path}")

    # 2. Ingest real dataset using format-agnostic loader
    gdf = load_geospatial_file(input_path)
    print(f"Loaded dataset containing {len(gdf)} parcels. Source CRS: {gdf.crs}")

    # 3. Detect and validate CRS
    harmonizer = CRSHarmonizer()
    val_info = harmonizer.validate_crs(gdf, strict=True)
    print(f"CRS Validation Info: {val_info}")

    # 4. Select appropriate UTM projected CRS for local region
    target_utm = harmonizer.select_appropriate_projected_crs(gdf)
    print(f"Selected Optimal Projected CRS: {target_utm}")

    # 5. Transform GeoDataFrame to target CRS
    harmonized_gdf = harmonizer.transform_to_crs(gdf, target_crs=target_utm)
    print(f"Reprojected GeoDataFrame. Transformed CRS: {harmonized_gdf.crs}")

    # 6. Verify attribute preservation and metric area calculation
    harmonized_gdf["calculated_area_sq_m"] = harmonized_gdf.geometry.area
    print(f"Parcel Attributes & Calculated Metric Areas:")
    for idx, row in harmonized_gdf.iterrows():
        print(f" - Parcel '{row['parcel_id']}' ({row['owner']}): {row['calculated_area_sq_m']:.2f} sq.m")

    # 7. Export harmonized dataset
    out_file = export_geospatial_file(harmonized_gdf, output_path)
    print(f"Successfully saved harmonized dataset to {out_file}")

if __name__ == "__main__":
    run_crs_harmonization_demo()
