#!/usr/bin/env python3
"""
Santhosh's Land Conflict & Change Detection Backend API
-------------------------------------------------------
FastAPI backend service exposing REST endpoints, OpenAPI Swagger documentation (/docs),
ReDoc (/redoc), dataset/database health checks, and conflict resolution engines.
"""

import sys
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional

# Load environment variables if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from santhosh_ai.pipeline import ConflictAndChangeDetector
from santhosh_ai.models import SeverityLevel

# Configuration from Environment Variables
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
DATASET_PATH = Path(os.getenv("DATASET_PATH", str(BASE_DIR / "data" / "sample_matched_records.json")))
DATABASE_URL = os.getenv("DATABASE_URL", None)

app = FastAPI(
    title="Santhosh's AI Land Conflict & Change Detection API",
    description=(
        "Backend REST API for land record matching, data & spatial conflict detection, "
        "historical change detection, owner identification, and CRITICAL conflict resolution with "
        "authoritative official survey coordinates."
    ),
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS for backend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance
detector = ConflictAndChangeDetector()


def load_database_records() -> Dict[str, Any]:
    """
    Connects to and loads data from the configured land records database/dataset.
    """
    target_path = DATASET_PATH if DATASET_PATH.is_absolute() else (BASE_DIR / DATASET_PATH)
    if not target_path.exists():
        raise FileNotFoundError(f"Database / Dataset not found at: {target_path}")
    
    with open(target_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


@app.get("/", tags=["General"])
def root():
    """
    Root entry point providing service metadata, database status, and documentation links.
    """
    return {
        "service": "Santhosh's AI Conflict & Change Detection Engine",
        "role": "Santhosh – Land Conflict & Change Detection Lead",
        "status": "ONLINE",
        "version": "1.2.0",
        "database_connected": DATASET_PATH.exists(),
        "database_source": str(DATASET_PATH),
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "endpoints": [
            "/api/health",
            "/api/stats",
            "/api/conflicts",
            "/api/conflicts/{parcel_id}",
            "/api/resolve/{parcel_id}"
        ]
    }


@app.get("/api/health", tags=["System"])
def health_check():
    """
    Verifies backend operational status and database connectivity.
    """
    try:
        data = load_database_records()
        parcel_count = len(data.get("parcels", []))
        return {
            "status": "HEALTHY",
            "database_connected": True,
            "database_type": "JSON Cadastral Store (Configurable via DATABASE_URL)",
            "database_file": str(DATASET_PATH),
            "total_parcels_in_database": parcel_count,
            "region": data.get("region", "Kadugodi / Whitefield Cadastral Zone")
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "UNHEALTHY",
                "database_connected": False,
                "error": str(e)
            }
        )


@app.get("/api/stats", tags=["Analytics"])
def get_execution_stats():
    """
    Retrieves summary execution metrics, conflict counts, and severity distribution.
    """
    try:
        dataset = load_database_records()
        results = detector.analyze_dataset(dataset)

        total_parcels = len(results)
        total_matched_records = sum(len(p.get("matched_records", [])) for p in dataset.get("parcels", []))
        total_conflicts = sum(len(r["conflicts"]) for r in results)
        total_changes = sum(len(r["changes"]) for r in results)

        severity_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        owners_available_count = 0
        official_coords_available_count = 0
        critical_parcel_ids = []

        for r in results:
            sev = r.get("overall_severity", "LOW")
            severity_counts[sev] = severity_counts.get(sev, 0) + 1

            if r.get("owners") and len(r["owners"]) > 0:
                owners_available_count += 1

            res = r.get("resolution")
            if res and res.get("official_survey_coordinates") not in [None, "OFFICIAL_COORDINATES_NOT_AVAILABLE"]:
                official_coords_available_count += 1

            if sev == "CRITICAL":
                critical_parcel_ids.append(r["parcel_id"])

        return {
            "total_records_processed": total_matched_records,
            "total_parcels_analyzed": total_parcels,
            "total_conflicts_detected": total_conflicts,
            "total_historical_changes": total_changes,
            "severity_distribution": severity_counts,
            "owner_information_available_count": owners_available_count,
            "official_coordinates_available_count": official_coords_available_count,
            "critical_parcels_count": len(critical_parcel_ids),
            "critical_parcels": critical_parcel_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conflicts", tags=["Conflicts & Changes"])
def get_all_conflicts(
    severity: Optional[str] = Query(None, description="Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)")
):
    """
    Retrieves all analyzed land parcels with conflict reports, detected changes, and resolutions.
    """
    try:
        dataset = load_database_records()
        results = detector.analyze_dataset(dataset)

        if severity:
            sev_upper = severity.strip().upper()
            results = [r for r in results if r.get("overall_severity") == sev_upper]

        return {
            "count": len(results),
            "parcels": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conflicts/{parcel_id:path}", tags=["Conflicts & Changes"])
def get_parcel_conflict(parcel_id: str):
    """
    Retrieves the complete conflict and change detection audit for a specific parcel ID.
    Supports slashed survey numbers (e.g. 127/3, 89/2, 45/1).
    """
    try:
        dataset = load_database_records()
        results = detector.analyze_dataset(dataset)
        
        target = next((r for r in results if r.get("parcel_id", "").lower() == parcel_id.strip().lower()), None)
        if not target:
            raise HTTPException(status_code=404, detail=f"Parcel '{parcel_id}' not found in database.")

        return target
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resolve/{parcel_id:path}", tags=["Critical Resolution"])
def resolve_critical_conflict(parcel_id: str):
    """
    Executes authoritative critical resolution for a parcel, extracting official coordinates
    and generating non-destructive recommendations.
    Supports slashed survey numbers (e.g. 127/3, 89/2, 45/1).
    """
    try:
        dataset = load_database_records()
        results = detector.analyze_dataset(dataset)
        
        target = next((r for r in results if r.get("parcel_id", "").lower() == parcel_id.strip().lower()), None)
        if not target:
            raise HTTPException(status_code=404, detail=f"Parcel '{parcel_id}' not found in database.")

        resolution = target.get("resolution")
        if not resolution:
            return {
                "parcel_id": parcel_id,
                "severity": target.get("overall_severity", "LOW"),
                "message": "Parcel is not classified as CRITICAL/HIGH. No critical resolution required."
            }

        return resolution
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print(f"[*] Starting FastAPI backend server on http://{HOST}:{PORT}")
    print(f"[*] Interactive API Docs (Swagger): http://{HOST}:{PORT}/docs")
    print(f"[*] ReDoc Documentation:            http://{HOST}:{PORT}/redoc")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
