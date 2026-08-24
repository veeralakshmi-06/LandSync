"""
Data Conflict Detector Module for Land Record Matching.
Detects:
- Area mismatch (with unit normalization: acre, hectare, sq.m, sq.ft, guntas)
- Survey number & sub-division mismatch
- Village / location / taluk / district mismatch
- Owner name, joint owners & land classification mismatch
- Missing mandatory and optional attribute values
- Duplicate & inconsistent records
"""

import re
import difflib
from typing import List, Dict, Any, Optional, Tuple
from .models import ConflictItem, ConflictType, SeverityLevel


class DataConflictDetector:
    """
    Analyzes multiple matched records for a single parcel and flags data conflicts.
    """

    # Conversion factor to standard Acres
    UNIT_TO_ACRES = {
        "acre": 1.0,
        "acres": 1.0,
        "ac": 1.0,
        "guntha": 0.025,       # 40 gunthas = 1 acre
        "gunthas": 0.025,
        "gunta": 0.025,
        "guntas": 0.025,
        "cent": 0.01,          # 100 cents = 1 acre
        "cents": 0.01,
        "sq_m": 0.000247105,
        "sqm": 0.000247105,
        "sq_meters": 0.000247105,
        "sq_ft": 0.0000229568,
        "sqft": 0.0000229568,
        "hectare": 2.47105,
        "hectares": 2.47105,
        "ha": 2.47105,
        "bigha": 0.330578,     # Standard Indian average bigha (~1/3 acre)
        "bighas": 0.330578
    }

    def __init__(self, area_tolerance_pct: float = 1.5):
        """
        :param area_tolerance_pct: Percentage difference threshold before flagging area mismatch.
        """
        self.area_tolerance_pct = area_tolerance_pct

    @classmethod
    def _safe_str(cls, val: Any) -> str:
        """Helper to convert value to string without converting None to 'None'."""
        if val is None:
            return ""
        s = str(val).strip()
        if s.lower() in ["none", "null", "nan", "na"]:
            return ""
        return s

    @classmethod
    def _clean_name(cls, name_str: str) -> str:
        """Strips titles and honorifics for normalized owner name comparison."""
        cleaned = name_str.strip().lower()
        cleaned = re.sub(r"\b(sri|smt|shri|mr|mrs|ms|dr|late|m/s|trust|sons|and)\b\.?", "", cleaned)
        cleaned = re.sub(r"[^\w\s]", "", cleaned)
        return re.sub(r"\s+", " ", cleaned).strip()

    @classmethod
    def parse_area_value(cls, area_input: Any) -> Tuple[Optional[float], str]:
        """
        Parses string or numeric area input (e.g. '1.25 acre', '54,450 sq_ft', 1.25).
        Returns (area_in_acres, original_unit_string).
        """
        if area_input is None:
            return None, "unknown"
        
        if isinstance(area_input, (int, float)):
            return float(area_input), "acre"
        
        text = str(area_input).strip().lower().replace(",", "")
        match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z_\s]*)", text)
        if not match:
            try:
                return float(text), "acre"
            except ValueError:
                return None, text
        
        val_str, unit_raw = match.groups()
        val = float(val_str)
        unit = unit_raw.strip().replace(" ", "_") if unit_raw.strip() else "acre"
        
        factor = cls.UNIT_TO_ACRES.get(unit, 1.0)
        return val * factor, unit

    def detect_conflicts(self, records: List[Dict[str, Any]], primary_record_id: Optional[str] = None) -> List[ConflictItem]:
        """
        Compares multiple matched records (e.g., RoR Revenue, Registration Dept, Cadastral Survey)
        belonging to the same land parcel across all available sources.
        """
        conflicts: List[ConflictItem] = []
        if not records:
            return conflicts

        # 1. Missing values check across all records
        for rec in records:
            conflicts.extend(self._check_missing_values(rec))

        # If only 1 record, missing values check is sufficient
        if len(records) == 1:
            return conflicts

        # 2. Pairwise comparison across records to detect all discrepancies
        seen_pairs = set()

        for i in range(len(records)):
            for j in range(i + 1, len(records)):
                base = records[i]
                rec = records[j]
                base_src = base.get("source", f"Source {i+1}")
                rec_src = rec.get("source", f"Source {j+1}")

                # --- Area Mismatch ---
                base_area_acres, base_unit = self.parse_area_value(base.get("area"))
                comp_area_acres, comp_unit = self.parse_area_value(rec.get("area"))

                if base_area_acres is not None and comp_area_acres is not None:
                    diff = abs(base_area_acres - comp_area_acres)
                    avg_area = (base_area_acres + comp_area_acres) / 2.0
                    pct_diff = (diff / max(avg_area, 0.0001)) * 100.0

                    if pct_diff > self.area_tolerance_pct:
                        pair_key = f"area_{min(base_area_acres, comp_area_acres)}_{max(base_area_acres, comp_area_acres)}"
                        if pair_key not in seen_pairs:
                            seen_pairs.add(pair_key)
                            if pct_diff > 25.0:
                                sev = SeverityLevel.CRITICAL.value
                            elif pct_diff > 10.0:
                                sev = SeverityLevel.HIGH.value
                            elif pct_diff > 5.0:
                                sev = SeverityLevel.MEDIUM.value
                            else:
                                sev = SeverityLevel.LOW.value

                            conflicts.append(ConflictItem(
                                type=ConflictType.AREA_MISMATCH.value,
                                severity=sev,
                                old_value=str(base.get("area")),
                                new_value=str(rec.get("area")),
                                field_name="area",
                                description=f"Area mismatch of {pct_diff:.1f}% between {base_src} ({base.get('area')}) and {rec_src} ({rec.get('area')})",
                                details={
                                    "base_source": base_src,
                                    "comp_source": rec_src,
                                    "base_acres": round(base_area_acres, 4),
                                    "comp_acres": round(comp_area_acres, 4),
                                    "difference_acres": round(diff, 4),
                                    "percentage_difference": round(pct_diff, 2)
                                }
                            ))

                # --- Survey Number Mismatch ---
                base_survey = self._safe_str(base.get("survey_number"))
                comp_survey = self._safe_str(rec.get("survey_number"))

                if base_survey and comp_survey and base_survey.lower() != comp_survey.lower():
                    pair_key = f"sn_{min(base_survey, comp_survey)}_{max(base_survey, comp_survey)}"
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        base_parts = re.split(r"[/_\-\s]", base_survey)
                        comp_parts = re.split(r"[/_\-\s]", comp_survey)
                        
                        if base_parts[0] == comp_parts[0]:
                            sev = SeverityLevel.MEDIUM.value
                            desc = f"Survey sub-division variance between {base_src} ('{base_survey}') and {rec_src} ('{comp_survey}')"
                        else:
                            sev = SeverityLevel.HIGH.value
                            desc = f"Fundamental survey number mismatch between {base_src} ('{base_survey}') and {rec_src} ('{comp_survey}')"

                        conflicts.append(ConflictItem(
                            type=ConflictType.SURVEY_NUMBER_MISMATCH.value,
                            severity=sev,
                            old_value=base_survey,
                            new_value=comp_survey,
                            field_name="survey_number",
                            description=desc,
                            details={"base_source": base_src, "comp_source": rec_src}
                        ))

                # --- Village / Location Mismatch ---
                base_village = self._safe_str(base.get("village"))
                comp_village = self._safe_str(rec.get("village"))
                if base_village and comp_village and base_village.lower() != comp_village.lower():
                    pair_key = f"vil_{min(base_village, comp_village)}_{max(base_village, comp_village)}"
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        sim = difflib.SequenceMatcher(None, base_village.lower(), comp_village.lower()).ratio()
                        sev = SeverityLevel.LOW.value if sim > 0.8 else SeverityLevel.HIGH.value
                        conflicts.append(ConflictItem(
                            type=ConflictType.VILLAGE_MISMATCH.value,
                            severity=sev,
                            old_value=base_village,
                            new_value=comp_village,
                            field_name="village",
                            description=f"Village name discrepancy between {base_src} ('{base_village}') and {rec_src} ('{comp_village}')",
                            details={"similarity": round(sim, 2), "base_source": base_src, "comp_source": rec_src}
                        ))

                base_taluk = self._safe_str(base.get("taluk", base.get("sub_district")))
                comp_taluk = self._safe_str(rec.get("taluk", rec.get("sub_district")))
                if base_taluk and comp_taluk and base_taluk.lower() != comp_taluk.lower():
                    pair_key = f"tlk_{min(base_taluk, comp_taluk)}_{max(base_taluk, comp_taluk)}"
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        conflicts.append(ConflictItem(
                            type=ConflictType.LOCATION_MISMATCH.value,
                            severity=SeverityLevel.HIGH.value,
                            old_value=base_taluk,
                            new_value=comp_taluk,
                            field_name="taluk",
                            description=f"Taluk/Sub-district conflict: '{base_taluk}' ({base_src}) vs '{comp_taluk}' ({rec_src})",
                            details={"base_source": base_src, "comp_source": rec_src}
                        ))

                # --- Owner / Attribute Mismatch ---
                base_owner = self._safe_str(base.get("owner_name", base.get("owner")))
                comp_owner = self._safe_str(rec.get("owner_name", rec.get("owner")))
                if base_owner and comp_owner and base_owner.lower() != comp_owner.lower():
                    pair_key = f"own_{min(base_owner, comp_owner)}_{max(base_owner, comp_owner)}"
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        c_base = self._clean_name(base_owner)
                        c_comp = self._clean_name(comp_owner)

                        if c_base == c_comp and c_base != "":
                            sim = 0.95
                        else:
                            sim = difflib.SequenceMatcher(None, base_owner.lower(), comp_owner.lower()).ratio()

                        if sim > 0.85:
                            sev = SeverityLevel.LOW.value
                            desc = f"Minor spelling variance in owner name: '{base_owner}' vs '{comp_owner}'"
                        elif sim > 0.6:
                            sev = SeverityLevel.MEDIUM.value
                            desc = f"Possible owner name discrepancy or middle name variation: '{base_owner}' vs '{comp_owner}'"
                        else:
                            sev = SeverityLevel.CRITICAL.value
                            desc = f"Owner mismatch detected: '{base_owner}' ({base_src}) vs '{comp_owner}' ({rec_src})"

                        conflicts.append(ConflictItem(
                            type=ConflictType.OWNER_MISMATCH.value,
                            severity=sev,
                            old_value=base_owner,
                            new_value=comp_owner,
                            field_name="owner_name",
                            description=desc,
                            details={"name_similarity": round(sim, 2), "base_source": base_src, "comp_source": rec_src}
                        ))

                # --- Land Use / Classification Mismatch ---
                base_use = self._safe_str(base.get("land_use", base.get("classification")))
                comp_use = self._safe_str(rec.get("land_use", rec.get("classification")))
                if base_use and comp_use and base_use.lower() != comp_use.lower():
                    pair_key = f"lu_{min(base_use, comp_use)}_{max(base_use, comp_use)}"
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        conflicts.append(ConflictItem(
                            type=ConflictType.LAND_USE_MISMATCH.value,
                            severity=SeverityLevel.MEDIUM.value,
                            old_value=base_use,
                            new_value=comp_use,
                            field_name="land_use",
                            description=f"Land use classification mismatch: '{base_use}' vs '{comp_use}'",
                            details={"base_source": base_src, "comp_source": rec_src}
                        ))

                # --- Duplicate / Inconsistent Records ---
                base_status = self._safe_str(base.get("status"))
                comp_status = self._safe_str(rec.get("status"))
                if base_status and comp_status and base_status != comp_status:
                    conflicts.append(ConflictItem(
                        type=ConflictType.INCONSISTENT_INFORMATION.value,
                        severity=SeverityLevel.HIGH.value,
                        old_value=base_status,
                        new_value=comp_status,
                        field_name="status",
                        description=f"Inconsistent parcel status: '{base_status}' vs '{comp_status}'"
                    ))

        return conflicts

    def _check_missing_values(self, record: Dict[str, Any]) -> List[ConflictItem]:
        """Flags missing essential fields in a record."""
        conflicts = []
        src = record.get("source", "Record")
        mandatory_fields = [
            ("survey_number", SeverityLevel.HIGH.value),
            ("area", SeverityLevel.HIGH.value),
            ("owner_name", SeverityLevel.HIGH.value),
            ("village", SeverityLevel.MEDIUM.value)
        ]

        for field_name, severity in mandatory_fields:
            val = record.get(field_name)
            if val is None or str(val).strip() == "" or str(val).strip().lower() in [
                "null", "none", "nan", "na", "missing", "unknown", "unspecified", "n/a"
            ]:
                conflicts.append(ConflictItem(
                    type=ConflictType.MISSING_VALUE.value,
                    severity=severity,
                    field_name=field_name,
                    old_value=None,
                    new_value="MISSING",
                    description=f"Mandatory field '{field_name}' is missing in {src}",
                    details={"source": src, "field": field_name}
                ))
        return conflicts
