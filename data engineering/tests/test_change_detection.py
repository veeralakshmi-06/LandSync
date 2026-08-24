"""
Unit Tests for Temporal Change Detector (2024 -> 2025 -> 2026).
"""

import unittest
from santhosh_ai.change_detector import ChangeDetector
from santhosh_ai.models import ChangeType


class TestChangeDetector(unittest.TestCase):
    def setUp(self):
        self.detector = ChangeDetector()

    def test_new_building_detection(self):
        snapshots = [
            {
                "year": 2024,
                "area": "1.25 acre",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[77.7410, 12.9910], [77.7430, 12.9910], [77.7430, 12.9890], [77.7410, 12.9890], [77.7410, 12.9910]]]
                },
                "buildings": []
            },
            {
                "year": 2026,
                "area": "1.25 acre",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[77.7410, 12.9910], [77.7430, 12.9910], [77.7430, 12.9890], [77.7410, 12.9890], [77.7410, 12.9910]]]
                },
                "buildings": [
                    {
                        "id": "bld_127_3_01",
                        "area_sq_m": 240.0,
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[77.7415, 12.9902], [77.7422, 12.9902], [77.7422, 12.9895], [77.7415, 12.9895], [77.7415, 12.9902]]]
                        }
                    }
                ]
            }
        ]

        changes = self.detector.detect_parcel_changes(snapshots)
        bld_changes = [ch for ch in changes if ch.type == ChangeType.NEW_BUILDING.value]
        self.assertEqual(len(bld_changes), 1)
        self.assertEqual(bld_changes[0].from_year, 2024)
        self.assertEqual(bld_changes[0].to_year, 2026)

    def test_removed_building_detection(self):
        snapshots = [
            {
                "year": 2024,
                "buildings": [{"id": "bld_shed", "area_sq_m": 80.0}]
            },
            {
                "year": 2026,
                "buildings": []
            }
        ]
        changes = self.detector.detect_parcel_changes(snapshots)
        rem_changes = [ch for ch in changes if ch.type == ChangeType.REMOVED_BUILDING.value]
        self.assertEqual(len(rem_changes), 1)
        self.assertEqual(rem_changes[0].from_year, 2024)
        self.assertEqual(rem_changes[0].to_year, 2026)

    def test_parcel_split_detection(self):
        parents = [
            {
                "parcel_id": "105",
                "geometry": {"type": "Polygon", "coordinates": [[[77.7410, 12.9870], [77.7450, 12.9870], [77.7450, 12.9840], [77.7410, 12.9840], [77.7410, 12.9870]]]}
            }
        ]
        children = [
            {
                "parcel_id": "105/1",
                "geometry": {"type": "Polygon", "coordinates": [[[77.7410, 12.9870], [77.7430, 12.9870], [77.7430, 12.9840], [77.7410, 12.9840], [77.7410, 12.9870]]]}
            },
            {
                "parcel_id": "105/2",
                "geometry": {"type": "Polygon", "coordinates": [[[77.7430, 12.9870], [77.7450, 12.9870], [77.7450, 12.9840], [77.7430, 12.9840], [77.7430, 12.9870]]]}
            }
        ]

        sm_changes = self.detector.detect_parcel_split_or_merge(parents, children, 2024, 2026)
        split_changes = [c for c in sm_changes if c.type == ChangeType.PARCEL_SPLIT.value]
        self.assertEqual(len(split_changes), 1)
        self.assertEqual(split_changes[0].details.get("parent_parcel"), "105")


if __name__ == "__main__":
    unittest.main()
