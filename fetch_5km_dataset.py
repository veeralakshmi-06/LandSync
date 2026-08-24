import osmnx as ox
import geopandas as gpd
import pandas as pd
import random

def download_exact_5km_data(lat=11.0402, lon=77.0743, dist_meters=5000):
    print(f"📡 Fetching 5 km radius real GIS data around Point: ({lat}, {lon})...")
    
    # 1. Fetch real polygons directly from exact lat, lon point
    point = (lat, lon)
    tags = {'building': True}
    gdf = ox.features_from_point(point, tags=tags, dist=dist_meters)
    
    # Filter only Polygons and MultiPolygons
    gdf = gdf[gdf.geometry.type.isin(['Polygon', 'MultiPolygon'])].reset_index()
    gdf = gdf[['geometry']].copy()
    
    # Standard WGS84 CRS (EPSG:4326)
    gdf = gdf.to_crs(epsg=4326)
    
    print("⚙️ Synthesizing cadastral survey attributes for local region...")
    
    # Accurate Area Calculation in Sq. Meters (UTM zone)
    gdf_projected = gdf.to_crs(epsg=3857)
    
    survey_numbers = []
    area_sqm_list = []
    for i, geom in enumerate(gdf_projected.geometry):
        survey_numbers.append(f"S.No {200 + (i // 5)}/{(i % 5) + 1}")
        area_sqm_list.append(round(geom.area, 2))
        
    gdf['Survey_Number'] = survey_numbers
    gdf['Area_Sqm'] = area_sqm_list
    gdf['Village'] = "Avinashi_Road_Zone"
    
    # First 200 real parcels around your point
    gdf_sample = gdf.head(200)
    gdf_sample.to_file("data/dept_survey_5km.geojson", driver="GeoJSON")
    print(f"✅ Cadastral GeoJSON saved: data/dept_survey_5km.geojson ({len(gdf_sample)} parcels)")
    
    # 2. Matching Revenue CSV with discrepancy flags
    revenue_rows = []
    owners = ["Ramasamy", "Anitha", "Karthik", "Priya", "Murugan", "Suresh", "Lakshmi", "Vignesh"]
    
    for _, row in gdf_sample.iterrows():
        factor = random.choice([1.0, 1.0, 1.0, 1.07, 0.93])
        area_acres = round(((row['Area_Sqm'] * factor) / 4046.86), 3)
        
        revenue_rows.append({
            "SurveyNo": row['Survey_Number'],
            "Patta_Holder": random.choice(owners),
            "Land_Area_Acres": area_acres,
            "Revenue_Village": "Avinashi_Road_Zone"
        })
        
    df_rev = pd.DataFrame(revenue_rows)
    df_rev.to_csv("data/dept_revenue_5km.csv", index=False)
    print(f"✅ Revenue CSV saved: data/dept_revenue_5km.csv ({len(df_rev)} records)")

if __name__ == "__main__":
    download_exact_5km_data()