import sys
print(f"Python Version: {sys.version}")

import geopandas as gpd
print(f"GeoPandas Version: {gpd.__version__}")

import shapely
print(f"Shapely Version: {shapely.__version__}")

import pyproj
print(f"PyProj Version: {pyproj.__version__}")

import rasterio
print(f"Rasterio Version: {rasterio.__version__}")

import pystac_client
print(f"pystac-client Version: {pystac_client.__version__}")

import fiona
print(f"Fiona Version: {fiona.__version__}")

import rioxarray
print(f"rioxarray Version: {rioxarray.__version__}")

import xarray
print(f"xarray Version: {xarray.__version__}")

# Verify project imports
from gis_engine import CRSHarmonizer, GeometryValidator, AreaAnalyzer, SpatialMatcher, ConflictDetector
from gis_engine.satellite import SatelliteCatalog, Sentinel2Client, search_recent_imagery, select_best_scene, ImageryProcessor
from gis_pipeline import GISPipeline
from utils import load_geospatial_file, export_geospatial_file, validate_crs_units

print("All project imports succeeded!")
