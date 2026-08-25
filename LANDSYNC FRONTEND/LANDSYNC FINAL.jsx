import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard, Map, Database, Radar, ScanSearch, History, Sparkles,
  FileText, ShieldCheck, GitBranch, Satellite, Search, Bell, ChevronDown,
  ArrowUpRight, TrendingUp, AlertTriangle, MapPinned, ArrowRight, ChevronLeft,
  ChevronRight, Layers, X, Filter, CheckCircle2, AlertOctagon, ArrowUpDown,
  Plug, Download, Clock, ShieldAlert, Compass, FileStack, ScanLine, Flag,
  Cpu, Send, Bot, User, Eye, EyeOff,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart as RRadarChart, PolarGrid,
  PolarAngleAxis, Radar as RRadar,
} from "recharts";

/* ============================================================
   LANDSYNC — AI Land Data Intelligence & Harmonization Platform
   Single-file interactive preview. Frontend-only, mock data.
   ============================================================ */

const C = {
  ground950: "#121314", ground900: "#17181a", ground850: "#1c1e19",
  surface1: "#1a1d16", surface2: "#23281d",
  line1: "#ffffff14", line2: "#ffffff1f", line3: "#ffffff2e",
  cyan: "#9caf88", emerald: "#c9a876", amber: "#d98e4a", critical: "#be5a4c",
  ink000: "#faf7ef", ink100: "#e8e3d6", ink300: "#a6ac98", ink500: "#767c6c", ink700: "#4a4f42",
  glass: "rgba(18,32,28,0.22)", glassStrong: "rgba(14,26,23,0.32)", glassBorder: "rgba(250,247,239,0.20)",
  panelSolid: "rgba(13,15,11,0.97)", panelBorder: "rgba(255,255,255,0.14)",
};

function GoogleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.61 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.85 1.15 7.96 3.03l5.66-5.66C34.19 6.15 29.32 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z" />
      <path fill="#FF3D00" d="M6.31 14.69l6.57 4.82C14.66 15.9 18.99 13 24 13c3.06 0 5.85 1.15 7.96 3.03l5.66-5.66C34.19 6.15 29.32 4 24 4 16.32 4 9.69 8.34 6.31 14.69z" />
      <path fill="#4CAF50" d="M24 44c5.22 0 9.98-2 13.57-5.24l-6.26-5.3C29.36 35.09 26.81 36 24 36c-5.2 0-9.62-3.32-11.28-7.95l-6.52 5.02C9.53 39.55 16.23 44 24 44z" />
      <path fill="#1976D2" d="M43.61 20.08H42V20H24v8h11.3c-.79 2.24-2.24 4.16-4.11 5.46l6.26 5.3C39.98 36.7 44 31 44 24c0-1.34-.14-2.65-.39-3.92z" />
    </svg>
  );
}

function AppleLogo({ size = 20, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 384 512" fill={color} aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

const FONT_DISPLAY = "'Space Grotesk', 'Inter', ui-sans-serif, sans-serif";
const FONT_SANS = "'Inter', ui-sans-serif, system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

/* ---------------- mock data ---------------- */

function seedRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DISTRICTS = [
  { id: "d-coimbatore", name: "Coimbatore", state: "Tamil Nadu", parcels: 41822, conflicts: 812 },
  { id: "d-erode", name: "Erode", state: "Tamil Nadu", parcels: 28110, conflicts: 401 },
  { id: "d-madurai", name: "Madurai", state: "Tamil Nadu", parcels: 36590, conflicts: 663 },
  { id: "d-pune", name: "Pune", state: "Maharashtra", parcels: 52310, conflicts: 1104 },
  { id: "d-nashik", name: "Nashik", state: "Maharashtra", parcels: 24780, conflicts: 355 },
  { id: "d-bengaluru-rural", name: "Bengaluru Rural", state: "Karnataka", parcels: 19240, conflicts: 588 },
];

const sourceLayers = ["Cadastral (DILRMP)", "Municipal GIS", "Survey Settlement", "RoR / Bhulekh", "Satellite Cadastre"];
const villageNames = ["Kinathukadavu", "Sulur", "Pollachi", "Annur", "Mettupalayam", "Palladam", "Perundurai", "Bhavani", "Gobichettipalayam", "Melur", "Usilampatti", "Haveli", "Baramati", "Devlali", "Sinnar", "Nelamangala", "Devanahalli", "Hoskote"];
const ownerTypes = ["Individual patta", "Joint family holding", "Government (Poramboke)", "Institutional trust", "Cooperative society"];
const landUses = ["Agricultural — irrigated", "Agricultural — rainfed", "Residential", "Mixed use", "Vacant / fallow", "Commercial"];

function buildParcel(i, rng) {
  const district = DISTRICTS[Math.floor(rng() * DISTRICTS.length)];
  const village = villageNames[Math.floor(rng() * villageNames.length)];
  const surveyNo = `${Math.floor(rng() * 400) + 1}/${["1", "2", "1A", "3B", ""][Math.floor(rng() * 5)]}`.replace(/\/$/, "");
  const identity = 78 + rng() * 21;
  const geometry = 70 + rng() * 29;
  const areaConsistency = 55 + rng() * 44;
  const adminConsistency = 68 + rng() * 31;
  const temporalConsistency = 62 + rng() * 37;
  const overall = identity * 0.28 + geometry * 0.24 + areaConsistency * 0.2 + adminConsistency * 0.16 + temporalConsistency * 0.12;
  const cadastralArea = +(800 + rng() * 8000).toFixed(0);
  const areaDrift = (areaConsistency < 85 ? (95 - areaConsistency) / 10 : 0.4) * (rng() > 0.5 ? 1 : -1);
  const rorArea = +(cadastralArea * (1 + areaDrift / 100)).toFixed(0);
  const status = overall >= 90 ? "harmonized" : overall >= 75 ? "review" : overall >= 60 ? "flagged" : "critical";

  const conflicts = [];
  if (areaConsistency < 90) conflicts.push({ type: "Area mismatch", severity: areaConsistency < 65 ? "critical" : areaConsistency < 82 ? "high" : "medium", detail: `Reported area differs by ${Math.abs(areaDrift).toFixed(1)}% between cadastral and RoR records.` });
  if (adminConsistency < 85) conflicts.push({ type: "Jurisdiction overlap", severity: adminConsistency < 70 ? "high" : "medium", detail: `Taluk boundary in municipal GIS layer disagrees with revenue village code on record.` });
  if (geometry < 85) conflicts.push({ type: "Geometry drift", severity: geometry < 72 ? "high" : "medium", detail: `Digitised boundary deviates ${(90 - geometry).toFixed(1)}m avg. from satellite cadastre trace.` });
  if (temporalConsistency < 80) conflicts.push({ type: "Stale mutation", severity: "medium", detail: `Last mutation recorded ${Math.floor((90 - temporalConsistency) / 4)} registry cycles behind linked deed.` });
  if (rng() < 0.06) conflicts.push({ type: "Duplicate claim", severity: "critical", detail: `Overlapping ownership claim filed against adjoining survey number ${surveyNo}-A.` });

  const cx = 60 + rng() * 880;
  const cy = 60 + rng() * 560;
  const rx = 10 + rng() * 22;
  const ry = 8 + rng() * 18;
  const rot = rng() * 40 - 20;

  return {
    id: `LS-${(cadastralArea + i * 7).toString().padStart(5, "0")}-${district.id.slice(2, 5).toUpperCase()}`,
    surveyNo, village, district: district.name, state: district.state,
    ownerType: ownerTypes[Math.floor(rng() * ownerTypes.length)],
    landUse: landUses[Math.floor(rng() * landUses.length)],
    cadastralArea, rorArea, status,
    dna: { identity: +identity.toFixed(1), geometry: +geometry.toFixed(1), areaConsistency: +areaConsistency.toFixed(1), adminConsistency: +adminConsistency.toFixed(1), temporalConsistency: +temporalConsistency.toFixed(1), overall: +overall.toFixed(1) },
    sources: sourceLayers.filter(() => rng() > 0.35).length ? sourceLayers.filter(() => rng() > 0.35) : [sourceLayers[0]],
    conflicts,
    lastSynced: `2026-0${Math.floor(rng() * 8) + 1}-${(Math.floor(rng() * 27) + 1).toString().padStart(2, "0")}`,
    geom: { cx, cy, rx, ry, rot },
  };
}

const rng = seedRandom(42);
const PARCELS = Array.from({ length: 130 }, (_, i) => buildParcel(i, rng));
const STATUS_META = {
  harmonized: { label: "Harmonized", tone: "emerald" },
  review: { label: "Needs review", tone: "cyan" },
  flagged: { label: "Flagged", tone: "amber" },
  critical: { label: "Critical conflict", tone: "critical" },
};

const DATASETS = [
  { id: "ds-01", name: "DILRMP Cadastral Master", type: "Cadastral", dept: "Dept. of Land Resources", format: "Shapefile + RDBMS", records: 41822, coverage: "Coimbatore, Erode, Madurai", lastIngest: "2026-08-19", quality: 94, status: "active", schemaFields: ["survey_no", "sub_division", "geom", "patta_holder", "classification"] },
  { id: "ds-02", name: "Municipal GIS — CCMC", type: "Municipal GIS", dept: "Coimbatore City Municipal Corp.", format: "GeoJSON", records: 18630, coverage: "Coimbatore Urban", lastIngest: "2026-08-21", quality: 88, status: "active", schemaFields: ["parcel_id", "zone_code", "geom", "ward_no", "property_tax_ref"] },
  { id: "ds-03", name: "Survey Settlement Records 1978–2004", type: "Survey", dept: "Survey & Settlement Dept.", format: "Scanned + OCR Index", records: 66920, coverage: "Tamil Nadu (statewide)", lastIngest: "2026-06-02", quality: 71, status: "active", schemaFields: ["survey_no", "chain_measurement", "boundary_desc", "tahsildar_seal"] },
  { id: "ds-04", name: "RoR / Bhulekh Extract", type: "Land Record", dept: "Revenue Dept.", format: "API (REST)", records: 58210, coverage: "Maharashtra pilot districts", lastIngest: "2026-08-23", quality: 90, status: "active", schemaFields: ["khata_no", "khasra_no", "owner_name", "area", "mutation_date"] },
  { id: "ds-05", name: "Property Tax Roll — PCMC", type: "Property", dept: "Pune Municipal Corp.", format: "CSV export", records: 39440, coverage: "Pune Metropolitan", lastIngest: "2026-08-15", quality: 82, status: "active", schemaFields: ["ptin", "address", "carpet_area", "assessed_value"] },
  { id: "ds-06", name: "Satellite Cadastre Trace (ISRO/Bhuvan)", type: "Geospatial layer", dept: "NRSC / ISRO", format: "Raster + Vector overlay", records: 112400, coverage: "Multi-state", lastIngest: "2026-08-10", quality: 96, status: "active", schemaFields: ["tile_id", "capture_date", "resolution_m", "boundary_confidence"] },
  { id: "ds-07", name: "Legacy Village Maps (Pre-digitisation)", type: "Survey", dept: "State Archives", format: "Scanned TIFF", records: 9040, coverage: "Bengaluru Rural", lastIngest: "2026-03-28", quality: 54, status: "degraded", schemaFields: ["village_code", "hand_annotation", "scale_ref"] },
];

const INGEST_EVENTS = [
  { time: "09:41", dataset: "RoR / Bhulekh Extract", action: "Delta sync — 1,204 records updated", type: "sync" },
  { time: "08:55", dataset: "Municipal GIS — CCMC", action: "Schema drift detected on ward_no field", type: "warning" },
  { time: "07:12", dataset: "DILRMP Cadastral Master", action: "Full re-index completed — 41,822 parcels", type: "success" },
  { time: "Yesterday", dataset: "Satellite Cadastre Trace", action: "New tile batch ingested (Aug capture)", type: "sync" },
  { time: "Yesterday", dataset: "Legacy Village Maps", action: "OCR confidence below threshold on 340 sheets", type: "error" },
];

const HARMONIZATION_TREND = [
  { month: "Mar", harmonized: 61, flagged: 22 }, { month: "Apr", harmonized: 65, flagged: 21 },
  { month: "May", harmonized: 69, flagged: 19 }, { month: "Jun", harmonized: 74, flagged: 17 },
  { month: "Jul", harmonized: 79, flagged: 14 }, { month: "Aug", harmonized: 83, flagged: 12 },
];
const CONFLICT_BY_TYPE = [
  { type: "Area mismatch", count: 1284, color: C.amber }, { type: "Geometry drift", count: 742, color: C.cyan },
  { type: "Jurisdiction overlap", count: 511, color: "#818cf8" }, { type: "Stale mutation", count: 398, color: "#94a3b8" },
  { type: "Duplicate claim", count: 96, color: C.critical },
];
const DISTRICT_CONFIDENCE = [
  { district: "Coimbatore", confidence: 88 }, { district: "Erode", confidence: 91 }, { district: "Madurai", confidence: 83 },
  { district: "Pune", confidence: 79 }, { district: "Nashik", confidence: 86 }, { district: "Bengaluru Rural", confidence: 74 },
];
const DATA_QUALITY_DIMENSIONS = [
  { dim: "Completeness", score: 91 }, { dim: "Accuracy", score: 84 }, { dim: "Consistency", score: 78 },
  { dim: "Timeliness", score: 88 }, { dim: "Uniqueness", score: 95 }, { dim: "Validity", score: 86 },
];
const dimDescriptions = {
  Completeness: "Required fields present across all indexed records.", Accuracy: "Values verified against an authoritative reference source.",
  Consistency: "Agreement of the same fact across multiple sources.", Timeliness: "Records reflect the most recent known mutation or survey.",
  Uniqueness: "Absence of duplicate parcel or ownership entries.", Validity: "Values conform to expected format, range and schema.",
};
const NATIONAL_STATS = { totalParcels: 202852, harmonizedPct: 83.4, activeConflicts: 3031, datasetsConnected: 7, avgConfidence: 87.2 };

const NOTIFICATIONS = [
  { id: "n1", tone: "critical", title: "Duplicate claim filed", detail: "Overlapping ownership claim on survey no. 214/1A, Sulur.", time: "12 min ago", unread: true },
  { id: "n2", tone: "amber", title: "Schema drift detected", detail: "Municipal GIS — CCMC: ward_no field format changed since last sync.", time: "48 min ago", unread: true },
  { id: "n3", tone: "cyan", title: "Full re-index completed", detail: "DILRMP Cadastral Master — 41,822 parcels re-indexed successfully.", time: "2 hr ago", unread: true },
  { id: "n4", tone: "emerald", title: "Conflict resolved", detail: "Area mismatch on LS-04821-COI cleared after RoR correction.", time: "5 hr ago", unread: false },
  { id: "n5", tone: "neutral", title: "Scheduled maintenance", detail: "Satellite Cadastre sync will pause 11:30 PM–1:00 AM IST tonight.", time: "Yesterday", unread: false },
];

const TIMELINE_EVENTS = [
  { date: "2004-11-02", title: "Original survey settlement recorded", source: "Survey Settlement Records", detail: "Boundary chain-measured and sealed by Tahsildar; area recorded as 2,140 sq.m.", kind: "survey" },
  { date: "2011-06-18", title: "RoR mutation — inheritance transfer", source: "RoR / Bhulekh", detail: "Khata split between two heirs following succession; area recorded as 2,148 sq.m.", kind: "mutation" },
  { date: "2016-02-09", title: "Municipal GIS digitisation", source: "Municipal GIS — CCMC", detail: "Parcel boundary manually traced from paper map during ward digitisation drive.", kind: "digitisation" },
  { date: "2021-09-27", title: "Satellite cadastre cross-check", source: "Satellite Cadastre Trace", detail: "Automated boundary extraction flags 6.1% area deviation vs recorded RoR figure.", kind: "flag" },
  { date: "2025-01-14", title: "Property tax reassessment", source: "Property Tax Roll", detail: "Reassessment uses cadastral area, compounding the pre-existing discrepancy.", kind: "flag" },
  { date: "2026-08-19", title: "LANDSYNC harmonization pass", source: "AI Harmonization Engine", detail: "Cross-source reconciliation run; conflict surfaced to Conflict Radar for review.", kind: "system" },
];
const kindMeta = {
  survey: { icon: Compass, tone: "cyan" }, mutation: { icon: FileStack, tone: "emerald" }, digitisation: { icon: ScanLine, tone: "cyan" },
  flag: { icon: Flag, tone: "amber" }, system: { icon: Cpu, tone: "emerald" },
};

const SOURCE_LINEAGE = [
  { field: "Area (sq.m.)", values: [
    { source: "Survey Settlement 1978–2004", value: "2,140", confidence: 82, asOf: "2004" },
    { source: "RoR / Bhulekh", value: "2,148", confidence: 90, asOf: "2011" },
    { source: "Municipal GIS — CCMC", value: "2,050", confidence: 71, asOf: "2016" },
    { source: "Satellite Cadastre Trace", value: "2,273", confidence: 96, asOf: "2026" },
  ]},
  { field: "Owner of record", values: [
    { source: "Survey Settlement 1978–2004", value: "R. Muthukrishnan", confidence: 88, asOf: "2004" },
    { source: "RoR / Bhulekh", value: "R. Muthukrishnan (heirs)", confidence: 94, asOf: "2011" },
    { source: "Municipal GIS — CCMC", value: "Not captured", confidence: 0, asOf: "—" },
  ]},
  { field: "Boundary geometry", values: [
    { source: "Municipal GIS — CCMC", value: "Manually traced polygon", confidence: 71, asOf: "2016" },
    { source: "Satellite Cadastre Trace", value: "ML-extracted polygon", confidence: 96, asOf: "2026" },
  ]},
];

const COPILOT_SUGGESTIONS = [
  "Which parcels in Coimbatore have area drift above 5%?",
  "Explain the confidence score for a flagged parcel",
  "Show duplicate ownership claims filed this month",
  "Summarize data quality issues in the Municipal GIS layer",
];

const REPORT_TEMPLATES = [
  { title: "District Harmonization Summary", desc: "Confidence, conflict volume and resolution rate by district.", cadence: "Weekly", tone: "cyan" },
  { title: "Conflict Resolution Audit", desc: "Every conflict opened and closed this period, with adjudication notes.", cadence: "Monthly", tone: "amber" },
  { title: "Data Source Quality Report", desc: "Per-dataset completeness, accuracy and timeliness scoring.", cadence: "Monthly", tone: "emerald" },
  { title: "Field Verification Dossier", desc: "Parcels flagged for on-ground survey, with generated checklists.", cadence: "On demand", tone: "cyan" },
];
const RECENT_REPORTS = [
  { name: "Coimbatore District — August Harmonization Summary", generated: "2026-08-20", size: "4.2 MB", format: "PDF" },
  { name: "Statewide Conflict Resolution Audit — Q2 2026", generated: "2026-07-31", size: "9.8 MB", format: "PDF" },
  { name: "Municipal GIS Data Quality Report — CCMC", generated: "2026-07-14", size: "1.6 MB", format: "XLSX" },
  { name: "Pune Metropolitan — Field Verification Dossier", generated: "2026-06-29", size: "2.9 MB", format: "PDF" },
];

/* ---------------- Land DNA helpers (core differentiator) ---------------- */

function toneForScore(score) {
  if (score >= 90) return "emerald";
  if (score >= 75) return "cyan";
  if (score >= 60) return "amber";
  return "critical";
}
const toneHex = { emerald: C.emerald, cyan: C.cyan, amber: C.amber, critical: C.critical, neutral: C.ink500 };

const DNA_DIMENSIONS = [
  { key: "identity", label: "Identity", desc: "Owner & parcel identifiers agree across sources" },
  { key: "geometry", label: "Geometry", desc: "Boundary shape agreement vs. satellite trace" },
  { key: "areaConsistency", label: "Area consistency", desc: "Recorded area agreement across records" },
  { key: "adminConsistency", label: "Administrative consistency", desc: "Jurisdiction, ward & village codes agree" },
  { key: "temporalConsistency", label: "Temporal consistency", desc: "Mutation history is current & sequential" },
];

function explainDimension(key, dna, parcel) {
  const score = dna[key];
  if (score >= 92) return null;
  switch (key) {
    case "areaConsistency":
      return `Confidence reduced because the reported area differs by ${((Math.abs(parcel.rorArea - parcel.cadastralArea) / parcel.cadastralArea) * 100).toFixed(1)}% between cadastral and RoR records.`;
    case "geometry":
      return `Confidence reduced because the digitised boundary deviates from the satellite cadastre trace by an estimated ${((100 - score) * 0.6).toFixed(1)}m on average.`;
    case "adminConsistency":
      return `Confidence reduced because jurisdiction codes (ward / taluk / village) disagree between the municipal GIS layer and the revenue record.`;
    case "temporalConsistency":
      return `Confidence reduced because the most recent mutation record predates the linked deed by more than one registry cycle.`;
    case "identity":
      return `Confidence reduced because owner or parcel identifiers show minor variation across ${parcel.sources.length} linked source${parcel.sources.length > 1 ? "s" : ""}.`;
    default: return null;
  }
}

/* ---------------- blurred backdrop (soft-focus terrain, glass sits above it) ---------------- */

function Backdrop({ fixed = true }) {
  return (
    <div style={{ position: fixed ? "fixed" : "absolute", inset: 0, zIndex: 0, overflow: "hidden", background: "#0a1a17" }}>
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <filter id="lsBlurBig" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="130" />
          </filter>
          <filter id="lsBlurSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="70" />
          </filter>
          <filter id="lsGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
          </filter>
          <radialGradient id="lsVignette" cx="46%" cy="40%" r="78%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        {/* base field — deep teal-black */}
        <rect width="1600" height="1000" fill="#0a1a17" />
        <g filter="url(#lsBlurBig)">
          {/* muted teal-slate upper field */}
          <ellipse cx="480" cy="140" rx="620" ry="420" fill="#3c5a58" opacity="0.85" />
          {/* soft yellow-green glow, upper right — like the FLOAT highlight */}
          <ellipse cx="1180" cy="160" rx="460" ry="340" fill="#a9b06a" opacity="0.4" />
          {/* bright warm cream diagonal glow, left-mid */}
          <ellipse cx="330" cy="430" rx="430" ry="230" fill="#f2ece0" opacity="0.5" />
          {/* rich forest green, lower field */}
          <ellipse cx="900" cy="620" rx="620" ry="440" fill="#0f4a3a" opacity="0.92" />
          <ellipse cx="1300" cy="820" rx="480" ry="360" fill="#0a2e24" opacity="0.95" />
          {/* deep near-black corner */}
          <ellipse cx="120" cy="880" rx="420" ry="320" fill="#081513" opacity="0.95" />
        </g>
        <g filter="url(#lsBlurSoft)">
          <ellipse cx="360" cy="380" rx="200" ry="130" fill="#fffdf6" opacity="0.18" />
          <ellipse cx="1020" cy="220" rx="170" ry="120" fill="#c7cf8e" opacity="0.14" />
        </g>
        <rect width="1600" height="1000" fill="url(#lsVignette)" />
        {/* film grain */}
        <rect width="1600" height="1000" filter="url(#lsGrain)" opacity="0.05" />
      </svg>
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(8,16,14,0.32), rgba(8,16,14,0.32))",
        }}
      />
    </div>
  );
}

/* ---------------- UI primitives ---------------- */

function Badge({ children, tone = "neutral", className = "" }) {
  const bg = { neutral: "#ffffff0f", cyan: "#9caf881a", emerald: "#c9a8761a", amber: "#d98e4a1a", critical: "#be5a4c1a" }[tone];
  const fg = { neutral: C.ink300, cyan: "#c6d3ae", emerald: "#e3cfa0", amber: "#efc08a", critical: "#e39184" }[tone];
  const bd = { neutral: C.line2, cyan: "#9caf8840", emerald: "#c9a87640", amber: "#d98e4a40", critical: "#be5a4c40" }[tone];
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, border: `1px solid ${bd}`, background: bg, color: fg, padding: "5px 11px", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {children}
    </span>
  );
}

function Card({ children, style, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: `linear-gradient(180deg, rgba(250,247,239,0.10), rgba(250,247,239,0.02)), ${C.glass}`,
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: `1px solid ${C.glassBorder}`,
        borderRadius: 32,
        boxShadow: "0 30px 70px -26px #00000070, 0 1px 0 0 rgba(250,247,239,0.12) inset",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ eyebrow, title, description, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "24px 26px 16px" }}>
      <div>
        {eyebrow && <p style={{ margin: 0, marginBottom: 6, fontFamily: FONT_MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.16em", color: C.ink500 }}>{eyebrow}</p>}
        {title && <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: C.ink000 }}>{title}</h3>}
        {description && <p style={{ margin: 0, marginTop: 5, fontSize: 13.5, color: C.ink500 }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function ProgressBar({ value, tone = "cyan", height = 5 }) {
  return (
    <div style={{ width: "100%", height, borderRadius: 999, background: "#ffffff0f", overflow: "hidden" }}>
      <div style={{ height, borderRadius: 999, background: toneHex[tone], width: `${Math.min(100, Math.max(0, value))}%`, transition: "width 700ms ease-out" }} />
    </div>
  );
}

function Button({ children, variant = "primary", onClick, style, size = "md" }) {
  const pad = size === "sm" ? "7px 14px" : "10px 20px";
  const fs = size === "sm" ? 16.5 : 18;
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, fontWeight: 600, fontSize: fs, padding: pad, cursor: "pointer", border: "none", whiteSpace: "nowrap", transition: "all .15s" };
  const variants = {
    primary: { background: C.cyan, color: C.ground950, boxShadow: "0 10px 30px -10px #9caf8880" },
    secondary: { background: "#ffffff0f", color: C.ink100, border: `1px solid ${C.line2}` },
    outline: { background: "transparent", color: C.ink100, border: `1px solid ${C.line3}` },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function DnaRing({ score, size = 64, stroke = 5 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const tone = toneForScore(score);
  const offset = c - (score / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ffffff14" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={toneHex[tone]} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${toneHex[tone]}80)`, transition: "stroke-dashoffset 900ms ease-out" }} />
      </svg>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: size < 50 ? 14 : 17, fontWeight: 600, color: C.ink000 }}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
}

function KeyValue({ label, value, mono }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", fontSize: 13.5 }}>
      <span style={{ color: C.ink500 }}>{label}</span>
      <span style={{ color: C.ink100, fontFamily: mono ? FONT_MONO : FONT_SANS, fontSize: mono ? 12.5 : 14.5, fontWeight: mono ? 400 : 600 }}>{value}</span>
    </div>
  );
}

/* ---------------- DNA Helix (signature visual) ---------------- */

function DnaHelix({ parcel }) {
  const { dna } = parcel;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 8 }}>
        <DnaRing score={dna.overall} size={112} stroke={7} />
        <div>
          <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.12em", color: C.ink500 }}>Overall confidence</p>
          <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 46.5, color: C.ink000 }}>{dna.overall.toFixed(0)}%</p>
          <p style={{ margin: 0, marginTop: 2, fontSize: 17, color: C.ink500, maxWidth: 360 }}>
            {dna.overall >= 90 ? "Fully harmonized across linked sources." : dna.overall >= 75 ? "Minor discrepancies — recommended for scheduled review." : "Significant discrepancy — flagged for priority review."}
          </p>
        </div>
      </div>
      <div style={{ position: "relative", marginTop: 22 }}>
        <div style={{ position: "absolute", left: 15, top: 12, bottom: 12, width: 1, background: `linear-gradient(180deg, ${C.cyan}66, #ffffff1a, ${C.emerald}55)` }} />
        {DNA_DIMENSIONS.map((d) => {
          const score = dna[d.key];
          const tone = toneForScore(score);
          const why = explainDimension(d.key, dna, parcel);
          return (
            <div key={d.key} style={{ position: "relative", display: "flex", gap: 16, padding: "14px 0" }}>
              <div style={{ position: "relative", zIndex: 1, marginTop: 2, height: 32, width: 32, flex: "none", borderRadius: 999, border: `1px solid ${C.line2}`, background: C.ground900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ height: 8, width: 8, borderRadius: 999, background: toneHex[tone], boxShadow: `0 0 8px ${toneHex[tone]}` }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 500, color: C.ink100 }}>{d.label}</p>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 17, color: C.ink000 }}>{score.toFixed(1)}%</span>
                </div>
                <div style={{ marginTop: 6, marginBottom: 6 }}><ProgressBar value={score} tone={tone} height={4} /></div>
                <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.5, color: C.ink500 }}>{why ?? d.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Intelligence Map (custom SVG) ---------------- */

function IntelligenceMap({ parcels, height = 480, onSelect, selectedId, conflictsOnly }) {
  const [hovered, setHovered] = useState(null);
  const visible = useMemo(() => (conflictsOnly ? parcels.filter((p) => p.conflicts.length > 0) : parcels), [parcels, conflictsOnly]);

  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: 22, border: `1px solid ${C.line1}`, background: C.ground900 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.6, backgroundImage: "linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 60% at 30% 20%, #1a2013aa 0%, transparent 60%)", pointerEvents: "none" }} />
      <svg viewBox="0 0 1000 680" style={{ position: "relative", height: "100%", width: "100%" }} preserveAspectRatio="xMidYMid slice">
        <g stroke="#ffffff14" strokeWidth="1">
          <path d="M0,120 C220,90 400,180 1000,140" fill="none" />
          <path d="M0,340 C260,300 620,420 1000,360" fill="none" />
          <path d="M0,520 C300,560 700,480 1000,540" fill="none" />
          <path d="M320,0 C280,220 360,460 300,680" fill="none" />
          <path d="M680,0 C640,240 720,440 660,680" fill="none" />
        </g>
        {visible.map((p) => {
          const isSel = p.id === selectedId, isHover = p.id === hovered;
          const color = toneHex[STATUS_META[p.status].tone];
          const scale = isSel || isHover ? 1.35 : 1;
          return (
            <g key={p.id} transform={`translate(${p.geom.cx} ${p.geom.cy * 1.15}) rotate(${p.geom.rot}) scale(${scale})`}
              onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered((h) => (h === p.id ? null : h))}
              onClick={() => onSelect?.(p)} style={{ cursor: "pointer", transition: "transform 200ms" }}>
              <ellipse rx={p.geom.rx} ry={p.geom.ry} fill={color} fillOpacity={isSel ? 0.55 : 0.28} stroke={color} strokeWidth={isSel ? 2 : 1.1}
                style={{ filter: isSel || isHover ? `drop-shadow(0 0 10px ${color}aa)` : undefined }} />
              {p.conflicts.some((c) => c.severity === "critical") && (
                <circle r={2.4} fill={C.critical} cx={p.geom.rx * 0.7} cy={-p.geom.ry * 0.7}>
                  <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
      {hovered && (() => {
        const p = visible.find((x) => x.id === hovered);
        if (!p) return null;
        const left = (p.geom.cx / 1000) * 100, top = ((p.geom.cy * 1.15) / 680) * 100;
        return (
          <div style={{ pointerEvents: "none", position: "absolute", zIndex: 20, width: 220, borderRadius: 18, border: `1px solid ${C.line2}`, background: "#1c1e19f5", padding: 12, left: `calc(${left}% + 14px)`, top: `calc(${top}% - 10px)` }}>
            <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 14.5, color: C.cyan }}>{p.id}</p>
            <p style={{ margin: 0, marginTop: 2, fontSize: 17, fontWeight: 500, color: C.ink000 }}>{p.village}, {p.district}</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 15, color: C.ink500 }}>Overall confidence</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 16.5, color: C.ink100 }}>{p.dna.overall.toFixed(0)}%</span>
            </div>
            {p.conflicts.length > 0 && <p style={{ margin: 0, marginTop: 6, fontSize: 15, color: "#efc08a" }}>{p.conflicts.length} active conflict{p.conflicts.length > 1 ? "s" : ""}</p>}
          </div>
        );
      })()}
      <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", alignItems: "center", gap: 12, borderRadius: 999, border: `1px solid ${C.line1}`, background: "#17181acc", padding: "8px 14px" }}>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14.5, color: C.ink500 }}>
            <span style={{ height: 6, width: 6, borderRadius: 999, background: toneHex[meta.tone] }} /> {meta.label}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 14, right: 14, borderRadius: 999, border: `1px solid ${C.line1}`, background: "#17181acc", padding: "6px 12px", fontFamily: FONT_MONO, fontSize: 14, color: C.ink500 }}>
        {visible.length.toLocaleString()} parcels rendered
      </div>
    </div>
  );
}

/* ---------------- Charts ---------------- */

const tooltipStyle = { background: C.surface2, border: `1px solid ${C.line2}`, borderRadius: 14, fontSize: 16.5, color: C.ink100, padding: "8px 12px" };

function HarmonizationTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={HARMONIZATION_TREND} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.emerald} stopOpacity={0.45} /><stop offset="100%" stopColor={C.emerald} stopOpacity={0} /></linearGradient>
          <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.amber} stopOpacity={0.35} /><stop offset="100%" stopColor={C.amber} stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid stroke="#ffffff0d" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: C.ink500, fontSize: 15 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: C.ink500, fontSize: 15 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#ffffff1f" }} />
        <Area type="monotone" dataKey="harmonized" stroke={C.emerald} strokeWidth={2} fill="url(#gH)" name="Harmonized %" />
        <Area type="monotone" dataKey="flagged" stroke={C.amber} strokeWidth={2} fill="url(#gF)" name="Flagged %" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
function ConflictDonut() {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie data={CONFLICT_BY_TYPE} dataKey="count" nameKey="type" innerRadius={54} outerRadius={80} paddingAngle={3} stroke="none">
          {CONFLICT_BY_TYPE.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
function DistrictConfidenceBars() {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={DISTRICT_CONFIDENCE} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#ffffff0d" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: C.ink500, fontSize: 14.5 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="district" type="category" tick={{ fill: C.ink300, fontSize: 16 }} axisLine={false} tickLine={false} width={128} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey="confidence" radius={[0, 6, 6, 0]} fill={C.cyan} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
function QualityRadarChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RRadarChart data={DATA_QUALITY_DIMENSIONS} outerRadius="72%">
        <PolarGrid stroke="#ffffff1a" />
        <PolarAngleAxis dataKey="dim" tick={{ fill: C.ink300, fontSize: 15 }} />
        <RRadar dataKey="score" stroke={C.cyan} fill={C.cyan} fillOpacity={0.28} strokeWidth={2} />
        <Tooltip contentStyle={tooltipStyle} />
      </RRadarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Layout: Sidebar + Topbar ---------------- */

const NAV_GOVERNMENT = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "map", label: "Intelligence Map", icon: Map },
  { id: "datahub", label: "Data Hub", icon: Database },
  { id: "conflicts", label: "Conflict Radar", icon: Radar },
  { id: "parcels", label: "Parcel Intelligence", icon: ScanSearch },
  { id: "timeline", label: "Land Timeline", icon: History },
  { id: "copilot", label: "AI Land Copilot", icon: Sparkles },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "quality", label: "Data Quality", icon: ShieldCheck },
  { id: "traceability", label: "Source Traceability", icon: GitBranch },
];

// Public citizens only get the parcel-facing views. Data ingestion,
// cross-department conflict resolution, internal quality scoring and
// field-level source lineage stay government-only.
const NAV_PUBLIC = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "map", label: "Intelligence Map", icon: Map },
  { id: "parcels", label: "Parcel Intelligence", icon: ScanSearch },
  { id: "timeline", label: "Land Timeline", icon: History },
  { id: "copilot", label: "AI Land Copilot", icon: Sparkles },
];

function Sidebar({ active, setActive, mobileOpen, setMobileOpen, userType }) {
  const NAV = userType === "government" ? NAV_GOVERNMENT : NAV_PUBLIC;
  return (
    <>
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 39 }} className="ls-mobile-only" />}
      <aside style={{
        position: "fixed", insetBlock: 0, left: 0, zIndex: 40, width: 264, flex: "none", display: "flex", flexDirection: "column",
        borderRight: `1px solid ${C.glassBorder}`, background: C.glassStrong, backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
        transform: mobileOpen ? "translateX(0)" : undefined,
      }} className={mobileOpen ? "ls-sidebar ls-sidebar-open" : "ls-sidebar"}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "26px 22px" }}>
          <div style={{ position: "relative", display: "flex", height: 40, width: 40, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 14, border: "1px solid #9caf884d", background: "#9caf881a" }}>
            <Satellite size={20} color="#c6d3ae" strokeWidth={1.75} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 26.5, letterSpacing: "0.06em", textTransform: "uppercase", color: C.ink000 }}>Landsync</p>
            <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.14em", color: C.ink500 }}>National Land Registry</p>
          </div>
        </div>
        <nav style={{ marginTop: 8, flex: 1, overflowY: "auto", padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button key={id} onClick={() => { setActive(id); setMobileOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 13, borderRadius: 18, padding: "12px 14px", fontSize: 18, fontWeight: 500,
                background: isActive ? "#9caf8817" : "transparent", color: isActive ? "#c6d3ae" : C.ink300, border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <Icon size={19} strokeWidth={1.85} color={isActive ? "#c6d3ae" : C.ink500} />
                <span>{label}</span>
                {isActive && <span style={{ marginLeft: "auto", height: 6, width: 6, borderRadius: 999, background: C.cyan, boxShadow: "0 0 8px #9caf88" }} />}
              </button>
            );
          })}
        </nav>
        <div style={{ margin: 12, borderRadius: 18, border: `1px solid ${C.line1}`, background: "#ffffff08", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: C.ink500 }}>System confidence</p>
            <span style={{ height: 6, width: 6, borderRadius: 999, background: C.emerald }} />
          </div>
          <p style={{ margin: 0, marginTop: 6, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 37, color: C.ink000 }}>{NATIONAL_STATS.avgConfidence}%</p>
          <p style={{ margin: 0, marginTop: 2, fontSize: 11.5, color: C.ink500 }}>{NATIONAL_STATS.datasetsConnected} sources synced live</p>
        </div>
      </aside>
    </>
  );
}

/* ---------------- accessible dropdown helper ---------------- */

function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    function handlePointer(e) { if (ref.current && !ref.current.contains(e.target)) onOutside(); }
    function handleKey(e) { if (e.key === "Escape") onOutside(); }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [active, ref, onOutside]);
}

/* ---------------- notification bell ---------------- */

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFICATIONS);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        style={{ position: "relative", display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 999, border: `1px solid ${C.line2}`, background: open ? "#ffffff14" : "#ffffff08", color: C.ink300, cursor: "pointer" }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", right: 7, top: 7, height: 7, width: 7, borderRadius: 999, background: C.critical, boxShadow: `0 0 0 2px ${C.ground900}` }} />
        )}
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={{
              position: "fixed", inset: 0, zIndex: 55,
              background: "rgba(250,247,239,0.45)", backdropFilter: "blur(18px) saturate(140%)", WebkitBackdropFilter: "blur(18px) saturate(140%)",
              animation: "lsFadeIn 160ms ease-out",
            }}
          />
          <div
            role="menu"
            aria-label="Notifications"
            style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 60, width: 340, maxWidth: "calc(100vw - 32px)",
              borderRadius: 20, border: `1px solid ${C.panelBorder}`, background: C.panelSolid, backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
              boxShadow: "0 30px 80px -16px #000000d0", overflow: "hidden", animation: "lsPopIn 160ms ease-out",
            }}
          >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${C.line2}` }}>
            <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.ink300 }}>Notifications</p>
            {unreadCount > 0 && (
              <button onClick={() => setItems((its) => its.map((n) => ({ ...n, unread: false })))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#c6d3ae" }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {items.map((n) => (
              <button
                key={n.id}
                role="menuitem"
                onClick={() => setItems((its) => its.map((it) => (it.id === n.id ? { ...it, unread: false } : it)))}
                style={{
                  display: "flex", width: "100%", gap: 10, textAlign: "left", border: "none", cursor: "pointer",
                  borderBottom: `1px solid ${C.line2}`, background: n.unread ? "#ffffff10" : "transparent", padding: "12px 16px",
                }}
              >
                <span style={{ marginTop: 5, height: 7, width: 7, flex: "none", borderRadius: 999, background: toneHex[n.tone] }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: n.unread ? 600 : 500, color: C.ink000 }}>{n.title}</p>
                  <p style={{ margin: 0, marginTop: 2, fontSize: 12.5, color: C.ink300, lineHeight: 1.4 }}>{n.detail}</p>
                  <p style={{ margin: 0, marginTop: 4, fontFamily: FONT_MONO, fontSize: 10.5, color: C.ink500 }}>{n.time}</p>
                </div>
              </button>
            ))}
          </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- simple search: inline input + dropdown ---------------- */

const SEARCH_HISTORY_KEY_LIMIT = 6;

function SearchBox({ userType, goto, onOpenParcel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  const NAV = userType === "government" ? NAV_GOVERNMENT : NAV_PUBLIC;
  const q = query.trim().toLowerCase();
  const pageResults = q ? NAV.filter((n) => n.label.toLowerCase().includes(q)) : [];
  const parcelResults = q
    ? PARCELS.filter((p) => p.id.toLowerCase().includes(q) || p.village.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.surveyNo.toLowerCase().includes(q)).slice(0, 5)
    : [];
  const hasResults = pageResults.length > 0 || parcelResults.length > 0;

  function commitHistory(term) {
    const clean = term.trim();
    if (!clean) return;
    setHistory((h) => [clean, ...h.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, SEARCH_HISTORY_KEY_LIMIT));
  }
  function runSearch(term) { setQuery(term); commitHistory(term); }
  function pickParcel(id) { commitHistory(query || id); onOpenParcel(id); close(); }
  function pickPage(id) { commitHistory(query || id); goto(id); close(); }
  function close() { setOpen(false); setQuery(""); }

  return (
    <div ref={wrapRef} className="ls-search" style={{ position: "relative", width: 260 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 999, border: `1px solid ${open ? C.line3 : C.line2}`, background: open ? "#ffffff12" : "#ffffff08", padding: "8px 14px" }}>
        <Search size={14.5} color={C.ink500} style={{ flex: "none" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (parcelResults[0]) pickParcel(parcelResults[0].id);
              else if (pageResults[0]) pickPage(pageResults[0].id);
              else commitHistory(query);
            } else if (e.key === "Escape") close();
          }}
          placeholder="Search parcels, villages…"
          aria-label="Search"
          className="ls-search-label"
          style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: 13.5, color: C.ink000 }}
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search" style={{ flex: "none", display: "flex", background: "none", border: "none", cursor: "pointer", color: C.ink500 }}>
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="Search results"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, minWidth: 300, zIndex: 60,
            borderRadius: 16, border: `1px solid ${C.panelBorder}`, background: C.panelSolid,
            backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
            boxShadow: "0 24px 60px -16px #000000d0", overflow: "hidden", animation: "lsPopIn 140ms ease-out",
          }}
        >
          {q ? (
            hasResults ? (
              <div style={{ padding: "8px", maxHeight: 340, overflowY: "auto" }}>
                {pageResults.map((n) => (
                  <button key={n.id} onClick={() => pickPage(n.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, textAlign: "left", border: "none", cursor: "pointer", background: "transparent", borderRadius: 12, padding: "9px 10px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff16")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <n.icon size={14} color={C.ink300} />
                    <span style={{ fontSize: 13.5, color: C.ink000 }}>{n.label}</span>
                  </button>
                ))}
                {parcelResults.map((p) => (
                  <button key={p.id} onClick={() => pickParcel(p.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, textAlign: "left", border: "none", cursor: "pointer", background: "transparent", borderRadius: 12, padding: "9px 10px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff16")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <ScanSearch size={14} color={C.ink300} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: FONT_MONO, fontSize: 12.5, color: C.ink000, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.id}</span>
                      <span style={{ display: "block", fontSize: 11.5, color: C.ink300 }}>{p.village}, {p.district}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, padding: "16px", fontSize: 13, color: C.ink300 }}>No matches for “{query}”.</p>
            )
          ) : history.length > 0 ? (
            <div style={{ padding: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px 6px" }}>
                <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: C.ink500 }}>Recent</p>
                <button onClick={() => setHistory([])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.ink300 }}>Clear</button>
              </div>
              {history.map((h) => (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "2px 4px 2px 10px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff16")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <History size={13} color={C.ink300} style={{ flex: "none" }} />
                  <button onClick={() => runSearch(h)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.ink000, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "7px 0" }}>
                    {h}
                  </button>
                  <button onClick={() => setHistory((hs) => hs.filter((x) => x !== h))} aria-label={`Remove ${h}`} style={{ flex: "none", display: "flex", height: 22, width: 22, alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: C.ink500 }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, padding: "16px", fontSize: 13, color: C.ink300 }}>Type to search parcels or pages…</p>
          )}
        </div>
      )}
    </div>
  );
}

function Topbar({ title, subtitle, onMenuClick, userType, onLogout, goto, onOpenParcel }) {
  const roleLabel = userType === "government" ? "Government Employee" : "Public User";
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", height: 78, alignItems: "center", gap: 16, borderBottom: `1px solid ${C.glassBorder}`, background: C.glass, backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)", padding: "0 28px" }}>
      <button onClick={onMenuClick} className="ls-menu-btn" style={{ display: "none", border: `1px solid ${C.line2}`, background: "#ffffff0a", borderRadius: 12, padding: 8, color: C.ink100, cursor: "pointer" }}>
        <Layers size={15} />
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: C.ink000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, fontSize: 12.5, color: C.ink500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</p>}
      </div>
      <Badge tone={userType === "government" ? "emerald" : "cyan"} className="ls-hide-mobile">{roleLabel}</Badge>
      <SearchBox userType={userType} goto={goto} onOpenParcel={onOpenParcel} />
      <NotificationBell />
      <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 999, border: `1px solid ${C.line2}`, background: "#ffffff08", padding: "4px 14px 4px 4px", cursor: "pointer" }}>
        <div style={{ display: "flex", height: 28, width: 28, alignItems: "center", justifyContent: "center", borderRadius: 999, background: `linear-gradient(135deg, ${C.cyan}, ${C.emerald})`, fontFamily: FONT_MONO, fontSize: 14.5, fontWeight: 700, color: C.ground950 }}>
          {userType === "government" ? "GE" : "PU"}
        </div>
        <div className="ls-username" style={{ lineHeight: 1.2, textAlign: "left" }}>
          <p style={{ margin: 0, fontSize: 16.5, fontWeight: 500, color: C.ink100 }}>{userType === "government" ? "A. Priyanka" : "R. Kumar"}</p>
          <p style={{ margin: 0, fontSize: 14, color: C.ink500 }}>Log out</p>
        </div>
      </button>
    </header>
  );
}

function AppShell({ title, subtitle, active, setActive, children, userType, onLogout, onOpenParcel }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Backdrop />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Sidebar active={active} setActive={setActive} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} userType={userType} />
        <div className="ls-content">
          <Topbar title={title} subtitle={subtitle} onMenuClick={() => setMobileOpen(true)} userType={userType} onLogout={onLogout} goto={setActive} onOpenParcel={onOpenParcel} />
          <main style={{ margin: "0 auto", maxWidth: 1440, padding: "32px 32px 72px" }}>{children}</main>
        </div>
      </div>
    </div>
  );
}


/* ---------------- Views ---------------- */

function OverviewView({ goto, openParcel, userType }) {
  const isGov = userType === "government";
  const topConflicts = [...PARCELS].filter((p) => p.conflicts.length).sort((a, b) => a.dna.overall - b.dna.overall).slice(0, 5);
  const stats = isGov
    ? [
        { label: "Total parcels tracked", value: NATIONAL_STATS.totalParcels.toLocaleString(), delta: "+2,140 this week", icon: MapPinned, tone: "cyan" },
        { label: "Harmonized coverage", value: `${NATIONAL_STATS.harmonizedPct}%`, delta: "+4.2pt vs last quarter", icon: TrendingUp, tone: "emerald" },
        { label: "Active conflicts", value: NATIONAL_STATS.activeConflicts.toLocaleString(), delta: "-318 resolved this month", icon: AlertTriangle, tone: "amber" },
        { label: "Connected datasets", value: NATIONAL_STATS.datasetsConnected, delta: "6 depts · 3 states", icon: Database, tone: "cyan" },
      ]
    : [
        { label: "Total parcels tracked", value: NATIONAL_STATS.totalParcels.toLocaleString(), delta: "+2,140 this week", icon: MapPinned, tone: "cyan" },
        { label: "Harmonized coverage", value: `${NATIONAL_STATS.harmonizedPct}%`, delta: "+4.2pt vs last quarter", icon: TrendingUp, tone: "emerald" },
      ];
  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "center", borderRadius: 22, border: `1px solid ${C.line1}`, background: `linear-gradient(135deg, #1c2016, #171a12, #121314)`, padding: 28 }}>
        <div style={{ maxWidth: 560 }}>
          <Badge tone="cyan">Live · updated 4 minutes ago</Badge>
          <h2 style={{ margin: 0, marginTop: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 56.5, lineHeight: 1.08, letterSpacing: "-0.025em", color: C.ink000 }}>
            {NATIONAL_STATS.harmonizedPct}% of tracked parcels are harmonized across every connected registry.
          </h2>
          <p style={{ margin: 0, marginTop: 10, fontSize: 18.5, color: C.ink500 }}>
            {isGov
              ? <>LANDSYNC continuously reconciles cadastral, municipal, survey and satellite records for {DISTRICTS.length} districts — surfacing every disagreement with a plain-language reason before it becomes a dispute.</>
              : <>LANDSYNC brings together cadastral, municipal, survey and satellite records for {DISTRICTS.length} districts so you can check your land's records in one place.</>}
          </p>
          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            {isGov ? (
              <Button onClick={() => goto("conflicts")}>Review conflict queue <ArrowRight size={15} /></Button>
            ) : (
              <Button onClick={() => goto("parcels")}>Find your parcel <ArrowRight size={15} /></Button>
            )}
            <Button variant="secondary" onClick={() => goto("map")}>Open Intelligence Map</Button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: 380 }} className="ls-hero-grid">
          {DISTRICTS.slice(0, 4).map((d) => (
            <div key={d.id} style={{ borderRadius: 18, border: `1px solid ${C.line1}`, background: "#ffffff08", padding: 14 }}>
              <p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>{d.name}</p>
              <p style={{ margin: 0, marginTop: 4, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 31.5, color: C.ink000 }}>{d.parcels.toLocaleString()}</p>
              {isGov && <p style={{ margin: 0, marginTop: 2, fontSize: 14.5, color: "#efc08ae0" }}>{d.conflicts} conflicts</p>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${toneHex[s.tone]}40`, background: `${toneHex[s.tone]}1a` }}>
                <s.icon size={16} color={toneHex[s.tone]} />
              </div>
              <ArrowUpRight size={14} color={C.ink700} />
            </div>
            <p style={{ margin: 0, marginTop: 16, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 37, color: C.ink000 }}>{s.value}</p>
            <p style={{ margin: 0, marginTop: 4, fontSize: 16.5, color: C.ink500 }}>{s.label}</p>
            <p style={{ margin: 0, marginTop: 8, fontSize: 15, color: C.ink700 }}>{s.delta}</p>
          </Card>
        ))}
      </div>

      {isGov && (
        <div style={{ marginBottom: 20, display: "grid", gap: 20, gridTemplateColumns: "2fr 1fr" }} className="ls-two-col">
          <Card>
            <CardHeader eyebrow="Trend · last 6 months" title="Harmonization progress" description="Share of tracked parcels by resolution state" />
            <div style={{ padding: "0 12px 16px" }}><HarmonizationTrendChart /></div>
          </Card>
          <Card>
            <CardHeader eyebrow="This month" title="Conflicts by type" />
            <div style={{ padding: "0 12px" }}><ConflictDonut /></div>
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {CONFLICT_BY_TYPE.map((c) => (
                <div key={c.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 16.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.ink300 }}><span style={{ height: 8, width: 8, borderRadius: 999, background: c.color }} />{c.type}</div>
                  <span style={{ fontFamily: FONT_MONO, color: C.ink000 }}>{c.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: isGov ? "2fr 1fr" : "1fr" }} className="ls-two-col">
        <Card style={{ overflow: "hidden" }}>
          <CardHeader eyebrow="Live" title="Land Intelligence Map" description="Click any parcel to open its Land DNA profile"
            action={<button onClick={() => goto("map")} style={{ background: "none", border: "none", color: "#c6d3ae", fontSize: 16.5, fontWeight: 500, cursor: "pointer" }}>Open full map →</button>} />
          <div style={{ padding: "0 20px 20px" }}><IntelligenceMap parcels={PARCELS.slice(0, 80)} height={320} /></div>
        </Card>
        {isGov && (
          <Card>
            <CardHeader eyebrow="Priority review" title="Lowest-confidence parcels"
              action={<button onClick={() => goto("conflicts")} style={{ background: "none", border: "none", color: "#c6d3ae", fontSize: 16.5, fontWeight: 500, cursor: "pointer" }}>View all →</button>} />
            <div style={{ padding: "0 8px 8px" }}>
              {topConflicts.map((p) => (
                <div key={p.id} onClick={() => openParcel(p.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 18, padding: "10px 12px", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#ffffff08"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 16, color: C.ink100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.id}</p>
                    <p style={{ margin: 0, fontSize: 16, color: C.ink500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.village}, {p.district}</p>
                  </div>
                  <span style={{ flex: "none", fontFamily: FONT_MONO, fontSize: 17, fontWeight: 600, color: "#e39184" }}>{p.dna.overall.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {isGov && (
        <Card style={{ marginTop: 20 }}>
          <CardHeader eyebrow="Data Hub" title="Recent ingestion activity" action={<button onClick={() => goto("datahub")} style={{ background: "none", border: "none", color: "#c6d3ae", fontSize: 16.5, fontWeight: 500, cursor: "pointer" }}>Open Data Hub →</button>} />
          <div style={{ padding: "0 20px 16px" }}>
            {INGEST_EVENTS.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", fontSize: 17, borderTop: i > 0 ? `1px solid ${C.line1}` : "none", flexWrap: "wrap" }}>
                <span style={{ width: 64, flex: "none", fontFamily: FONT_MONO, fontSize: 15, color: C.ink500 }}>{e.time}</span>
                <span style={{ height: 6, width: 6, flex: "none", borderRadius: 999, background: e.type === "success" ? C.emerald : e.type === "error" ? C.critical : e.type === "warning" ? C.amber : C.cyan }} />
                <span style={{ width: 170, flex: "none", color: C.ink300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.dataset}</span>
                <span style={{ color: C.ink100 }}>{e.action}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MapView({ openParcel }) {
  const [selected, setSelected] = useState(null);
  const [district, setDistrict] = useState("All");
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const filtered = PARCELS.filter((p) => district === "All" || p.district === district);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 300px", gap: 20 }} className="ls-map-grid">
      <Card style={{ padding: 16, height: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 600, color: C.ink000, marginBottom: 10 }}><Filter size={15} color="#c6d3ae" /> District</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {["All", ...DISTRICTS.map((d) => d.name)].map((d) => (
            <button key={d} onClick={() => setDistrict(d)} style={{ textAlign: "left", borderRadius: 12, padding: "7px 10px", fontSize: 17, border: "none", cursor: "pointer", background: district === d ? "#9caf881a" : "transparent", color: district === d ? "#c6d3ae" : C.ink300 }}>
              {d}
            </button>
          ))}
        </div>
        <label style={{ marginTop: 18, display: "flex", cursor: "pointer", alignItems: "center", justifyContent: "space-between", borderRadius: 14, border: `1px solid ${C.line2}`, padding: "10px 12px", fontSize: 16.5, color: C.ink300 }}>
          Conflicts only
          <input type="checkbox" checked={conflictsOnly} onChange={() => setConflictsOnly((s) => !s)} />
        </label>
      </Card>

      <div>
        <IntelligenceMap parcels={filtered} height={600} onSelect={setSelected} selectedId={selected?.id} conflictsOnly={conflictsOnly} />
        <p style={{ marginTop: 8, fontSize: 16, color: C.ink500 }}>Rendered as a stylised cadastral surface for dependency-free display — geometry corresponds to indexed survey parcels.</p>
      </div>

      <Card style={{ padding: 20, height: "fit-content" }}>
        {!selected ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 0", textAlign: "center" }}>
            <div style={{ marginBottom: 12, display: "flex", height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: 999, border: `1px solid ${C.line2}` }}><Layers size={17} color={C.ink500} /></div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 500, color: C.ink100 }}>Select a parcel</p>
            <p style={{ margin: 0, marginTop: 4, maxWidth: 200, fontSize: 16.5, color: C.ink500 }}>Click any point on the map to preview its Land DNA profile here.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 16, color: "#c6d3ae" }}>{selected.id}</p>
                <p style={{ margin: 0, marginTop: 2, fontSize: 19, fontWeight: 600, color: C.ink000 }}>{selected.village}</p>
                <p style={{ margin: 0, fontSize: 16.5, color: C.ink500 }}>{selected.district}, {selected.state}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.ink500, cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16, borderRadius: 18, border: `1px solid ${C.line1}`, background: "#ffffff08", padding: 14 }}>
              <DnaRing score={selected.dna.overall} size={78} />
              <div><Badge tone={STATUS_META[selected.status].tone}>{STATUS_META[selected.status].label}</Badge>
                <p style={{ margin: 0, marginTop: 6, fontSize: 16, color: C.ink500 }}>Survey no. {selected.surveyNo}</p></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <KeyValue label="Cadastral area" value={`${selected.cadastralArea.toLocaleString()} sq.m`} mono />
              <KeyValue label="RoR area" value={`${selected.rorArea.toLocaleString()} sq.m`} mono />
              <KeyValue label="Land use" value={selected.landUse} />
              <KeyValue label="Sources linked" value={selected.sources.length} />
            </div>
            {selected.conflicts.length > 0 && (
              <div style={{ marginTop: 14, borderRadius: 18, border: "1px solid #d98e4a33", background: "#d98e4a0f", padding: 14 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "#efc08a" }}>{selected.conflicts.length} active conflict{selected.conflicts.length > 1 ? "s" : ""}</p>
                <p style={{ margin: 0, marginTop: 4, fontSize: 16, lineHeight: 1.5, color: C.ink300 }}>{selected.conflicts[0].detail}</p>
              </div>
            )}
            <Button style={{ marginTop: 16, width: "100%" }} onClick={() => openParcel(selected.id)}>Open full profile <ArrowRight size={14} /></Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function DataHubView() {
  const [sortByQuality, setSortByQuality] = useState(false);
  const list = sortByQuality ? [...DATASETS].sort((a, b) => b.quality - a.quality) : DATASETS;
  return (
    <div>
      <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16 }}>
        <Card style={{ padding: 16 }}><p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>Connected sources</p><p style={{ margin: 0, marginTop: 4, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34, color: C.ink000 }}>{DATASETS.length}</p></Card>
        <Card style={{ padding: 16 }}><p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>Total indexed records</p><p style={{ margin: 0, marginTop: 4, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34, color: C.ink000 }}>{DATASETS.reduce((s, d) => s + d.records, 0).toLocaleString()}</p></Card>
        <Card style={{ padding: 16 }}><p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>Avg. source quality</p><p style={{ margin: 0, marginTop: 4, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34, color: "#e3cfa0" }}>{Math.round(DATASETS.reduce((s, d) => s + d.quality, 0) / DATASETS.length)}%</p></Card>
        <Card style={{ padding: 16 }}><p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>Degraded sources</p><p style={{ margin: 0, marginTop: 4, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34, color: "#efc08a" }}>{DATASETS.filter((d) => d.status === "degraded").length}</p></Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }} className="ls-two-col">
        <Card>
          <CardHeader eyebrow="Registry" title="Connected datasets" action={<button onClick={() => setSortByQuality((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.ink500, fontSize: 16, cursor: "pointer" }}><ArrowUpDown size={13} /> Sort by quality</button>} />
          <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((d) => (
              <div key={d.id} style={{ borderRadius: 18, border: `1px solid ${C.line1}`, background: "#ffffff05", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ marginTop: 2, display: "flex", height: 36, width: 36, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${C.line2}`, background: "#ffffff08" }}><Database size={15} color="#c6d3ae" /></div>
                    <div><p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.ink000 }}>{d.name}</p><p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>{d.dept} · {d.format}</p></div>
                  </div>
                  <Badge tone={d.type === "Survey" ? "amber" : d.type === "Municipal GIS" || d.type === "Property" ? "emerald" : "cyan"}>{d.type}</Badge>
                </div>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 16 }}>
                  <div><p style={{ margin: 0, color: C.ink500 }}>Records</p><p style={{ margin: 0, marginTop: 2, fontFamily: FONT_MONO, color: C.ink100 }}>{d.records.toLocaleString()}</p></div>
                  <div><p style={{ margin: 0, color: C.ink500 }}>Coverage</p><p style={{ margin: 0, marginTop: 2, color: C.ink100 }}>{d.coverage}</p></div>
                  <div><p style={{ margin: 0, color: C.ink500 }}>Last ingest</p><p style={{ margin: 0, marginTop: 2, fontFamily: FONT_MONO, color: C.ink100 }}>{d.lastIngest}</p></div>
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}><ProgressBar value={d.quality} tone={d.quality >= 85 ? "emerald" : d.quality >= 70 ? "cyan" : "amber"} /></div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.ink100 }}>{d.quality}%</span>
                  {d.status === "active" ? <CheckCircle2 size={14} color="#e3cfa0" /> : <AlertOctagon size={14} color="#efc08a" />}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHeader eyebrow="Live feed" title="Ingestion activity" />
            <div style={{ padding: "0 20px 16px" }}>
              {INGEST_EVENTS.map((e, i) => (
                <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? `1px solid ${C.line1}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 14.5, color: C.ink500 }}>{e.time}</span>
                    <span style={{ borderRadius: 999, padding: "2px 8px", fontSize: 13, textTransform: "uppercase", background: e.type === "success" ? "#c9a8761a" : e.type === "error" ? "#be5a4c1a" : e.type === "warning" ? "#d98e4a1a" : "#9caf881a", color: e.type === "success" ? "#e3cfa0" : e.type === "error" ? "#e39184" : e.type === "warning" ? "#efc08a" : "#c6d3ae" }}>{e.type}</span>
                  </div>
                  <p style={{ margin: 0, marginTop: 4, fontSize: 16.5, fontWeight: 500, color: C.ink100 }}>{e.dataset}</p>
                  <p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>{e.action}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 20, textAlign: "center" }}>
            <Plug size={20} color="#c6d3ae" style={{ margin: "0 auto 8px" }} />
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.ink000 }}>Connect a new source</p>
            <p style={{ margin: 0, marginTop: 4, fontSize: 16, color: C.ink500 }}>Add a REST API, shapefile drop, or scanned record batch to the harmonization pipeline.</p>
            <Button variant="secondary" size="sm" style={{ marginTop: 12, width: "100%" }}>Configure connector</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ConflictRadarView({ openParcel }) {
  const rows = useMemo(() => {
    const r = [];
    PARCELS.forEach((p) => p.conflicts.forEach((c) => r.push({ parcel: p, conflict: c })));
    const order = { critical: 0, high: 1, medium: 2 };
    return r.sort((a, b) => order[a.conflict.severity] - order[b.conflict.severity]);
  }, []);
  const [severity, setSeverity] = useState("all");
  const filtered = rows.filter((r) => severity === "all" || r.conflict.severity === severity);
  const counts = { critical: rows.filter((r) => r.conflict.severity === "critical").length, high: rows.filter((r) => r.conflict.severity === "high").length, medium: rows.filter((r) => r.conflict.severity === "medium").length };

  return (
    <div>
      <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="ls-severity-grid">
        {[{ key: "critical", label: "Critical", tone: "critical", desc: "Duplicate claims & major geometry conflicts" },
          { key: "high", label: "High", tone: "amber", desc: "Significant drift requiring verification" },
          { key: "medium", label: "Medium", tone: "cyan", desc: "Minor discrepancies, routine review" }].map((s) => (
          <Card key={s.key} onClick={() => setSeverity(severity === s.key ? "all" : s.key)} style={{ padding: 16, cursor: "pointer", borderColor: severity === s.key ? C.line3 : C.line1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><Badge tone={s.tone}>{s.label}</Badge><AlertTriangle size={14} color={C.ink700} /></div>
            <p style={{ margin: 0, marginTop: 12, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 37, color: C.ink000 }}>{counts[s.key].toLocaleString()}</p>
            <p style={{ margin: 0, marginTop: 4, fontSize: 16, color: C.ink500 }}>{s.desc}</p>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader eyebrow={`${filtered.length.toLocaleString()} conflicts`} title="Conflict queue" action={severity !== "all" && <button onClick={() => setSeverity("all")} style={{ background: "none", border: "none", color: "#c6d3ae", fontSize: 16, cursor: "pointer" }}>Clear filter</button>} />
        <div style={{ padding: "0 8px 8px" }}>
          {filtered.slice(0, 50).map(({ parcel, conflict }, i) => (
            <div key={`${parcel.id}-${i}`} onClick={() => openParcel(parcel.id)} style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 18, padding: "12px", cursor: "pointer", borderTop: i > 0 ? `1px solid ${C.line1}` : "none" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#ffffff08"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <DnaRing score={parcel.dna.overall} size={52} stroke={5} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Badge tone={conflict.severity === "critical" ? "critical" : conflict.severity === "high" ? "amber" : "cyan"}>{conflict.severity}</Badge><span style={{ fontSize: 17, fontWeight: 500, color: C.ink000 }}>{conflict.type}</span></div>
                <p style={{ margin: 0, marginTop: 4, fontSize: 16.5, color: C.ink500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conflict.detail}</p>
              </div>
              <div className="ls-hide-mobile" style={{ flex: "none", textAlign: "right" }}>
                <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 16, color: C.ink100 }}>{parcel.id}</p>
                <p style={{ margin: 0, fontSize: 15, color: C.ink500 }}>{parcel.village}, {parcel.district}</p>
              </div>
              <ChevronRight size={16} color={C.ink700} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ParcelListView({ openParcel }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PARCELS.filter((p) => {
      const mq = !q || p.id.toLowerCase().includes(q) || p.village.toLowerCase().includes(q) || p.surveyNo.toLowerCase().includes(q);
      const ms = status === "all" || p.status === status;
      return mq && ms;
    });
  }, [query, status]);

  return (
    <div>
      <div style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", flex: 1, minWidth: 220, alignItems: "center", gap: 10, borderRadius: 999, border: `1px solid ${C.line2}`, background: "#ffffff08", padding: "10px 16px" }}>
          <Search size={15} color={C.ink500} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by parcel ID, survey number, or village…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 18, color: C.ink100 }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["all", "harmonized", "review", "flagged", "critical"].map((s) => (
            <button key={s} onClick={() => setStatus(s)} style={{ borderRadius: 999, border: `1px solid ${status === s ? "#9caf8866" : C.line2}`, padding: "8px 14px", fontSize: 16.5, fontWeight: 500, cursor: "pointer", background: status === s ? "#9caf881a" : "transparent", color: status === s ? "#c6d3ae" : C.ink500 }}>
              {s === "all" ? "All" : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>
      <Card>
        <div style={{ padding: "0 8px" }}>
          {filtered.slice(0, 60).map((p) => (
            <div key={p.id} onClick={() => openParcel(p.id)} style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 18, padding: "12px", cursor: "pointer", borderTop: `1px solid ${C.line1}` }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#ffffff08"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <DnaRing score={p.dna.overall} size={52} stroke={5} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 16.5, color: C.ink000 }}>{p.id}</p>
                <p style={{ margin: 0, fontSize: 16, color: C.ink500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Survey {p.surveyNo} · {p.landUse}</p>
              </div>
              <div className="ls-hide-mobile" style={{ fontSize: 16.5, color: C.ink300, width: 150, flex: "none" }}>{p.village}, {p.district}</div>
              <div className="ls-hide-mobile" style={{ flex: "none" }}><Badge tone={STATUS_META[p.status].tone}>{STATUS_META[p.status].label}</Badge></div>
              <ChevronRight size={16} color={C.ink700} />
            </div>
          ))}
          {filtered.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontSize: 17, color: C.ink500 }}>No parcels match your search.</p>}
        </div>
      </Card>
    </div>
  );
}

function ParcelDetailView({ parcelId, back, goto }) {
  const parcel = PARCELS.find((p) => p.id === parcelId) || PARCELS[0];
  const nearby = PARCELS.filter((p) => p.district === parcel.district && p.id !== parcel.id).slice(0, 30);

  return (
    <div>
      <button onClick={back} style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.ink500, fontSize: 16.5, cursor: "pointer" }}><ChevronLeft size={14} /> Back to parcel search</button>
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", borderRadius: 22, border: `1px solid ${C.line1}`, background: "linear-gradient(135deg, #1c2016, #121314)", padding: 24 }}>
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 17, color: "#c6d3ae" }}>{parcel.id}</p>
            <Badge tone={STATUS_META[parcel.status].tone}>{STATUS_META[parcel.status].label}</Badge>
          </div>
          <h2 style={{ margin: 0, marginTop: 6, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 37, color: C.ink000 }}>{parcel.village}, {parcel.district}</h2>
          <p style={{ margin: 0, marginTop: 4, fontSize: 17, color: C.ink500 }}>{parcel.state} · Survey no. {parcel.surveyNo} · {parcel.ownerType}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={() => goto("copilot")}><Sparkles size={14} /> Ask Copilot</Button>
          <Button>Mark for field verification</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }} className="ls-two-col">
        <Card>
          <CardHeader eyebrow="Land DNA" title="Confidence profile" description="Why this parcel scores the way it does, dimension by dimension." />
          <div style={{ padding: "0 20px 24px" }}><DnaHelix parcel={parcel} /></div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHeader eyebrow="Record" title="Parcel details" />
            <div style={{ padding: "0 20px 12px" }}>
              <KeyValue label="Cadastral area" value={`${parcel.cadastralArea.toLocaleString()} sq.m`} mono />
              <KeyValue label="RoR area" value={`${parcel.rorArea.toLocaleString()} sq.m`} mono />
              <KeyValue label="Land use" value={parcel.landUse} />
              <KeyValue label="Owner type" value={parcel.ownerType} />
              <KeyValue label="Last synced" value={parcel.lastSynced} mono />
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow={`${parcel.sources.length} linked`} title="Source layers" action={<Layers size={15} color={C.ink500} />} />
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {parcel.sources.map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 12, border: `1px solid ${C.line1}`, background: "#ffffff05", padding: "8px 12px", fontSize: 16.5 }}>
                  <span style={{ color: C.ink100 }}>{s}</span>
                  <button onClick={() => goto("traceability")} style={{ background: "none", border: "none", color: "#c6d3ae", cursor: "pointer" }}>Trace →</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {parcel.conflicts.length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <CardHeader eyebrow={`${parcel.conflicts.length} active`} title="Conflicts on this parcel" action={<AlertTriangle size={15} color="#efc08a" />} />
          <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {parcel.conflicts.map((c, i) => (
              <div key={i} style={{ borderRadius: 18, border: `1px solid ${C.line1}`, background: "#ffffff05", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Badge tone={c.severity === "critical" ? "critical" : c.severity === "high" ? "amber" : "cyan"}>{c.severity}</Badge><p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: C.ink000 }}>{c.type}</p></div>
                <p style={{ margin: 0, marginTop: 6, fontSize: 16.5, lineHeight: 1.5, color: C.ink500 }}>{c.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginTop: 20 }}>
        <CardHeader eyebrow="Location" title="Nearby parcels" description={`Other tracked parcels in ${parcel.district}`} />
        <div style={{ padding: "0 20px 20px" }}><IntelligenceMap parcels={[...nearby, parcel]} selectedId={parcel.id} height={280} /></div>
      </Card>
    </div>
  );
}

function LandTimelineView() {
  const [parcelId, setParcelId] = useState(PARCELS[12].id);
  const parcel = PARCELS.find((p) => p.id === parcelId);
  return (
    <div>
      <Card style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16.5, color: C.ink500 }}>Viewing history for</span>
          <select value={parcelId} onChange={(e) => setParcelId(e.target.value)} style={{ borderRadius: 12, border: `1px solid ${C.line2}`, background: C.ground900, padding: "6px 10px", fontFamily: FONT_MONO, fontSize: 16.5, color: "#c6d3ae" }}>
            {PARCELS.slice(0, 30).map((p) => <option key={p.id} value={p.id}>{p.id} — {p.village}</option>)}
          </select>
          <span style={{ fontSize: 16.5, color: C.ink500 }}>{parcel.district}, {parcel.state}</span>
        </div>
      </Card>
      <Card>
        <CardHeader eyebrow={`${TIMELINE_EVENTS.length} records`} title="Record history" description="Every touchpoint that shaped this parcel's current data state." />
        <div style={{ position: "relative", padding: "8px 24px 32px" }}>
          <div style={{ position: "absolute", left: 38, top: 8, bottom: 32, width: 1, background: `linear-gradient(180deg, ${C.cyan}80, #ffffff1a, ${C.emerald}66)` }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {TIMELINE_EVENTS.map((e, i) => {
              const meta = kindMeta[e.kind]; const Icon = meta.icon;
              const borderC = meta.tone === "amber" ? "#d98e4a66" : meta.tone === "emerald" ? "#c9a87666" : "#9caf8866";
              const bgC = meta.tone === "amber" ? "#d98e4a1a" : meta.tone === "emerald" ? "#c9a8761a" : "#9caf881a";
              const fgC = meta.tone === "amber" ? "#efc08a" : meta.tone === "emerald" ? "#e3cfa0" : "#c6d3ae";
              return (
                <div key={i} style={{ position: "relative", display: "flex", gap: 20 }}>
                  <div style={{ position: "relative", zIndex: 1, display: "flex", height: 32, width: 32, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 999, border: `1px solid ${borderC}`, background: bgC }}><Icon size={14} color={fgC} /></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.ink500 }}>{e.date}</span>
                      <Badge tone={meta.tone}>{e.source}</Badge>
                    </div>
                    <p style={{ margin: 0, marginTop: 6, fontSize: 18.5, fontWeight: 500, color: C.ink000 }}>{e.title}</p>
                    <p style={{ margin: 0, marginTop: 2, fontSize: 17, lineHeight: 1.5, color: C.ink500 }}>{e.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function findParcelMention(text) {
  const m = text.match(/LS-\d{5}-[A-Z]{3}/i);
  if (m) return PARCELS.find((p) => p.id.toLowerCase() === m[0].toLowerCase());
  return null;
}
function generateReply(userText) {
  const text = userText.toLowerCase();
  const mentioned = findParcelMention(userText);
  if (mentioned) {
    const d = mentioned.dna;
    const worst = Object.entries(d).filter(([k]) => k !== "overall").sort((a, b) => a[1] - b[1])[0];
    const why = explainDimension(worst[0], d, mentioned);
    return `Parcel ${mentioned.id} (${mentioned.village}, ${mentioned.district}) has an overall confidence of ${d.overall.toFixed(0)}%. Its weakest dimension is ${worst[0].replace(/([A-Z])/g, " $1")} at ${worst[1].toFixed(1)}%. ${why || "No significant discrepancy was found on this dimension."} ${mentioned.conflicts.length ? `There ${mentioned.conflicts.length === 1 ? "is" : "are"} currently ${mentioned.conflicts.length} open conflict${mentioned.conflicts.length > 1 ? "s" : ""} on this parcel.` : "No open conflicts are recorded."}`;
  }
  if (text.includes("area drift") || text.includes("area mismatch") || text.includes("differs")) {
    const matches = PARCELS.filter((p) => p.dna.areaConsistency < 90 && (text.includes("coimbatore") ? p.district === "Coimbatore" : true)).sort((a, b) => a.dna.areaConsistency - b.dna.areaConsistency).slice(0, 5);
    return `I found ${matches.length} parcels with notable area drift${text.includes("coimbatore") ? " in Coimbatore" : ""}: ${matches.map((p) => `${p.id} (${(100 - p.dna.areaConsistency).toFixed(1)}% inconsistency)`).join(", ")}.`;
  }
  if (text.includes("duplicate")) {
    const dupes = PARCELS.filter((p) => p.conflicts.some((c) => c.type === "Duplicate claim"));
    return dupes.length ? `There ${dupes.length === 1 ? "is" : "are"} ${dupes.length} parcel${dupes.length > 1 ? "s" : ""} with duplicate ownership claims filed this cycle, including ${dupes[0].id} in ${dupes[0].village}. Routed to Conflict Radar under "critical" severity.` : "No duplicate ownership claims are currently open.";
  }
  if (text.includes("municipal gis") || text.includes("data quality")) {
    return "The Municipal GIS — CCMC layer is at 88% source quality, mainly held back by inconsistent ward_no coding and 6% missing owner-of-record fields — the largest driver of Administrative consistency drops across Coimbatore Urban parcels.";
  }
  if (text.includes("explain") && text.includes("confidence")) {
    const p = PARCELS.filter((x) => x.status === "flagged")[0];
    const worst = Object.entries(p.dna).filter(([k]) => k !== "overall").sort((a, b) => a[1] - b[1])[0];
    return `Take ${p.id} as an example — it's flagged at ${p.dna.overall.toFixed(0)}% overall. ${explainDimension(worst[0], p.dna, p)}`;
  }
  return "I can trace conflicts to source records, explain any Land DNA score, or summarize data quality across a dataset. Try asking about a specific parcel ID (e.g. " + PARCELS[5].id + "), a district, or a conflict type.";
}

function AICopilotView() {
  const [messages, setMessages] = useState([{ role: "assistant", text: "I'm the Land Copilot. I can trace conflicts to their source records, explain any confidence score, and draft harmonization actions across your connected datasets. Ask me about a parcel, a district, or a data quality issue." }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  function send(text) {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setThinking(true);
    const delay = 620 + Math.floor(Math.random() * 500);
    window.setTimeout(() => { setMessages((m) => [...m, { role: "assistant", text: generateReply(t) }]); setThinking(false); }, delay);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", minHeight: "60vh" }}>
      <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18, maxHeight: 520 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 12, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ display: "flex", height: 32, width: 32, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 999, background: m.role === "user" ? "#ffffff14" : "#9caf881a", border: m.role === "user" ? "none" : "1px solid #9caf8840", color: m.role === "user" ? C.ink100 : "#c6d3ae" }}>
                {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div style={{ maxWidth: "78%", borderRadius: 22, padding: "12px 16px", fontSize: 18, lineHeight: 1.55, background: m.role === "user" ? "#ffffff0f" : "#ffffff08", color: C.ink100, border: `1px solid ${C.line1}` }}>{m.text}</div>
            </div>
          ))}
          {thinking && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", height: 32, width: 32, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid #9caf8840", background: "#9caf881a", color: "#c6d3ae" }}><Bot size={14} /></div>
              <div style={{ display: "flex", gap: 4, alignItems: "center", borderRadius: 22, padding: "14px 16px", background: "#ffffff08", border: `1px solid ${C.line1}` }}>
                {[0, 1, 2].map((i) => <span key={i} style={{ height: 6, width: 6, borderRadius: 999, background: C.cyan, opacity: 0.6, animation: "lsPulse 1.4s infinite", animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        {messages.length <= 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderTop: `1px solid ${C.line1}`, padding: "14px 20px" }}>
            {COPILOT_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} style={{ borderRadius: 999, border: `1px solid ${C.line2}`, background: "#ffffff08", padding: "8px 14px", fontSize: 16.5, color: C.ink300, cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${C.line1}`, padding: 14 }}>
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 8, borderRadius: 999, border: `1px solid ${C.line2}`, background: "#ffffff08", padding: "10px 16px" }}>
            <Sparkles size={14} color="#c6d3ae" />
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about a parcel, district, or conflict…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 18, color: C.ink100 }} />
          </div>
          <button onClick={() => send()} style={{ display: "flex", height: 40, width: 40, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 999, background: C.cyan, border: "none", color: C.ground950, cursor: "pointer" }}><Send size={15} /></button>
        </div>
      </Card>
      <p style={{ textAlign: "center", marginTop: 12, fontSize: 15, color: C.ink500 }}>Copilot answers are generated locally from connected mock data for this prototype.</p>
    </div>
  );
}

function ReportsView() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }} className="ls-two-col">
        <Card>
          <CardHeader eyebrow="Templates" title="Generate a report" description="Pulls live from every connected dataset — no manual compilation." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 20px 20px" }} className="ls-report-grid">
            {REPORT_TEMPLATES.map((r) => (
              <div key={r.title} style={{ borderRadius: 18, border: `1px solid ${C.line1}`, background: "#ffffff05", padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${C.line2}`, background: "#ffffff08" }}><FileText size={15} color="#c6d3ae" /></div>
                  <Badge tone={r.tone}>{r.cadence}</Badge>
                </div>
                <p style={{ margin: 0, marginTop: 12, fontSize: 18, fontWeight: 600, color: C.ink000 }}>{r.title}</p>
                <p style={{ margin: 0, marginTop: 4, fontSize: 16.5, lineHeight: 1.5, color: C.ink500 }}>{r.desc}</p>
                <Button variant="secondary" size="sm" style={{ marginTop: 14, width: "100%" }}>Generate <ChevronRight size={13} /></Button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="Snapshot" title="Confidence by district" />
          <div style={{ padding: "0 16px" }}><DistrictConfidenceBars /></div>
          <div style={{ borderTop: `1px solid ${C.line1}`, padding: "14px 20px", fontSize: 16.5, color: C.ink500 }}>
            National average confidence sits at <span style={{ fontFamily: FONT_MONO, color: C.ink100 }}>{NATIONAL_STATS.avgConfidence}%</span>, up 3.1 points quarter-over-quarter.
          </div>
        </Card>
      </div>
      <Card style={{ marginTop: 20 }}>
        <CardHeader eyebrow="Archive" title="Recently generated" />
        <div style={{ padding: "0 8px 8px" }}>
          {RECENT_REPORTS.map((r, i) => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 18, padding: 14, borderTop: i > 0 ? `1px solid ${C.line1}` : "none" }}>
              <div style={{ display: "flex", height: 36, width: 36, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${C.line2}`, background: "#ffffff08" }}><FileText size={15} color={C.ink300} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: C.ink100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 16, color: C.ink500 }}><Clock size={11} /> {r.generated} · {r.size} · {r.format}</p>
              </div>
              <button style={{ display: "flex", height: 32, width: 32, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${C.line2}`, background: "transparent", color: C.ink300, cursor: "pointer" }}><Download size={14} /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DataQualityView() {
  const worstDataset = [...DATASETS].sort((a, b) => a.quality - b.quality)[0];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }} className="ls-two-col">
        <Card>
          <CardHeader eyebrow="Six dimensions" title="National quality scorecard" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", padding: "0 20px 20px" }} className="ls-report-grid">
            {DATA_QUALITY_DIMENSIONS.map((d) => (
              <div key={d.dim} style={{ padding: "12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17 }}><span style={{ fontWeight: 500, color: C.ink100 }}>{d.dim}</span><span style={{ fontFamily: FONT_MONO, color: C.ink000 }}>{d.score}%</span></div>
                <div style={{ margin: "6px 0" }}><ProgressBar value={d.score} tone={d.score >= 88 ? "emerald" : d.score >= 78 ? "cyan" : "amber"} /></div>
                <p style={{ margin: 0, fontSize: 16, color: C.ink500 }}>{dimDescriptions[d.dim]}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card><CardHeader eyebrow="Radar" title="Dimension balance" /><div style={{ padding: "0 8px 16px" }}><QualityRadarChart /></div></Card>
      </div>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="ls-two-col">
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", height: 36, width: 36, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "1px solid #c9a87640", background: "#c9a8761a" }}><ShieldCheck size={16} color="#e3cfa0" /></div>
            <div><p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.ink000 }}>Strongest source</p><p style={{ margin: 0, marginTop: 4, fontSize: 16.5, lineHeight: 1.5, color: C.ink500 }}>Satellite Cadastre Trace (ISRO/Bhuvan) leads at 96% quality — high-resolution ML boundary extraction keeps geometry and timeliness scores consistently high.</p></div>
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", height: 36, width: 36, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "1px solid #d98e4a40", background: "#d98e4a1a" }}><ShieldAlert size={16} color="#efc08a" /></div>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.ink000 }}>Needs attention</p>
              <p style={{ margin: 0, marginTop: 4, fontSize: 16.5, lineHeight: 1.5, color: C.ink500 }}>{worstDataset.name} sits at {worstDataset.quality}% quality — hand-annotated legacy maps have inconsistent scale references, dragging down accuracy and validity.</p>
              <div style={{ marginTop: 8 }}><Badge tone="amber">Degraded source</Badge></div>
            </div>
          </div>
        </Card>
      </div>
      <Card style={{ marginTop: 20 }}>
        <CardHeader eyebrow="By source" title="Quality per connected dataset" />
        <div style={{ padding: "0 20px 16px" }}>
          {DATASETS.map((d, i) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderTop: i > 0 ? `1px solid ${C.line1}` : "none" }}>
              <span style={{ width: 220, flex: "none", fontSize: 17, color: C.ink100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
              <div style={{ flex: 1 }}><ProgressBar value={d.quality} tone={d.quality >= 85 ? "emerald" : d.quality >= 70 ? "cyan" : "amber"} /></div>
              <span style={{ width: 40, flex: "none", textAlign: "right", fontFamily: FONT_MONO, fontSize: 16.5, color: C.ink100 }}>{d.quality}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SourceTraceabilityView() {
  const [parcelId, setParcelId] = useState(PARCELS[12].id);
  return (
    <div>
      <Card style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16.5, color: C.ink500 }}>Tracing lineage for</span>
          <select value={parcelId} onChange={(e) => setParcelId(e.target.value)} style={{ borderRadius: 12, border: `1px solid ${C.line2}`, background: C.ground900, padding: "6px 10px", fontFamily: FONT_MONO, fontSize: 16.5, color: "#c6d3ae" }}>
            {PARCELS.slice(0, 30).map((p) => <option key={p.id} value={p.id}>{p.id} — {p.village}</option>)}
          </select>
        </div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {SOURCE_LINEAGE.map((field) => (
          <Card key={field.field}>
            <CardHeader eyebrow={`${field.values.length} sources report this field`} title={field.field} action={<GitBranch size={15} color={C.ink500} />} />
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1, background: "#ffffff1a" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {field.values.map((v, i) => (
                    <div key={i} style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 16, paddingLeft: 20 }}>
                      <span style={{ position: "absolute", left: 0, top: 6, height: 14, width: 14, borderRadius: 999, border: `2px solid ${C.ground900}`, background: C.cyan, boxShadow: "0 0 8px #9caf8880" }} />
                      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, borderRadius: 18, border: `1px solid ${C.line1}`, background: "#ffffff05", padding: "12px 16px" }}>
                        <div><p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: C.ink100 }}>{v.source}</p><p style={{ margin: 0, marginTop: 2, fontFamily: FONT_MONO, fontSize: 17, color: C.ink000 }}>{v.value}</p></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.ink500 }}>as of {v.asOf}</span>
                          <Badge tone={v.confidence >= 90 ? "emerald" : v.confidence >= 75 ? "cyan" : v.confidence === 0 ? "critical" : "amber"}>{v.confidence > 0 ? `${v.confidence}% conf.` : "not captured"}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Login ---------------- */

/* ---------------- Mock OAuth account picker (Google / Apple style) ---------------- */

const AVATAR_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#9c27b0", "#00897b"];

function initialOf(name, email) {
  const src = (name || email || "?").trim();
  return src.charAt(0).toUpperCase();
}

function useStoredAccounts(provider) {
  const [accounts, setAccounts] = useState([]);
  const [ready, setReady] = useState(false);
  const storageKey = `oauth_accounts_${provider}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(storageKey, false);
        if (!cancelled && res && res.value) setAccounts(JSON.parse(res.value));
      } catch (e) {
        // nothing saved yet on this device — that's fine
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  async function addAccount(account) {
    const next = [...accounts, account];
    setAccounts(next);
    try { await window.storage.set(storageKey, JSON.stringify(next), false); } catch (e) { /* best-effort */ }
  }

  return { accounts, ready, addAccount };
}

function OAuthAccountPicker({ provider, onClose, onChoose }) {
  const isGoogle = provider === "google";
  const { accounts, ready, addAccount } = useStoredAccounts(provider);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  async function handleAdd() {
    if (!newEmail.trim()) return;
    const account = {
      name: newName.trim() || newEmail.split("@")[0],
      email: newEmail.trim(),
      color: AVATAR_COLORS[accounts.length % AVATAR_COLORS.length],
      initial: initialOf(newName, newEmail),
    };
    await addAccount(account);
    onChoose(account);
  }

  const addFormFieldStyleLight = {
    width: "100%", border: "1px solid #dadce0", borderRadius: 10, padding: "10px 12px",
    fontSize: 14, color: "#202124", outline: "none", marginTop: 8,
  };
  const addFormFieldStyleDark = {
    width: "100%", border: "1px solid #ffffff2a", borderRadius: 10, padding: "10px 12px",
    fontSize: 14, color: "#fff", background: "#2c2c2e", outline: "none", marginTop: 8,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", padding: 20,
      }}
    >
      {isGoogle ? (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 420, maxWidth: "100%", background: "#fff", borderRadius: 28,
            boxShadow: "0 24px 70px -20px #000000b0", overflow: "hidden", fontFamily: "'Roboto', 'Inter', ui-sans-serif, sans-serif",
          }}
        >
          <div style={{ padding: "32px 40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <GoogleLogo size={26} />
            <h2 style={{ margin: 0, marginTop: 18, fontSize: 22, fontWeight: 400, color: "#202124" }}>
              {adding ? "Add a Google account" : "Choose an account"}
            </h2>
            <p style={{ margin: 0, marginTop: 8, fontSize: 14, color: "#5f6368" }}>to continue to LANDSYNC</p>
          </div>

          {adding ? (
            <div style={{ padding: "4px 40px 8px" }}>
              <label style={{ fontSize: 12, color: "#5f6368" }}>Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Your name" style={addFormFieldStyleLight} />
              <label style={{ fontSize: 12, color: "#5f6368", display: "block", marginTop: 14 }}>Email</label>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@gmail.com" style={addFormFieldStyleLight} />
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                <button onClick={() => setAdding(false)} style={{ border: "none", background: "transparent", color: "#1a73e8", fontSize: 14, fontWeight: 600, padding: "9px 12px", borderRadius: 8, cursor: "pointer" }}>Back</button>
                <button onClick={handleAdd} style={{ border: "none", background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 20px", borderRadius: 8, cursor: "pointer" }}>Continue</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "8px 0 8px" }}>
              {ready && accounts.length === 0 && (
                <p style={{ margin: "0 40px 12px", fontSize: 13, color: "#5f6368", textAlign: "center" }}>
                  No Google accounts saved on this device yet.
                </p>
              )}
              {accounts.map((a) => (
                <button
                  key={a.email}
                  onClick={() => onChoose(a)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 16, border: "none", background: "transparent",
                    padding: "12px 40px", cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ display: "flex", flex: "none", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 999, background: a.color, color: "#fff", fontSize: 16, fontWeight: 600 }}>
                    {a.initial}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#5f6368", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</p>
                  </span>
                </button>
              ))}
              <button
                onClick={() => setAdding(true)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, border: "none", background: "transparent", padding: "12px 40px", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ display: "flex", flex: "none", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid #dadce0" }}>
                  <User size={18} color="#5f6368" />
                </span>
                <span style={{ fontSize: 14, color: "#202124" }}>Use another account</span>
              </button>
            </div>
          )}

          <div style={{ padding: "16px 40px 28px", borderTop: "1px solid #f1f3f4" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#5f6368", lineHeight: 1.5 }}>
              To continue, Google will share your name, email address and profile picture with LANDSYNC.
            </p>
          </div>
        </div>
      ) : (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 400, maxWidth: "100%", background: "#1c1c1e", borderRadius: 28, border: "1px solid #ffffff1a",
            boxShadow: "0 24px 70px -20px #000000c0", overflow: "hidden", fontFamily: FONT_SANS, textAlign: "center",
          }}
        >
          <div style={{ padding: "36px 32px 22px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <AppleLogo size={30} color="#fff" />
            <h2 style={{ margin: 0, marginTop: 18, fontSize: 19, fontWeight: 600, color: "#fff" }}>
              {adding ? "Add Apple ID" : "Sign in with Apple ID"}
            </h2>
            <p style={{ margin: 0, marginTop: 6, fontSize: 13, color: "#98989d" }}>to continue to LANDSYNC</p>
          </div>

          {adding ? (
            <div style={{ padding: "4px 24px 8px", textAlign: "left" }}>
              <label style={{ fontSize: 12, color: "#98989d" }}>Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Your name" style={addFormFieldStyleDark} />
              <label style={{ fontSize: 12, color: "#98989d", display: "block", marginTop: 14 }}>Apple ID (email)</label>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@icloud.com" style={addFormFieldStyleDark} />
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                <button onClick={() => setAdding(false)} style={{ border: "none", background: "transparent", color: "#98989d", fontSize: 14, fontWeight: 600, padding: "9px 12px", borderRadius: 8, cursor: "pointer" }}>Back</button>
                <button onClick={handleAdd} style={{ border: "none", background: "#0a84ff", color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 20px", borderRadius: 8, cursor: "pointer" }}>Continue</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "4px 16px 8px" }}>
              {ready && accounts.length === 0 && (
                <p style={{ margin: "0 12px 12px", fontSize: 13, color: "#98989d" }}>
                  No Apple IDs saved on this device yet.
                </p>
              )}
              {accounts.map((a, i) => (
                <button
                  key={a.email}
                  onClick={() => onChoose(a)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14, border: "none",
                    borderTop: i > 0 ? "1px solid #ffffff14" : "none", background: "transparent",
                    padding: "14px 12px", cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0d")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ display: "flex", flex: "none", height: 38, width: 38, alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#3a3a3c", color: "#fff", fontSize: 15, fontWeight: 600 }}>
                    {a.initial}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: "#98989d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</p>
                  </span>
                </button>
              ))}
              <button
                onClick={() => setAdding(true)}
                style={{ width: "100%", border: "none", borderTop: accounts.length ? "1px solid #ffffff14" : "none", background: "transparent", padding: "14px 12px", cursor: "pointer", fontSize: 14.5, color: "#0a84ff", textAlign: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff0d")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Use a different Apple ID
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            style={{ width: "100%", border: "none", borderTop: "1px solid #ffffff1a", background: "transparent", padding: "16px 12px", cursor: "pointer", fontSize: 14.5, fontWeight: 600, color: "#98989d" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- password field: show/hide + strength ---------------- */

function evaluatePassword(pw) {
  const hasLength = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const passed = [hasLength, hasUpper && hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const missing = [];
  if (!hasLength) missing.push("At least 8 characters");
  if (!(hasUpper && hasLower)) missing.push("Upper & lowercase letters");
  if (!hasNumber) missing.push("A number");
  if (!hasSpecial) missing.push("A special character");
  return { passed, missing };
}

function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const { passed, missing } = evaluatePassword(password);
  const meta =
    passed <= 1 ? { label: "Weak", color: C.critical } :
    passed <= 2 ? { label: "Fair", color: C.amber } :
    passed === 3 ? { label: "Fair", color: C.amber } :
    { label: "Strong", color: C.emerald };

  return (
    <div style={{ marginTop: 9 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < passed ? meta.color : C.line2,
              transition: "background .2s",
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600, color: meta.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {meta.label}
        </span>
      </div>
      {missing.length > 0 && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: C.ink500, lineHeight: 1.4 }}>
          Add: {missing.join(" · ")}
        </p>
      )}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, fieldStyle, labelStyle, showStrength = false, marginTop = 18 }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginTop }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ ...fieldStyle, paddingRight: 28 }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{
            position: "absolute", right: 0, top: 6, background: "transparent", border: "none",
            cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: C.ink500,
          }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showStrength && <PasswordStrengthMeter password={value} />}
    </div>
  );
}

function LoginView({ onLogin }) {
  const [userType, setUserType] = useState("government");
  const [mode, setMode] = useState("login"); // login | signup — normal-people flow only
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [name, setName] = useState("");
  const [password2, setPassword2] = useState("");
  const [oauthPicker, setOauthPicker] = useState(null); // null | "google" | "apple"

  const fieldStyle = {
    width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${C.glassBorder}`,
    padding: "10px 0", marginTop: 6, fontSize: 15, color: C.ink000, outline: "none",
  };
  const labelStyle = { display: "block", fontFamily: FONT_MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.1em", color: C.ink500 };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {oauthPicker && (
        <OAuthAccountPicker
          provider={oauthPicker}
          onClose={() => setOauthPicker(null)}
          onChoose={() => { setOauthPicker(null); onLogin("normal"); }}
        />
      )}
      <Backdrop />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: userType === "government" ? 520 : 960, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* access type toggle, sits above the card */}
        <div style={{ display: "flex", gap: 8, borderRadius: 999, border: `1px solid ${C.glassBorder}`, background: C.glass, backdropFilter: "blur(30px)", padding: 4, marginBottom: 16, width: "100%", maxWidth: 420 }}>
          {[["government", "Government Employee"], ["normal", "Public User"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setUserType(key)}
              style={{
                flex: 1, border: "none", cursor: "pointer", borderRadius: 999, padding: "10px 10px", fontSize: 12.5, fontWeight: 600,
                background: userType === key ? C.cyan : "transparent", color: userType === key ? C.ground950 : C.ink300, transition: "all .15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {userType === "government" ? (
          /* ---------------- Government Employee: single static form ---------------- */
          <div
            style={{
              width: "100%",
              background: C.glassStrong, backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: `1px solid ${C.glassBorder}`, borderRadius: 32, padding: "48px 44px", boxShadow: "0 40px 100px -30px #000000a0",
            }}
          >
            <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.16em", color: C.ink500 }}>Landsync · Restricted Access</p>
            <h1 style={{ margin: 0, marginTop: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, letterSpacing: "-0.02em", color: C.ink000 }}>Login</h1>
            <p style={{ margin: 0, marginTop: 8, fontSize: 13, color: C.ink500 }}>Department-issued credentials only. Access is logged and audited.</p>

            <div style={{ marginTop: 28 }}>
              <label style={labelStyle}>Official Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@landrevenue.gov.in" style={fieldStyle} />
            </div>
            <PasswordField
              label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••" fieldStyle={fieldStyle} labelStyle={labelStyle}
            />

            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.ink300, cursor: "pointer" }}>
                <input type="checkbox" checked={remember} onChange={() => setRemember((r) => !r)} /> Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12.5, color: C.ink300, textDecoration: "underline" }}>Forgot your password?</a>
            </div>

            <button
              onClick={() => onLogin("government")}
              style={{
                marginTop: 26, width: "100%", border: "none", cursor: "pointer", borderRadius: 999, padding: "15px 0",
                background: `linear-gradient(90deg, ${C.cyan}, ${C.emerald})`, color: C.ground950, fontSize: 13, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: "0 16px 40px -14px #9caf8880",
              }}
            >
              Login
            </button>
          </div>
        ) : (
          /* ---------------- Public User: sliding login / signup ---------------- */
          <div
            style={{
              position: "relative", overflow: "hidden", height: 620, width: "100%",
              borderRadius: 32, border: `1px solid ${C.glassBorder}`, boxShadow: "0 40px 100px -30px #000000a0",
            }}
            className="ls-login-slider"
          >
            {/* form panel */}
            <div
              style={{
                position: "absolute", top: 0, bottom: 0, width: "50%",
                left: mode === "login" ? "0%" : "50%",
                transition: "left 620ms cubic-bezier(0.65,0,0.35,1)",
                background: C.glassStrong, backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
                padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden",
              }}
              className="ls-login-form-panel"
            >
              {mode === "login" ? (
                <>
                  <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.16em", color: C.ink500 }}>Landsync · Public Access</p>
                  <h1 style={{ margin: 0, marginTop: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, letterSpacing: "-0.02em", color: C.ink000 }}>Login</h1>
                  <p style={{ margin: 0, marginTop: 8, fontSize: 13, color: C.ink500 }}>
                    New here?{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); }} style={{ color: "#c6d3ae", textDecoration: "underline" }}>Create an account</a>
                  </p>

                  <div style={{ marginTop: 24 }}>
                    <label style={labelStyle}>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={fieldStyle} />
                  </div>
                  <PasswordField
                    label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••" fieldStyle={fieldStyle} labelStyle={labelStyle}
                  />
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.ink300, cursor: "pointer" }}>
                      <input type="checkbox" checked={remember} onChange={() => setRemember((r) => !r)} /> Remember me
                    </label>
                    <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12.5, color: C.ink300, textDecoration: "underline" }}>Forgot your password?</a>
                  </div>
                  <button
                    onClick={() => onLogin("normal")}
                    style={{
                      marginTop: 26, width: "100%", border: "none", cursor: "pointer", borderRadius: 999, padding: "15px 0",
                      background: `linear-gradient(90deg, ${C.cyan}, ${C.emerald})`, color: C.ground950, fontSize: 13, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: "0 16px 40px -14px #9caf8880",
                    }}
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.16em", color: C.ink500 }}>Landsync · Public Access</p>
                  <h1 style={{ margin: 0, marginTop: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, letterSpacing: "-0.02em", color: C.ink000 }}>Sign up</h1>
                  <p style={{ margin: 0, marginTop: 8, fontSize: 13, color: C.ink500 }}>
                    Already a member?{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }} style={{ color: "#c6d3ae", textDecoration: "underline" }}>Sign in here</a>
                  </p>

                  <div style={{ marginTop: 24 }}>
                    <label style={labelStyle}>Your name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={fieldStyle} />
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <label style={labelStyle}>Your email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={fieldStyle} />
                  </div>
                  <PasswordField
                    label="Create password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••" fieldStyle={fieldStyle} labelStyle={labelStyle} showStrength
                  />
                  <PasswordField
                    label="Repeat password" value={password2} onChange={(e) => setPassword2(e.target.value)}
                    placeholder="••••••••••" fieldStyle={fieldStyle} labelStyle={labelStyle}
                  />
                  <button
                    onClick={() => onLogin("normal")}
                    style={{
                      marginTop: 24, width: "100%", border: "none", cursor: "pointer", borderRadius: 999, padding: "15px 0",
                      background: `linear-gradient(90deg, ${C.cyan}, ${C.emerald})`, color: C.ground950, fontSize: 13, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: "0 16px 40px -14px #9caf8880",
                    }}
                  >
                    Sign up
                  </button>
                </>
              )}

              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: C.glassBorder }} />
                <span style={{ fontSize: 11, color: C.ink700, textTransform: "uppercase", letterSpacing: "0.08em" }}>or</span>
                <div style={{ flex: 1, height: 1, background: C.glassBorder }} />
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onClick={() => setOauthPicker("google")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    width: "100%", border: `1px solid ${C.glassBorder}`, background: "#ffffff0d",
                    color: C.ink100, borderRadius: 22, padding: "16px 18px", fontSize: 14.5, fontWeight: 600,
                    cursor: "pointer", transition: "background .15s, transform .1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff18")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff0d")}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <span style={{ display: "flex", height: 26, width: 26, alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#fff" }}>
                    <GoogleLogo size={16} />
                  </span>
                  Continue with Google
                </button>
                <button
                  onClick={() => setOauthPicker("apple")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    width: "100%", border: `1px solid ${C.glassBorder}`, background: "#ffffff0d",
                    color: C.ink100, borderRadius: 22, padding: "16px 18px", fontSize: 14.5, fontWeight: 600,
                    cursor: "pointer", transition: "background .15s, transform .1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff18")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff0d")}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <span style={{ display: "flex", height: 26, width: 26, alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#000" }}>
                    <AppleLogo size={14} />
                  </span>
                  Continue with Apple
                </button>
              </div>
            </div>

            {/* visual panel */}
            <div
              style={{
                position: "absolute", top: 0, bottom: 0, width: "50%", overflow: "hidden",
                left: mode === "login" ? "50%" : "0%",
                transition: "left 620ms cubic-bezier(0.65,0,0.35,1)",
              }}
              className="ls-login-visual-panel"
            >
              <Backdrop fixed={false} />
              <div style={{ position: "absolute", top: 20, [mode === "login" ? "right" : "left"]: 20, zIndex: 2, display: "flex", alignItems: "center", gap: 8, borderRadius: 999, background: "#9caf88e6", padding: "8px 8px 8px 16px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ground950 }}>{mode === "login" ? "Sign In" : "Sign Up"}</span>
                <span style={{ display: "flex", height: 26, width: 26, alignItems: "center", justifyContent: "center", borderRadius: 999, background: C.ground950 }}>
                  <Satellite size={13} color="#c6d3ae" />
                </span>
              </div>
              <div style={{ position: "absolute", left: 24, bottom: 24, zIndex: 2, maxWidth: 260 }}>
                <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: C.ink000, lineHeight: 1.1 }}>
                  {mode === "login" ? <>One record.<br />Every source.<br />No disputes.</> : <>Track your land.<br />See every record.<br />Anytime.</>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Root ---------------- */

const TITLES = {
  overview: ["Overview", "National land data harmonization status"],
  map: ["Land Intelligence Map", "Unified cadastral view across every connected source"],
  datahub: ["Data Hub", "Connected registries, GIS layers and record sources"],
  conflicts: ["Conflict Radar", "Every disagreement between sources, ranked by severity"],
  parcels: ["Parcel Intelligence", "Search any parcel and inspect its full Land DNA profile"],
  timeline: ["Land Timeline", "Chronological record history for a parcel, across every source"],
  copilot: ["AI Land Copilot", "Ask questions across every connected dataset in plain language"],
  reports: ["Reports", "Generate and export harmonization reporting for stakeholders"],
  quality: ["Data Quality", "How trustworthy is each dimension of the harmonized dataset"],
  traceability: ["Source Traceability", "Field-level lineage — see exactly which record produced each value"],
};

export default function LandsyncPrototype() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState("government");
  const [active, setActive] = useState("overview");
  const [selectedParcelId, setSelectedParcelId] = useState(null);

  const allowedIds = useMemo(
    () => new Set((userType === "government" ? NAV_GOVERNMENT : NAV_PUBLIC).map((n) => n.id).concat(["parcel-detail"])),
    [userType]
  );

  // If a public user's session somehow points at a government-only view
  // (e.g. they were logged in as government and switched accounts), bounce
  // back to Overview instead of rendering restricted content.
  useEffect(() => {
    if (!allowedIds.has(active)) setActive("overview");
  }, [userType]); // eslint-disable-line react-hooks/exhaustive-deps

  function goto(id) {
    if (!allowedIds.has(id)) return;
    setActive(id);
  }
  function openParcel(id) { setSelectedParcelId(id); setActive("parcel-detail"); }

  const [title, subtitle] = active === "parcel-detail" ? ["Parcel Intelligence", `Land DNA profile — ${selectedParcelId}`] : TITLES[active];

  const globalStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff1a; border-radius: 8px; }
        @keyframes lsPulse { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes lsFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lsSlideDown { from { opacity: 0; transform: translateY(-14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes lsPopIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ls-content { padding-left: 264px; }
        .ls-sidebar { transition: transform .25s ease; }
        .ls-mobile-only { display: none; }
        .ls-search { transition: width .2s ease; }
        @media (max-width: 920px) {
          .ls-content { padding-left: 0; }
          .ls-sidebar { transform: translateX(-100%); }
          .ls-sidebar-open { transform: translateX(0); }
          .ls-mobile-only { display: block; }
          .ls-menu-btn { display: inline-flex !important; }
          .ls-search { width: 150px !important; }
          .ls-username { display: none; }
          .ls-two-col { grid-template-columns: 1fr !important; }
          .ls-map-grid { grid-template-columns: 1fr !important; }
          .ls-severity-grid { grid-template-columns: 1fr !important; }
          .ls-report-grid { grid-template-columns: 1fr !important; }
          .ls-hero-grid { width: 100% !important; }
          .ls-hide-mobile { display: none !important; }
          .ls-login-slider { max-width: 420px !important; height: auto !important; }
          .ls-login-form-panel { position: relative !important; left: 0 !important; width: 100% !important; padding: 36px 26px !important; }
          .ls-login-visual-panel { display: none !important; }
        }
  `;

  if (!loggedIn) {
    return (
      <div style={{ fontFamily: FONT_SANS, WebkitFontSmoothing: "antialiased" }}>
        <style>{globalStyles}</style>
        <LoginView onLogin={(type) => { setUserType(type); setLoggedIn(true); }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_SANS, WebkitFontSmoothing: "antialiased" }}>
      <style>{globalStyles}</style>
      <AppShell title={title} subtitle={subtitle} active={active === "parcel-detail" ? "parcels" : active} setActive={goto} userType={userType} onLogout={() => setLoggedIn(false)} onOpenParcel={openParcel}>
        {active === "overview" && <OverviewView goto={goto} openParcel={openParcel} userType={userType} />}
        {active === "map" && <MapView openParcel={openParcel} />}
        {active === "datahub" && allowedIds.has("datahub") && <DataHubView />}
        {active === "conflicts" && allowedIds.has("conflicts") && <ConflictRadarView openParcel={openParcel} />}
        {active === "parcels" && <ParcelListView openParcel={openParcel} />}
        {active === "parcel-detail" && <ParcelDetailView parcelId={selectedParcelId} back={() => setActive("parcels")} goto={goto} />}
        {active === "timeline" && <LandTimelineView />}
        {active === "copilot" && <AICopilotView />}
        {active === "reports" && allowedIds.has("reports") && <ReportsView />}
        {active === "quality" && allowedIds.has("quality") && <DataQualityView />}
        {active === "traceability" && allowedIds.has("traceability") && <SourceTraceabilityView />}
      </AppShell>
    </div>
  );
}
