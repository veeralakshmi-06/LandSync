"""
Models and Data Structures for Santhosh's AI Conflict & Change Detection Module.
Includes Critical Conflict Resolution schemas, Official Document References, and Formatted Outputs.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional, Union
import json


class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

    @classmethod
    def max_severity(cls, levels: List["SeverityLevel"]) -> "SeverityLevel":
        order = [cls.LOW, cls.MEDIUM, cls.HIGH, cls.CRITICAL]
        if not levels:
            return cls.LOW
        return max(levels, key=lambda x: order.index(x) if x in order else 0)


class ConflictType(str, Enum):
    # Data Conflicts
    AREA_MISMATCH = "AREA_MISMATCH"
    SURVEY_NUMBER_MISMATCH = "SURVEY_NUMBER_MISMATCH"
    VILLAGE_MISMATCH = "VILLAGE_MISMATCH"
    LOCATION_MISMATCH = "LOCATION_MISMATCH"
    OWNER_MISMATCH = "OWNER_MISMATCH"
    LAND_USE_MISMATCH = "LAND_USE_MISMATCH"
    MISSING_VALUE = "MISSING_VALUE"
    DUPLICATE_RECORD = "DUPLICATE_RECORD"
    INCONSISTENT_INFORMATION = "INCONSISTENT_INFORMATION"
    
    # Spatial Conflicts
    BOUNDARY_MISMATCH = "BOUNDARY_MISMATCH"
    PARCEL_OVERLAP = "PARCEL_OVERLAP"
    GAP_DETECTED = "GAP_DETECTED"
    SHAPE_DEVIATION = "SHAPE_DEVIATION"
    GEOMETRY_AREA_MISMATCH = "GEOMETRY_AREA_MISMATCH"


class ChangeType(str, Enum):
    AREA_CHANGE = "AREA_CHANGE"
    BOUNDARY_CHANGE = "BOUNDARY_CHANGE"
    NEW_BUILDING = "NEW_BUILDING"
    REMOVED_BUILDING = "REMOVED_BUILDING"
    PARCEL_SPLIT = "PARCEL_SPLIT"
    PARCEL_MERGE = "PARCEL_MERGE"
    LAND_USE_CHANGE = "LAND_USE_CHANGE"


@dataclass
class OfficialDocumentReference:
    doc_id: str
    doc_name: str
    authority: str
    date: str
    verified: bool = True
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "doc_name": self.doc_name,
            "authority": self.authority,
            "date": self.date,
            "verified": self.verified,
            "notes": self.notes
        }


@dataclass
class CriticalResolution:
    parcel_id: str
    survey_number: str
    owners: List[str]
    conflict_type: str
    severity: str
    conflicting_coordinates: Any
    official_survey_coordinates: Any
    coordinate_source: str
    source_document: Optional[OfficialDocumentReference]
    coordinate_comparison_result: str
    recommended_solution: str
    required_action: str = "MANUAL_SURVEY_VERIFICATION_REQUIRED"
    status: str = "PENDING_REVIEW"
    spatial_difference: Dict[str, Any] = field(default_factory=dict)
    official_geometry: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        owner_str = self.owners[0] if len(self.owners) == 1 else (", ".join(self.owners) if self.owners else "Not Available")
        return {
            "parcel_id": self.parcel_id,
            "survey_number": self.survey_number,
            "owner": owner_str,
            "owners": self.owners,
            "severity": self.severity,
            "conflict_type": self.conflict_type,
            "conflict_details": self.coordinate_comparison_result,
            "existing_coordinates": self.conflicting_coordinates,
            "conflicting_coordinates": self.conflicting_coordinates,
            "official_survey_coordinates": self.official_survey_coordinates,
            "coordinate_source": self.coordinate_source,
            "source_document": self.source_document.to_dict() if self.source_document else None,
            "coordinate_comparison_result": self.coordinate_comparison_result,
            "recommended_solution": self.recommended_solution,
            "required_action": self.required_action,
            "status": self.status,
            "spatial_difference": self.spatial_difference,
            "official_geometry": self.official_geometry
        }


@dataclass
class ConflictItem:
    type: str
    severity: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    field_name: Optional[str] = None
    description: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "type": self.type,
            "severity": self.severity
        }
        if self.old_value is not None:
            d["old_value"] = self.old_value
        if self.new_value is not None:
            d["new_value"] = self.new_value
        if self.field_name:
            d["field_name"] = self.field_name
        if self.description:
            d["description"] = self.description
        if self.details:
            d["details"] = self.details
        return d


@dataclass
class ChangeItem:
    type: str
    from_year: int
    to_year: int
    severity: str = SeverityLevel.MEDIUM.value
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    description: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "type": self.type,
            "from_year": self.from_year,
            "to_year": self.to_year,
            "severity": self.severity
        }
        if self.old_value is not None:
            d["old_value"] = self.old_value
        if self.new_value is not None:
            d["new_value"] = self.new_value
        if self.description:
            d["description"] = self.description
        if self.details:
            d["details"] = self.details
        return d


@dataclass
class ParcelAnalysisResult:
    parcel_id: str
    conflict_detected: bool
    survey_number: str = ""
    owners: List[str] = field(default_factory=list)
    conflicts: List[ConflictItem] = field(default_factory=list)
    changes: List[ChangeItem] = field(default_factory=list)
    overall_severity: str = SeverityLevel.LOW.value
    summary: str = ""
    resolution: Optional[CriticalResolution] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def get_owner_display(self) -> str:
        """Returns clean human-readable representation of ownership."""
        if not self.owners:
            return "Not Available"
        if len(self.owners) == 1:
            return self.owners[0]
        return ", ".join(self.owners)

    def get_formatted_conflict_report(self) -> str:
        """
        Generates the formatted conflict output based on severity:
        - If CRITICAL: Outputs the full Resolution Report with Coordinates, Source Document, Recommended Solution, and Required Action.
        - If HIGH: Outputs Conflict Details and Recommended Review.
        - If LOW or MEDIUM: Outputs standard detected conflict report.
        """
        lines: List[str] = []

        if not self.conflict_detected and not self.conflicts and not self.changes:
            lines.append(f"✓ No conflicts detected on Parcel {self.parcel_id}")
            lines.append(f"Survey Number: {self.survey_number or self.parcel_id}")
            lines.append(f"Land Owner: {self.get_owner_display()}")
            return "\n".join(lines).strip()

        # --- CRITICAL CONFLICT REPORT ---
        if self.overall_severity == SeverityLevel.CRITICAL.value and self.resolution:
            res = self.resolution
            lines.append("⚠️ CRITICAL CONFLICT\n")
            lines.append(f"Parcel ID: {self.parcel_id}")
            lines.append(f"Survey Number: {self.survey_number or self.parcel_id}")
            
            if not self.owners:
                lines.append("Owner: Not Available\n")
            elif len(self.owners) == 1:
                lines.append(f"Owner: {self.owners[0]}\n")
            else:
                lines.append("Owners:")
                for i, ow in enumerate(self.owners, 1):
                    lines.append(f"  {i}. {ow}")
                lines.append("")

            primary_conflict = res.conflict_type.replace("_", " ").title() if res.conflict_type else (self.conflicts[0].type.replace("_", " ").title() if self.conflicts else "Critical Conflict")
            lines.append(f"Conflict Type: {primary_conflict}")
            lines.append("Severity: CRITICAL\n")

            # Conflicting coordinates
            lines.append("Conflicting Coordinates:")
            if isinstance(res.conflicting_coordinates, list):
                lines.append(json.dumps(res.conflicting_coordinates))
            else:
                lines.append(str(res.conflicting_coordinates))
            lines.append("")

            # Official survey coordinates
            lines.append("Official Survey Coordinates:")
            if isinstance(res.official_survey_coordinates, list):
                lines.append(json.dumps(res.official_survey_coordinates))
            else:
                lines.append(str(res.official_survey_coordinates))
            lines.append("")

            # Coordinate Source
            lines.append("Coordinate Source:")
            lines.append(f"{res.coordinate_source}\n")

            # Spatial Comparison Result if available
            if res.coordinate_comparison_result:
                lines.append("Coordinate Comparison Result:")
                lines.append(f"{res.coordinate_comparison_result}\n")

            # Recommended Solution
            lines.append("Recommended Solution:")
            lines.append(f"{res.recommended_solution}\n")

            # Required Action
            lines.append("Required Action:")
            lines.append(f"{res.required_action}\n")

            # Status
            lines.append("Status:")
            lines.append(f"{res.status}")

            return "\n".join(lines).strip()

        # --- HIGH SEVERITY CONFLICT REPORT ---
        elif self.overall_severity == SeverityLevel.HIGH.value:
            lines.append("⚠️ HIGH SEVERITY CONFLICT DETECTED\n")
            lines.append(f"Parcel ID: {self.parcel_id}")
            lines.append(f"Survey Number: {self.survey_number or self.parcel_id}\n")

            if not self.owners:
                lines.append("Land Owner: Not Available\n")
            elif len(self.owners) == 1:
                lines.append(f"Land Owner: {self.owners[0]}\n")
            else:
                lines.append("Land Owners:")
                for i, ow in enumerate(self.owners, 1):
                    lines.append(f"{i}. {ow}")
                lines.append("")

            for c in self.conflicts:
                type_label = c.type.replace("_", " ").title()
                lines.append(f"Conflict Type: {type_label}")
                if c.old_value is not None:
                    lines.append(f"Old Value: {c.old_value}")
                if c.new_value is not None:
                    lines.append(f"New Value: {c.new_value}")
                lines.append(f"Severity: {c.severity}\n")

            if self.resolution:
                lines.append("Recommended Review:")
                lines.append(f"{self.resolution.recommended_solution}\n")
                lines.append(f"Required Action: {self.resolution.required_action}")
                lines.append(f"Status: {self.resolution.status}\n")

            for ch in self.changes:
                ch_label = ch.type.replace("_", " ").title()
                lines.append(f"Detected Change: {ch_label} ({ch.from_year} → {ch.to_year})")
                if ch.description:
                    lines.append(f"Details: {ch.description}")
                lines.append("")

            return "\n".join(lines).strip()

        # --- LOW / MEDIUM SEVERITY CONFLICT REPORT ---
        else:
            lines.append("⚠️ CONFLICT DETECTED\n")
            lines.append(f"Parcel ID: {self.parcel_id}")
            lines.append(f"Survey Number: {self.survey_number or self.parcel_id}\n")

            if not self.owners:
                lines.append("Land Owner: Not Available\n")
            elif len(self.owners) == 1:
                lines.append(f"Land Owner: {self.owners[0]}\n")
            else:
                lines.append("Land Owners:")
                for i, ow in enumerate(self.owners, 1):
                    lines.append(f"{i}. {ow}")
                lines.append("")

            for c in self.conflicts:
                type_label = c.type.replace("_", " ").title()
                lines.append(f"Conflict Type: {type_label}")
                if c.type == ConflictType.AREA_MISMATCH.value:
                    lines.append(f"Revenue Area: {c.old_value}")
                    lines.append(f"Survey Area: {c.new_value}")
                elif c.type == ConflictType.OWNER_MISMATCH.value:
                    lines.append(f"Record 1 Owner: {c.old_value}")
                    lines.append(f"Record 2 Owner: {c.new_value}")
                else:
                    if c.old_value is not None:
                        lines.append(f"Old Value: {c.old_value}")
                    if c.new_value is not None:
                        lines.append(f"New Value: {c.new_value}")
                lines.append(f"Severity: {c.severity}\n")

            for ch in self.changes:
                ch_label = ch.type.replace("_", " ").title()
                lines.append(f"Detected Change: {ch_label} ({ch.from_year} → {ch.to_year})")
                if ch.description:
                    lines.append(f"Details: {ch.description}")
                lines.append("")

            return "\n".join(lines).strip()

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "parcel_id": self.parcel_id,
            "survey_number": self.survey_number or self.parcel_id,
            "owners": self.owners,
            "owner_display": self.get_owner_display(),
            "conflict_detected": self.conflict_detected,
            "overall_severity": self.overall_severity,
            "conflicts": [c.to_dict() for c in self.conflicts],
            "changes": [ch.to_dict() for ch in self.changes],
            "summary": self.summary,
            "formatted_conflict_report": self.get_formatted_conflict_report(),
            "metadata": self.metadata
        }
        if self.resolution:
            d["resolution"] = self.resolution.to_dict()
        return d
