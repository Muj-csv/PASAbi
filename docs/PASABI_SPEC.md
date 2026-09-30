# PASAbi — Implementation Specification & Feature Roadmap

> **Purpose:** Implementation-ready specification derived from the PASAbi Product Context & Strategic Direction.
>
> **Core principle:** **When the network goes down, the local situation picture stays alive.**

---

## 1. Product Definition

PASAbi is an **offline edge layer for disaster-response systems** that preserves, structures, corroborates, and reconstructs local situation information when normal connectivity becomes unavailable.

The core pipeline is:

```text
Person
  ↓
Observation
  ↓
Evidence
  ↓
Incident
  ↓
Corroboration
  ↓
Situation Picture
  ↓
Gateway
  ↓
Existing Responder System
```

PASAbi should primarily preserve and propagate **structured observations**, not simply transmit messages.

### Product question

> **What do we actually know right now, locally, even though the network is down?**

---

# 2. Development Priorities

Implement and validate work in approximately this order:

1. **Real-device offline transport validation**
2. **Incident Passport**
3. **Purok Sweep / information-gap workflow**
4. **Security and privacy hardening**
5. **Real barangay field testing**
6. **Interoperability/API design**
7. **Category-specific clustering/rules**
8. Cosmetic and advanced features only after the above are sufficiently validated

Do not add features merely because they sound impressive.

Every feature should strengthen the ability to maintain a trustworthy local situation picture during connectivity disruption.

---

# 3. Feature 1 — Incident Passport

## 3.1 Goal

Create a standardized, portable representation of an incident that can be stored and transferred offline and handed to an external disaster-response system when connectivity returns.

The Incident Passport must not require another system to become part of the PASAbi ecosystem.

## 3.2 Required Data

An Incident Passport should support the following fields where applicable:

```text
incidentId
category
location
affectedPeople
firstObservedAt
lastObservedAt
freshness
reportCount
independentSourceCount
evidenceTimeline
currentStatus
uncertainty
unknowns
spatialExtent
propagationHistory
supportingEvidence
```

### Suggested conceptual structure

```json
{
  "incidentId": "INC-...",
  "category": "flood",
  "location": {},
  "affectedPeople": 0,
  "firstObservedAt": "...",
  "lastObservedAt": "...",
  "freshness": {},
  "reportCount": 0,
  "independentSourceCount": 0,
  "evidenceTimeline": [],
  "currentStatus": "active",
  "uncertainty": [],
  "unknowns": [],
  "spatialExtent": {},
  "propagationHistory": [],
  "supportingEvidence": []
}
```

The exact field names should follow existing PASAbi conventions where those already exist.

## 3.3 Offline Requirements

The Incident Passport must be usable without internet access.

It should support:

- Local display
- Local storage
- Device-to-device transfer
- QR export
- Re-import from QR
- Optional printing

The Passport must remain understandable even when separated from the original UI.

## 3.4 Online / Recovery Requirements

When connectivity returns, the same Passport should be transformable into:

- JSON
- API payload
- CSV
- PDF
- Other standardized formats later

Do not implement specific third-party integrations yet unless explicitly requested.

Instead, create a clean export abstraction.

### Suggested abstraction

```text
Incident
   ↓
IncidentPassport
   ↓
Exporter
   ├── JSON
   ├── CSV
   ├── PDF
   └── API
```

## 3.5 Evidence Preservation

The Passport must preserve the distinction between:

- A report
- Evidence supporting the report
- Corroboration
- Derived incident state
- Unknown information

Do not convert an observation into an absolute fact simply because it has been incorporated into an incident.

---

# 4. Feature 2 — Purok Sweep

## 4.1 Goal

Turn the principle:

> **No reports ≠ safe**

into an operational workflow.

PASAbi should identify areas where the local situation picture is incomplete and allow an operator or volunteer to deliberately collect new observations.

## 4.2 Information Gaps

The system should identify areas with one or more of:

- No reports
- Stale reports
- Insufficient corroboration
- Poor coverage
- Unresolved uncertainty

These areas should be represented as **information gaps**, not automatically as safe or unsafe areas.

## 4.3 Purok Sweep Workflow

```text
Situation Picture
      ↓
Detect Information Gap
      ↓
Create Purok Sweep
      ↓
Assign / Start Sweep
      ↓
Collect Observations Offline
      ↓
Confirm Observations
      ↓
Add Observations to Local Evidence Store
      ↓
Reconstruct Incidents
      ↓
Update Situation Picture
      ↓
Recalculate Information Gaps
```

## 4.4 Sweep Categories

A sweep should be able to collect observations for:

- Flooding
- Trapped persons
- Medical needs
- Road blockage
- Food/water needs
- Evacuation/shelter status
- Safe check-ins

The implementation should allow categories to be extended later.

## 4.5 Example

```text
PUROK 3 — INFORMATION GAP

[ ] Flooding
[ ] Trapped persons
[ ] Medical needs
[ ] Road blockage
[ ] Food/water needs
[ ] Evacuation / shelter status
[ ] Safe check-ins

        ↓

Volunteer performs sweep offline.

        ↓

New observations are recorded.

        ↓

Observations propagate to participating devices.

        ↓

Local situation picture is reconstructed.
```

## 4.6 Sweep Requirements

A sweep should record at minimum:

```text
sweepId
targetArea
createdAt
startedAt
completedAt
assignedOperator (if applicable)
requestedCategories
observationsCollected
coverageStatus
remainingUnknowns
```

A sweep must remain usable without internet access.

---

# 5. Information-Gap Model

The system must distinguish between:

```text
Known
Unknown
Stale
Insufficiently corroborated
No data
```

### Important rule

**No reports must never automatically become "safe."**

For example:

```text
Purok 3
Reports: 0
Status: INFORMATION GAP
```

is valid.

This is different from:

```text
Purok 3
Reports: 0
Status: SAFE
```

which must not be inferred.

## 5.1 Gap Detection

The exact thresholds should remain deterministic and configurable.

Potential gap signals include:

```text
reportCount == 0
lastObservedAt is too old
independentSourceCount below required threshold
spatial coverage insufficient
incident uncertainty unresolved
```

Do not hide the reason an area was marked as an information gap.

The UI should be able to explain:

```text
Information gap because:
- No observations received
- Last observation is stale
- Only one source reported the area
```

---

# 6. Incident Clustering

The current deterministic clustering approach should remain explainable.

## 6.1 Known Problem

A transitive chain can incorrectly combine geographically distant reports:

```text
A ↔ B ↔ C ↔ D
```

A and D may end up in the same incident even though they are far apart.

Do not replace the current clustering logic casually.

## 6.2 Future Improvements

Potential deterministic improvements:

- Category-specific thresholds
- Spatial extent warnings
- Cluster confidence
- Representative centroid
- Maximum incident radius
- Temporal decay
- Category-dependent clustering behavior

Every change must preserve:

- Determinism
- Explainability
- Reproducibility

The system should be able to explain why observations were grouped together.

---

# 7. Corroboration

PASAbi must continue distinguishing:

```text
Report Count
```

from:

```text
Independent Source Count
```

However:

> **Device ≠ Human**

Multiple devices may belong to one person or household.

Therefore, device diversity must not be presented as proof of independent human confirmation.

Use source diversity as an **evidence-quality indicator**, not absolute truth.

---

# 8. Evidence and Uncertainty

The system must preserve the difference between:

```text
Observation
Evidence
Corroboration
Derived Incident
Known Information
Unknown Information
```

### Rules

1. Evidence should be preserved.
2. Original report information should not be silently overwritten.
3. Corroboration should remain distinguishable from report count.
4. Uncertainty must remain visible.
5. Missing information must remain visible.
6. Derived incident state must be explainable.

---

# 9. AI Usage

AI may be used as an **input-assistance layer**.

## 9.1 Allowed

Example:

User says:

```text
"May baha sa Purok 3, around ten houses affected."
```

AI proposes:

```text
Category: Flood
Area: Purok 3
Affected: 10 households
Original report text: preserved
```

Human confirms.

The deterministic PASAbi engine then processes the confirmed structured observation.

## 9.2 Not Allowed

Do not use AI as the authority that:

- Creates truth
- Invents locations
- Arbitrarily changes severity
- Merges incidents without deterministic rules
- Declares incidents resolved
- Claims responders were notified
- Determines emergency priority without explainable rules

Human confirmation remains important.

---

# 10. Offline Transport Validation

The software/data model is more mature than the proven physical networking layer.

Before relying on the transport system operationally, validate it on real devices.

## 10.1 Test Areas

Test:

- Phone-to-phone propagation
- QR transfer reliability
- Bluetooth/native transport
- Interrupted transfers
- Partial transfers
- Duplicate observations
- Battery consumption
- Human interaction time
- Multi-device propagation
- Repeated propagation across multiple devices

## 10.2 Key Question

Do not only ask:

> "Does the protocol work in tests?"

Ask:

> **"Can a real barangay operator use this during a stressful, disconnected disaster?"**

## 10.3 Suggested Test Metrics

| Metric | Measurement |
|---|---|
| Propagation | Time required for information to reach another station |
| Reliability | Percentage of successful transfers |
| Human friction | Time and interactions required to perform a transfer |
| Battery | Battery consumption during operation |
| Correctness | Whether devices converge toward the same situation picture |
| Clustering | Frequency of incorrect incident merges |
| Coverage | Ability to identify information gaps |
| Comprehension | Ability of an operator to understand the situation quickly |
| Recovery | Ability to hand accumulated information to connected systems |

---

# 11. Deployment / Readiness

PASAbi should primarily be treated as prepared disaster-resilience infrastructure rather than simply a consumer app.

## 11.1 Pre-Deployment Workflow

Provide support for:

```text
Station Setup
    ↓
Device Preparation
    ↓
Barangay Configuration
    ↓
Volunteer Preparation
    ↓
Offline Test
    ↓
Readiness Check
```

The goal is to minimize deployment friction before an actual disaster.

## 11.2 Initial Operational User

The strongest initial operational user is expected to be:

- Barangay disaster-response personnel
- BDRRMC
- Designated local station operators

Residents and volunteers remain important information sources.

---

# 12. Security and Privacy

Treat security and privacy as production requirements.

Potentially sensitive information includes:

- Precise location
- Timestamps
- Emergency status
- Medical needs
- Vulnerable individuals
- Household information
- Device identity

## 12.1 Required Areas

Plan for:

- Encryption
- Responder authentication
- Access control
- Secure transport
- Device compromise
- Data retention
- Data deletion
- Threat modeling
- Sensitive-location handling

Do not sacrifice these concerns merely to make a demo look more advanced.

---

# 13. Interoperability

PASAbi should not become a closed ecosystem.

Target architecture:

```text
PASAbi Local Network
        ↓
     Gateway
        ↓
Incident Passport / API
        ↓
Existing LGU / DRRM System
```

Not:

```text
PASAbi → PASAbi forever
```

## 13.1 Initial Implementation

Do not build specific third-party integrations unless requested.

First create:

- Stable Incident Passport representation
- Export interfaces
- Gateway abstraction
- API-ready data model

---

# 14. Recovery / Connectivity Restoration

When connectivity returns, accumulated local information should be recoverable and transferable.

The recovery flow should be:

```text
Offline Observations
      ↓
Local Evidence Store
      ↓
Reconstructed Incidents
      ↓
Incident Passport
      ↓
Gateway
      ↓
Connected Responder System
```

The system must not falsely claim that responders were notified simply because connectivity returned.

Successful transmission should be explicitly distinguishable from:

```text
Prepared for transmission
Transmission attempted
Transmission failed
Transmission confirmed
```

---

# 15. Product UI Requirements

The UI should help an operator quickly answer:

1. What is happening?
2. Where is it happening?
3. How recently was it observed?
4. How many reports exist?
5. How many independent sources contributed?
6. What evidence exists?
7. What remains uncertain?
8. Which areas need further checking?

## 15.1 Situation Picture

The main operational view should prioritize:

```text
ACTIVE INCIDENTS
INFORMATION GAPS
STALE INFORMATION
UNCERTAINTIES
RECENT EVIDENCE
SWEEPS IN PROGRESS
```

Avoid unnecessary giant dashboards or visualizations that do not improve responder comprehension.

---

# 16. Feature Exclusions

Do not prioritize the following unless a demonstrated field requirement emerges:

- Chatbot
- Social feed
- Public messaging
- Blockchain
- Generic AI assistant
- Predictive disaster AI
- Computer vision
- Unnecessary IoT integrations
- Giant interactive maps
- Unnecessary gamification
- Unnecessary wearable support
- Complicated analytics dashboards

The question for every feature is:

> **Does this strengthen trustworthy local situation awareness during connectivity disruption?**

---

# 17. Implementation Checklist

## Phase A — Foundation

- [ ] Confirm existing observation/evidence/incident models
- [ ] Confirm existing deterministic clustering behavior
- [ ] Confirm existing freshness and uncertainty representation
- [ ] Identify existing transport abstractions
- [ ] Identify existing local persistence layer

## Phase B — Incident Passport

- [ ] Define `IncidentPassport`
- [ ] Map incident state into Passport
- [ ] Include evidence timeline
- [ ] Include source/corroboration information
- [ ] Include uncertainty and unknowns
- [ ] Include propagation history
- [ ] Implement local serialization
- [ ] Implement QR export/import
- [ ] Implement JSON export
- [ ] Add CSV export
- [ ] Add PDF export if needed
- [ ] Add exporter abstraction for future APIs
- [ ] Add tests for round-trip serialization

## Phase C — Information Gaps

- [ ] Define information-gap model
- [ ] Detect areas with no reports
- [ ] Detect stale areas
- [ ] Detect insufficient corroboration
- [ ] Detect poor coverage
- [ ] Detect unresolved uncertainty
- [ ] Explain why each gap exists
- [ ] Ensure "no reports" does not become "safe"

## Phase D — Purok Sweep

- [ ] Define sweep model
- [ ] Define target area
- [ ] Define requested observation categories
- [ ] Start sweep offline
- [ ] Record observations offline
- [ ] Confirm observations
- [ ] Add observations to evidence store
- [ ] Reconstruct incidents
- [ ] Update situation picture
- [ ] Recalculate information gaps
- [ ] Track unresolved sweep items
- [ ] Support multiple sweeps

## Phase E — Transport Validation

- [ ] Test phone-to-phone propagation
- [ ] Test QR transfer
- [ ] Test Bluetooth/native transport
- [ ] Test interrupted transfers
- [ ] Test partial transfers
- [ ] Test duplicate handling
- [ ] Test multi-device propagation
- [ ] Measure transfer time
- [ ] Measure battery impact
- [ ] Test convergence of situation state

## Phase F — Security

- [ ] Threat model
- [ ] Review sensitive fields
- [ ] Add authentication where required
- [ ] Add access control
- [ ] Review local storage security
- [ ] Review transport security
- [ ] Define retention policy
- [ ] Define deletion behavior
- [ ] Address sensitive-location handling
- [ ] Test compromised-device scenarios

## Phase G — Field Validation

- [ ] Simulate a disconnected disaster
- [ ] Use multiple real devices
- [ ] Include operators with minimal technical training
- [ ] Measure propagation
- [ ] Measure reliability
- [ ] Measure human friction
- [ ] Measure battery use
- [ ] Measure comprehension
- [ ] Measure information-gap detection
- [ ] Test connectivity recovery
- [ ] Record field problems before adding features

---

# 18. Acceptance Criteria

## Incident Passport

The feature is ready for initial use when:

- An incident can be represented as a portable Passport.
- Passport data can be stored offline.
- Passport data can be transferred offline.
- Passport data can be reconstructed without losing evidence context.
- Evidence, corroboration, uncertainty, and unknowns remain distinguishable.
- Passport data can be exported into at least one machine-readable format.
- The architecture allows additional exporters later.

## Purok Sweep

The feature is ready for initial use when:

- The system can identify an information gap.
- An operator can start a sweep without internet access.
- The operator can record observations offline.
- Observations are incorporated into the local evidence store.
- The situation picture updates after observations are processed.
- Information gaps are recalculated.
- The system never equates absence of reports with safety.

## Offline Transport

The transport layer is ready for broader field testing when:

- Transfers succeed reliably across tested devices.
- Duplicate observations do not corrupt the situation picture.
- Interrupted transfers can recover safely.
- Multiple devices converge on compatible state.
- Transfer time is acceptable for actual operators.
- Battery impact is measured.
- Operators can perform transfers without excessive technical steps.

---

# 19. Testing Principles

For every new feature, test both:

### Connected mode

```text
Normal connectivity
```

and:

### Disconnected mode

```text
No internet
No cellular service
No cloud API
```

Critical functionality must remain usable in disconnected mode.

Also test:

- Duplicate data
- Stale data
- Missing data
- Conflicting observations
- Partial transfers
- Device restarts
- Interrupted operations
- Multiple sources
- Repeated propagation
- Connectivity restoration

---

# 20. Future Decision Rule

Before implementing a new feature, evaluate it against these questions:

1. Does it improve operation during connectivity loss?
2. Does it improve evidence quality?
3. Does it reduce uncertainty?
4. Does it improve responder decision support?
5. Does it improve interoperability?
6. Does it reduce deployment friction?
7. Does it improve trust/security?
8. Does it solve a demonstrated field problem?

If the answer is **no to most of these**, do not prioritize the feature.

---

# 21. Product Narrative

## Problem

During major disasters, people closest to the situation may lose the connectivity required to report what they are seeing.

## Existing Gap

Connected disaster-response platforms can aggregate and coordinate information, but they depend on a functioning communication path.

## PASAbi

PASAbi keeps a structured local evidence network alive even when normal connectivity is unavailable.

## Mechanism

```text
Residents / Volunteers / Responders
              ↓
         Observations
              ↓
      Local Device Exchange
              ↓
    Evidence + Corroboration
              ↓
     Deterministic Incidents
              ↓
       Situation Picture
```

## Result

Responders can see:

- What is happening
- Where it is happening
- How recently it was observed
- How many independent sources contributed
- What evidence exists
- What remains uncertain
- Which areas need further checking

## Recovery

When connectivity returns, the information can be handed back to existing disaster-response infrastructure.

---

# 22. One-Sentence Positioning

> **PASAbi is an offline disaster-response edge layer that keeps local evidence and situation awareness alive when connectivity fails, then reconnects that information to existing response systems when the network returns.**

### Short tagline

> **When the network goes down, the situation picture stays alive.**

---

# 23. Most Important Strategic Principle

Do not turn PASAbi into a larger collection of features.

Make its central capability deeper:

> **A community can lose the internet without losing its shared understanding of what is happening.**

Everything implemented in PASAbi should reinforce that idea.
