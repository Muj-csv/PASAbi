# AgapAI × PASAbi — Final Edge-First PWA Implementation Plan

> **Purpose:** Evolve AgapAI from a voice-first emergency reporting application into an offline-tolerant emergency intelligence and community relay system, using PASAbi's strongest mechanisms as architectural inspiration without copying PASAbi's product wholesale.
>
> **Primary outcome:** AgapAI should be an installable, edge-first Progressive Web App (PWA) that can continue operating from an iPhone Home Screen with little or no connectivity. It turns individual reports into evidence-aware incidents, corroborates independent observations, preserves freshness and uncertainty, identifies information gaps, tracks report propagation honestly, and moves urgent reports across disconnected devices until they reach a connected gateway or responder system.

---

## 0. Executive Summary

### Current AgapAI

AgapAI already establishes the core emergency-reporting pipeline:

```text
Voice / Tap / Gesture
        ↓
Speech or structured input
        ↓
AI triage
        ↓
Geographic resolution
        ↓
Barangay / agency routing
        ↓
Offline queue / responder path
```

The current specification is intentionally strict about degradation, truthful dispatch state, privacy, jurisdiction resolution, and failure visibility.

### PASAbi-inspired evolution

The combined system becomes:

```text
Citizen observation
        ↓
Input normalization
        ↓
AI fact extraction
        ↓
Deterministic validation
        ↓
Location + jurisdiction resolution
        ↓
Incident grouping
        ↓
Corroboration
        ↓
Freshness + evidence
        ↓
Known / unknown / information gaps
        ↓
Priority with explanation
        ↓
Offline queue
        ↓
Relay / QR / future radio transport
        ↓
Gateway / station
        ↓
Cloud synchronization
        ↓
Responder situation board
        ↓
Verified lifecycle updates
```

The central product shift is:

> **AgapAI should not only report emergencies. It should progressively construct the best available picture of what is happening, while clearly separating observations, derived facts, unknowns, and confirmed operational states.**

---

# 1. Product North Star

## 1.1 New product statement

**AgapAI is an emergency intelligence layer that remains useful when communication infrastructure is degraded: it captures structured reports, resolves jurisdiction, combines independent observations into incidents, tracks evidence and freshness, and relays urgent information toward responders without claiming delivery that has not occurred.**

## 1.2 What AgapAI is not

AgapAI must not become:

- a replacement for 911;
- an autonomous emergency dispatch authority;
- a real-time surveillance system;
- a continuous location tracker;
- a system that treats AI-generated text as authoritative truth;
- a system that marks an incident "responded" without actual evidence;
- a system that treats absence of reports as evidence of safety.

## 1.3 Core design principle

Separate:

```text
OBSERVATION
what someone reported
```

from:

```text
INTERPRETATION
what software extracted from the observation
```

from:

```text
EVIDENCE
how many independent observations support it,
how recent they are, and where they came from
```

from:

```text
OPERATIONAL STATE
what an authorized responder actually acknowledged or changed
```

---

# 2. Source-Informed Design Decisions

The following mechanisms are explicitly inspired by PASAbi's current architecture and feature set:

| PASAbi mechanism | AgapAI adaptation |
|---|---|
| Structured offline observations | Structured emergency reports |
| Observation → incident synthesis | Emergency incident aggregation |
| Independent reporter/source counting | Independent corroboration |
| Evidence timeline | Incident evidence timeline |
| Freshness | Freshness / stale / last-known state |
| Known vs not-yet-reported | Known / not reported / unknown |
| Area coverage | Barangay / purok information coverage |
| "What changed" | Responder change feed |
| Honest propagation state | Saved → relayed → gateway → uploaded → acknowledged |
| QR transfer | Encrypted emergency relay |
| Priority-first synchronization | Emergency-aware relay queue |
| Station mode | AgapAI gateway / barangay station |
| Incident lifecycle | New → acknowledged → in progress → resolved |
| Deterministic derived situation picture | Deterministic evidence layer around AI extraction |

PASAbi's current repository describes its core as:

`observation → incident → corroboration → situation picture`

and lists structured offline observations, QR relay, incident synthesis, station mode, honest propagation state, known/unknown reporting, coverage, evidence, upload, and a responder dashboard among its implemented or planned capabilities.

---

# 3. Architecture Target

## 3.1 Primary platform decision

AgapAI is **web-first and edge-first**.

The primary citizen application is an installable **Progressive Web App (PWA)** that users can add to the iPhone Home Screen. The PWA must remain useful when the network is unavailable by relying on:

- a Service Worker for application-shell/offline loading;
- IndexedDB for durable local storage;
- local deterministic logic for the emergency fallback path;
- cached region/jurisdiction data;
- encrypted local queues;
- QR relay as the first device-to-device transport.

A central cloud database is **not a prerequisite for the emergency path**. The cloud is an optional synchronization and coordination layer.

## 3.2 Target system

```text
┌─────────────────────────────────────────────────────────────┐
│                    AGAPAI PWA / WEB APP                     │
│                                                             │
│  Home Screen App on iPhone / iPad / desktop / Android      │
│  Voice │ Text │ Tap │ Gesture │ Check-In │ Medical context  │
│  React + TypeScript + Vite                                 │
│  Service Worker + Web App Manifest                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        EDGE CORE                            │
│                                                             │
│ IndexedDB · reports · incidents · evidence · freshness     │
│ coverage · offline queue · relay queue · region packs      │
│ Web Crypto encryption                                      │
└───────────────┬────────────────────────────┬────────────────┘
                │                            │
                │ online                     │ offline
                ▼                            ▼
      ┌─────────────────┐          ┌────────────────────────┐
      │   AGAPAI API    │          │     RELAY LAYER        │
      │ Node / TypeScript│         │ encrypted QR first     │
      └────────┬────────┘          │ future native/P2P      │
               │                   └───────────┬────────────┘
               ▼                               │
      ┌─────────────────┐               ┌──────▼──────┐
      │ Optional Cloud  │               │   Gateway   │
      │ PostgreSQL      │               │     PWA     │
      │ + PostGIS       │               │ IndexedDB   │
      └────────┬────────┘               └──────┬───────┘
               │                               │
               │ sync                          │
               └───────────────────┬───────────┘
                                   ▼
                         ┌─────────────────────┐
                         │ RESPONDER PWA       │
                         │ Situation Board     │
                         │ What Changed        │
                         │ Coverage            │
                         │ Evidence            │
                         └─────────────────────┘
```

## 3.3 Three persistence levels

### Level 1 — Citizen device

```text
IndexedDB
```

Stores emergency state locally.

### Level 2 — Gateway

```text
IndexedDB
```

Stores a local shared situation picture for a barangay, evacuation center, school, or authorized relay station.

### Level 3 — Cloud

```text
PostgreSQL + PostGIS
```

Stores synchronized history and coordinates when connectivity exists.

The emergency path must remain functional when Level 3 is unavailable.

## 3.4 Platform matrix

| Capability | PWA / Web | Optional Native Enhancement |
|---|---:|---:|
| Home Screen installation | ✓ | ✓ |
| Offline application shell | ✓ | ✓ |
| IndexedDB local persistence | ✓ | ✓ |
| Service Worker | ✓ | — |
| Voice capture | ✓ | ✓ |
| Text emergency path | ✓ | ✓ |
| Local incident engine | ✓ | ✓ |
| Encrypted QR relay | ✓ | ✓ |
| Gateway mode | ✓ | ✓ |
| Responder dashboard | ✓ | ✓ |
| Push notifications | ✓, where supported | ✓ |
| Apple Back Tap / App Intents | ✗ | ✓ |
| Action Button integration | ✗ | ✓ |
| Lock Screen Control | ✗ | ✓ |
| Live Activity | ✗ | ✓ |

### Architectural consequence

The PWA is the required baseline. Native iOS functionality is an **optional enhancement layer** and must never be required for the core emergency workflow.

## 3.5 Failure behavior

```text
Internet available
    ↓
PWA → local store → API → cloud sync

Internet unavailable
    ↓
PWA → local store → local intelligence → relay/gateway

Cloud unavailable
    ↓
PWA continues locally

Gateway unavailable
    ↓
device retains report and may relay directly to another device

AI unavailable
    ↓
deterministic fallback

GPS unavailable
    ↓
network location → last-known → landmark/manual pin

Microphone unavailable
    ↓
text + emergency chips

Everything unavailable
    ↓
local emergency interface + bundled fallback directory
```

# 4. Architectural Boundaries

## 4.1 AI boundary

AI is permitted to:

- transcribe speech;
- interpret Taglish / Filipino / English;
- extract category;
- extract explicitly stated people affected;
- extract stated hazards;
- extract stated landmark descriptions;
- suggest urgency;
- normalize free-form language into a strict schema.

AI is not permitted to:

- invent a barangay;
- invent an agency;
- invent contact numbers;
- claim that an incident exists solely because the model thinks it does;
- convert one observation into a confirmed fact;
- mark responders as notified;
- mark responders as dispatched;
- create a false location;
- rewrite official hazard bulletins.

## 4.2 Geometry/data boundary

Deterministic systems own:

- point-in-polygon barangay resolution;
- PSGC normalization;
- jurisdiction lookup;
- known agency directory;
- facility lookup;
- distance calculation;
- incident spatial clustering;
- coverage calculations.

## 4.3 Evidence boundary

The evidence engine owns:

- report count;
- independent-source count;
- timestamps;
- freshness;
- corroboration;
- contradiction state;
- propagation receipts;
- operational-event history.

## 4.4 Operational authority boundary

Only authenticated responder / gateway actions can move an incident into operational states such as:

```text
ACKNOWLEDGED
ASSIGNED
IN_PROGRESS
RESOLVED
```

No AI response and no citizen-side optimistic UI may claim these states.

---

# 5. Phase 0 — Repository Baseline and Safety Lock

**Goal:** Protect the current AgapAI implementation before adding the PASAbi-inspired layer.

## Tasks

### 5.1 Create architecture branch

Recommended branch:

```text
architecture/edge-first-pwa
```

### 5.2 Freeze current emergency contracts

Document and test:

- `/report`;
- `/resolve`;
- `/describe`;
- `/alerts`;
- region packs;
- offline queue;
- agency fallback;
- `is_dispatch`;
- permission degradation;
- GPS degradation.

### 5.3 Establish golden contracts

Create:

```text
contracts/
├── report.schema.json
├── incident.schema.json
├── evidence.schema.json
├── propagation.schema.json
├── coverage.schema.json
└── responder_event.schema.json
```

### 5.4 Introduce explicit versioning

Every persisted record gets:

```text
schema_version
created_at
updated_at
```

### 5.5 Acceptance criteria

- Existing tests remain green.
- Existing emergency path works unchanged.
- No new feature may remove a degradation path.
- No UI claims server receipt unless supported by a receipt.
- All persisted schemas have versions.

---

# 6. Phase 1 — Canonical Report Model

**Goal:** Unify voice, text, tap, and future relay input into one deterministic record.

## 6.1 Report schema

```ts
type Report = {
  id: string;
  schemaVersion: number;

  createdAt: string;
  observedAt?: string;

  source: {
    type: "voice" | "text" | "tap" | "gesture" | "relay" | "gateway";
    deviceId: string;
    sessionId?: string;
  };

  content: {
    transcript?: string;
    note?: string;
    category?: EmergencyCategory;
    structuredFacts?: StructuredFacts;
  };

  location: {
    observer?: GeoPoint;
    incident?: GeoPoint;
    source:
      | "gps"
      | "network"
      | "last_known"
      | "manual_pin"
      | "landmark"
      | "relay";
    confidence: "high" | "medium" | "low" | "unknown";
  };

  jurisdiction?: JurisdictionResult;

  evidence: {
    peopleAffected?: number;
    explicitClaims: string[];
  };

  privacy: {
    containsMedicalData: boolean;
    containsPreciseLocation: boolean;
  };

  propagation: PropagationState;
};
```

## 6.2 Important distinction

Always support:

```text
observer location
```

and:

```text
incident location
```

as separate values.

Example:

> "I'm at the corner of X street. The house on the next street is on fire."

The user's phone location is not necessarily the incident location.

## 6.3 Structured facts

Example:

```json
{
  "hazard": "fire",
  "people_affected": 3,
  "trapped": true,
  "injured": null,
  "road_blocked": null,
  "needs": ["rescue"]
}
```

`null` means:

> not reported / not established

It must never mean:

> false

---

# 7. Phase 2 — AI Extraction Pipeline

**Goal:** Preserve AgapAI's voice-first advantage while making AI output deterministic and auditable.

## 7.1 Pipeline

```text
Audio
 ↓
ASR
 ↓
Transcript
 ↓
Strict JSON extraction
 ↓
Schema validation
 ↓
Fact normalization
 ↓
Deterministic rules
```

## 7.2 Output rules

AI must return:

```json
{
  "category": "flood",
  "urgency_signal": "high",
  "people_affected": 4,
  "trapped": true,
  "incident_location_text": "Purok 4",
  "claims": [
    "water entered houses",
    "four people are inside"
  ]
}
```

It must also include a field such as:

```json
"evidence_basis": {
  "people_affected": "explicit",
  "trapped": "explicit",
  "urgency_signal": "model_classification"
}
```

This makes interpretation provenance visible.

## 7.3 Fallback

When the hosted model fails:

```text
AI unavailable
 ↓
on-device deterministic classifier
 ↓
structured minimal report
```

This aligns with the current AgapAI degradation ladder.

## 7.4 Tests

Create:

```text
eval/incidents/
├── taglish.json
├── filipino.json
├── english.json
├── ambiguous.json
├── landmark-only.json
├── no-location.json
└── low-audio-quality.json
```

Measure:

- category accuracy;
- extraction accuracy;
- false-positive extraction;
- null preservation;
- malformed JSON rate;
- latency;
- fallback success.

---

# 8. Phase 3 — Incident Aggregation Engine

**Goal:** Convert many reports into one incident when there is sufficient evidence that they describe the same event.

This is the central PASAbi-inspired feature.

## 8.1 Concept

```text
Report A ─┐
Report B ─┼──→ Incident X
Report C ─┤
Report D ─┘
```

## 8.2 Do not use one similarity score

Use multiple deterministic signals:

```text
category similarity
+
spatial proximity
+
temporal proximity
+
landmark/jurisdiction overlap
+
structured-fact overlap
```

## 8.3 Example grouping score

```text
group_score =
  category_match * 0.30
+ spatial_match  * 0.30
+ temporal_match * 0.20
+ jurisdiction_match * 0.10
+ semantic_fact_match * 0.10
```

These weights are implementation defaults, not immutable truth. Validate them against a labelled incident-pair dataset.

## 8.4 Guardrails

Never merge incidents when:

- locations are materially incompatible;
- categories are incompatible;
- timestamps are too far apart for the event;
- the only similarity is a common place name;
- the confidence threshold is not met.

## 8.5 Incident model

```ts
type Incident = {
  id: string;
  schemaVersion: number;

  category: EmergencyCategory;

  reportIds: string[];
  independentSourceCount: number;

  firstObservedAt: string;
  lastObservedAt: string;

  observerLocation?: GeoArea;
  incidentLocation?: GeoArea;

  jurisdiction?: JurisdictionResult;

  facts: AggregatedFacts;

  evidenceState: EvidenceState;
  freshnessState: FreshnessState;

  lifecycle: IncidentLifecycle;

  contradictions: Contradiction[];

  priority: PriorityResult;

  createdAt: string;
  updatedAt: string;
};
```

---

# 9. Phase 4 — Corroboration Engine

**Goal:** Distinguish "many reports" from "many independent sources."

## 9.1 Metrics

Always display both:

```text
Reports: 6
Independent sources: 4
```

Never call six submissions "six witnesses" unless the system actually knows they are six people.

## 9.2 Source identity

Use a privacy-preserving device identifier.

Recommended:

```text
device_observer_id =
HMAC(server_or_cohort_secret, local_device_install_id)
```

Avoid exposing raw device IDs.

## 9.3 Corroboration state

Suggested values:

```text
UNVERIFIED
SINGLE_SOURCE
CORROBORATED
STRONGLY_CORROBORATED
CONFLICTED
STALE
```

## 9.4 Example

```text
TRAPPED RESIDENTS

5 reports
3 independent devices

Corroborated

Last observed:
2 minutes ago
```

## 9.5 Avoid overclaiming

"Corroborated" should mean:

> multiple independent observations are consistent with the same incident.

It should not mean:

> verified by an official responder.

Those are separate states.

---

# 10. Phase 5 — Evidence Layer

**Goal:** Give every incident an inspectable evidence trail.

## 10.1 Evidence object

```ts
type EvidenceRecord = {
  id: string;
  incidentId: string;
  type:
    | "report"
    | "corroboration"
    | "location"
    | "gateway_receipt"
    | "upload_receipt"
    | "responder_action"
    | "contradiction";

  sourceId?: string;

  createdAt: string;

  payloadRef?: string;

  confidence: "high" | "medium" | "low";

  visibility:
    | "citizen"
    | "responder"
    | "internal";
};
```

## 10.2 Evidence timeline

Example:

```text
20:41  First citizen report
20:43  Second independent report
20:45  Barangay resolved
20:47  Third report corroborates trapped-person claim
20:48  Gateway received incident
20:49  Uploaded to server
20:52  Responder acknowledged
```

## 10.3 Evidence views

Citizen:

```text
Saved on this phone
```

Responder:

```text
4 reports
3 independent sources
Fresh
Gateway received
```

System:

```text
full event/evidence chain
```

---

# 11. Phase 6 — Freshness Engine

**Goal:** Prevent stale incidents from looking current.

## 11.1 State machine

```text
FRESH
  ↓
AGING
  ↓
STALE
  ↓
LAST_KNOWN
```

Exact durations should be category-specific.

Example initial defaults:

| Category | Fresh | Aging | Stale |
|---|---:|---:|---:|
| Fire | 5 min | 15 min | 30 min |
| Medical | 10 min | 30 min | 60 min |
| Flood | 15 min | 60 min | 180 min |
| Structural damage | 30 min | 120 min | 360 min |
| Missing person | 30 min | 120 min | 360 min |

These are tunable engineering defaults, not official emergency standards.

## 11.2 UI wording

Use:

```text
Fresh
```

```text
Aging
Last reported 23 min ago
```

```text
Stale
No newer observation for 2 h
```

```text
Last known
Information may no longer reflect current conditions
```

Never simply retain:

```text
ACTIVE
```

indefinitely.

---

# 12. Phase 7 — Known / Unknown / Not Reported

**Goal:** Make absence of information explicit.

## 12.1 Three states

### Known

There is evidence.

```text
Road is partially blocked
```

### Not reported

No nearby report mentions it.

```text
No report yet about injuries
```

### Unknown

The system cannot determine the state.

```text
Current flood depth: unknown
```

These must not be collapsed into one status.

## 12.2 Example incident detail

```text
FLOODING — PUROK 4

KNOWN
• Water entering homes
• 5 reports
• 3 independent sources

NOT YET REPORTED
• Trapped residents
• Power outage

UNKNOWN
• Flood depth
• Shelter capacity
• Responder arrival
```

## 12.3 Rule

Never display:

```text
No trapped residents
```

when the actual state is:

```text
No reports of trapped residents
```

---

# 13. Phase 8 — Coverage Intelligence

**Goal:** Show where information exists and where it does not.

## 13.1 Coverage entity

```ts
type CoverageArea = {
  areaId: string;
  areaName: string;

  expectedPopulation?: number;
  expectedPuroks?: number;

  recentReportCount: number;
  independentSourceCount: number;

  lastReportAt?: string;

  coverage:
    | "high"
    | "moderate"
    | "limited"
    | "stale"
    | "no_recent_reports";
};
```

## 13.2 Responder board

```text
BARANGAY COVERAGE

Purok 1   HIGH
Purok 2   MODERATE
Purok 3   LIMITED
Purok 4   STALE
Purok 5   NO RECENT REPORTS
```

## 13.3 Required warning

```text
No recent reports does not mean the area is safe.
```

## 13.4 Coverage calculations

Use:

- expected administrative areas;
- recent report density;
- independent source count;
- time since latest observation.

Do not treat raw report count alone as population-normalized safety evidence.

---

# 14. Phase 9 — Explainable Priority Engine

**Goal:** Replace opaque "AI priority scores" with structured, inspectable reasoning.

## 14.1 Inputs

Priority can consider:

- emergency category;
- explicit severity;
- people affected;
- trapped/injured status;
- freshness;
- corroboration;
- location certainty;
- responder state;
- nearby hazards;
- information gaps.

## 14.2 Example

```text
PRIORITY: CRITICAL

Reasons:
+ Possible trapped persons
+ 3 people explicitly reported
+ 3 independent sources
+ Fresh report
+ Incident location resolved
+ No responder acknowledgment yet
```

## 14.3 Rules

Do not let:

```text
AI confidence = 95%
```

directly mean:

```text
priority = 95
```

AI confidence and operational priority are different concepts.

## 14.4 Priority output

```ts
type PriorityResult = {
  class: "critical" | "high" | "moderate" | "low";
  factors: PriorityFactor[];
  computedAt: string;
  engineVersion: string;
};
```

---

# 15. Phase 10 — Honest Propagation State

**Goal:** Give users and responders proof-based delivery states.

## 15.1 State machine

```text
CREATED
  ↓
SAVED_LOCAL
  ↓
RELAYED
  ↓
GATEWAY_RECEIVED
  ↓
UPLOADED
  ↓
SERVER_ACCEPTED
  ↓
RESPONDER_ACKNOWLEDGED
  ↓
RESPONDER_STATUS_UPDATED
```

Not every report will reach every state.

## 15.2 Citizen UI

```text
✓ Saved on this phone
✓ Passed to another device
✓ Reached AgapAI gateway
○ Internet upload pending
○ Responder acknowledgment not confirmed
```

## 15.3 Never claim

```text
Responders notified
```

unless there is actual integration evidence.

## 15.4 Receipt model

```ts
type PropagationReceipt = {
  id: string;
  reportId: string;

  fromNode: string;
  toNode: string;

  receivedAt: string;

  transport:
    | "qr"
    | "bluetooth"
    | "wifi_aware"
    | "gateway"
    | "https"
    | "sms";

  payloadHash: string;
  signature?: string;
};
```

---

# 16. Phase 11 — Offline Relay Engine

**Goal:** Let critical reports move between devices without internet.

## 16.1 Principle

```text
Store
Carry
Forward
```

A disconnected report should remain useful rather than becoming trapped on one device.

## 16.2 Transport abstraction

Build a transport interface:

```ts
interface RelayTransport {
  discover(): Promise<Peer[]>;
  send(bundle: RelayBundle): Promise<RelayReceipt>;
  receive(input: RelayInput): Promise<RelayReceipt>;
}
```

Implement in this order:

```text
1. Local loopback / test transport
2. QR transport
3. Native Bluetooth / Wi-Fi transport
4. Gateway transport
```

## 16.3 Why QR first

QR gives a testable physical relay path without first requiring a complex native mesh implementation.

## 16.4 Relay bundle

Never relay the full database.

Relay only a minimal encrypted bundle:

```ts
type RelayBundle = {
  protocolVersion: number;
  bundleId: string;

  reports: RelayReport[];

  createdAt: string;

  encryption:
    "AES-GCM";

  integrityHash: string;

  senderEphemeralKey?: string;
};
```

---

# 17. Phase 12 — Encrypted QR Relay

**Goal:** Ship a deterministic, demoable, offline transport first.

## 17.1 Flow

```text
PHONE A
Emergency report
   ↓
Encrypt bundle
   ↓
Chunk bundle
   ↓
Render QR frames
   ↓
PHONE B scans
   ↓
Reassemble
   ↓
Verify integrity
   ↓
Decrypt
   ↓
Deduplicate
   ↓
Store
   ↓
Receipt
```

## 17.2 QR protocol

Use:

```text
bundleId
frameIndex
frameCount
protocolVersion
ciphertext
checksum
```

Example:

```text
AGAPAI1|B42|03|12|<payload>|<checksum>
```

## 17.3 Security

- never put raw medical data in QR;
- never expose precise coordinates in plaintext;
- encrypt before chunking;
- authenticate bundle integrity;
- reject malformed frames;
- expire incomplete transfers;
- do not keep plaintext relay payload longer than necessary;
- log only non-sensitive transfer metadata.

## 17.4 UX

Sender:

```text
3 urgent reports ready to relay

[ Show Relay QR ]
```

Receiver:

```text
Scan AgapAI Relay

[ Camera ]

2 new reports detected

[ Accept ]
```

Do not make the receiver read an emergency story before accepting the transport.

---

# 18. Phase 13 — Priority-First Relay Queue

**Goal:** If contact is brief, send the most valuable information first.

## 18.1 Queue order

```text
critical + fresh
        ↓
high + fresh
        ↓
critical + aging
        ↓
high + aging
        ↓
moderate
        ↓
low
```

Within a class:

```text
higher independent-source count
→ more recent
→ older
```

## 18.2 Example

```text
RELAY QUEUE

01 🔴 Trapped person
02 🔴 Medical emergency
03 🔴 Fire
04 🟠 Flood
05 🟠 Road blockage
06 🟡 Supply request
```

## 18.3 Bundle limits

Set hard limits for:

- max reports per bundle;
- max bundle bytes;
- max QR frames;
- max transfer time.

When limits are exceeded, carry forward the remainder.

---

# 19. Phase 14 — Deduplication and Idempotency

**Goal:** Allow the same report to travel through multiple phones without creating duplicates.

## 19.1 Stable report ID

Generate:

```text
UUIDv7
```

or an equivalent globally unique identifier.

## 19.2 Content hash

Compute:

```text
canonical_report_hash
```

for duplicate detection.

## 19.3 Idempotent insertion

Server:

```text
POST /relay/ingest
Idempotency-Key: <bundle/report id>
```

Repeated submission must not create a duplicate incident observation.

## 19.4 Test

Simulate:

```text
A → B → C
A → C
B → C → A
A uploads twice
```

Expected:

```text
1 logical report
1 evidence item
multiple valid propagation receipts
```

---

# 20. Phase 15 — Gateway / Barangay Station

**Goal:** Give disconnected areas a practical local collection point.

## 20.1 Gateway roles

A gateway can be:

- barangay hall tablet;
- DRRM laptop;
- evacuation center device;
- school device;
- authorized volunteer device.

## 20.2 Gateway modes

### Offline gateway

Stores reports and displays a local situation board.

### Online gateway

Uploads and synchronizes with the server.

## 20.3 Gateway UI

```text
AGAPAI GATEWAY

CONNECTION
Offline

QUEUE
12 reports
5 incidents

CRITICAL
2

FRESH
8

STALE
4

[ Situation Board ]
[ Receive Relay ]
[ Send Relay ]
[ Sync When Online ]
```

## 20.4 Trust model

Gateways should have a distinct node identity.

Never automatically grant responder authority to an arbitrary device.

---

# 21. Phase 16 — Server Synchronization

**Goal:** Merge gateway and cloud observations deterministically.

## 21.1 Sync endpoint

Recommended:

```http
POST /sync/batch
```

Input:

```json
{
  "node_id": "gateway_001",
  "cursor": "abc123",
  "items": []
}
```

Output:

```json
{
  "accepted": [],
  "duplicates": [],
  "rejected": [],
  "next_cursor": "def456"
}
```

## 21.2 Sync rules

Server must:

- validate schema;
- verify integrity;
- deduplicate;
- preserve original observation timestamps;
- preserve source IDs;
- append propagation receipts;
- recompute incidents;
- recompute freshness;
- recalculate coverage;
- emit derived changes.

## 21.3 Never overwrite history

Use append-only events where practical.

Correction should create a new event:

```text
OBSERVATION_CREATED
OBSERVATION_CORRECTED
RESPONDER_ACKNOWLEDGED
INCIDENT_RESOLVED
INCIDENT_REOPENED
```

rather than silently rewriting the past.

---

# 22. Phase 17 — Incident Lifecycle

**Goal:** Make responder operational state explicit.

## 22.1 State machine

```text
NEW
 ↓
CORROBORATED
 ↓
ACKNOWLEDGED
 ↓
IN_PROGRESS
 ↓
RESOLVED
```

Possible branch:

```text
RESOLVED
   ↓
NEW REPORT
   ↓
REOPENED
```

## 22.2 Rules

### NEW

At least one report exists.

### CORROBORATED

More than one sufficiently independent consistent source.

### ACKNOWLEDGED

Authorized responder action recorded.

### IN_PROGRESS

Authorized responder action recorded.

### RESOLVED

Authorized responder disposition recorded.

### REOPENED

New qualifying evidence appears after resolution.

## 22.3 Citizen visibility

Do not expose internal responder data beyond what is appropriate.

The citizen may see:

```text
Report saved
Report reached gateway
Responder acknowledgment confirmed
```

only where actually supported.

---

# 23. Phase 18 — "What Changed" Responder Feed

**Goal:** Reduce responder scanning burden.

## 23.1 Change types

```text
NEW_INCIDENT
MORE_CORROBORATION
PRIORITY_ESCALATED
PRIORITY_REDUCED
BECAME_STALE
RECEIVED_AT_GATEWAY
UPLOADED
ACKNOWLEDGED
IN_PROGRESS
RESOLVED
REOPENED
CONTRADICTION_DETECTED
```

## 23.2 Example

```text
WHAT CHANGED
Since 20:00

NEW
Medical emergency — Purok 3

CORROBORATED
Flood — Purok 4
2 → 4 sources

BECAME STALE
Road obstruction — Purok 2

REOPENED
Structural damage — Purok 1
New report received
```

## 23.3 API

```http
GET /incidents/changes?since=<cursor>
```

Use a cursor rather than only timestamps to avoid duplicate or missing events.

---

# 24. Phase 19 — Contradiction Engine

**Goal:** Surface conflicts rather than silently collapsing them.

## 24.1 Examples

```text
Report A:
Road blocked

Report B:
Road passable
```

```text
Report A:
No trapped people

Report B:
Three people trapped
```

## 24.2 Model

```ts
type Contradiction = {
  id: string;
  incidentId: string;

  field: string;

  claims: Array<{
    value: unknown;
    reportIds: string[];
    lastObservedAt: string;
  }>;

  state:
    | "unresolved"
    | "latest_supported"
    | "responder_resolved";
};
```

## 24.3 UI

```text
⚠ CONFLICTING REPORTS

ROAD ACCESS

Blocked:
2 reports
Last: 20:41

Passable:
1 report
Last: 20:49

Current state:
UNRESOLVED
```

Never hide the disagreement.

---

# 25. Phase 20 — Location Intelligence Expansion

AgapAI's existing jurisdiction resolver is already a major asset. Extend it carefully.

## 25.1 Maintain two location tracks

```text
observer_location
incident_location
```

## 25.2 Location sources

```text
GPS
network
last-known
manual pin
landmark description
relay-provided location
gateway annotation
```

## 25.3 Confidence

```text
HIGH
MEDIUM
LOW
UNKNOWN
```

## 25.4 Landmark path

Use the current `/describe` concept:

```text
spoken description
 ↓
candidate retrieval
 ↓
user confirmation
 ↓
later geometric confirmation where possible
```

Do not make lexical similarity silently equivalent to precise jurisdiction.

---

# 26. Phase 21 — Evidence-Aware Map

**Goal:** Evolve the map from "pins on a map" into a situation map.

## 26.1 Layers

```text
INCIDENTS
COVERAGE
FRESHNESS
JURISDICTIONS
FACILITIES
HAZARDS
INFORMATION GAPS
```

## 26.2 Incident marker

Each incident marker should communicate:

```text
category
priority
freshness
corroboration
location confidence
```

Example:

```text
🔴 TRAPPED

4 reports
3 sources
Fresh
High location confidence
```

## 26.3 Information gap layer

Show areas with:

```text
No recent reports
```

without implying:

```text
Safe
```

---

# 27. Phase 22 — Nearby Facilities + Incident Context

Use the existing AgapAI region-pack architecture, but allow incident context to affect presentation.

Example:

```text
MEDICAL INCIDENT

Nearby facilities

1. Hospital A
   Trauma capability: high
   2.4 km

2. Clinic B
   General care
   1.1 km
```

The ranking should remain deterministic and explainable.

Do not let an LLM invent facility capability.

---

# 28. Phase 23 — Hazard-to-Incident Correlation

AgapAI already has a hazard aggregation module.

Connect it to incident context without making official alerts secondary to citizen reports.

Example:

```text
OFFICIAL HAZARD
PHIVOLCS-confirmed earthquake

+
COMMUNITY REPORTS
3 structural damage observations

=
SITUATIONAL CONTEXT

Earthquake
Confirmed official hazard

Structural damage
3 community reports
2 locations
Fresh
```

Never rewrite official bulletin text.

Keep:

```text
official source
community observation
derived relationship
```

as separate objects.

---

# 23A. PWA-Specific Implementation Requirements

## 23A.1 Web App Manifest

Implement an installable manifest with:

```json
{
  "name": "AgapAI",
  "short_name": "AgapAI",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

The Home Screen experience is a product requirement. Test installation and launch on actual target iOS devices, not only desktop browsers.

## 23A.2 Service Worker

Cache:

- application shell;
- emergency route;
- core JS/CSS;
- icons;
- emergency fallback copy;
- minimum jurisdiction/fallback data.

Do not place sensitive report data in the static application-shell cache. Use IndexedDB for user data.

## 23A.3 IndexedDB

Create a versioned local database:

```text
agapai-local
├── reports
├── incidents
├── evidence
├── relayQueue
├── propagationReceipts
├── coverage
├── regionPacks
├── hazardCache
├── settings
└── syncMetadata
```

Use migrations and test upgrades from every supported schema version.

## 23A.4 Local-first report write

When a report is created:

```text
1. validate locally
2. persist locally
3. generate stable report ID
4. create evidence record
5. calculate local incident / priority state
6. add to sync + relay queues
7. attempt network synchronization
8. update propagation only on verified receipt
```

Network availability must not control whether the report can be created.

## 23A.5 Offline readiness

After the app shell, required assets, and minimum fallback data are locally available, surface a state such as:

```text
AGAPAI READY OFFLINE
```

Do not claim readiness before the required assets are actually cached.

## 23A.6 Browser storage constraints

Design for:

- storage quota variability;
- browser data clearing;
- interrupted page lifecycle;
- private/incognito sessions;
- platform-specific capability differences.

Keep emergency records small, persist immediately, avoid large media by default, and provide a visible path to relay/export important queued reports before storage becomes constrained.

## 23A.7 PWA voice strategy

Use a layered voice path:

```text
browser audio capture
        ↓
local transcription where reliably supported
        ↓
structured extraction
```

When reliable offline transcription is unavailable:

```text
capture / queue audio or prompt for text
        ↓
transcribe when connectivity returns
```

The text emergency path remains the guaranteed offline fallback. Do not claim browser offline ASR support until it has been validated on target iOS versions.

## 23A.8 Optional native enhancement

A later native wrapper may provide:

```text
Back Tap
Siri
Action Button
Lock Screen controls
Live Activity
```

These capabilities are outside the PWA baseline and must not be dependencies for the core product.

## 23A.9 PWA route structure

```text
/                         citizen home
/report                   emergency report
/incidents/:id            incident status
/relay                    QR relay
/gateway                  gateway mode
/responder                responder board
/responder/incidents/:id responder incident detail
/settings                 settings
```

The root emergency interface must be loadable from the Service Worker without an API request.

# 29. Phase 24 — Privacy and Security

This phase should be implemented before broad relay testing.

## 29.1 Data classification

### Tier 1 — operational metadata

- incident ID;
- category;
- timestamps;
- coarse administrative location.

### Tier 2 — sensitive emergency data

- precise coordinates;
- medical information;
- personal details;
- contact information.

### Tier 3 — relay protocol data

- encrypted payload;
- bundle ID;
- receipt metadata.

## 29.2 Principles

- data minimization;
- encryption at rest;
- encryption in transit;
- encrypted relay bundles;
- short retention for unnecessary sensitive details;
- no background tracking;
- no remote live location viewer;
- no unnecessary contact notifications.

## 29.3 Threats to test

```text
QR interception
QR replay
malformed bundle
duplicate bundle
device theft
stale credentials
gateway impersonation
location leakage
medical payload leakage
metadata correlation
```

---

# 30. Phase 25 — Responder Authentication

**Goal:** Separate community relay from responder authority.

## 30.1 Roles

```text
CITIZEN
VOLUNTEER
GATEWAY
RESPONDER
ADMIN
```

## 30.2 Permissions

| Action | Citizen | Volunteer | Gateway | Responder | Admin |
|---|---:|---:|---:|---:|---:|
| Create report | ✓ | ✓ | ✓ | ✓ | ✓ |
| Relay report | ✓ | ✓ | ✓ | ✓ | ✓ |
| View public incident summary | ✓ | ✓ | ✓ | ✓ | ✓ |
| Acknowledge |  |  | limited | ✓ | ✓ |
| Change operational state |  |  |  | ✓ | ✓ |
| Manage agency directory |  |  |  |  | ✓ |
| Export audit data |  |  |  | limited | ✓ |

---

# 31. Phase 26 — Database Design

Recommended PostgreSQL + PostGIS target.

## 31.1 Core tables

```text
reports
incidents
incident_reports
sources
locations
jurisdictions
agencies
facilities
evidence_records
propagation_receipts
gateway_nodes
responder_events
contradictions
coverage_snapshots
sync_cursors
hazard_events
```

## 31.2 Reports

```sql
reports (
  id UUID PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  source_observer_id TEXT NOT NULL,
  observed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  category TEXT,
  structured_facts JSONB,
  observer_point GEOGRAPHY(Point, 4326),
  incident_point GEOGRAPHY(Point, 4326),
  location_source TEXT,
  location_confidence TEXT,
  content_hash TEXT,
  encrypted_sensitive_payload BYTEA,
  created_on_device BOOLEAN DEFAULT TRUE
)
```

## 31.3 Incidents

```sql
incidents (
  id UUID PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  category TEXT NOT NULL,
  first_observed_at TIMESTAMPTZ NOT NULL,
  last_observed_at TIMESTAMPTZ NOT NULL,
  incident_centroid GEOGRAPHY(Point, 4326),
  jurisdiction_id TEXT,
  evidence_state TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  priority_class TEXT NOT NULL,
  priority_factors JSONB NOT NULL
)
```

## 31.4 Event table

Prefer an append-only operational event stream:

```sql
incident_events (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
)
```

---

# 32. Phase 27 — API Contracts

## 32.1 Existing

Preserve:

```http
POST /report
GET  /resolve
GET  /describe
GET  /alerts
GET  /packs/{region}
```

## 32.2 New

### Create report

```http
POST /reports
```

### Build/recompute incident

```http
POST /incidents/recompute
```

Internal/admin use only.

### List incidents

```http
GET /incidents
```

Filters:

```text
category
priority
freshness
jurisdiction
since
status
```

### Incident detail

```http
GET /incidents/{id}
```

### Evidence

```http
GET /incidents/{id}/evidence
```

### Timeline

```http
GET /incidents/{id}/timeline
```

### Changes

```http
GET /incidents/changes?cursor=<cursor>
```

### Relay ingest

```http
POST /relay/ingest
```

### Gateway sync

```http
POST /sync/batch
```

### Gateway status

```http
POST /gateway/heartbeat
```

Only if a gateway networking model eventually needs heartbeat behavior.

### Coverage

```http
GET /coverage?jurisdiction=<id>
```

### Nearby

```http
GET /nearby?lat=<lat>&lon=<lon>&category=<category>
```

---

# 33. Phase 28 — Offline Storage

## 33.1 Local database

The mobile app should have a durable local store for:

```text
reports
incidents cache
evidence
relay queue
propagation receipts
region pack
gateway credentials
settings
```

## 33.2 Queue states

```text
PENDING
READY_TO_RELAY
RELAYED
READY_TO_UPLOAD
UPLOADED
FAILED_RETRY
EXPIRED
```

## 33.3 Retry policy

Use bounded exponential backoff:

```text
5 s
15 s
30 s
60 s
5 min
15 min
```

Cap retries per transport and surface persistent failure.

## 33.4 Fault injection

Automate:

```text
GPS off
permission denied
AI timeout
AI 429
invalid JSON
network loss mid-upload
app killed during queue
device reboot
duplicate relay
partial QR scan
clock skew
database migration
```

Acceptance target:

```text
0 lost logical reports in 200 induced failure cases
```

consistent with the current AgapAI acceptance philosophy.

---

# 34. Phase 29 — Mobile UI

## 34.1 Citizen home

Keep the emergency path simple.

Suggested information hierarchy:

```text
PRIMARY
[ NEED HELP ]

SECONDARY
[ ALERT MY CONTACTS ]

CONTEXT
Nearby hazards
My current area
Recent report status
```

## 34.2 Incident confirmation

After reporting:

```text
YOUR REPORT

Possible medical emergency

Location:
Balibago
High confidence

Status:
✓ Saved on this phone
○ Gateway not reached

[ View details ]
```

## 34.3 Relay screen

```text
OFFLINE RELAY

3 emergency reports waiting

[ SEND VIA QR ]
[ RECEIVE VIA QR ]
```

## 34.4 Incident evidence

```text
EVIDENCE

4 reports
3 independent sources

Last observation:
2 minutes ago

Location:
High confidence

Timeline
...
```

---

# 35. Phase 30 — Responder Dashboard

## 35.1 Main layout

```text
┌────────────────────────────────────────────┐
│ AGAPAI RESPONDER                           │
├────────────────────────────────────────────┤
│ CRITICAL  3   HIGH  8   MODERATE 17       │
├────────────────────────────────────────────┤
│                                            │
│  WHAT CHANGED                              │
│                                            │
│  NEW       Medical Purok 3                 │
│  ↑         Flood Purok 4                  │
│  ⚠         Road contradiction Purok 2     │
│                                            │
├────────────────────────────────────────────┤
│ INCIDENTS                                  │
│                                            │
│ 🔴 Trapped persons                         │
│    5 reports · 3 sources · Fresh            │
│                                            │
│ 🟠 Flooding                                │
│    8 reports · 5 sources · Aging            │
│                                            │
└────────────────────────────────────────────┘
```

## 35.2 Incident card

Show:

```text
priority
category
jurisdiction
freshness
reports
sources
people affected
location confidence
responder state
last update
```

## 35.3 Detail layout

```text
INCIDENT
↓
Priority + why
↓
Location
↓
Evidence summary
↓
Timeline
↓
Known / not reported / unknown
↓
Contradictions
↓
Nearby facilities
↓
Responder actions
```

---

# 36. Phase 31 — "What Changed" Engine

Implement a deterministic snapshot-diff layer.

## 36.1 Compare

```text
previous incident snapshot
vs
current incident snapshot
```

## 36.2 Emit

```text
NEW
ESCALATED
CORROBORATED
STALE
RECEIVED
ACKNOWLEDGED
RESOLVED
REOPENED
CONFLICTED
```

## 36.3 Avoid repeated noise

Each generated change event needs:

```text
dedupe_key
incident_id
change_type
previous_state
current_state
created_at
```

---

# 37. Phase 32 — Testing Strategy

Testing must be treated as a product feature.

## 37.1 Unit tests

### Report

- schema;
- normalization;
- null semantics;
- hashing.

### Incident engine

- grouping;
- non-grouping;
- edge distances;
- time windows;
- category conflicts.

### Corroboration

- independent source counting;
- repeated same-device reports;
- relay duplicates.

### Freshness

- transitions;
- clock skew;
- category-specific thresholds.

### Coverage

- no reports;
- sparse reports;
- stale reports.

### Priority

- explainability;
- deterministic output;
- stable factors.

### Relay

- encryption;
- chunking;
- reassembly;
- corruption;
- replay;
- deduplication.

---

# 38. Phase 33 — Property-Based Tests

Create invariants.

## 38.1 No duplicate logical report

For any relay path:

```text
ingest(report)
ingest(report)
```

results in one logical report.

## 38.2 No false dispatch

For any path:

```text
no responder integration event
```

then:

```text
is_dispatch = false
```

## 38.3 Freshness monotonicity

Without a newer observation:

```text
FRESH → AGING → STALE
```

must never move backward.

## 38.4 Corroboration monotonicity

Adding a new independent consistent report may increase corroboration, but removing a source must decrease it.

## 38.5 Unknown preservation

If a fact was not observed:

```text
state = unknown / not_reported
```

never:

```text
false
```

## 38.6 Relay idempotence

Any permutation or duplication of the same bundle should preserve logical state.

---

# 39. Phase 34 — End-to-End Disaster Scenarios

Build scripted scenarios.

## Scenario A — Online voice report

```text
voice
→ ASR
→ AI extraction
→ resolve
→ incident
→ upload
→ responder
```

Expected:

```text
≤ current full-path target
```

## Scenario B — No data, GPS available

```text
voice
→ offline queue
→ SMS/share fallback if applicable
```

## Scenario C — No signal

```text
voice
→ local queue
→ volunteer QR relay
→ gateway
→ server
```

## Scenario D — Multiple reports

```text
A reports fire
B reports fire
C reports trapped residents
```

Expected:

```text
1 incident
3 reports
3 independent sources
```

## Scenario E — Contradiction

```text
A: road blocked
B: road passable
```

Expected:

```text
1 incident
contradiction visible
no silent overwrite
```

## Scenario F — Stale information

No new reports for threshold duration.

Expected:

```text
STALE
```

not active-looking UI.

## Scenario G — Resolved then reopened

```text
RESOLVED
↓
new strong observation
↓
REOPENED
```

---

# 40. Phase 35 — Relay Demonstration Script

Use this for a hackathon/demo.

## Device A

Turn off:

```text
cellular
Wi-Fi
internet
```

Create:

> "May tatlong tao na trapped sa bahay sa Purok 4."

Show:

```text
Saved on this phone
```

## Device B

Create another nearby report.

Show:

```text
2 reports
2 independent sources
CORROBORATED
```

## Device C

Act as volunteer relay.

```text
Receive relay
```

Show:

```text
1 critical incident transferred
```

## Gateway

Scan / receive.

Show:

```text
Gateway received
```

The gateway displays:

```text
TRAPPED PERSONS
Purok 4

2 reports
2 independent sources
Fresh
```

## Reconnect internet

Show:

```text
Uploaded
Server accepted
```

## Responder dashboard

Show:

```text
NEW INCIDENT
```

Then create a third report to demonstrate:

```text
WHAT CHANGED
2 → 3 sources
Priority increased
```

This makes the PASAbi-inspired architecture visually obvious.

---

# 41. Phase 36 — Metrics and Evaluation

## 41.1 Reliability

Measure:

```text
report loss rate
relay success rate
upload success rate
duplicate rate
QR reassembly failure
offline queue recovery
```

Targets:

```text
report loss: 0 in controlled fault-injection set
duplicate logical reports: 0 after dedupe
```

## 41.2 AI

Measure separately:

```text
ASR accuracy
category extraction
fact extraction
location phrase extraction
false fact insertion
```

## 41.3 Incident engine

Measure:

```text
true merge rate
false merge rate
missed merge rate
```

## 41.4 Corroboration

Measure:

```text
independent-source accuracy
same-device overcount rate
```

## 41.5 Freshness

Measure:

```text
time-to-stale correctness
stale state visibility
```

## 41.6 Relay

Measure:

```text
reports transferred per contact
critical reports transferred first
median QR transfer time
partial transfer recovery
```

---

# 42. Phase 37 — Security and Abuse Testing

## Abuse cases

### False report flood

Mitigate with:

- per-device rate limits;
- duplicate suppression;
- source-level trust metadata;
- responder review.

Do not silently erase evidence.

### Replay attack

Reject:

```text
same bundle ID
same receipt chain
same nonce
```

when replayed.

### Stolen phone

Use encryption and local data protection.

### Malicious gateway

Do not permit gateway-only status changes without authority.

### Privacy abuse

Ensure:

- no continuous background location;
- no public live location;
- no unauthorized contact alerts;
- no medical information in plaintext relay.

---

# 43. Phase 38 — Observability

Create internal dashboards for the engineering team.

## System metrics

```text
ASR latency
LLM latency
fallback rate
report ingest rate
incident merge rate
relay rate
gateway sync rate
queue age
API error rate
```

## Safety metrics

```text
dispatch overclaim incidents
unknown → false conversion incidents
duplicate incidents
false merges
stale incidents
privacy violations
```

## Reliability metrics

```text
offline recovery
fault injection
data persistence
```

---

# 44. Phase 39 — Data and Evaluation Sets

Build three foundational datasets.

## 44.1 Incident report set

At least:

```text
200 Taglish emergency reports
```

with labels for:

- category;
- people affected;
- trapped;
- injured;
- incident location phrase;
- urgency;
- relevant landmarks.

## 44.2 Incident pair set

At least:

```text
500 report pairs
```

label:

```text
same_incident
different_incident
uncertain
```

## 44.3 Contradiction set

At least:

```text
100 conflicting report pairs
```

## 44.4 Relay fixtures

Create deterministic bundles:

```text
small
medium
large
corrupted
duplicated
out_of_order
expired
```

---

# 45. Phase 40 — Implementation Order

Do not build everything simultaneously.

Recommended sequence:

```text
PHASE 0
Baseline + contracts
        ↓
PHASE 1
Canonical report model
        ↓
PHASE 2
AI extraction
        ↓
PHASE 3
Incident aggregation
        ↓
PHASE 4
Corroboration
        ↓
PHASE 5
Evidence layer
        ↓
PHASE 6
Freshness
        ↓
PHASE 7
Known / unknown
        ↓
PHASE 8
Coverage
        ↓
PHASE 9
Explainable priority
        ↓
PHASE 10
Propagation state
        ↓
PHASE 11
Relay abstraction
        ↓
PHASE 12
QR relay
        ↓
PHASE 13
Priority relay
        ↓
PHASE 14
Deduplication
        ↓
PHASE 15
Gateway mode
        ↓
PHASE 16
Server sync
        ↓
PHASE 17
Incident lifecycle
        ↓
PHASE 18
What Changed
        ↓
PHASE 19
Contradictions
        ↓
PHASE 20
Location intelligence
        ↓
PHASE 21
Situation map
        ↓
PHASE 22
Nearby context
        ↓
PHASE 23
Hazard correlation
        ↓
PHASE 24
Security hardening
        ↓
PHASE 25
Responder auth
        ↓
PHASE 26
Database hardening
        ↓
PHASE 27
API hardening
        ↓
PHASE 28
Offline hardening
        ↓
PHASE 29
Mobile UI
        ↓
PHASE 30
Responder dashboard
        ↓
PHASE 31
Change engine
        ↓
PHASE 32+
Full testing, evaluation, pilot
```

---

# 46. Recommended Git Branch Strategy

Keep the implementation traceable.

Use one branch per major architecture phase, not one branch per tiny feature.

```text
main
 │
 ├── architecture/situation-intelligence
 │
 ├── feature/report-model
 │
 ├── feature/incident-engine
 │
 ├── feature/evidence-layer
 │
 ├── feature/coverage-intelligence
 │
 ├── feature/relay-core
 │
 ├── feature/qr-relay
 │
 ├── feature/gateway-mode
 │
 ├── feature/responder-situation-board
 │
 └── hardening/disaster-e2e
```

Each branch should include:

```text
implementation
tests
fixtures
documentation
acceptance evidence
```

---

# 47. Recommended Repository Structure

```text
agapai/
├── web/                       # PRIMARY PWA
│   ├── src/
│   │   ├── app/
│   │   ├── activation/
│   │   ├── report/
│   │   ├── triage/
│   │   ├── incidents/
│   │   ├── evidence/
│   │   ├── corroboration/
│   │   ├── freshness/
│   │   ├── coverage/
│   │   ├── priority/
│   │   ├── relay/
│   │   │   ├── core/
│   │   │   ├── qr/
│   │   │   └── transports/
│   │   ├── gateway/
│   │   ├── queue/
│   │   ├── alerts/
│   │   ├── nearby/
│   │   ├── medical/
│   │   ├── checkin/
│   │   ├── offline/
│   │   ├── storage/
│   │   ├── crypto/
│   │   └── a11y/
│   ├── public/
│   │   ├── manifest.webmanifest
│   │   ├── icons/
│   │   └── emergency-fallback/
│   └── sw/
│
├── server/                    # OPTIONAL ONLINE COORDINATION
│   ├── routes/
│   ├── incident/
│   ├── priority/
│   ├── geo/
│   ├── ingest/
│   ├── normalize/
│   ├── redact/
│   └── relay/
│
├── responder/                 # RESPONDER/GATEWAY WEB SURFACES
├── agapai-jurisdiction/       # Offline-capable resolver/data
├── shared/                    # Shared types + schemas
├── eval/
├── contracts/
├── docs/
└── scripts/
```

## 47.1 Route strategy

One deployed PWA can expose role-specific routes:

```text
/                         citizen home
/report                   emergency report
/incidents/:id            citizen incident status
/relay                    QR relay
/gateway                  gateway mode
/responder                responder board
/responder/incidents/:id responder incident detail
/settings                 settings
```

The citizen emergency shell should be locally cacheable and should not require an active API request merely to open.

# 48. Phase Exit Criteria

Every phase must have an explicit "done" condition.

## Incident Engine — done when

- same-event reports group correctly on labelled fixtures;
- unrelated reports remain separated;
- grouping is deterministic;
- every merged incident retains source report IDs;
- no raw report is deleted because it was grouped.

## Corroboration — done when

- report count and independent-source count are always separate;
- duplicate device submissions do not inflate independent-source count.

## Evidence — done when

- every incident can render an evidence timeline;
- provenance is retained;
- responder actions are distinct from citizen observations.

## Freshness — done when

- incidents automatically become stale;
- stale UI is visible;
- new observation refreshes freshness.

## Coverage — done when

- no-report areas are rendered;
- no-report never equals safe;
- expected administrative areas are represented.

## Relay — done when

- encrypted bundle can move device-to-device;
- partial transfer can resume;
- duplicates are rejected;
- receipts are generated;
- critical reports move first.

## Gateway — done when

- gateway receives offline reports;
- local situation board works offline;
- gateway sync is idempotent;
- responder status changes are authenticated.

## Responder board — done when

- incidents are sortable;
- evidence is inspectable;
- "what changed" works;
- stale information is visually explicit;
- operational states come from real events.

---

# 49. Feature Priority

Use this as the implementation priority model.

## Tier A — Must build

```text
1. Canonical report model
2. Incident aggregation
3. Corroboration
4. Evidence timeline
5. Freshness
6. Honest propagation state
7. Encrypted QR relay
8. Gateway mode
9. What Changed
10. Known / unknown
```

## Tier B — High-value

```text
11. Coverage
12. Explainable priority
13. Contradiction engine
14. Responder authentication
15. Evidence-aware situation map
16. Reporter vs incident location
```

## Tier C — Later

```text
17. Native Bluetooth / Wi-Fi mesh
18. Background Android carry service
19. Satellite uplink
20. SMS integration for emergency relay
21. richer cross-platform mesh
22. advanced evidence capture
```

Do not delay the core product waiting for mesh networking.

QR relay provides a practical first transport.

---

# 50. Minimal Viable "AgapAI Situation Intelligence"

If implementation time becomes constrained, ship exactly this subset:

```text
VOICE/TEXT
   ↓
STRUCTURED REPORT
   ↓
INCIDENT GROUPING
   ↓
CORROBORATION
   ↓
FRESHNESS
   ↓
EVIDENCE
   ↓
OFFLINE QUEUE
   ↓
QR RELAY
   ↓
GATEWAY
   ↓
RESPONDER BOARD
```

And the responder board must show:

```text
WHAT IS HAPPENING
HOW MANY REPORTS
HOW MANY INDEPENDENT SOURCES
HOW FRESH
WHERE
WHAT IS NOT KNOWN
WHAT CHANGED
HAS A RESPONDER ACKNOWLEDGED IT
```

That is the smallest architecture that captures the highest-value PASAbi influence.

---

# 51. Final Product Behavior

The intended behavior after implementation is:

### Before connectivity fails

AgapAI works normally:

```text
voice
→ AI
→ location
→ jurisdiction
→ report
```

### During connectivity failure

AgapAI still:

```text
captures
→ structures
→ stores
→ groups
→ corroborates
→ ages
→ relays
```

### When users encounter each other

```text
report
→ encrypted relay
→ receipt
```

### When a gateway is reached

```text
reports
→ gateway
→ local situation picture
```

### When internet returns

```text
gateway
→ server
→ responder
```

### At every step

AgapAI distinguishes:

```text
OBSERVED
INFERRED
CORROBORATED
UNKNOWN
STALE
RECEIVED
ACKNOWLEDGED
```

and never silently promotes one category into another.

---

# 52. Final Acceptance Checklist

Before calling this architecture production-ready:

## Emergency path

- [ ] Voice path works
- [ ] Text path works
- [ ] Tap path works
- [ ] Gesture path works
- [ ] No permission path still produces a useful report
- [ ] No GPS path still produces a useful report
- [ ] No AI path still produces a useful report
- [ ] No data path still stores the report

## Incident intelligence

- [ ] Reports can aggregate into incidents
- [ ] Unrelated reports do not merge
- [ ] Corroboration is independent-source aware
- [ ] Evidence timeline is complete
- [ ] Freshness is automatic
- [ ] Unknowns are explicit
- [ ] Contradictions are visible
- [ ] Coverage is visible
- [ ] "No reports" never means "safe"

## Relay

- [ ] QR relay works in airplane mode
- [ ] Bundles are encrypted
- [ ] Bundle integrity is verified
- [ ] Partial QR transfers recover
- [ ] Duplicate reports deduplicate
- [ ] Priority reports transfer first
- [ ] Relay receipts are honest

## Gateway

- [ ] Gateway works offline
- [ ] Gateway stores reports durably
- [ ] Gateway builds a local situation picture
- [ ] Gateway can sync later
- [ ] Sync is idempotent
- [ ] Gateway cannot forge responder acknowledgment

## Responder

- [ ] Incident board works
- [ ] Evidence can be inspected
- [ ] What Changed works
- [ ] Coverage works
- [ ] Stale reports are visible
- [ ] Responder state is authenticated
- [ ] No UI overclaims dispatch

## Safety

- [ ] No background tracking
- [ ] No continuous location sharing
- [ ] No plaintext medical data in relay
- [ ] No invented jurisdiction
- [ ] No invented agency data
- [ ] No invented phone numbers
- [ ] Official hazard text remains attributed
- [ ] Citizen observations remain distinguishable from confirmed operational facts

---

# 53. Recommended First Build Sprint

Do not start with mesh networking.

Build this exact slice first:

```text
SPRINT 1

Canonical Report
        ↓
Incident Grouping
        ↓
Corroboration
        ↓
Evidence Timeline
        ↓
Freshness
        ↓
Responder "What Changed"
```

Then:

```text
SPRINT 2

Offline queue
        ↓
Relay abstraction
        ↓
Encrypted QR relay
        ↓
Receipts
```

Then:

```text
SPRINT 3

Gateway
        ↓
Sync
        ↓
Responder board
```

Then:

```text
SPRINT 4

Coverage
        ↓
Known / Unknown
        ↓
Contradictions
        ↓
Situation map
```

Then:

```text
SPRINT 5

Security hardening
        ↓
Fault injection
        ↓
E2E disaster scenarios
        ↓
Pilot preparation
```

---

# 54. Core Design Rule to Preserve

> **AI interprets. Geometry resolves. Evidence corroborates. Time ages. Relay transports. Responders decide.**

This should become the guiding architectural sentence for the combined AgapAI system.



# 54. Final Database Decision

## 54.1 Central database is optional for the emergency path

AgapAI **does not require PostgreSQL/PostGIS for the emergency workflow on the user's device**.

Minimum edge architecture:

```text
PWA
 ↓
Service Worker
 ↓
IndexedDB
 ↓
Local incident/evidence engine
 ↓
Encrypted QR relay
```

## 54.2 Local persistence is still required

The system needs durable local persistence for:

- reports;
- incident state;
- evidence;
- relay queue;
- propagation receipts;
- region packs;
- sync metadata.

Therefore the correct statement is:

> **Database locally, cloud database optionally.**

## 54.3 When PostgreSQL + PostGIS becomes useful

Introduce centralized persistence when the pilot needs:

- multi-gateway synchronization;
- centralized incident history;
- cross-barangay spatial queries;
- responder access across locations;
- historical analytics;
- multi-LGU coordination.

## 54.4 Cloud is additive

Correct:

```text
EDGE
 ↓
works without cloud
 ↓
cloud synchronization adds capability
```

Incorrect:

```text
cloud database
 ↓
PWA must reach cloud
 ↓
only then can emergency workflow begin
```

The second model violates the edge-first goal.

# 55. Final Platform Statement

> **AgapAI is an installable, edge-first emergency PWA. Each device owns a durable local copy of the reports and evidence it has observed or received. Incidents, corroboration, freshness, priority, and coverage can be derived locally. Encrypted relay moves urgent observations between devices without requiring the internet. A gateway can assemble a local community situation picture. When connectivity returns, the gateway or device synchronizes with optional cloud infrastructure.**

The cloud should make AgapAI **more connected**, not make AgapAI **exist**.

> **AI interprets. Geometry resolves. Evidence corroborates. Time ages. Relay transports. Gateways consolidate. Responders decide.**

# 56. Recommended Technology Stack

| Layer | Recommendation | Reason |
|---|---|---|
| Frontend | React + TypeScript | Shared citizen/gateway/responder UI |
| Build | Vite | Fast PWA-oriented build pipeline |
| PWA | Service Worker + Web App Manifest | Home Screen install + offline shell |
| Local persistence | IndexedDB | Durable browser-side edge storage |
| Cryptography | Web Crypto API | Encrypted local/relay payloads |
| Maps | MapLibre GL JS | Flexible web mapping |
| Backend | Node.js + TypeScript | Optional online coordination |
| Central DB | PostgreSQL + PostGIS | Optional server history/spatial coordination |
| Gateway | Same PWA | Avoid separate gateway software |
| Responder | Same PWA / dedicated route | Single deployable product surface |
| AI | Hosted ASR/LLM + deterministic fallback | Retain voice advantage without cloud dependency |

## 56.1 First deployable architecture

For the first hackathon/pilot build, PostgreSQL can be omitted:

```text
React PWA
 +
Service Worker
 +
IndexedDB
 +
Local incident engine
 +
Encrypted QR relay
 +
Gateway PWA
```

Add the cloud API and PostgreSQL/PostGIS only when centralized synchronization, history, or multi-gateway coordination is needed.

# 57. Recommended First Build Sprint

Build this exact vertical slice first:

```text
PWA HOME SCREEN APP
        ↓
CANONICAL REPORT
        ↓
LOCAL INCIDENT GROUPING
        ↓
CORROBORATION
        ↓
EVIDENCE TIMELINE
        ↓
FRESHNESS
        ↓
OFFLINE QUEUE
        ↓
ENCRYPTED QR RELAY
        ↓
GATEWAY PWA
        ↓
RESPONDER SITUATION BOARD
```

Do not begin with native Back Tap, Bluetooth mesh, or a centralized database. Prove that the web app can remain useful, preserve state, share urgent information, and reconstruct a local situation picture without the cloud first.
