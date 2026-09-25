# Pasabi: Submission

Everything needed to submit to Beginner's Paradise: FirstCommit, in one file,
so nothing is discovered missing at 2am.

**Target:** submitted by **Sept 30, 22:00 PHT**. Hard deadline Oct 1, 05:00 PHT.

---

## 1. Checklist

| Required | Status | Owner |
|---|---|---|
| Working project | Engine, capture, sync protocol, station board, uplink, dashboard — green in CI | |
| Public GitHub repo with README and setup steps | Repo public? _____ | |
| Project description (Devpost) | Draft in §3 | |
| 3–5 minute video | Script in §4 | |
| `LEARNING.md` devlog | Written per phase | |

**Still blank in the README, and each needs a human:**
- [ ] Dashboard / preview URL (needs Vercel connected)
- [ ] Team names beyond the lead
- [ ] Licence — *pick one before submitting*. "To be decided" on a public repo means nobody may legally use it.
- [ ] Remove the "Draft README" notice once the above are filled

**Before recording anything:**
- [ ] Wake the Supabase project. Free projects pause when idle, and a paused database is a dead dashboard on camera (ADR-003).
- [ ] Re-run `npm test` and the web build.

---

## 2. The honest-limits block

Use this wording, or something equally plain, in the README, the video and
the Devpost entry. A clearly stated limitation reads better than a staged
demo, and *Learning & Growth* is weighted at 30%.

> Pasabi's mesh does not span platforms: iOS devices sync with iOS devices
> and Android with Android, because Multipeer Connectivity and Nearby
> Connections do not interoperate. On iOS, carrying only happens while the
> app is open on screen, since iOS has no equivalent of Android's foreground
> service. Corroboration counts distinct devices, not people. The grouping
> thresholds are initial values that still need tuning with a real barangay.
> This is a bridge until official channels are reachable, not a replacement
> for them.

If the field test did not happen, add:

> We have not yet demonstrated sync over real radios. The protocol is
> verified by an in-browser simulation of three devices converging to
> identical incident lists, which proves the protocol and proves nothing
> about Bluetooth or Wi-Fi.

---

## 3. Devpost description (draft)

### Inspiration

When a typhoon knocks out power, the cell towers go with it. For the first
24–48 hours a barangay's disaster-response team knows only what people walk
in and tell them, and that arrives as a pile of duplicates and fragments
rather than a picture of where the problems are.

Offline mesh apps already exist. Almost all of them pass **messages**. A feed
of a hundred messages is not a situation picture: someone still has to read
all of it and work out that seven of them describe the same flooded road.

### What it does

Pasabi turns the phones already in the community into the network, and turns
what they carry into a ranked picture.

People record short structured **observations** — category, people affected,
a note, location and time. Phones exchange those observations directly over
Bluetooth and Wi-Fi whenever they come near each other, with no signal and no
internet. Then every phone runs the same deterministic **incident engine**
over whatever it holds: grouping observations of the same kind, place and
time, counting how many independent devices reported each one, and ranking
them with a transparent urgency score that always shows its working.

At the barangay hall, a **station** phone shows a ranked situation board with
"why ranked here" for every incident, and operators can acknowledge or
resolve. When any phone reaches the internet, everything uploads and a
responder dashboard rebuilds the same picture, including what changed since
last time.

The unit is not a message. It is **observation → incident → corroboration →
situation picture**.

### How we built it

One TypeScript codebase — React Native via Expo — targeting iOS, Android and
the web, so the engine is written once and runs identically everywhere.

The decision the whole design rests on is that **incidents are derived, never
transmitted**. Only immutable observations travel. Every device computes
incidents from the same rules, so any two devices holding the same
observations agree with no coordinator, no conflict resolution and no merge
logic. It also means the dashboard cannot drift from a station board, because
it is literally running the same function.

Ranking is rule-based and explainable, never ML: a category base, a
corroboration bonus per independent reporter, people affected, an
unacknowledged bonus and a staleness penalty. Deciding who gets help first
has to be auditable.

### Challenges

**The spec contradicted itself, and we found it before writing code.** A
review turned up ten rule-level problems. Two documents disagreed about when
area text groups observations. An acknowledged, stale incident could score
below zero and sort *underneath* resolved ones. And the storage rules could
deadlock, because the rate limit and the expiry window together allowed 432
observations on a device that could hold 300 and was forbidden from evicting
them.

**Writing the test vectors before the engine caught a bug that reading never
would.** Eight of eleven failed on the first run because `-Math.min(0, 20)`
is *negative zero*, which compares unequal to `0` and survives into stored
snapshots. Had we generated the vectors from engine output, that would have
been enshrined as correct.

**A green test hid a real bug.** Two sync tests lost observations. The quick
fix made them pass. Tracing it properly showed the protocol was answering a
peer's goodbye mid-transfer and reporting the encounter finished while data
was still on the wire, which in the field means tearing down a live
connection. The failing tests were not the misleading part; the green ones
were.

**Then the platform target changed to iOS-first, mid-project.** That was not
a UI port. iOS has no equivalent of Android's foreground service, so the
premise that phones relay passively in a pocket stopped being true, and
carrying became something a person does deliberately. Multipeer Connectivity
and Nearby Connections also do not interoperate, so a mixed barangay runs two
separate meshes. Both limits are designed for and stated out loud rather than
hidden.

### Accomplishments

The engine groups 3,000 observations into 1,705 incidents in under 7 ms,
roughly forty times inside our budget, and produces byte-identical output
across 100 random input orderings. Scoring is integer arithmetic end to end,
so no runtime can round differently. Every rule fix carries a test that fails
if someone quietly undoes it.

### What we learned

Writing the check before the code is what turns a specification from prose
into something that can be wrong out loud. Nearly every real defect in this
project was found either by a test written before the implementation, or by
opening the thing in a browser and looking at it. Almost none were found by
re-reading the code.

### What's next

A field test with a real barangay disaster-response team, threshold tuning
against real puroks, observation signatures, an Android background carry
service, and a map on the dashboard.

---

## 4. Video script (3–5 minutes)

| Time | Beat |
|---|---|
| 0:00–0:20 | The problem. Towers go down with the grid; a barangay is blind for 24–48 hours. |
| 0:20–0:50 | Why mesh chat is not enough. Name Bridgefy, BitChat, MeshAid. A feed of 100 messages is not a picture. |
| 0:50–2:20 | **Live.** Three devices in airplane mode. Create three FLOOD reports near one spot. Bring them together. The station board shows **one strongly corroborated incident**, not three messages. Open it: "why ranked here", term by term. |
| 2:20–2:50 | Acknowledge on the station. Carry to another device — the status travelled. |
| 2:50–3:20 | One device gets Wi-Fi. The dashboard rebuilds the same picture and shows what changed since last sync. |
| 3:20–4:00 | What we learned, and the honest limits from §2. Say them on camera. |

If there are no devices, run the same story on `/sim` and say plainly that it
is a simulation of the protocol, not a radio test.

---

## 5. After submitting

- [ ] Tag the commit that was submitted
- [ ] Note the submission URL here: _____
- [ ] Record what you would do differently in `LEARNING.md`
