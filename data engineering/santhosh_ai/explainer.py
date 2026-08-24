"""
Human-Readable Explanation Generator for Land Conflicts and Temporal Changes.
Generates clear, concise natural language audit sentences and summaries.
"""

from typing import List, Dict, Any
from .models import ConflictItem, ChangeItem, ConflictType, ChangeType, SeverityLevel


class ConflictExplainer:
    """
    Generates natural language explanations for detected conflicts and temporal changes.
    """

    @classmethod
    def generate_parcel_explanation(
        cls,
        parcel_id: str,
        conflicts: List[ConflictItem],
        changes: List[ChangeItem],
        overall_severity: str
    ) -> str:
        """
        Generates a concise, human-readable paragraph summarizing the parcel's status:
        e.g., "Parcel 127/3 has an area mismatch between records. A new building was detected between 2024 and 2026. Overall conflict severity: MEDIUM."
        """
        if not conflicts and not changes:
            return f"Parcel {parcel_id} has no detected data or spatial conflicts. No critical temporal changes observed. Overall conflict severity: {overall_severity}."

        sentences: List[str] = []

        # 1. Summarize primary conflicts
        conflict_phrases: List[str] = []
        for c in conflicts:
            if c.type == ConflictType.AREA_MISMATCH.value:
                if c.old_value and c.new_value:
                    conflict_phrases.append(f"an area mismatch ({c.old_value} vs {c.new_value})")
                else:
                    conflict_phrases.append("an area mismatch between records")
            elif c.type == ConflictType.SURVEY_NUMBER_MISMATCH.value:
                conflict_phrases.append(f"a survey number mismatch ({c.old_value} vs {c.new_value})")
            elif c.type == ConflictType.OWNER_MISMATCH.value:
                conflict_phrases.append(f"an ownership title discrepancy ({c.old_value} vs {c.new_value})")
            elif c.type == ConflictType.VILLAGE_MISMATCH.value:
                conflict_phrases.append(f"a village location mismatch ({c.old_value} vs {c.new_value})")
            elif c.type == ConflictType.LOCATION_MISMATCH.value:
                conflict_phrases.append("a taluk/sub-district mismatch")
            elif c.type == ConflictType.MISSING_VALUE.value:
                field = c.field_name or "required attribute"
                conflict_phrases.append(f"missing {field}")
            elif c.type == ConflictType.PARCEL_OVERLAP.value:
                overlap_m2 = c.details.get("overlap_area_m2", "")
                other_p = c.details.get("overlapping_parcel", "neighboring plot")
                conflict_phrases.append(f"a boundary overlap of {overlap_m2} m² with parcel {other_p}")
            elif c.type == ConflictType.BOUNDARY_MISMATCH.value:
                dev = c.details.get("max_deviation_meters", "")
                conflict_phrases.append(f"a cadastral boundary deviation of {dev}m")
            elif c.type == ConflictType.SHAPE_DEVIATION.value:
                iou = c.details.get("iou", "")
                conflict_phrases.append(f"a shape geometry distortion (IoU {iou})")
            elif c.type == ConflictType.GEOMETRY_AREA_MISMATCH.value:
                conflict_phrases.append("a discrepancy between GIS mapped area and textual RoR area")
            elif c.type == ConflictType.LAND_USE_MISMATCH.value:
                conflict_phrases.append(f"a land use conflict ({c.old_value} vs {c.new_value})")

        if conflict_phrases:
            # Group into clean sentence
            if len(conflict_phrases) == 1:
                sentences.append(f"Parcel {parcel_id} has {conflict_phrases[0]}.")
            elif len(conflict_phrases) == 2:
                sentences.append(f"Parcel {parcel_id} has {conflict_phrases[0]} and {conflict_phrases[1]}.")
            else:
                sentences.append(f"Parcel {parcel_id} has {', '.join(conflict_phrases[:-1])}, and {conflict_phrases[-1]}.")

        # 2. Summarize temporal changes
        for ch in changes:
            if ch.type == ChangeType.NEW_BUILDING.value:
                sentences.append(f"A new building was detected between {ch.from_year} and {ch.to_year}.")
            elif ch.type == ChangeType.REMOVED_BUILDING.value:
                sentences.append(f"A building demolition/clearance was detected between {ch.from_year} and {ch.to_year}.")
            elif ch.type == ChangeType.AREA_CHANGE.value:
                direction = ch.details.get("change_type", "change")
                sentences.append(f"A parcel area {direction} ({ch.old_value} → {ch.new_value}) was recorded between {ch.from_year} and {ch.to_year}.")
            elif ch.type == ChangeType.BOUNDARY_CHANGE.value:
                sentences.append(f"A boundary realignment was identified between {ch.from_year} and {ch.to_year}.")
            elif ch.type == ChangeType.PARCEL_SPLIT.value:
                sentences.append(f"A parcel subdivision occurred between {ch.from_year} and {ch.to_year} ({ch.new_value}).")
            elif ch.type == ChangeType.PARCEL_MERGE.value:
                sentences.append(f"A parcel consolidation occurred between {ch.from_year} and {ch.to_year} ({ch.new_value}).")
            elif ch.type == ChangeType.LAND_USE_CHANGE.value:
                sentences.append(f"A land use conversion from '{ch.old_value}' to '{ch.new_value}' was registered between {ch.from_year} and {ch.to_year}.")

        # 3. Overall severity closing statement
        sentences.append(f"Overall conflict severity: {overall_severity}.")

        return " ".join(sentences)
