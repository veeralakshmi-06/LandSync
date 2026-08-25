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

const NATIONAL_STATS = { totalParcels: 202852, harmonizedPct: 83.4, activeConflicts: 3031, datasetsConnected: 7, avgConfidence: 87.2 };

const NOTIFICATIONS = [
  { id: "n1", tone: "critical", title: "Duplicate claim filed", detail: "Overlapping ownership claim on survey no. 214/1A, Sulur.", time: "12 min ago", unread: true },
  { id: "n2", tone: "amber", title: "Schema drift detected", detail: "Municipal GIS — CCMC: ward_no field format changed since last sync.", time: "48 min ago", unread: true },
  { id: "n3", tone: "cyan", title: "Full re-index completed", detail: "DILRMP Cadastral Master — 41,822 parcels re-indexed successfully.", time: "2 hr ago", unread: true },
  { id: "n4", tone: "emerald", title: "Conflict resolved", detail: "Area mismatch on LS-04821-COI cleared after RoR correction.", time: "5 hr ago", unread: false },
  { id: "n5", tone: "neutral", title: "Scheduled maintenance", detail: "Satellite Cadastre sync will pause 11:30 PM–1:00 AM IST tonight.", time: "Yesterday", unread: false },
];

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

function Backdrop({ fixed = true }) {
  return (
    <div style={{ position: fixed ? "fixed" : "absolute", inset: 0, zIndex: 0, overflow: "hidden", background: "#0a1a17" }}>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <filter id="lsBlurBig" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="130" /></filter>
          <filter id="lsBlurSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70" /></filter>
          <radialGradient id="lsVignette" cx="46%" cy="40%" r="78%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <rect width="1600" height="1000" fill="#0a1a17" />
        <g filter="url(#lsBlurBig)">
          <ellipse cx="480" cy="140" rx="620" ry="420" fill="#3c5a58" opacity="0.85" />
          <ellipse cx="1180" cy="160" rx="460" ry="340" fill="#a9b06a" opacity="0.4" />
          <ellipse cx="330" cy="430" rx="430" ry="230" fill="#f2ece0" opacity="0.5" />
          <ellipse cx="900" cy="620" rx="620" ry="440" fill="#0f4a3a" opacity="0.92" />
          <ellipse cx="1300" cy="820" rx="480" ry="360" fill="#0a2e24" opacity="0.95" />
          <ellipse cx="120" cy="880" rx="420" ry="320" fill="#081513" opacity="0.95" />
        </g>
        <rect width="1600" height="1000" fill="url(#lsVignette)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(8,16,14,0.32), rgba(8,16,14,0.32))" }} />
    </div>
  );
}

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
    <div onClick={onClick} className={className} style={{
      background: `linear-gradient(180deg, rgba(250,247,239,0.10), rgba(250,247,239,0.02)), ${C.glass}`,
      backdropFilter: "blur(40px) saturate(180%)",
      WebkitBackdropFilter: "blur(40px) saturate(180%)",
      border: `1px solid ${C.glassBorder}`,
      borderRadius: 32,
      boxShadow: "0 30px 70px -26px #00000070, 0 1px 0 0 rgba(250,247,239,0.12) inset",
      ...style,
    }}>
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

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userType, setUserType] = useState("government");

  return (
    <div style={{ position: "relative", minHeight: "100vh", color: C.ink100, background: C.ground950 }}>
      <Backdrop />
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1440, margin: "0 auto", padding: "28px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#9caf881a", border: "1px solid #9caf884d" }}>
              <Satellite size={20} color="#c6d3ae" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: C.ink000 }}>LANDSYNC AI</h1>
              <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 10, color: C.ink500, letterSpacing: "0.1em" }}>National Cadastral Harmonization Engine</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Badge tone="emerald">PostGIS Master View Live</Badge>
            <Button size="sm" variant="secondary" onClick={() => setUserType(u => u === "government" ? "public" : "government")}>
              Role: {userType === "government" ? "Government Access" : "Public User"}
            </Button>
          </div>
        </header>

        <main style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <Card style={{ padding: 24 }}>
            <CardHeader eyebrow="Harmonization Metrics" title="83.4% Live Synchronized" description="Autonomous cross-department land parcel validation in PostGIS" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 18 }}>
              <div style={{ background: "#ffffff08", padding: 14, borderRadius: 16, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: C.ink500 }}>Parcels</p>
                <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700 }}>200</p>
              </div>
              <div style={{ background: "#ffffff08", padding: 14, borderRadius: 16, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: C.ink500 }}>Conflicts</p>
                <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: C.amber }}>31</p>
              </div>
              <div style={{ background: "#ffffff08", padding: 14, borderRadius: 16, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: C.ink500 }}>Mortgages</p>
                <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: C.critical }}>60</p>
              </div>
              <div style={{ background: "#ffffff08", padding: 14, borderRadius: 16, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: C.ink500 }}>Confidence</p>
                <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: C.emerald }}>95.2%</p>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 24 }}>
            <CardHeader eyebrow="Explainable AI" title="Land DNA Score" description="Weighted IoU, centroid, & area consistency" />
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
              <DnaRing score={95.2} size={84} stroke={6} />
              <div>
                <Badge tone="emerald">MATCHED & VERIFIED</Badge>
                <p style={{ margin: 0, marginTop: 8, fontSize: 13, color: C.ink500 }}>Boundary Overlap: 96.4%<br/>Centroid Deviation: 1.8m</p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}