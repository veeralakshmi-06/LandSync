import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine
import json

DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

def generate_quality_and_conflict_summary():
    print("📊 Generating Data Quality & Ingestion Summary Report...")

    # PostGIS View-லிருந்து harmonized data-வை எடுத்தல்
    query = "SELECT * FROM unified_land_records;"
    gdf = gpd.read_postgis(query, engine, geom_col="geometry")

    total_records = len(gdf)
    missing_geometry = int(gdf["geometry"].isna().sum())
    missing_owner = int(gdf["registered_owner"].isna().sum())
    
    # பரப்பளவில் 5%க்கு மேல் முரண்பாடு உள்ள நிலங்களைக் கண்டறிதல்
    area_mismatches = gdf[gdf["area_discrepancy_sqm"] > 50.0]

    report = {
        "dataset_summary": {
            "total_harmonized_parcels": total_records,
            "missing_spatial_polygons": missing_geometry,
            "missing_revenue_records": missing_owner,
            "status": "PROCESSED_SUCCESSFULLY"
        },
        "critical_flags": [
            {
                "survey_number": row["survey_number"],
                "village": row["village_name"],
                "discrepancy_sqm": round(float(row["area_discrepancy_sqm"]), 2),
                "issue_type": "AREA_MISMATCH" if row["area_discrepancy_sqm"] > 50 else "GEOMETRY_MISSING" if pd.isna(row["geometry"]) else "UNREGISTERED_PARCEL"
            }
            for _, row in area_mismatches.iterrows()
        ]
    }

    # Backend / AI டீமுக்காக JSON ஃபைலாக சேமித்தல்
    with open("data_quality_report.json", "w") as f:
        json.dump(report, f, indent=4)

    print("\n--- Ingestion Quality Report ---")
    print(f"Total Parcels Analyzed: {total_records}")
    print(f"Missing Geometries Flagged: {missing_geometry}")
    print(f"Area Discrepancies Detected: {len(area_mismatches)}")
    print("📄 Saved output to 'data_quality_report.json'")

if __name__ == "__main__":
    generate_quality_and_conflict_summary()