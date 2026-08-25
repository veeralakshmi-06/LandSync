import geopandas as gpd
import pandas as pd
import json
from sqlalchemy import create_engine

# Database Connection (Replace YOUR_PASSWORD with your actual password)
DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

def generate_quality_and_conflict_summary():
    print("📊 Generating 4-Department Data Quality & Conflict Summary Report...")
    
    # Query updated master 4-department view
    query = "SELECT * FROM master_harmonized_land_records;"
    gdf = gpd.read_postgis(query, engine, geom_col="geometry")
    
    total_records = len(gdf)
    missing_patta = int(gdf['patta_number'].isna().sum())
    missing_zoning = int(gdf['zoning_classification'].isna().sum())
    mortgaged_count = int((gdf['encumbrance_status'] == 'MORTGAGED').sum())
    unapproved_zones = int((gdf['master_plan_approval'] == 'UNAPPROVED').sum())
    
    # Detect Area Discrepancies > 30 sqm
    discrepancy_cases = gdf[gdf['area_discrepancy_sqm'] > 30.0]
    conflict_count = len(discrepancy_cases)
    
    report = {
        "dataset_summary": {
            "total_parcels_processed": total_records,
            "region": "Avinashi Road Zone, Coimbatore (5 KM Radius)",
            "departments_integrated": ["Survey_Cadastral", "Revenue_Patta", "Registration_SRO", "Municipal_DTCP"]
        },
        "critical_anomalies_detected": {
            "area_mismatch_conflicts": conflict_count,
            "missing_patta_records": missing_patta,
            "unapproved_or_waterbody_zones": unapproved_zones,
            "encumbered_mortgaged_properties": mortgaged_count
        },
        "sample_conflicted_parcels": discrepancy_cases[[
            'survey_number', 'patta_holder', 'gis_area_sqm', 'revenue_area_sqm', 'area_discrepancy_sqm', 'zoning_classification'
        ]].head(10).to_dict(orient='records')
    }
    
    with open("data_quality_report.json", "w") as f:
        json.dump(report, f, indent=4)
        
    print(f"✅ Report saved: 'data_quality_report.json'")
    print(f"   • Total Parcels: {total_records}")
    print(f"   • Area Discrepancy Conflicts: {conflict_count}")
    print(f"   • Mortgaged Parcels: {mortgaged_count}")
    print(f"   • Unapproved / Waterbody Violations: {unapproved_zones}")

if __name__ == "__main__":
    generate_quality_and_conflict_summary()