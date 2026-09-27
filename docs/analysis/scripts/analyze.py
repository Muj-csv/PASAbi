import json, math, random, statistics as st, numpy as np, segno
d = json.load(open("docs/analysis/scripts/measurements.json"))
raw, rnd = np.array(d["rawSizes"]), np.array(d["roundedSizes"])
print("== SCAN per-observation wire bytes (n=5000 each)")
for name, a in [("raw doubles", raw), ("lat/lon 6dp, accuracy int", rnd)]:
    print(f"  {name:28s} median {np.median(a):.0f}  p90 {np.percentile(a,90):.0f}  max {a.max()}  mean {a.mean():.1f}")
print("  worst-case single observation:", d["worstBytes"], "bytes")
HDR = len("PSB1:abcd1234:12/34:")
def frames(b64, chunk): return math.ceil(b64 / chunk)
rows = {}
for pname, pages in [("raw", d["pagesRaw"]), ("rounded", d["pagesRounded"])]:
    for enc in ["b64", "deflB64"]:
        vals = np.array([p[enc] for p in pages])
        for chunk in (700, 400):
            fr = np.array([frames(v, chunk) for v in vals])
            rows[(pname, enc, chunk)] = fr
            print(f"  page of 60 · {pname:7s} · {enc:7s} · {chunk} chars: base64 median {np.median(vals):.0f} chars → frames median {np.median(fr):.0f}, p90 {np.percentile(fr,90):.0f}")
bytes_raw = np.array([p["bytes"] for p in d["pagesRaw"]])
print("  page bytes raw: median", int(np.median(bytes_raw)), "; deflate ratio median",
      round(float(np.median(np.array([p['deflB64'] for p in d['pagesRaw']]) / np.array([p['b64'] for p in d['pagesRaw']]))),3))

print("\n== QR versions for one frame (byte mode, segno minimal version)")
random.seed(1); alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
qr = {}
for chunk in (300, 400, 500, 700):
    s = "PSB1:abcd1234:12/34:" + "".join(random.choice(alphabet) for _ in range(chunk))
    for ecl in ("l", "m"):
        q = segno.make(s, error=ecl, micro=False, boost_error=False)
        mods = 17 + 4 * q.version
        pt = 360 / (mods + 8)   # 4-module quiet zone each side, 360 pt display
        qr[(chunk, ecl)] = (q.version, mods, pt)
        print(f"  {chunk} chars ECC {ecl.upper()}: version {q.version:2d}, {mods} modules, {pt:.2f} pt/module at 360 pt")

print("\n== MODEL time to collect a page (frames cycle every 0.4 s; each display caught with prob p)")
def sim(n, p, runs=4000, interval=0.4):
    out = []
    for _ in range(runs):
        got, t, i = set(), 0.0, 0
        while len(got) < n:
            t += interval
            if random.random() < p: got.add(i % n)
            i += 1
        out.append(t)
    return np.median(out), np.percentile(out, 90)
model = {}
for n in (8, 13, 16, 23, 30):
    for p in (0.5, 0.7, 0.9):
        m, p90 = sim(n, p); model[(n, p)] = (m, p90)
        print(f"  {n:2d} frames p={p}: median {m:5.1f} s  p90 {p90:5.1f} s")

g = d["gap"]; ext = np.array(g["extents"])
print("\n== ANALYZE gap check on the 3,000-observation benchmark (laptop, Node)")
print(f"  incidents {g['incidents']}, compute {g['computeMs']:.1f} ms; all-pairs gap check {g['allPairsMs']:.0f} ms; one incident vs all {g['onIncidentMs']:.3f} ms")
print(f"  spatial extent: median {np.median(ext):.0f} m, p99 {np.percentile(ext,99):.0f} m, max {ext.max()} m, share >300 m {np.mean(ext>300):.1%}")
print("\n== Vector incidents under fresh <1 h / stale >=3 h")
from collections import Counter
vf = d["vectorFreshness"]; print(" ", Counter(v["freshness"] for v in vf), [ (v['file'][:2], v['ageMin'], v['freshness']) for v in vf])
json.dump({"rows": {f"{k[0]}|{k[1]}|{k[2]}": v.tolist() for k, v in rows.items()},
           "qr": {f"{k[0]}|{k[1]}": v for k, v in qr.items()},
           "model": {f"{k[0]}|{k[1]}": v for k, v in model.items()}}, open("docs/analysis/scripts/derived.json", "w"))
