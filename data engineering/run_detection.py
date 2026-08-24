#!/usr/bin/env python3
"""
Santhosh's AI Conflict & Change Detection Runner
------------------------------------------------
Command-line backend runner for Santhosh's AI Module.
Analyzes the real dataset in the repository, extracts ownership and official survey coordinates,
identifies data/spatial conflicts & historical changes, classifies severity, and generates
authoritative resolutions for CRITICAL cases.
"""

import sys
import os
import json
import csv
import argparse
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from santhosh_ai.pipeline import ConflictAndChangeDetector


def main():
    parser = argparse.ArgumentParser(
        description="Santhosh's AI Conflict & Change Detection Backend Engine."
    )
    parser.add_argument(
        "--data",
        type=str,
        default=str(BASE_DIR / "data" / "sample_matched_records.json"),
        help="Path to land records dataset (JSON)"
    )
    parser.add_argument(
        "--parcel",
        type=str,
        default=None,
        help="Filter and inspect a specific parcel_id (e.g. 127/3, 45/1, 89/2)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(BASE_DIR / "output"),
        help="Directory to save backend output JSON and CSV files"
    )
    args = parser.parse_args()

    data_file = Path(args.data)
    if not data_file.exists():
        print(f"[!] Error: Dataset file not found at {data_file}")
        sys.exit(1)

    with open(data_file, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    print("=" * 80)
    print("  SANTHOSH'S AI CONFLICT & CHANGE DETECTION ENGINE")
    print("  Role: Santhosh – Land Conflict & Change Detection Lead")
    print(f"  Dataset: {data_file.name}")
    print(f"  Project: {dataset.get('project_name', 'Land Record Matching')}")
    print(f"  Region:  {dataset.get('region', 'Cadastral Zone')}")
    print("=" * 80)

    detector = ConflictAndChangeDetector()
    results = detector.analyze_dataset(dataset)

    # Calculate statistics
    total_parcels = len(results)
    total_matched_records = sum(len(p.get("matched_records", [])) for p in dataset.get("parcels", []))
    total_conflicts = sum(len(r["conflicts"]) for r in results)
    total_changes = sum(len(r["changes"]) for r in results)

    severity_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    owners_available_count = 0
    official_coords_available_count = 0
    critical_parcels = []

    for r in results:
        sev = r.get("overall_severity", "LOW")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

        if r.get("owners") and len(r["owners"]) > 0:
            owners_available_count += 1

        res = r.get("resolution")
        if res and res.get("official_survey_coordinates") not in [None, "OFFICIAL_COORDINATES_NOT_AVAILABLE"]:
            official_coords_available_count += 1

        if sev == "CRITICAL":
            critical_parcels.append(r)

    # Print summary statistics
    print("\n" + "=" * 80)
    print("  SUMMARY EXECUTION METRICS")
    print("=" * 80)
    print(f"  Total records processed:          {total_matched_records} matched source records")
    print(f"  Total parcels analyzed:           {total_parcels}")
    print(f"  Total conflicts detected:         {total_conflicts}")
    print(f"  Total historical changes:         {total_changes}")
    print(f"  Severity Distribution:")
    print(f"    - LOW:      {severity_counts['LOW']}")
    print(f"    - MEDIUM:   {severity_counts['MEDIUM']}")
    print(f"    - HIGH:     {severity_counts['HIGH']}")
    print(f"    - CRITICAL: {severity_counts['CRITICAL']}")
    print(f"  Owner information available:      {owners_available_count} / {total_parcels} parcels")
    print(f"  Official coordinates available:   {official_coords_available_count} / {total_parcels} parcels")
    print(f"  Critical parcels count:           {len(critical_parcels)}")
    print("=" * 80 + "\n")

    # If single parcel filter
    if args.parcel:
        filtered = [r for r in results if r["parcel_id"].lower() == args.parcel.strip().lower()]
        if not filtered:
            print(f"[!] Parcel '{args.parcel}' not found in dataset.")
            sys.exit(1)
        results_to_print = filtered
    else:
        results_to_print = results

    # Print individual results
    for r in results_to_print:
        print("=" * 80)
        report_text = r.get("formatted_conflict_report", "")
        if report_text:
            print(report_text)
        else:
            print(f"Parcel ID: {r['parcel_id']}")
            print(f"Severity: {r['overall_severity']}")
            print(f"Summary: {r['summary']}")

        print(f"\n[AI Natural Language Summary]:\n  \"{r['summary']}\"")
        print("=" * 80 + "\n")

    # Save outputs
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    json_out_path = out_dir / "conflict_detection_results.json"
    with open(json_out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Save CSV Summary
    csv_out_path = out_dir / "conflict_summary.csv"
    with open(csv_out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "parcel_id",
            "survey_number",
            "owner",
            "severity",
            "conflict_type",
            "conflict_count",
            "change_count",
            "official_coordinates_available",
            "recommended_solution",
            "required_action",
            "status"
        ])
        for r in results:
            res = r.get("resolution") or {}
            primary_conflict = r["conflicts"][0]["type"] if r["conflicts"] else (res.get("conflict_type") or "NONE")
            has_off_coords = res.get("official_survey_coordinates") not in [None, "OFFICIAL_COORDINATES_NOT_AVAILABLE"]
            writer.writerow([
                r["parcel_id"],
                r.get("survey_number", r["parcel_id"]),
                r.get("owner_display", "Not Available"),
                r["overall_severity"],
                primary_conflict,
                len(r["conflicts"]),
                len(r["changes"]),
                "YES" if has_off_coords else "NO",
                res.get("recommended_solution", "N/A"),
                res.get("required_action", "NO_ACTION_REQUIRED"),
                res.get("status", "CLEAN" if not r["conflict_detected"] else "PENDING_REVIEW")
            ])

    print(f"[+] Final JSON output saved to: {json_out_path.resolve()}")
    print(f"[+] Summary CSV output saved to: {csv_out_path.resolve()}")


if __name__ == "__main__":
    main()
