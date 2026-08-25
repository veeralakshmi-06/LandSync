import osmnx as ox
import geopandas as gpd
import pandas as pd
import random

def generate_four_department_datasets(lat=11.0402, lon=77.0743, dist_meters=5000):
    print(f"📡 Downloading 5 KM GIS Footprints from Point: ({lat}, {lon})...")
    
    # Base GIS Extraction via OSM
    gdf = ox.features_from_point((lat, lon), tags={'building': True}, dist=dist_meters)
    gdf = gdf[gdf.geometry.type.isin(['Polygon', 'MultiPolygon'])].reset_index()[['geometry']]
    gdf = gdf.to_crs(epsg=4326)
    
    gdf_projected = gdf.to_crs(epsg=3857)
    survey_numbers = []
    area_sqm_list = []
    
    for i, geom in enumerate(gdf_projected.geometry):
        survey_numbers.append(f"S.No {300 + (i // 5)}/{(i % 5) + 1}")
        area_sqm_list.append(round(geom.area, 2))
        
    gdf['survey_number'] = survey_numbers
    gdf['cadastral_area_sqm'] = area_sqm_list
    gdf['village'] = "Avinashi_Road_Zone"
    sample_parcels = gdf.head(200)

    # 1. SURVEY / CADASTRAL DEPT DATA (GeoJSON)
    sample_parcels.to_file("data/dept_survey_cadastral.geojson", driver="GeoJSON")
    print(f"✅ 1. Survey Cadastral GeoJSON saved: data/dept_survey_cadastral.geojson ({len(sample_parcels)} records)")

    # 2. REVENUE DEPT DATA (Patta & Land Area)
    owners = ["Ramasamy", "Anitha", "Karthik", "Priya", "Murugan", "Suresh", "Lakshmi", "Vignesh"]
    revenue_rows = []
    for _, row in sample_parcels.iterrows():
        factor = random.choice([1.0, 1.0, 1.0, 1.08, 0.92]) # Add realistic area mismatch
        revenue_rows.append({
            "survey_no": row['survey_number'],
            "patta_number": f"PATTA-{random.randint(1000, 9999)}",
            "patta_holder": random.choice(owners),
            "revenue_area_acres": round(((row['cadastral_area_sqm'] * factor) / 4046.86), 3),
            "land_type": random.choice(["Nanjai", "Punjai", "Grama Natham", "Poramboke"])
        })
    pd.DataFrame(revenue_rows).to_csv("data/dept_revenue_records.csv", index=False)
    print("✅ 2. Revenue CSV saved: data/dept_revenue_records.csv")

    # 3. REGISTRATION DEPT DATA (Guideline Value & Encumbrance Details)
    registration_rows = []
    for _, row in sample_parcels.iterrows():
        is_encumbered = random.choice([False, False, False, True]) # Bank mortgage / legal claim
        registration_rows.append({
            "survey_number": row['survey_number'],
            "last_doc_number": f"DOC/{random.randint(100, 999)}/{random.randint(2018, 2024)}",
            "guideline_value_sqft": random.choice([3500, 4200, 5000, 6500]),
            "encumbrance_status": "MORTGAGED" if is_encumbered else "CLEAR",
            "registered_market_val": round(row['cadastral_area_sqm'] * random.randint(300, 600), 2)
        })
    pd.DataFrame(registration_rows).to_csv("data/dept_registration.csv", index=False)
    print("✅ 3. Registration Dept CSV saved: data/dept_registration.csv")

    # 4. MUNICIPAL / URBAN PLANNING DEPT DATA (Zoning & Approval Status)
    municipal_rows = []
    for _, row in sample_parcels.iterrows():
        zone = random.choice(["Residential", "Commercial", "Agricultural", "Waterbody_Buffer"])
        approval = "UNAPPROVED" if zone == "Waterbody_Buffer" else random.choice(["APPROVED", "APPROVED", "PENDING_APPROVAL"])
        municipal_rows.append({
            "gis_survey_id": row['survey_number'],
            "zoning_classification": zone,
            "master_plan_approval": approval,
            "property_tax_id": f"TAX-{random.randint(50000, 99999)}"
        })
    pd.DataFrame(municipal_rows).to_csv("data/dept_municipal.csv", index=False)
    print("✅ 4. Municipal Planning CSV saved: data/dept_municipal.csv")

if __name__ == "__main__":
    generate_four_department_datasets()