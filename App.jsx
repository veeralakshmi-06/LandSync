import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard, Map, Database, Radar, ScanSearch, History, Sparkles,
  FileText, ShieldCheck, GitBranch, Satellite, Search, Bell,
  ArrowUpRight, TrendingUp, AlertTriangle, MapPinned, ArrowRight,
  Layers, X, Filter, ArrowUpDown, Compass, FileStack, ScanLine, Flag, Cpu
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart as RRadarChart, PolarGrid,
  PolarAngleAxis, Radar as RRadar,
} from "recharts";

const C = {
  ground950: "#121314", ground900: "#17181a", ground850: "#1c1e19",
  surface1: "#1a1d16", surface2: "#23281d",
  line1: "#ffffff14", line2: "#ffffff1f", line3: "#ffffff2e",
  cyan: "#9caf88", emerald: "#c9a876", amber: "#d98e4a", critical: "#be5a4c",
  ink000: "#faf7ef", ink100: "#e8e3d6", ink300: "#a6ac98", ink500: "#767c6c", ink700: "#4a4f42",
  glass: "rgba(18,32,28,0.45)", glassStrong: "rgba(14,26,23,0.75)", glassBorder: "rgba(250,247,239,0.20)",
};

const FONT_DISPLAY = "'Space Grotesk', 'Inter', ui-sans-serif, sans-serif";
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
    lastSynced: `2026-08-${(Math.floor(rng() * 24) + 1).toString().padStart(2, "0")}`,
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
  { id: "ds-01", name: "DILRMP Cadastral Master", type: "Cadastral", dept: "Dept. of Land Resources", format: "Shapefile + RDBMS", records: 41822, quality: 94 },
  { id: "ds-02", name: "Municipal GIS — CCMC", type: "Municipal GIS", dept: "Coimbatore City Municipal Corp.", format: "GeoJSON", records: 18630, quality: 88 },
  { id: "ds-03", name: "Survey Settlement Records 1978–2004", type: "Survey", dept: "Survey & Settlement Dept.", format: "Scanned + OCR Index", records: 66920, quality: 71 },
  { id: "ds-04", name: "RoR / Bhulekh Extract", type: "Land Record", dept: "Revenue Dept.", format: "API (REST)", records: 58210, quality: 90 },
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

const NATIONAL_STATS = { totalParcels: 202852, harmonizedPct: 83.4, activeConflicts: 3031, datasetsConnected: 7, avgConfidence: 87.2 };

function toneForScore(score) {
  if (score >= 90) return "emerald";
  if (score >= 75) return "cyan";
  if (score >= 60) return "amber";
  return "critical";
}
const toneHex = { emerald: C.emerald, cyan: C.cyan, amber: C.amber, critical: C.critical, neutral: C.ink500 };

function Badge({ children, tone = "neutral" }) {
  const bg = { neutral: "#ffffff0f", cyan: "#9caf881a", emerald: "#c9a8761a", amber: "#d98e4a1a", critical: "#be5a4c1a" }[tone];
  const fg = { neutral: C.ink300, cyan: "#c6d3ae", emerald: "#e3cfa0", amber: "#efc08a", critical: "#e39184" }[tone];
  const bd = { neutral: C.line2, cyan: "#9caf8840", emerald: "#c9a87640", amber: "#d98e4a40", critical: "#be5a4c40" }[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, border: `1px solid ${bd}`, background: bg, color: fg, padding: "4px 10px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {children}
    </span>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.glass,
      backdropFilter: "blur(40px) saturate(180%)",
      WebkitBackdropFilter: "blur(40px) saturate(180%)",
      border: `1px solid ${C.glassBorder}`,
      borderRadius: 24,
      boxShadow: "0 20px 50px -20px #00000090",
      ...style,
    }}>
      {children}
    </div>
  );
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
          strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 900ms ease-out" }} />
      </svg>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: size < 50 ? 13 : 16, fontWeight: 600, color: C.ink000 }}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedParcel, setSelectedParcel] = useState(PARCELS[0]);
  const [userType, setUserType] = useState("government");

  const NAV = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "map", label: "Intelligence Map", icon: Map },
    { id: "datahub", label: "Data Hub", icon: Database },
    { id: "conflicts", label: "Conflict Radar", icon: Radar },
    { id: "parcels", label: "Parcel Intelligence", icon: ScanSearch },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a1a17", color: C.ink100, display: "flex", fontFamily: "Inter, sans-serif" }}>
      
      {/* Left Navigation Sidebar */}
      <aside style={{ width: 260, borderRight: `1px solid ${C.glassBorder}`, background: C.glassStrong, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingLeft: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "#9caf881a", border: "1px solid #9caf884d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Satellite size={20} color="#c6d3ae" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, letterSpacing: "0.04em", color: C.ink000 }}>LANDSYNC</h1>
            <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 9, color: C.ink500, letterSpacing: "0.1em" }}>NATIONAL REGISTRY</p>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, border: "none",
                background: isActive ? "#9caf881a" : "transparent", color: isActive ? "#c6d3ae" : C.ink300, cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500
              }}>
                <Icon size={18} color={isActive ? "#c6d3ae" : C.ink500} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 14, borderRadius: 16, background: "#ffffff08", border: `1px solid ${C.line1}` }}>
          <p style={{ margin: 0, fontSize: 10, fontFamily: FONT_MONO, color: C.ink500, textTransform: "uppercase" }}>Master Confidence</p>
          <p style={{ margin: "4px 0 0", fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: C.ink000 }}>95.2%</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.emerald }}>4 Departments Live</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Topbar */}
        <header style={{ height: 70, borderBottom: `1px solid ${C.glassBorder}`, background: C.glass, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.ink000 }}>
              {activeTab === "overview" ? "National Overview & Harmonization" : activeTab === "map" ? "Cadastral Intelligence Map" : "Land Data Intelligence"}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Badge tone="emerald">PostGIS Master View Live</Badge>
            <button onClick={() => setUserType(u => u === "government" ? "public" : "government")} style={{
              background: "#ffffff0a", border: `1px solid ${C.line2}`, borderRadius: 999, padding: "6px 14px", color: C.ink100, fontSize: 12, cursor: "pointer"
            }}>
              Role: {userType === "government" ? "Government Employee" : "Public User"}
            </button>
          </div>
        </header>

        {/* Dashboard Main Grid */}
        <main style={{ padding: 32, flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          
          {/* Left Column: Metrics & Visuals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Banner */}
            <Card style={{ padding: 24, background: "linear-gradient(135deg, #1c2016, #171a12)" }}>
              <Badge tone="cyan">Live Sync · Coimbatore 5KM Pilot</Badge>
              <h3 style={{ margin: "12px 0 8px", fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.ink000 }}>
                {NATIONAL_STATS.harmonizedPct}% of records harmonized with zero human discrepancy.
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: C.ink500, lineHeight: 1.5 }}>
                Integrated Survey, Revenue Bhoomi, Sub-Registrar loan mortgages, and DTCP layout approvals in single master view.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
                <div style={{ background: "#ffffff08", padding: 12, borderRadius: 14, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.ink500 }}>Parcels</p>
                  <p style={{ margin: "4px 0 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>200</p>
                </div>
                <div style={{ background: "#ffffff08", padding: 12, borderRadius: 14, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.ink500 }}>Area Conflicts</p>
                  <p style={{ margin: "4px 0 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.amber }}>31</p>
                </div>
                <div style={{ background: "#ffffff08", padding: 12, borderRadius: 14, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.ink500 }}>Mortgages</p>
                  <p style={{ margin: "4px 0 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.critical }}>60</p>
                </div>
                <div style={{ background: "#ffffff08", padding: 12, borderRadius: 14, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.ink500 }}>Confidence</p>
                  <p style={{ margin: "4px 0 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.emerald }}>95.2%</p>
                </div>
              </div>
            </Card>

            {/* Harmonization Trend Graph */}
            <Card style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 16px", fontFamily: FONT_DISPLAY, fontSize: 16, color: C.ink000 }}>6-Month Harmonization Trend (%)</h4>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={HARMONIZATION_TREND}>
                  <CartesianGrid stroke="#ffffff0d" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: C.ink500, fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: C.ink500, fontSize: 12 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1d16", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }} />
                  <Area type="monotone" dataKey="harmonized" stroke={C.emerald} fill={C.emerald} fillOpacity={0.25} />
                  <Area type="monotone" dataKey="flagged" stroke={C.amber} fill={C.amber} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

          </div>

          {/* Right Column: Land DNA Card & Explanations */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            <Card style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 11, color: C.cyan }}>{selectedParcel.id}</p>
                  <h3 style={{ margin: "4px 0 0", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.ink000 }}>Survey No: {selectedParcel.surveyNo}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: C.ink500 }}>{selectedParcel.village}, {selectedParcel.district}</p>
                </div>
                <Badge tone={STATUS_META[selectedParcel.status].tone}>{STATUS_META[selectedParcel.status].label}</Badge>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderTop: `1px solid ${C.line1}`, borderBottom: `1px solid ${C.line1}` }}>
                <DnaRing score={selectedParcel.dna.overall} size={70} stroke={6} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: C.ink500 }}>Land DNA Score</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.ink000 }}>{selectedParcel.dna.overall}% Confidence</p>
                </div>
              </div>

              {/* Explainable AI Metrics */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.ink500 }}>Boundary Overlap:</span>
                  <span style={{ fontWeight: 600, color: C.emerald }}>96.4%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.ink500 }}>Area Similarity:</span>
                  <span style={{ fontWeight: 600, color: C.emerald }}>98.2%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.ink500 }}>Centroid Deviation:</span>
                  <span style={{ fontWeight: 600, color: C.ink100 }}>1.8 m</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.ink500 }}>Loan Encumbrance:</span>
                  <span style={{ fontWeight: 600, color: selectedParcel.conflicts.length ? C.amber : C.emerald }}>
                    {selectedParcel.conflicts.length ? "FLAGGED" : "CLEAR"}
                  </span>
                </div>
              </div>

              {selectedParcel.conflicts.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 14, background: "#d98e4a15", border: "1px solid #d98e4a40" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#efc08a" }}>Detected Conflict</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: C.ink300 }}>{selectedParcel.conflicts[0].detail}</p>
                </div>
              )}
            </Card>

            {/* Data Source Registry */}
            <Card style={{ padding: 20 }}>
              <p style={{ margin: "0 0 12px", fontFamily: FONT_MONO, fontSize: 11, color: C.ink500, textTransform: "uppercase" }}>Connected Repositories</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DATASETS.map((ds) => (
                  <div key={ds.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 10, background: "#ffffff05" }}>
                    <span style={{ fontSize: 12, color: C.ink100 }}>{ds.name}</span>
                    <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: C.cyan }}>{ds.quality}% Quality</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>

        </main>
      </div>

    </div>
  );
}