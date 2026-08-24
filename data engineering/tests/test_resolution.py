"""
Unit Tests for Critical Conflict Resolution Engine.
---------------------------------------------------
Verifies the rules and constraints of the Critical Conflict Resolution feature:
1. Never invent or guess coordinates.
2. Coordinates extracted strictly from official survey documents.
3. Fallback to 'OFFICIAL_COORDINATES_NOT_AVAILABLE' if document lacks usable coordinates.
4. Intelligent document selection based on authority tier and date.
5. Tailored solutions for Area, Boundary, Owner, Survey Number, and Overlap conflicts.
6. Non-destructive: Status is always PENDING_REVIEW with manual verification required.
"""

import json
import unittest
from pathlib import Path
from santhosh_ai.resolution_engine import CriticalConflictResolver
from santhosh_ai.pipeline import ConflictAndChangeDetector
from santhosh_ai.models import (
    ConflictItem,
    ConflictType,
    SeverityLevel,
    CriticalResolution
)


class TestCriticalConflictResolution(unittest.TestCase):
    def setUp(self):
        self.resolver = CriticalConflictResolver()
        self.detector = ConflictAndChangeDetector()
        self.data_path = Path(__file__).resolve().parent.parent / "data" / "sample_matched_records.json"

    def test_document_selection_priority_and_date(self):
        """
        Tests that when multiple documents exist:
        - Higher authority (SSLR) takes precedence over lower tier (Private / Sub-Registrar)
        - Latest date takes precedence among equal tiers
        """
        docs = [
            {
                "doc_id": "DOC-PRIV-2023",
                "doc_name": "Private Land Valuation Survey",
                "authority": "Private Licensed Surveyor",
                "authority_type": "PRIVATE_LICENSED_SURVEYOR",
                "date": "2023-01-01",
                "survey_number": "100/1",
                "verified": True,
                "coordinates": [[[77.1, 12.1], [77.2, 12.1], [77.2, 12.0], [77.1, 12.0], [77.1, 12.1]]]
            },
            {
                "doc_id": "DOC-SSLR-2024",
                "doc_name": "Old FMB Map",
                "authority": "Survey Settlement & Land Records Dept",
                "authority_type": "SURVEY_SETTLEMENT_AND_LAND_RECORDS",
                "date": "2024-05-10",
                "survey_number": "100/1",
                "verified": True,
                "coordinates": [[[77.1, 12.1], [77.2, 12.1], [77.2, 12.0], [77.1, 12.0], [77.1, 12.1]]]
            },
            {
                "doc_id": "DOC-SSLR-2025-LATEST",
                "doc_name": "Revised FMB Cadastral Map",
                "authority": "Survey Settlement & Land Records Dept",
                "authority_type": "SURVEY_SETTLEMENT_AND_LAND_RECORDS",
                "date": "2025-11-15",
                "survey_number": "100/1",
                "verified": True,
                "coordinates": [[[77.1, 12.1], [77.25, 12.1], [77.25, 12.0], [77.1, 12.0], [77.1, 12.1]]]
            }
        ]

        best_doc, rationale = self.resolver._select_authoritative_document(docs, "100/1", "100/1")
        self.assertIsNotNone(best_doc)
        self.assertEqual(best_doc["doc_id"], "DOC-SSLR-2025-LATEST")
        self.assertIn("DOC-SSLR-2025-LATEST", rationale)

    def test_missing_coordinates_in_document(self):
        """
        Tests rule 6: If document does not contain usable coordinates,
        return 'OFFICIAL_COORDINATES_NOT_AVAILABLE' and recommend manual survey verification.
        """
        docs = [
            {
                "doc_id": "DOC-TEXT-ONLY",
                "doc_name": "Revenue Gazette Notification",
                "authority": "Revenue Department",
                "date": "2025-01-01",
                "survey_number": "200/2",
                "verified": True,
                "notes": "Text only document without GIS coordinates"
            }
        ]

        conflicts = [
            ConflictItem(
                type=ConflictType.BOUNDARY_MISMATCH.value,
                severity=SeverityLevel.CRITICAL.value,
                description="Boundary deviation"
            )
        ]

        res = self.resolver.resolve_parcel(
            parcel_id="200/2",
            survey_number="200/2",
            owners=["Devaiah"],
            conflicts=conflicts,
            changes=[],
            overall_severity=SeverityLevel.CRITICAL.value,
            conflicting_geometry={"type": "Polygon", "coordinates": [[[77.1, 12.1], [77.2, 12.1], [77.2, 12.0], [77.1, 12.0], [77.1, 12.1]]]},
            official_documents=docs
        )

        self.assertIsNotNone(res)
        self.assertEqual(res.official_survey_coordinates, "OFFICIAL_COORDINATES_NOT_AVAILABLE")
        self.assertEqual(res.required_action, "MANUAL_SURVEY_VERIFICATION_REQUIRED")
        self.assertEqual(res.status, "PENDING_REVIEW")
        self.assertIn("OFFICIAL_COORDINATES_NOT_AVAILABLE", res.coordinate_comparison_result)

    def test_boundary_mismatch_resolution_and_diff(self):
        """
        Tests boundary mismatch resolution with coordinate comparison and spatial difference calculation.
        """
        conflicting_geom = {
            "type": "Polygon",
            "coordinates": [
                [
                    [77.74320, 12.99076],
                    [77.74398, 12.99076],
                    [77.74398, 12.99000],
                    [77.74320, 12.99000],
                    [77.74320, 12.99076]
                ]
            ]
        }
        official_doc = {
            "doc_id": "DOC-SSLR-2025-8920",
            "doc_name": "Official Cadastral Map",
            "authority": "Survey Settlement & Land Records Dept",
            "date": "2025-08-15",
            "verified": True,
            "survey_number": "89/2",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [77.74320, 12.99076],
                        [77.74390, 12.99076],
                        [77.74390, 12.99000],
                        [77.74320, 12.99000],
                        [77.74320, 12.99076]
                    ]
                ]
            }
        }

        conflicts = [
            ConflictItem(
                type=ConflictType.BOUNDARY_MISMATCH.value,
                severity=SeverityLevel.CRITICAL.value,
                old_value="Cadastral Boundary",
                new_value="Survey Boundary (8.79m shift)"
            )
        ]

        res = self.resolver.resolve_parcel(
            parcel_id="89/2",
            survey_number="89/2",
            owners=["Muniswamappa"],
            conflicts=conflicts,
            changes=[],
            overall_severity=SeverityLevel.CRITICAL.value,
            conflicting_geometry=conflicting_geom,
            official_documents=[official_doc]
        )

        self.assertIsNotNone(res)
        self.assertEqual(res.status, "PENDING_REVIEW")
        self.assertEqual(res.required_action, "MANUAL_SURVEY_VERIFICATION_REQUIRED")
        self.assertIn("DOC-SSLR-2025-8920", res.coordinate_source)
        self.assertIn("compare the conflicting boundary", res.recommended_solution.lower())
        self.assertIn("max_boundary_deviation_meters", res.spatial_difference)
        self.assertGreater(res.spatial_difference["max_boundary_deviation_meters"], 5.0)

    def test_owner_mismatch_resolution(self):
        """
        Tests owner mismatch resolution requires legal document verification.
        """
        conflicts = [
            ConflictItem(
                type=ConflictType.OWNER_MISMATCH.value,
                severity=SeverityLevel.CRITICAL.value,
                old_value="Ramesh Kumar",
                new_value="Suresh Kumar"
            )
        ]

        res = self.resolver.resolve_parcel(
            parcel_id="45/1",
            survey_number="45/1",
            owners=["Ramesh Kumar", "Suresh Kumar"],
            conflicts=conflicts,
            changes=[],
            overall_severity=SeverityLevel.CRITICAL.value,
            conflicting_geometry=None,
            official_documents=[]
        )

        self.assertIsNotNone(res)
        self.assertEqual(res.required_action, "LEGAL_DOCUMENT_VERIFICATION_REQUIRED")
        self.assertEqual(res.status, "PENDING_REVIEW")
        self.assertEqual(res.recommended_solution, "Verify ownership using the authoritative land/registration document.")

    def test_multiple_critical_conflicts_escalation(self):
        """
        Tests that multiple critical conflicts escalate the parcel to manual expert review.
        """
        conflicts = [
            ConflictItem(type=ConflictType.OWNER_MISMATCH.value, severity=SeverityLevel.CRITICAL.value),
            ConflictItem(type=ConflictType.PARCEL_OVERLAP.value, severity=SeverityLevel.CRITICAL.value)
        ]

        docs = [
            {
                "doc_id": "DOC-GOV-01",
                "doc_name": "Cadastral Map",
                "authority": "SSLR",
                "date": "2025-01-01",
                "geometry": {"type": "Polygon", "coordinates": [[[77.0, 12.0], [77.1, 12.0], [77.1, 12.1], [77.0, 12.1], [77.0, 12.0]]]}
            }
        ]

        res = self.resolver.resolve_parcel(
            parcel_id="99/X",
            survey_number="99/X",
            owners=["Owner A", "Owner B"],
            conflicts=conflicts,
            changes=[],
            overall_severity=SeverityLevel.CRITICAL.value,
            conflicting_geometry={"type": "Polygon", "coordinates": [[[77.0, 12.0], [77.1, 12.0], [77.1, 12.1], [77.0, 12.1], [77.0, 12.0]]]},
            official_documents=docs
        )

        self.assertIsNotNone(res)
        self.assertEqual(res.required_action, "MANUAL_EXPERT_REVIEW_REQUIRED")
        self.assertIn("escalate the parcel", res.recommended_solution.lower())

    def test_full_pipeline_critical_formatted_report(self):
        """
        Tests end-to-end pipeline formatted report for a CRITICAL parcel matching the exact user format.
        """
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        results = self.detector.analyze_dataset(data)
        res_45 = next(r for r in results if r["parcel_id"] == "45/1")

        report = res_45["formatted_conflict_report"]
        self.assertIn("⚠️ CRITICAL CONFLICT", report)
        self.assertIn("Parcel ID: 45/1", report)
        self.assertIn("Survey Number: 45/1", report)
        self.assertIn("Owners:", report)
        self.assertIn("Ramesh Kumar Gowda", report)
        self.assertIn("Suresh Babu Hegde", report)
        self.assertIn("Severity: CRITICAL", report)
        self.assertIn("Conflicting Coordinates:", report)
        self.assertIn("Official Survey Coordinates:", report)
        self.assertIn("Coordinate Source:", report)
        self.assertIn("DOC-SSLR-2025-451", report)
        self.assertIn("Recommended Solution:", report)
        self.assertIn("Required Action:\nLEGAL_DOCUMENT_VERIFICATION_REQUIRED", report)
        self.assertIn("Status:\nPENDING_REVIEW", report)


if __name__ == "__main__":
    unittest.main()
