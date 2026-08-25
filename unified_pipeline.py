import geopandas as gpd
import pandas as pd
import re
from shapely.validation import make_valid
from sqlalchemy import create_engine, text

# Unga PostgreSQL password-ai inge confirm pannavum
DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

COLUMN_MAP = {
    "survey_number": ["survey_number", "s_no", "surveyno", "sno", "parcel_id"],
    "owner_name": ["owner_name", "owner_nm", "patta_holder", "name"],
    "area_acres": ["extent_acres", "land_area_acres", "acres"],
    "area_sqm": ["area_sqm", "extent_sqm", "area"],
    "village_name": ["village_name", "village", "revenue_village"]
}

def clean_survey_no(val):
    if pd.isna(val):
        return "UNKNOWN"
    return re.sub(r"[^0-9\/\-]", "", str(val)).strip()

def normalize_columns(df):
    matched = {}
    for std_col, variations in COLUMN_MAP.items():
        for col in df.columns:
            if col.lower().strip() in variations:
                matched[col] = std_col
                break
    return df.rename(columns=matched)

def run_full_harmonization():
    print("🚀 Starting Unified Data Harmonization on 5 KM Real-World Dataset...")

    # 1. Clean existing dependent views first to avoid lock errors
    with engine.begin() as conn:
        conn.execute(text("DROP VIEW IF EXISTS unified_land_records CASCADE;"))

    # 2. Process 5 KM Cadastral Spatial Data
    gdf_survey = gpd.read_file("data/dept_survey_5km.geojson")
    gdf_survey = normalize_columns(gdf_survey)
    if gdf_survey.crs is None or gdf_survey.crs.to_string() != "EPSG:4326":
        gdf_survey = gdf_survey.to_crs(epsg=4326)
    gdf_survey["geometry"] = gdf_survey["geometry"].apply(lambda g: make_valid(g) if not g.is_valid else g)
    gdf_survey["survey_number"] = gdf_survey["survey_number"].apply(clean_survey_no)
    gdf_survey["source"] = "SURVEY_DEPT_5KM"

    # 3. Process 5 KM Revenue Tabular Data
    df_rev = pd.read_csv("data/dept_revenue_5km.csv")
    df_rev = normalize_columns(df_rev)
    df_rev["survey_number"] = df_rev["survey_number"].apply(clean_survey_no)
    if "area_acres" in df_rev.columns:
        df_rev["area_sqm"] = df_rev["area_acres"] * 4046.86
    df_rev["source"] = "REVENUE_DEPT_5KM"

    # 4. Ingest into PostGIS tables
    gdf_survey.to_postgis("stage_cadastral", engine, if_exists="replace", index=False)
    df_rev.to_sql("stage_revenue", engine, if_exists="replace", index=False)

    # 5. Recreate Unified View
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE OR REPLACE VIEW unified_land_records AS
            SELECT 
                COALESCE(c.survey_number, r.survey_number) AS survey_number,
                COALESCE(c.village_name, r.village_name) AS village_name,
                r.owner_name AS registered_owner,
                c.area_sqm AS gis_area_sqm,
                r.area_sqm AS revenue_area_sqm,
                ABS(COALESCE(c.area_sqm, 0) - COALESCE(r.area_sqm, 0)) AS area_discrepancy_sqm,
                c.geometry
            FROM stage_cadastral c
            FULL OUTER JOIN stage_revenue r 
                ON c.survey_number = r.survey_number;
        """))

    print("✅ Harmonization Complete! 5 KM dataset ingested into PostGIS 'unified_land_records'.")

if __name__ == "__main__":
    run_full_harmonization()