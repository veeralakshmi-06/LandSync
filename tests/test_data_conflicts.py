"""
Unit Tests for Data Conflict Detector.
"""

import unittest
from santhosh_ai.data_conflict_detector import DataConflictDetector
from santhosh_ai.models import ConflictType, SeverityLevel


class TestDataConflictDetector(unittest.TestCase):
    def setUp(self):
        self.detector = DataConflictDetector(area_tolerance_pct=1.5)

    def test_area_mismatch_detection(self):
        # 1.25 acre vs 1.18 acre
        records = [
            {"source": "RoR", "survey_number": "127/3", "area": "1.25 acre", "owner_name": "Venkatesh"},
            {"source": "Deed", "survey_number": "127/3", "area": "1.18 acre", "owner_name": "Venkatesh"}
        ]
        conflicts = self.detector.detect_conflicts(records)
        area_conflicts = [c for c in conflicts if c.type == ConflictType.AREA_MISMATCH.value]
        self.assertEqual(len(area_conflicts), 1)
        self.assertEqual(area_conflicts[0].old_value, "1.25 acre")
        self.assertEqual(area_conflicts[0].new_value, "1.18 acre")
        self.assertIn(area_conflicts[0].severity, [SeverityLevel.MEDIUM.value, SeverityLevel.LOW.value])

    def test_unit_conversions(self):
        # 1 acre = 40 gunthas = 43560 sq_ft
        val1, _ = DataConflictDetector.parse_area_value("1.0 acre")
        val2, _ = DataConflictDetector.parse_area_value("40 gunthas")
        self.assertAlmostEqual(val1, val2, places=2)

    def test_survey_number_mismatch(self):
        records = [
            {"source": "RoR", "survey_number": "45/1", "area": "2.4 acre", "owner_name": "Ramesh"},
            {"source": "Survey", "survey_number": "45/1A", "area": "2.4 acre", "owner_name": "Ramesh"}
        ]
        conflicts = self.detector.detect_conflicts(records)
        survey_conflicts = [c for c in conflicts if c.type == ConflictType.SURVEY_NUMBER_MISMATCH.value]
        self.assertEqual(len(survey_conflicts), 1)
        self.assertEqual(survey_conflicts[0].old_value, "45/1")
        self.assertEqual(survey_conflicts[0].new_value, "45/1A")

    def test_owner_mismatch(self):
        records = [
            {"source": "RoR", "survey_number": "45/1", "area": "2.4 acre", "owner_name": "Ramesh Kumar"},
            {"source": "Registry", "survey_number": "45/1", "area": "2.4 acre", "owner_name": "Suresh Babu"}
        ]
        conflicts = self.detector.detect_conflicts(records)
        owner_conflicts = [c for c in conflicts if c.type == ConflictType.OWNER_MISMATCH.value]
        self.assertEqual(len(owner_conflicts), 1)
        self.assertEqual(owner_conflicts[0].severity, SeverityLevel.CRITICAL.value)

    def test_missing_values(self):
        records = [
            {"source": "RoR", "survey_number": "214/A", "area": "0.95 acre", "owner_name": None}
        ]
        conflicts = self.detector.detect_conflicts(records)
        missing_conflicts = [c for c in conflicts if c.type == ConflictType.MISSING_VALUE.value]
        self.assertTrue(any(c.field_name == "owner_name" for c in missing_conflicts))


if __name__ == "__main__":
    unittest.main()
