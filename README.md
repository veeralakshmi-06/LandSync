# LandSync — Member 2 Real GIS + Satellite Data Engine

> **Role & Subsystem**: Member 2 — Complete GIS / Remote Sensing / Spatial Engine Layer  
> **Platform**: LandSync — AI-Powered Geospatial Land Data Harmonization & Intelligence Platform

---

## 📌 Executive Summary

Member 2 is responsible for the core spatial intelligence engine of LandSync. This engine ingests real-world geospatial datasets (cadastral maps, municipal layers, GNSS/CORS surveys, building footprints) and connects directly with official satellite data APIs (Copernicus Data Space Ecosystem STAC). It harmonizes disparate Coordinate Reference Systems (CRS), validates spatial topology, calculates metric parcel area differences, performs spatial overlay matching, and flags conflict severity.

---

## 🏗️ GIS Engine Architecture

```
[ Vector Datasets ]              [ Copernicus STAC API ]
(GeoJSON, Shapefile, GPKG, CSV)   (https://stac.dataspace.copernicus.eu/v1/)
       │                                     │
       ▼                                     ▼
┌──────────────────┐               ┌──────────────────┐
│  CRS Harmonizer  │               │ SatelliteCatalog │
└────────┬─────────┘               └────────┬─────────┘
         │                                  │
         ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐
│ GeometryVal.     │               │ ImagerySearch &  │
└────────┬─────────┘               │ BestSceneSelector│
         │                                  │
         ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐
│ AreaAnalyzer     │               │ ImageryProcessor │
└────────┬─────────┘               │ (Clip / NDVI)    │
         │                                  │
         ▼                                  └───────┐
┌──────────────────┐                                │
│ SpatialMatcher   │                                │
└────────┬─────────┘                                │
         │                                          │
         ▼                                          │
┌──────────────────┐                                │
│ ConflictDetector │                                │
└────────┬─────────┘                                │
         │                                          │
         └─────────────┬────────────────────────────┘
                       ▼
            ┌─────────────────────┐
            │  Unified GIS Result │
            └─────────────────────┘
```

---

## 📐 Core Engineering Standards & Rules

1. **Strict Projected CRS for Metric Calculations**:
   - Never calculate parcel area or linear boundary distances directly in geographic degrees (`EPSG:4326`).
   - Automatically determines optimal local UTM CRS (or metric projection like `EPSG:3857`) for accurate metric area (`sq_m`, `hectares`, `acres`).
2. **Metadata Preservation**:
   - Preserves raw source attributes, original CRS parameters, and repair logs in dataframe metadata attributes (`gdf.attrs`).
3. **Reproducible Pipeline**:
   - Structured conflict output with severity classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
4. **Copernicus STAC Integration**:
   - Connects to official Copernicus endpoint: `https://stac.dataspace.copernicus.eu/v1/`
   - Uses AOI-based spatial bounding box filtering, cloud cover limits, and recency scoring rather than downloading giant satellite scenes.

---

## 📁 File Structure

```
member_2_gis/
├── gis_engine/
│   ├── __init__.py
│   ├── crs_harmonizer.py       # CRS detection, UTM selection, reprojection
│   ├── geometry_validator.py   # Topology checks (null, empty, invalid, self-intersection, duplicates)
│   ├── area_analyzer.py        # Metric parcel area calculation and claim vs survey mismatch
│   ├── spatial_matcher.py      # IoU, centroid distance, spatial overlap scoring
│   ├── conflict_detector.py   # Rule-based conflict engine & severity grading
│   └── satellite/
│       ├── __init__.py
│       ├── satellite_catalog.py # Copernicus STAC API query wrapper
│       ├── sentinel2_client.py  # OAuth2 authentication & asset token client
│       ├── imagery_search.py   # High-level AOI search & multi-criteria scene selector
│       └── imagery_processor.py# Raster inspection, AOI clipping, NDVI computation
├── gis_pipeline.py             # End-to-end GIS pipeline orchestrator
├── tests/
│   ├── __init__.py
│   ├── test_crs_harmonizer.py
│   ├── test_geometry_validator.py
│   ├── test_area_analyzer.py
│   ├── test_spatial_matcher.py
│   ├── test_conflict_detector.py
│   ├── test_satellite_catalog.py
│   └── test_sentinel2_client.py
├── data/
│   ├── input/
│   ├── cache/
│   └── output/
├── utils/
│   ├── __init__.py
│   └── geometry_utils.py        # Format-agnostic loader (GeoJSON, SHP, GPKG, CSV, KML)
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ Environment Setup & Installation

1. **Navigate to member_2_gis directory**:
   ```bash
   cd member_2_gis
   ```

2. **Create Python virtual environment**:
   ```bash
   python -m venv .venv
   ```

3. **Activate environment**:
   - **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
   - **Linux / macOS**: `source .venv/bin/activate`

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Add your Copernicus Data Space Ecosystem credentials if running live API calls.

---

## 🧪 Running Tests

### 1. Run Unit Tests (In-Memory Synthetic Data & Mocked Satellite APIs)
```bash
pytest -v -m "not integration"
```

### 2. Run Optional Live Satellite Integration Test
```bash
pytest -v -m "integration"
```

### 3. Run Full Test Suite
```bash
pytest -v
```

---

## 🚀 Development Roadmap

- [x] **Phase 1: Architecture Initialization & Test Rig** (Completed)
- [ ] **Phase 2: Real File Processing & Dynamic CRS Harmonization Engine**
- [ ] **Phase 3: Topological Geometry Repair & Boundary Similarity Matching**
- [ ] **Phase 4: STAC AOI Sentinel-2 Asset Retrieval & Cloud-Aware Clipping**
- [ ] **Phase 5: Backend Integration Contract for LandSync Core**
