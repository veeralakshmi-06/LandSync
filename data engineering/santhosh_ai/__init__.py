"""
Santhosh's AI Conflict & Change Detection Module
------------------------------------------------
Role: Santhosh – AI Conflict & Change Detection Lead
Purpose: Identify data conflicts, spatial conflicts, multi-year changes (2024-2026),
         classify severity (LOW, MEDIUM, HIGH, CRITICAL), provide Critical Conflict Resolutions,
         extract official document coordinates, and generate human-readable explanations.
"""

from .pipeline import ConflictAndChangeDetector
from .data_conflict_detector import DataConflictDetector
from .spatial_conflict_detector import SpatialConflictDetector
from .change_detector import ChangeDetector
from .severity_classifier import SeverityClassifier
from .explainer import ConflictExplainer
from .resolution_engine import CriticalConflictResolver
from .models import (
    ConflictType,
    ChangeType,
    SeverityLevel,
    ConflictItem,
    ChangeItem,
    CriticalResolution,
    OfficialDocumentReference,
    ParcelAnalysisResult
)

__all__ = [
    "ConflictAndChangeDetector",
    "DataConflictDetector",
    "SpatialConflictDetector",
    "ChangeDetector",
    "SeverityClassifier",
    "ConflictExplainer",
    "CriticalConflictResolver",
    "ConflictType",
    "ChangeType",
    "SeverityLevel",
    "ConflictItem",
    "ChangeItem",
    "CriticalResolution",
    "OfficialDocumentReference",
    "ParcelAnalysisResult",
]

__version__ = "1.1.0"
__author__ = "Santhosh (AI Conflict & Change Detection Lead)"
