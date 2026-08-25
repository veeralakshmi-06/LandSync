# Santhosh's AI Module: Land Conflict Detection, Change Detection & Critical Conflict Resolution

**Role:** Santhosh – AI Conflict & Change Detection Lead  
**Module Type:** Pure Backend & AI Intelligence Engine  
**Version:** 1.2.0

---

## 🗺️ Where Things Live

This repository contains multiple components and pipeline scripts. Here is a quick reference guide for backend contributors:

- **`data engineering/`** — **Primary Backend AI Module** (Santhosh's AI Conflict & Change Detection package `santhosh_ai/`, dataset, test suite, and canonical requirements — the core backend to run).
- **`run_detection.py`** — Root CLI entrypoint to execute Santhosh's conflict and change detection engine on sample land records.
- **`main.py`** — Root FastAPI REST API server exposing endpoints for health checks, statistics, conflict inspection, and resolution.
- **`ingest_harmonize.py` / `advanced_harmonizer.py` / `unified_pipeline.py` / `multi_dept_pipeline.py`** — Multi-department ETL ingestion pipelines harmonizing Revenue, Survey, Registration, and Municipal records into PostgreSQL/PostGIS.
- **`fetch_5km_dataset.py` / `fetch_multi_dept_5km.py`** — OSMnx / OpenStreetMap scripts for extracting and generating sample 5km geographical datasets.
- **`run_all_etl.py`** — Master orchestration script that sequentially executes all departmental ETL pipelines.
- **`data_quality_reporter.py` / `data_quality_report.json`** — Audit utility assessing data completeness, coordinate validity, and generating quality reports.
- **`generate_web_map.py` / `gis_map_view.html`** — Interactive Folium GIS web map visualizer for multi-department cadastral parcel boundaries.
- **`ingest_imagery.py`** — Satellite and aerial imagery ingestion and metadata cataloging script.
- **`ai/matching/` (`run_matching.py`)** — Machine learning and similarity scoring pipeline for matching cadastral survey records with revenue records.
- **`integration/` (`resolve_conflicts.py`)** — Standalone integration utility linking matched records with conflict resolution outputs.
- **`data/`** — Multi-department source CSVs, Cadastral GeoJSONs, and spatial boundary layers.

> **Important:** Run the backend from the repo root with `python run_detection.py` or `python main.py` — both now correctly resolve the `santhosh_ai` package.

---

## 📖 Overview

In land administration, records from multiple government departments (such as Revenue Department RoR / Bhoomi, Registration Department deeds / Kaveri, Cadastral Maps, and Statutory Ground/DGPS Surveys) often contain discrepancies. 

**Santhosh's Backend AI Module** processes matched land records and provides:
1. **Data & Attribute Conflict Detection** (Area mismatches, Survey number variations, Village/Taluk discrepancies, Owner title disputes, Missing mandatory values, Duplicate records).
2. **Spatial & Geometric Conflict Detection** (Boundary vertex shifts, Parcel overlaps, Encroachments, Polygon shape distortion).
3. **Temporal Change Detection (2024 → 2026)** (Area changes, Boundary shifts, New building construction, Demolished structures, Parcel splits/subdivisions, Parcel merges).
4. **Deterministic Severity Classification** (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
5. **Critical Conflict Resolution** (Authoritative official survey coordinate extraction, spatial deviation calculations, and non-destructive recommendation generation).
6. **Structured Outputs** (JSON, CSV, and formatted terminal reports).

---

## 🏗️ Backend Architecture

```
data engineering/
├── santhosh_ai/                      # Core Backend AI Engine
│   ├── __init__.py                  # Package exports
│   ├── models.py                    # Dataclasses, CriticalResolution, and JSON schemas
│   ├── pipeline.py                  # Master ConflictAndChangeDetector controller
│   ├── resolution_engine.py         # Critical conflict resolver & coordinate extractor
│   ├── data_conflict_detector.py    # Attribute & multi-unit area conflict detector
│   ├── spatial_conflict_detector.py # Geometry, boundary shift & overlap detector
│   ├── change_detector.py           # Multi-year temporal change detector
│   ├── severity_classifier.py       # Severity classification matrix
│   ├── explainer.py                 # Natural language summary generator
│   └── geometry_utils.py            # Computational geometry & Hausdorff distance
├── data/
│   ├── sample_matched_records.json  # Primary real dataset with official survey documents
│   └── temporal_parcels_2024_2026.geojson # Spatial GeoJSON polygons & footprints
├── output/
│   ├── conflict_detection_results.json # Backend full JSON report
│   └── conflict_summary.csv         # Backend summary CSV report
├── tests/
│   ├── test_resolution.py           # Critical resolution & coordinate tests
│   ├── test_data_conflicts.py       # Attribute conflict unit tests
│   ├── test_spatial_conflicts.py    # Spatial overlap & boundary unit tests
│   ├── test_change_detection.py     # Temporal building & split/merge tests
│   └── test_pipeline.py             # End-to-end pipeline integration tests
├── run_detection.py                 # Backend command-line runner
├── requirements.txt                 # Dependencies (Python Standard Library)
└── README.md                        # Backend documentation
```

---

## 🚀 How to Run the Backend

### 1. Run Complete Backend Pipeline
```bash
python run_detection.py
```

### 2. Inspect a Specific Parcel (e.g. `89/2` or `45/1`)
```bash
python run_detection.py --parcel "89/2"
```

### 3. Run the Automated Unit Test Suite (20 Tests)
From the repo root:
```bash
python -m unittest discover -s "data engineering/tests" -t "data engineering" -p "test_*.py" -v
```
Or from inside `data engineering/`:
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

---

## ⚖️ Critical Conflict Resolution Rules

When a land conflict is classified as **`CRITICAL`**, the backend engine:
1. **Never generates, guesses, or invents coordinates.**
2. **Extracts coordinates strictly from official survey documents** (`DOC-SSLR-...`) present in the repository.
3. If no digital coordinates are available in the document, returns `"OFFICIAL_COORDINATES_NOT_AVAILABLE"` and sets action to `MANUAL_SURVEY_VERIFICATION_REQUIRED`.
4. **Calculates spatial discrepancy** (maximum boundary shift in meters and area difference in acres).
5. **Generates tailored solutions:**
   - `AREA_MISMATCH`: *"Verify the area using the official survey geometry and recalculate the parcel area."*
   - `BOUNDARY_MISMATCH`: *"Compare the conflicting boundary with the official survey coordinates and perform manual survey verification."*
   - `OWNER_MISMATCH`: *"Verify ownership using the authoritative land/registration document."*
   - `SURVEY_NUMBER_MISMATCH`: *"Verify the survey number against the authoritative survey record."*
   - `PARCEL_OVERLAP`: *"Inspect boundary overlap against authoritative survey map and perform joint field verification."*
   - `MULTIPLE_CRITICAL_CONFLICTS`: *"Escalate the parcel for multi-departmental manual expert review."*
6. **Never automatically modifies legal records.** Status is marked as `PENDING_REVIEW`.

---

## 📋 Generated Output Files
- **JSON Full Export:** `data engineering/output/conflict_detection_results.json`
- **CSV Summary Table:** `data engineering/output/conflict_summary.csv`
