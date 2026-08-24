import geopandas as gpd
import pandas as pd
import re
from shapely.validation import make_valid
from sqlalchemy import create_engine

# Database Connection (Replace YOUR_PASSWORD with your actual password)
DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

# Department Column Mapping Dictionary
COLUMN_SYNONYMS = {
    "survey_number": ["survey_number", "s_no", "surveyno", "sno", "parcel_id", "gis_id"],
    "owner_name": ["owner_name", "owner_nm", "patta_holder", "name"],
    "area": ["area", "extent", "area_sqm", "extent_acres", "land_area"],
    "village_name": ["village_name", "village", "taluk", "revenue_village"]
}

def clean_survey_number(val):
    if pd.isna(val):
        return "UNKNOWN"
    cleaned = re.sub(r"[^0-9\/\-]", "", str(val))
    return cleaned.strip()

def standardize_columns(df):
    """Dynamically map unknown headers to standard schema."""
    matched_cols = {}
    for standard_col, variations in COLUMN_SYNONYMS.items():
        for col in df.columns:
            if col.lower().strip() in variations:
                matched_cols[col] = standard_col
                break
    return df.rename(columns=matched_cols)

def ingest_spatial_dataset(file_path, department_tag):
    print(f"\n--- Ingesting {department_tag} Data: {file_path} ---")
    gdf = gpd.read_file(file_path)

    # 1. Standardize Columns
    gdf = standardize_columns(gdf)

    # 2. CRS Reprojection to EPSG:4326 (WGS84)
    if gdf.crs is None or gdf.crs.to_string() != "EPSG:4326":
        gdf = gdf.to_crs(epsg=4326)

    # 3. Geometry Validation (Fix invalid polygons automatically)
    gdf["geometry"] = gdf["geometry"].apply(lambda geom: make_valid(geom) if not geom.is_valid else geom)

    # 4. Standardize Attributes
    if "survey_number" in gdf.columns:
        gdf["survey_number"] = gdf["survey_number"].apply(clean_survey_number)
    gdf["source_dept"] = department_tag

    # 5. Ingest into PostGIS
    table_name = f"raw_{department_tag.lower()}_parcels"
    gdf.to_postgis(table_name, engine, if_exists="replace", index=False)
    print(f" Loaded {len(gdf)} records into PostGIS table: '{table_name}'")

if __name__ == "__main__":
    # Test execution using sample cadastral data
    ingest_spatial_dataset("data/raw_cadastral.geojson", "MUNICIPAL_GIS")