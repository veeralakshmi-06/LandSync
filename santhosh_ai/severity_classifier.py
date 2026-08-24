"""
Severity Classifier Module.
Classifies individual conflicts and overall parcel risk into:
- LOW
- MEDIUM
- HIGH
- CRITICAL
"""

from typing import List
from .models import ConflictItem, ChangeItem, SeverityLevel, ConflictType, ChangeType


class SeverityClassifier:
    """
    Evaluates conflict severity and computes aggregated overall parcel risk level.
    """

    SEVERITY_ORDER = [
        SeverityLevel.LOW.value,
        SeverityLevel.MEDIUM.value,
        SeverityLevel.HIGH.value,
        SeverityLevel.CRITICAL.value
    ]

    @classmethod
    def classify_overall_severity(
        cls,
        conflicts: List[ConflictItem],
        changes: List[ChangeItem]
    ) -> str:
        """
        Determines the overall severity for a parcel.
        - If any conflict is CRITICAL -> CRITICAL
        - If any conflict is HIGH -> HIGH
        - If any conflict is MEDIUM -> MEDIUM
        - If changes are present (e.g. new building) -> MEDIUM
        - Otherwise LOW
        """
        if not conflicts and not changes:
            return SeverityLevel.LOW.value

        all_severities = [c.severity for c in conflicts] + [ch.severity for ch in changes]
        
        if SeverityLevel.CRITICAL.value in all_severities:
            return SeverityLevel.CRITICAL.value
        elif SeverityLevel.HIGH.value in all_severities:
            return SeverityLevel.HIGH.value
        elif SeverityLevel.MEDIUM.value in all_severities:
            return SeverityLevel.MEDIUM.value
        elif SeverityLevel.LOW.value in all_severities:
            return SeverityLevel.LOW.value
        else:
            return SeverityLevel.LOW.value
