import geopandas as gpd
import pandas as pd
from shapely.validation import make_valid
from sqlalchemy import create_engine, text

# Database Connection (Replace YOUR_PASSWORD with your actual password)
DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

def run_multi_dept_etl():
    print("🚀 Ingesting & Harmonizing all 4 Department Datasets into PostGIS...")

    # 1. Drop ALL dependent views before replacing tables
    with engine.begin() as conn:
        conn.execute(text("DROP VIEW IF EXISTS unified_land_records CASCADE;"))
        conn.execute(text("DROP VIEW IF EXISTS master_harmonized_land_records CASCADE;"))

    # 2. Ingest Survey Cadastral (Spatial Layer)
    gdf_survey = gpd.read_file("data/dept_survey_cadastral.geojson")
    gdf_survey["geometry"] = gdf_survey["geometry"].apply(lambda g: make_valid(g) if not g.is_valid else g)
    gdf_survey.to_postgis("stage_cadastral", engine, if_exists="replace", index=False)

    # 3. Ingest Revenue Dept (Patta & Extent)
    df_rev = pd.read_csv("data/dept_revenue_records.csv")
    df_rev["revenue_area_sqm"] = df_rev["revenue_area_acres"] * 4046.86
    df_rev.to_sql("stage_revenue", engine, if_exists="replace", index=False)

    # 4. Ingest Registration Dept (Guideline Value & EC)
    df_reg = pd.read_csv("data/dept_registration.csv")
    df_reg.to_sql("stage_registration", engine, if_exists="replace", index=False)

    # 5. Ingest Municipal Dept (Zoning & Master Plan)
    df_mun = pd.read_csv("data/dept_municipal.csv")
    df_mun.to_sql("stage_municipal", engine, if_exists="replace", index=False)

    # 6. Create Master Unified PostGIS View (Joins all 4 Departments)
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE OR REPLACE VIEW master_harmonized_land_records AS
            SELECT 
                c.survey_number,
                c.village,
                r.patta_number,
                r.patta_holder,
                r.land_type,
                c.cadastral_area_sqm AS gis_area_sqm,
                r.revenue_area_sqm,
                ABS(COALESCE(c.cadastral_area_sqm, 0) - COALESCE(r.revenue_area_sqm, 0)) AS area_discrepancy_sqm,
                reg.last_doc_number,
                reg.guideline_value_sqft,
                reg.encumbrance_status,
                mun.zoning_classification,
                mun.master_plan_approval,
                mun.property_tax_id,
                c.geometry
            FROM stage_cadastral c
            LEFT JOIN stage_revenue r ON c.survey_number = r.survey_no
            LEFT JOIN stage_registration reg ON c.survey_number = reg.survey_number
            LEFT JOIN stage_municipal mun ON c.survey_number = mun.gis_survey_id;
        """))

    print("✅ Success! 4-Department Master View 'master_harmonized_land_records' created in PostGIS.")

if __name__ == "__main__":
    run_multi_dept_etl()