import subprocess
import sys

def run_script(script_name, description):
    print(f"\n==================================================")
    print(f"▶️ RUNNING: {description} ({script_name})")
    print(f"==================================================")
    result = subprocess.run([sys.executable, script_name], capture_output=False)
    if result.returncode != 0:
        print(f"❌ Error occurred while executing {script_name}")
        sys.exit(1)

def run_master_data_pipeline():
    print("\n🚀 STARTING COMPLETE LANDSYNC DATA ENGINEERING PIPELINE (MEMBER 5)...")
    
    # 1. Fetch & Synthesize 4-Dept Real 5KM Data
    run_script("fetch_multi_dept_5km.py", "Fetching 5KM Cadastral & Synthesizing 4 Department Datasets")
    
    # 2. Harmonize & Ingest into PostGIS
    run_script("multi_dept_pipeline.py", "Ingesting & Harmonizing Vector/Tabular Data into PostGIS View")
    
    # 3. Ingest Drone & Satellite Catalog
    run_script("ingest_imagery.py", "Registering Drone & Satellite Raster Catalog in PostGIS")
    
    # 4. Generate Data Quality Report
    run_script("data_quality_reporter.py", "Analyzing Missing Records & Area Discrepancies")
    
    # 5. Generate Web Map
    run_script("generate_web_map.py", "Building Interactive Web GIS Map View")
    
    print("\n==================================================")
    print("🎯 ALL DATA PIPELINES COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_master_data_pipeline()