from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.database import engine, get_db
from app.models import Base, Conflict, AuditLog

app = FastAPI(
    title="LandSync AI Backend",
    version="1.0.0",
    description="Backend API for LandSync AI"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8002",
    "http://127.0.0.1:8002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure database tables exist
Base.metadata.create_all(bind=engine)


def init_db_data():
    db = Session(bind=engine)
    try:
        if db.query(Conflict).count() == 0:
            initial_conflicts = [
                Conflict(
                    id=101,
                    survey_number="SUR-001",
                    conflict_type="Area Mismatch",
                    description="Area differs between cadastral and revenue records",
                    risk_score=87,
                    status="pending"
                ),
                Conflict(
                    id=102,
                    survey_number="SUR-002",
                    conflict_type="Boundary Overlap",
                    description="Parcel overlaps with another cadastral parcel",
                    risk_score=92,
                    status="pending"
                ),
                Conflict(
                    id=103,
                    survey_number="SUR-003",
                    conflict_type="Duplicate Record",
                    description="Possible duplicate land record detected",
                    risk_score=75,
                    status="pending"
                )
            ]
            db.add_all(initial_conflicts)
            db.commit()
            try:
                db.execute(text("SELECT setval('conflicts_id_seq', (SELECT MAX(id) FROM conflicts));"))
                db.commit()
            except Exception:
                pass
    except Exception as e:
        db.rollback()
        print(f"Error seeding DB: {e}")
    finally:
        db.close()


init_db_data()


@app.get("/")
def root():
    return {
        "message": "LandSync AI Backend is running",
        "status": "success"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


land_records = [
    {
        "id": 1,
        "survey_number": "SUR-001",
        "owner_name": "Ravi Kumar",
        "area": 1250.5,
        "status": "verified"
    },
    {
        "id": 2,
        "survey_number": "SUR-002",
        "owner_name": "Priya",
        "area": 980.2,
        "status": "pending"
    },
    {
        "id": 3,
        "survey_number": "SUR-003",
        "owner_name": "Arun",
        "area": 1500.0,
        "status": "conflict"
    }
]


@app.get("/land-records")
def get_land_records():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT 
                    survey_number, 
                    village, 
                    patta_number, 
                    patta_holder, 
                    land_type, 
                    gis_area_sqm, 
                    revenue_area_sqm, 
                    area_discrepancy_sqm, 
                    last_doc_number, 
                    guideline_value_sqft, 
                    encumbrance_status, 
                    zoning_classification, 
                    master_plan_approval, 
                    property_tax_id
                FROM master_harmonized_land_records
            """))
            return [dict(row) for row in result.mappings()]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch land records from database: {str(e)}"
        )


@app.get("/land-records/{id}")
def get_land_record(id: int):
    for record in land_records:
        if record["id"] == id:
            return record

    return {"error": "Land record not found"}


@app.get("/conflicts")
def get_conflicts(db: Session = Depends(get_db)):
    conflicts_list = db.query(Conflict).order_by(Conflict.id.asc()).all()
    return [c.to_dict() for c in conflicts_list]


class ConflictActionPayload(BaseModel):
    officer: Optional[str] = "System Officer"
    resolution_note: Optional[str] = None


@app.post("/conflicts/{id}/approve")
def approve_conflict(id: int, payload: Optional[ConflictActionPayload] = None, db: Session = Depends(get_db)):
    conflict = db.query(Conflict).filter(Conflict.id == id).first()
    if not conflict:
        return {"error": "Conflict not found"}

    officer = payload.officer if (payload and payload.officer) else "System Officer"
    note = payload.resolution_note if payload else None

    conflict.status = "approved"
    conflict.resolved_by = officer
    conflict.resolution_note = note
    conflict.updated_at = datetime.utcnow()

    audit_entry = AuditLog(
        conflict_id=id,
        officer=officer,
        action="APPROVED"
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(conflict)

    return {
        "message": "Conflict approved successfully",
        "conflict": conflict.to_dict()
    }


@app.post("/conflicts/{id}/reject")
def reject_conflict(id: int, payload: Optional[ConflictActionPayload] = None, db: Session = Depends(get_db)):
    conflict = db.query(Conflict).filter(Conflict.id == id).first()
    if not conflict:
        return {"error": "Conflict not found"}

    officer = payload.officer if (payload and payload.officer) else "System Officer"
    note = payload.resolution_note if payload else None

    conflict.status = "rejected"
    conflict.resolved_by = officer
    conflict.resolution_note = note
    conflict.updated_at = datetime.utcnow()

    audit_entry = AuditLog(
        conflict_id=id,
        officer=officer,
        action="REJECTED"
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(conflict)

    return {
        "message": "Conflict rejected successfully",
        "conflict": conflict.to_dict()
    }


@app.post("/conflicts/{id}/escalate")
def escalate_conflict(id: int, payload: Optional[ConflictActionPayload] = None, db: Session = Depends(get_db)):
    conflict = db.query(Conflict).filter(Conflict.id == id).first()
    if not conflict:
        return {"error": "Conflict not found"}

    officer = payload.officer if (payload and payload.officer) else "System Officer"
    note = payload.resolution_note if payload else None

    conflict.status = "escalated"
    conflict.resolved_by = officer
    conflict.resolution_note = note
    conflict.updated_at = datetime.utcnow()

    audit_entry = AuditLog(
        conflict_id=id,
        officer=officer,
        action="ESCALATED"
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(conflict)

    return {
        "message": "Conflict escalated successfully",
        "conflict": conflict.to_dict()
    }


@app.post("/audit")
async def create_audit_log(
    request: Request,
    action: Optional[str] = None,
    conflict_id: Optional[int] = None,
    officer: Optional[str] = None,
    db: Session = Depends(get_db)
):
    body_action = action
    body_conflict_id = conflict_id
    body_officer = officer

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            data = await request.json()
            if isinstance(data, dict):
                body_action = data.get("action", body_action)
                body_conflict_id = data.get("conflict_id", body_conflict_id)
                body_officer = data.get("officer", body_officer)
        except Exception:
            pass

    if not body_action:
        raise HTTPException(status_code=400, detail="action is required")

    log_entry = AuditLog(
        conflict_id=body_conflict_id,
        officer=body_officer,
        action=body_action
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return {
        "message": "Audit log created successfully",
        "log": log_entry.to_dict()
    }


@app.get("/audit")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    return [log.to_dict() for log in logs]