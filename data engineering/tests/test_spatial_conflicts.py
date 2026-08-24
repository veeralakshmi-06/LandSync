"""
Unit Tests for Spatial Conflict Detector.
"""

import unittest
from santhosh_ai.spatial_conflict_detector import SpatialConflictDetector
from santhosh_ai.models import ConflictType


class TestSpatialConflictDetector(unittest.TestCase):
    def setUp(self):
        self.detector = SpatialConflictDetector(
            min_overlap_area_m2=5.0,
            max_boundary_deviation_m=2.0,
            min_shape_iou=0.85
        )

    def test_single_parcel_boundary_deviation(self):
        cadastral = {
            "type": "Polygon",
            "coordinates": [[[77.7410, 12.9910], [77.7430, 12.9910], [77.7430, 12.9890], [77.7410, 12.9890], [77.7410, 12.9910]]]
        }
        # Shifted survey boundary
        survey = {
            "type": "Polygon",
            "coordinates": [[[77.7410, 12.9905], [77.7425, 12.9905], [77.7425, 12.9890], [77.7410, 12.9890], [77.7410, 12.9905]]]
        }
        conflicts = self.detector.detect_single_parcel_geometry_conflicts(cadastral, survey, recorded_area_acres=1.25)
        self.assertTrue(any(c.type in [ConflictType.SHAPE_DEVIATION.value, ConflictType.BOUNDARY_MISMATCH.value] for c in conflicts))

    def test_adjacent_parcel_overlap(self):
        p1 = {
            "parcel_id": "89/2",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[77.7480, 12.9910], [77.7510, 12.9910], [77.7510, 12.9880], [77.7480, 12.9880], [77.7480, 12.9910]]]
            }
        }
        # p2 intentionally overlaps with p1 between 77.7505 and 77.7510
        p2 = {
            "parcel_id": "90/1",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[77.7505, 12.9910], [77.7535, 12.9910], [77.7535, 12.9880], [77.7505, 12.9880], [77.7505, 12.9910]]]
            }
        }

        res = self.detector.detect_adjacent_parcel_conflicts([p1, p2])
        self.assertTrue(len(res["89/2"]) > 0)
        self.assertTrue(len(res["90/1"]) > 0)
        self.assertEqual(res["89/2"][0].type, ConflictType.PARCEL_OVERLAP.value)


if __name__ == "__main__":
    unittest.main()
