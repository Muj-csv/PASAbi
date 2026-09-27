// ARGUS measurement script for PASAbi constants. Runs the REAL core code.
// Usage: npx tsx measure.ts <repo> > measurements.json
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { deflateRawSync } from "node:zlib";

const repo = process.argv[2];
const core = await import(join(repo, "packages/core/index.ts"));
const { compute, haversineMetres, encodeBatch } = core;

// Deterministic PRNG (same family the repo's tests use).
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260927);
const hex = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join("");
const uuid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-${"89ab"[Math.floor(rand() * 4)]}${hex(3)}-${hex(12)}`;

// Realistic content, mirroring what src/app/index.tsx stores today:
// lat/lon/accuracy are the raw doubles from expo-location (no rounding).
const CATS = ["MEDICAL", "TRAPPED", "STRUCTURAL", "FLOOD", "ROAD_BLOCKED", "MISSING_PERSON", "WATER_FOOD", "SHELTER", "SAFE_CHECKIN"];
const WORDS = ["baha", "na", "sa", "tapat", "ng", "kapilya", "hanggang", "tuhod", "tumataas", "ang", "tubig", "may", "matanda", "naiipit",
  "bubong", "kalsada", "sarado", "puno", "natumba", "Sto.", "Niño", "kailangan", "gamot", "pagkain", "tubig", "inumin", "flood", "road",
  "blocked", "near", "the", "school", "water", "rising", "fast", "family", "of", "six", "on", "roof", "Purok", "4", "barangay", "hall"];
const note = (maxLen: number) => { if (process.env.RANDOM_NOTES) { const L="abcdefghijklmnopqrstuvwxyz ñéABCDEFGHIJ0123456789.,"; let s=""; for (let i=0;i<maxLen;i++) s+=L[Math.floor(rand()*L.length)]; return s.trim(); }
  let s = "";
  while (s.length < maxLen) s += (s ? " " : "") + WORDS[Math.floor(rand() * WORDS.length)];
  return s.slice(0, maxLen).trim();
};
const devices = Array.from({ length: 40 }, uuid);

function observation(now: number, opts: { round?: boolean } = {}) {
  const isStatus = rand() < 0.1;
  const hasGps = rand() < 0.8;
  const lat = 14.5995 + (rand() - 0.5) * 0.018 + rand() * 1e-9;
  const lon = 120.9842 + (rand() - 0.5) * 0.018 + rand() * 1e-9;
  const acc = 3 + rand() * 60;
  const o: Record<string, unknown> = {
    id: uuid(),
    type: isStatus ? "STATUS" : "REPORT",
    created_at: now - Math.floor(rand() * 72 * 3600),
    device_id: devices[Math.floor(rand() * devices.length)],
  };
  if (isStatus) {
    o.action = rand() < 0.6 ? "ACK" : "RESOLVE";
    o.refs = Array.from({ length: 1 + Math.floor(rand() * 4) }, uuid);
    return o;
  }
  o.category = CATS[Math.floor(rand() * CATS.length)];
  if (hasGps) {
    o.lat = opts.round ? Math.round(lat * 1e6) / 1e6 : lat;
    o.lon = opts.round ? Math.round(lon * 1e6) / 1e6 : lon;
    o.accuracy_m = opts.round ? Math.round(acc) : acc;
  }
  if (!hasGps || rand() < 0.4 || o.category === "SAFE_CHECKIN") o.area_text = "Purok " + (1 + Math.floor(rand() * 7));
  if (rand() < 0.5) o.people = Math.floor(rand() * 16);
  if (rand() < 0.6) o.note = note(Math.floor(rand() * 141));
  return o;
}

const NOW = 1759000000;
const b64len = (n: number) => 4 * Math.ceil(n / 3);

// ---- 1. Per-observation wire size (encodeBatch of one = 1 type byte + JSON array)
function sizes(round: boolean, n = 5000) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(encodeBatch([observation(NOW, { round })]).length - 3); // minus type byte and []
  return out;
}
const rawSizes = sizes(false);
const roundedSizes = sizes(true);

// Worst case: every optional field, 140-char note with multibyte letters.
const worst = {
  id: uuid(), type: "REPORT", category: "MISSING_PERSON", people: 15,
  note: "ñ".repeat(140), lat: 14.599512345678901, lon: 120.98423456789012, accuracy_m: 48.123456789012345,
  area_text: "Purok 7 tabi ng Sto. Niño chapel", created_at: NOW, device_id: uuid(),
};
const worstBytes = encodeBatch([worst]).length - 3;

// ---- 2. Pages of 60: bytes, base64, deflate+base64, frames at several frame sizes
function pageStats(round: boolean, pages = 400, perPage = 60) {
  const rows = [];
  for (let p = 0; p < pages; p++) {
    const page = Array.from({ length: perPage }, () => observation(NOW, { round }));
    const bytes = encodeBatch(page);
    const deflated = deflateRawSync(Buffer.from(bytes), { level: 9 });
    rows.push({ bytes: bytes.length, b64: b64len(bytes.length), deflB64: b64len(deflated.length) });
  }
  return rows;
}
const pagesRaw = pageStats(false);
const pagesRounded = pageStats(true);

// ---- 3. Gap-check cost: all incident pairs on the repo's 3,000-observation benchmark shape
function syntheticObservations(count: number, now: number) {
  const r = mulberry32(20260925);
  const categories = CATS.slice(0, 8);
  const obs = [];
  for (let i = 0; i < count; i++) {
    obs.push({
      id: "00000000-0000-4000-8000-" + String(i).padStart(12, "0"),
      type: "REPORT", category: categories[Math.floor(r() * categories.length)],
      device_id: "dev-" + Math.floor(r() * 40),
      lat: 14.5995 + (r() - 0.5) * 0.018, lon: 120.9842 + (r() - 0.5) * 0.018,
      created_at: now - Math.floor(r() * 72 * 3600), people: Math.floor(r() * 8),
    });
  }
  return obs;
}
const bench = syntheticObservations(3000, NOW);
compute(bench, NOW);
let t0 = performance.now();
const incidents = compute(bench, NOW);
const computeMs = performance.now() - t0;
const withCentroid = incidents.filter((i: any) => i.centroid);
let near = 0;
t0 = performance.now();
for (const a of withCentroid) for (const b of withCentroid) {
  if (a === b) continue;
  if (haversineMetres(a.centroid.lat, a.centroid.lon, b.centroid.lat, b.centroid.lon) <= 300) near++;
}
const allPairsMs = performance.now() - t0;
const one = withCentroid[0];
t0 = performance.now();
for (let k = 0; k < 100; k++) for (const b of withCentroid)
  haversineMetres(one.centroid.lat, one.centroid.lon, b.centroid.lat, b.centroid.lon);
const onIncidentMs = (performance.now() - t0) / 100;
const extents = incidents.map((i: any) => i.spatialExtentM);

// ---- 4. Freshness of the 11 vector incidents under 1 h / 3 h
const vdir = join(repo, "packages/core/test-vectors");
const vectorFreshness = readdirSync(vdir).filter(f => f.endsWith(".json")).sort().flatMap(f => {
  const v = JSON.parse(readFileSync(join(vdir, f), "utf8"));
  return compute(v.observations, v.now).map((i: any) => {
    const age = Math.max(0, v.now - i.lastSeen);
    return { file: f, key: i.key.slice(-4), ageMin: Math.round(age / 60),
      freshness: age < 3600 ? "fresh" : age >= 3 * 3600 ? "stale" : "aging" };
  });
});

console.log(JSON.stringify({
  rawSizes, roundedSizes, worstBytes, pagesRaw, pagesRounded,
  gap: { incidents: incidents.length, withCentroid: withCentroid.length, computeMs, allPairsMs, onIncidentMs,
    nearPairsWithin300: near / 2, extents },
  vectorFreshness,
}));
