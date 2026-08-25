from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True, index=True)
    survey_number = Column(String, nullable=False)
    conflict_type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    risk_score = Column(Integer, default=0)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_by = Column(String, nullable=True)
    resolution_note = Column(String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "survey_number": self.survey_number,
            "conflict_type": self.conflict_type,
            "description": self.description,
            "risk_score": self.risk_score,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_by": self.resolved_by,
            "resolution_note": self.resolution_note
        }


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    conflict_id = Column(Integer, nullable=True)
    officer = Column(String, nullable=True)
    action = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "conflict_id": self.conflict_id,
            "officer": self.officer,
            "action": self.action,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

