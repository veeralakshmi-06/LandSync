import os
import pandas as pd
from sqlalchemy import create_engine, text

# Unga PostgreSQL password-ai replace pannavum
DB_URL = "postgresql://postgres:echo@localhost:5432/landsync_db"
engine = create_engine(DB_URL)

def setup_imagery_catalog():
    print("🛰️ Registering Satellite & Drone Metadata in PostGIS...")

    os.makedirs("data/imagery", exist_ok=True)

    # 1. Drone & Satellite Metadata Catalog
    imagery_records = [
        {
            "image_id": "SAT_SENTINEL2_COIMBATORE_001",
            "image_type": "SATELLITE",
            "sensor_source": "Sentinel-2 L2A",
            "resolution_meters": 10.0,
            "capture_date": "2026-01-15",
            "bounding_box_wgs84": "POLYGON((77.02 11.00, 77.12 11.00, 77.12 11.08, 77.02 11.08, 77.02 11.00))",
            "file_path": "data/imagery/satellite_scene_latest.tif",
            "status": "AVAILABLE"
        },
        {
            "image_id": "DRONE_ORTHO_AVINASHI_002",
            "image_type": "DRONE_UAV",
            "sensor_source": "DJI Matrice 300 RTK",
            "resolution_meters": 0.05,
            "capture_date": "2026-02-10",
            "bounding_box_wgs84": "POLYGON((77.06 11.03, 77.09 11.03, 77.09 11.05, 77.06 11.05, 77.06 11.03))",
            "file_path": "data/imagery/drone_orthomosaic_5km.tif",
            "status": "PROCESSED"
        }
    ]

    df_imagery = pd.DataFrame(imagery_records)

    # 2. Ingest into PostGIS Table
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS stage_imagery_catalog CASCADE;"))
        conn.execute(text("""
            CREATE TABLE stage_imagery_catalog (
                image_id VARCHAR(100) PRIMARY KEY,
                image_type VARCHAR(50),
                sensor_source VARCHAR(100),
                resolution_meters FLOAT,
                capture_date DATE,
                bounding_box_wgs84 GEOMETRY(Polygon, 4326),
                file_path TEXT,
                status VARCHAR(50)
            );
        """))

        for _, row in df_imagery.iterrows():
            conn.execute(text("""
                INSERT INTO stage_imagery_catalog 
                (image_id, image_type, sensor_source, resolution_meters, capture_date, bounding_box_wgs84, file_path, status)
                VALUES (:image_id, :image_type, :sensor_source, :resolution_meters, :capture_date, ST_GeomFromText(:bounding_box, 4326), :file_path, :status);
            """), {
                "image_id": row['image_id'],
                "image_type": row['image_type'],
                "sensor_source": row['sensor_source'],
                "resolution_meters": row['resolution_meters'],
                "capture_date": row['capture_date'],
                "bounding_box": row['bounding_box_wgs84'],
                "file_path": row['file_path'],
                "status": row['status']
            })

    print("✅ Success! Drone & Satellite catalog saved in PostGIS table 'stage_imagery_catalog'.")

if __name__ == "__main__":
    setup_imagery_catalog()