import geopandas as gpd
import pandas as pd
import re
from sqlalchemy import create_engine

# Unga PostgreSQL password-ai YOUR_PASSWORD idathil podavum
DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

def clean_survey_number(val):
    if pd.isna(val):
        return "UNKNOWN"
    cleaned = re.sub(r"[^0-9\/\-]", "", str(val))
    return cleaned.strip()

def run_pipeline():
    print("1. Reading raw geospatial and tabular data...")
    gdf = gpd.read_file("data/raw_cadastral.geojson")
    df_rev = pd.read_csv("data/raw_revenue.csv")

    # CRS standardization to EPSG:4326
    if gdf.crs is None or gdf.crs.to_string() != "EPSG:4326":
        gdf = gdf.set_crs(epsg=4326, allow_override=True)

    # Clean and standardize Cadastral data
    gdf = gdf.rename(columns={"Survey_Number": "survey_number", "Area_Sqm": "area_sqm", "Village": "village_name"})
    gdf["survey_number"] = gdf["survey_number"].apply(clean_survey_number)
    gdf["village_name"] = gdf["village_name"].str.strip().str.title()
    gdf["source_dept"] = "SURVEY_DEPT"

    # Clean and standardize Revenue data
    df_rev = df_rev.rename(columns={"S_No": "survey_number", "Owner_Nm": "owner_name", "Extent_Acres": "area_acres", "Village_Name": "village_name"})
    df_rev["survey_number"] = df_rev["survey_number"].apply(clean_survey_number)
    df_rev["village_name"] = df_rev["village_name"].str.strip().str.title()
    df_rev["area_sqm"] = df_rev["area_acres"] * 4046.86
    df_rev["source_dept"] = "REVENUE_DEPT"

    print("2. Ingesting harmonized data into PostGIS...")
    gdf.to_postgis("standardized_cadastral", engine, if_exists="replace", index=False)
    df_rev.to_sql("standardized_revenue", engine, if_exists="replace", index=False)
    
    print(" Pipeline Success! Data successfully harmonized and stored in PostGIS.")

if __name__ == "__main__":
    run_pipeline()