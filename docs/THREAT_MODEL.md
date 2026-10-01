# PASAbi: Threat model, retention and sensitive data (P6, spec §12)

**Date:** 2026-10-01. **Status:** first pass, to review with the team before field use.
PASAbi holds disaster reports in a barangay: where people are trapped, who needs medical help, which houses are empty. Treat it as sensitive even though no names are collected.

## 1. What is sensitive

| Data | Where it lives | Why it matters |
|---|---|---|
| Precise location (lat/lon) | Observations; Passport exports | Points at homes, at vulnerable people, and at empty houses (looting) |
| Medical and people notes | `note`, `people`, category MEDICAL | Health information about identifiable households |
| Device ID | `device_id` on every observation | Pseudonymous, but stable: it can link one phone's reports over time |
| Timestamps | Every observation | Together with location, they show movement patterns |
| Station PIN | Hashed, salted with the device ID | Only hides a UI mode; it protects no data (stated in the UI) |

## 2. Threats and responses

| # | Threat | Today | Response |
|---|---|---|---|
| T1 | **Lost or stolen phone** | Data sits in the browser's IndexedDB, not encrypted at rest | **Accepted for now.** The OS lock screen and device encryption are the protection. **Clear this phone** (Settings) wipes it. Web apps can't hold a key safely without a passphrase; a passphrase prompt in a disaster is its own risk. |
| T2 | **Malicious QR injection** (fake reports) | Every received item goes through `receiveObservations()`: shape-checked, never replaces what is held, StorePolicy-bounded. Rate limit applies to own reports only. | **Accepted with mitigation.** Corroboration counts *phones*, and every screen says so. One phone can't make an incident look "strongly corroborated". Signatures (`sig`) are reserved for later (ADR, deferred). |
| T3 | **Replay** of old bundles | Duplicates are ignored by ID, and expiry (72 h TTL) drops old ones | **Mitigated** |
| T4 | **Fake station** (receipt says "station") | The receipt role is trusted, not verified (BR-015, stated in the UI) | **Accepted.** The "AT STATION" stamp is labelled as what the receiver claimed. A real fix needs station keys (see §4). |
| T5 | **Location leak in exports** | Passport JSON / CSV / Copy | **Fixed (P6):** exports are **coarse by default** (about 110 m: 3 decimals, accuracy dropped). Exact location is an explicit per-export choice. The QR stays exact, because the receiving phone's engine needs it to group reports. |
| T6 | **Compromised or misused gateway** | Supabase anon key in the bundle; RLS allows insert/upsert and reading a view only (`db/rls.sql`) | **Mitigated.** No service key anywhere (a CI check enforces it). The responder view is readable by anyone with the URL: **see §3, open item.** |
| T7 | **Interception over the air** | QR is visible to anyone nearby | **Accepted** (it's line-of-sight by design). |

## 3. Open items (decide before a real deployment)

1. **Responder authentication.** Put the responder view behind Supabase Auth (email OTP or magic link for MDRRMO staff), with RLS reads limited to authenticated responders. Needs the Supabase project set up, which is a human task. Until then, don't put the responder URL anywhere public.
2. **Station identity.** Fixing T4 needs a key per station, made at setup, whose public half other phones learn (e.g. by QR at a readiness drill). It is designed here, not built.
3. **Transport encryption.** A shared community key only obscures QR content: anyone with the app has it. Real confidentiality needs per-recipient keys, which conflicts with "any phone can carry for anyone". **Decision needed** on whether confidentiality between residents is a goal at all, given that reports are meant to spread.

## 4. Retention and deletion

- **Observations expire after 72 hours** (24 hours for safe check-ins): `TTL_SECONDS` in `rules.ts`, applied on every write.
- **Capacity limits** (500 resident, 3,000 station) evict the oldest first, but never the phone's own reports before they are uploaded.
- **Own report delete:** My reports → Delete. It is local only; copies already passed on stay, and the UI says so.
- **Clear this phone:** Settings → Clear this phone (two taps). It deletes PASAbi's whole local database (reports, station setup, logs, sweeps) on this phone only.
- **Server retention** (Supabase): an operator task (D-008), not done from the app.
- **Logs:** the field-test log and sweep records never leave the phone, except by a deliberate export.
