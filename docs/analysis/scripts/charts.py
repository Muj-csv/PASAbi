import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, matplotlib.ticker as mt, numpy as np, pandas as pd, json, math, random
INK, MUTED, GRID, CONTEXT = "#1F2937", "#6B7280", "#E5E7EB", "#CBD5E1"
ACCENT, ALERT = "#2563EB", "#DC2626"
plt.rcParams.update({"figure.figsize": (9, 5), "figure.dpi": 110, "savefig.dpi": 200, "savefig.bbox": "tight",
 "font.family": "DejaVu Sans", "font.size": 11, "text.color": INK, "axes.edgecolor": GRID, "axes.labelcolor": MUTED,
 "axes.titlesize": 15, "axes.titleweight": "bold", "axes.titlelocation": "left", "axes.titlepad": 26,
 "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True, "axes.axisbelow": True, "axes.grid.axis": "y",
 "grid.color": GRID, "xtick.color": MUTED, "ytick.color": MUTED, "xtick.major.size": 0, "ytick.major.size": 0,
 "legend.frameon": False, "lines.linewidth": 2.2})
def titled(ax, t, s=None, src=None):
    ax.set_title(t)
    if s: ax.text(0, 1.02, s, transform=ax.transAxes, color=MUTED, fontsize=10.5, va="bottom")
    if src: ax.figure.text(0.01, -0.02, src, color=MUTED, fontsize=8.5, ha="left", va="top")
OUT = "docs/analysis/"  # run from the repo root
d = json.load(open("docs/analysis/scripts/measurements.json")); r = json.load(open("docs/analysis/scripts/m_rand.json"))
med = lambda pages, key, chunk: int(np.median([math.ceil(p[key]/chunk) for p in pages]))
s = pd.Series({
 "Proposed: base64, 700 chars": med(d["pagesRaw"], "b64", 700),
 "base64, 400 chars": med(d["pagesRaw"], "b64", 400),
 "deflate, 700 chars": med(r["pagesRaw"], "deflB64", 700),
 "Recommended: deflate, 500 chars": med(r["pagesRaw"], "deflB64", 500),
 "deflate, 400 chars": med(r["pagesRaw"], "deflB64", 400),
}).sort_values()
fig, ax = plt.subplots(figsize=(9, 3.6))
cols = [ACCENT if "Recommended" in k else (ALERT if "Proposed" in k else CONTEXT) for k in s.index]
ax.barh(s.index, s.values, color=cols, height=.66)
for i, v in enumerate(s.values): ax.text(v, i, f"  {v} frames", va="center", fontsize=10)
ax.grid(False); ax.set_xticks([]); ax.spines["bottom"].set_visible(False); ax.set_xlim(0, s.max()*1.25)
titled(ax, "Compressing each page cuts QR frames by about 2.6×",
 "Median QR frames for one page of 60 observations, by encoding · 400 simulated pages each",
 "Source: real encodeBatch() on synthetic observations (raw GPS doubles; deflate measured with worst-case random-letter notes). docs/analysis/ARGUS_constants.md")
fig.savefig(OUT+"fig1_frames_per_page.png"); plt.close(fig)

def sim(n, p, runs=3000, interval=0.4):
    out=[]
    for _ in range(runs):
        got,t,i=set(),0.0,0
        while len(got)<n:
            t+=interval
            if random.random()<p: got.add(i%n)
            i+=1
        out.append(t)
    return np.median(out), np.percentile(out,90)
random.seed(7); ps = np.array([.4,.5,.6,.7,.8,.9,.95])
fig, ax = plt.subplots()
for n, lab, col, hl in [(33, "Proposed (33 frames)", ALERT, True), (18, "Recommended (18 frames)", ACCENT, True)]:
    m = np.array([sim(n,p) for p in ps])
    ax.plot(ps, m[:,0], color=col, lw=2.6); ax.fill_between(ps, m[:,0], m[:,1], color=col, alpha=.12, lw=0)
    ax.annotate(f"{lab}", (ps[0], m[0,0]), xytext=(6, 6), textcoords="offset points", color=col, fontweight="bold", fontsize=10)
ax.axhline(60, color=MUTED, ls=":", lw=1.2); ax.text(0.955, 61.5, "NFR-009: 60 s", color=MUTED, fontsize=9, ha="right")
ax.set_xlabel("share of displayed frames the camera catches (p)"); ax.set_ylabel("seconds to collect a page")
ax.xaxis.set_major_formatter(mt.PercentFormatter(1.0))
titled(ax, "Uncompressed, a page reliably fits 60 s only if the camera catches ~75% of frames",
 "MODEL: time to collect every frame of one page, frames cycling every 0.4 s · line = median, band = median to 90th percentile",
 "Model assumption: each frame display is caught independently with probability p. The QR spike should measure p on the team's iPhones.")
fig.savefig(OUT+"fig2_scan_time_model.png"); plt.close(fig)
print("ok", s.to_dict())
