import geopandas as gpd
import folium
from folium import plugins
from sqlalchemy import create_engine

# Database Connection (Replace YOUR_PASSWORD with your actual password)
DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

def generate_interactive_map():
    print("🗺️ Generating Interactive Web GIS Map from PostGIS...")
    
    query = """
        SELECT survey_number, village, patta_holder, land_type,
               gis_area_sqm, revenue_area_sqm, area_discrepancy_sqm,
               guideline_value_sqft, encumbrance_status, zoning_classification, 
               master_plan_approval, geometry 
        FROM master_harmonized_land_records 
        WHERE geometry IS NOT NULL;
    """
    gdf = gpd.read_postgis(query, engine, geom_col="geometry")
    
    if gdf.empty:
        print("⚠️ No spatial records found.")
        return

    center_lat = gdf.geometry.centroid.y.mean()
    center_lon = gdf.geometry.centroid.x.mean()
    
    m = folium.Map(location=[center_lat, center_lon], zoom_start=15, control_scale=True)
    
    folium.TileLayer(
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri Satellite',
        name='Satellite View'
    ).add_to(m)

    folium.TileLayer('openstreetmap', name='OpenStreetMap Standard').add_to(m)

    def style_function(feature):
        discrepancy = feature['properties']['area_discrepancy_sqm']
        zone = feature['properties']['zoning_classification']
        if (discrepancy and discrepancy > 30.0) or zone == "Waterbody_Buffer":
            return {'fillColor': '#ff4d4d', 'color': '#b30000', 'weight': 2, 'fillOpacity': 0.6}
        else:
            return {'fillColor': '#33cc33', 'color': '#008000', 'weight': 1.5, 'fillOpacity': 0.4}

    folium.GeoJson(
        gdf,
        name="Cadastral Parcels",
        style_function=style_function,
        tooltip=folium.GeoJsonTooltip(
            fields=['survey_number', 'patta_holder', 'gis_area_sqm', 'area_discrepancy_sqm', 'zoning_classification'],
            aliases=['Survey No:', 'Patta Holder:', 'GIS Area (sqm):', 'Discrepancy (sqm):', 'Zoning:']
        ),
        popup=folium.GeoJsonPopup(
            fields=['survey_number', 'patta_holder', 'land_type', 'gis_area_sqm', 'revenue_area_sqm', 'area_discrepancy_sqm', 'guideline_value_sqft', 'encumbrance_status', 'master_plan_approval'],
            aliases=['Survey No', 'Patta Holder', 'Land Type', 'GIS Area (sqm)', 'Revenue Area (sqm)', 'Discrepancy (sqm)', 'Guideline (₹/sqft)', 'Encumbrance', 'DTCP Approval']
        )
    ).add_to(m)

    folium.LayerControl().add_to(m)
    plugins.Fullscreen().add_to(m)

    output_html = "gis_map_view.html"
    m.save(output_html)
    print(f"✅ Interactive GIS Map saved successfully: '{output_html}'")

if __name__ == "__main__":
    generate_interactive_map()