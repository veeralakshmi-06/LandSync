"""
Unit Tests for End-to-End Pipeline in Santhosh's AI Module.
"""

import json
import unittest
from pathlib import Path
from santhosh_ai.pipeline import ConflictAndChangeDetector
from santhosh_ai.models import SeverityLevel


class TestPipeline(unittest.TestCase):
    def setUp(self):
        self.detector = ConflictAndChangeDetector()
        self.data_path = Path(__file__).resolve().parent.parent / "data" / "sample_matched_records.json"

    def test_parcel_127_3_prompt_example(self):
        """
        Tests the specific example requested in the prompt:
        - Parcel 127/3 has area mismatch (1.25 acre vs 1.18 acre)
        - New building detected between 2024 and 2026
        - Overall conflict severity: MEDIUM
        - Correct JSON output and explanation
        - Ownership retrieved and displayed
        """
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        parcel_data = next(p for p in data["parcels"] if p["parcel_id"] == "127/3")
        res = self.detector.analyze_parcel(
            parcel_id=parcel_data["parcel_id"],
            matched_records=parcel_data["matched_records"],
            cadastral_geometry=parcel_data["cadastral_geometry"],
            survey_geometry=parcel_data["survey_geometry"],
            temporal_snapshots=parcel_data["temporal_snapshots"],
            metadata=parcel_data.get("metadata")
        )

        res_dict = res.to_dict()

        self.assertEqual(res_dict["parcel_id"], "127/3")
        self.assertEqual(res_dict["survey_number"], "127/3")
        self.assertEqual(res_dict["owners"], ["K. Venkatesh Reddy"])
        self.assertEqual(res_dict["owner_display"], "K. Venkatesh Reddy")
        self.assertTrue(res_dict["conflict_detected"])
        
        # Verify conflict types
        conflict_types = [c["type"] for c in res_dict["conflicts"]]
        self.assertIn("AREA_MISMATCH", conflict_types)

        # Verify change types
        change_types = [ch["type"] for ch in res_dict["changes"]]
        self.assertIn("NEW_BUILDING", change_types)

        # Verify overall severity
        self.assertIn(res_dict["overall_severity"], [SeverityLevel.MEDIUM.value, SeverityLevel.HIGH.value])

        # Verify natural language summary
        self.assertIn("127/3", res_dict["summary"])
        self.assertIn("area mismatch", res_dict["summary"].lower())
        self.assertIn("new building", res_dict["summary"].lower())
        self.assertIn("Overall conflict severity:", res_dict["summary"])

        # Verify formatted conflict report
        report = res_dict["formatted_conflict_report"]
        self.assertIn("⚠️ CONFLICT DETECTED", report)
        self.assertIn("Parcel ID: 127/3", report)
        self.assertIn("Survey Number: 127/3", report)
        self.assertIn("Land Owner: K. Venkatesh Reddy", report)
        self.assertIn("Conflict Type: Area Mismatch", report)
        self.assertIn("Revenue Area: 1.25 acre", report)
        self.assertIn("Survey Area: 1.18 acre", report)
        self.assertIn("Severity: MEDIUM", report)

    def test_multi_owner_dispute(self):
        """Tests that parcels with conflicting owners list all owners in report."""
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        parcel_data = next(p for p in data["parcels"] if p["parcel_id"] == "45/1")
        res = self.detector.analyze_parcel(
            parcel_id=parcel_data["parcel_id"],
            matched_records=parcel_data["matched_records"]
        )
        res_dict = res.to_dict()
        self.assertEqual(len(res_dict["owners"]), 2)
        self.assertIn("Ramesh Kumar Gowda", res_dict["owners"])
        self.assertIn("Suresh Babu Hegde", res_dict["owners"])
        report = res_dict["formatted_conflict_report"]
        self.assertTrue("Owners:" in report or "Land Owners:" in report)
        self.assertIn("1. Ramesh Kumar Gowda", report)
        self.assertIn("2. Suresh Babu Hegde", report)

    def test_missing_owner_handling(self):
        """Tests that parcels without owners clearly display 'Not Available'."""
        res = self.detector.analyze_parcel(
            parcel_id="999/X",
            matched_records=[
                {"source": "RoR", "survey_number": "999/X", "area": "1.0 acre", "owner_name": None},
                {"source": "Deed", "survey_number": "999/X", "area": "1.0 acre", "owner_name": ""}
            ]
        )
        res_dict = res.to_dict()
        self.assertEqual(res_dict["owners"], [])
        self.assertEqual(res_dict["owner_display"], "Not Available")
        self.assertIn("Land Owner: Not Available", res_dict["formatted_conflict_report"])

    def test_analyze_full_dataset(self):
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        results = self.detector.analyze_dataset(data)
        self.assertEqual(len(results), len(data["parcels"]))
        
        # Check that at least one Critical parcel (45/1 owner dispute) and one Clean parcel (77/4) exist
        severities = {r["parcel_id"]: r["overall_severity"] for r in results}
        self.assertEqual(severities.get("45/1"), SeverityLevel.CRITICAL.value)
        self.assertEqual(severities.get("77/4"), SeverityLevel.LOW.value)


if __name__ == "__main__":
    unittest.main()
