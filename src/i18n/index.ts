import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import type {
  Category,
  CorroborationLevel,
  IncidentChange,
  IncidentStatus,
} from "@pasabi/core";

export type Lang = "en" | "fil";

const LANG_KEY = "pasabi.lang.v1";

const en = {
  appName: "Pasabi",
  tagline: "When the towers fall, the barangay passes it on.",
  newObservation: "New observation",
  categoryPrompt: "What is happening?",
  peopleAffected: "People affected (optional)",
  /** The same field read back rather than filled in, so no "(optional)". */
  peopleAffectedShort: "People affected",
  note: "Short note (optional)",
  noteCounter: "characters left",
  areaLabel: "Purok or landmark",
  areaRequiredNoGps: "No GPS fix, so a purok or landmark is required.",
  areaRequiredCheckin: "A safe check-in always needs a purok or landmark.",
  areaNeededToSave: "Still no location. Name the purok or landmark to save.",
  locating: "Getting location",
  locationFound: "Location attached",
  locationNone: "No location. Name the purok or landmark instead.",
  submit: "Record observation",
  saving: "Saving",
  saved: "Recorded.",
  rateLimited: "Six observations recorded this hour. Try again later.",
  myData: "My data",
  back: "Back",
  carrying: "Carrying",
  observationOne: "observation",
  observationMany: "observations",
  incidentOne: "incident",
  incidentMany: "incidents",
  mine: "Mine",
  carried: "Carried",
  deleteAction: "Delete",
  deleteNote:
    "Deleting removes it from this phone only. Copies already carried by others stay.",
  empty: "Nothing carried yet.",
  languageName: "Filipino",
  reporterOne: "reporter",
  reporterMany: "reporters",
  spans: "spans",

  // Uplink and dashboard (FR-009, FR-010)
  dashboard: "Responder dashboard",
  dashboardIntro:
    "Rebuilt from uploaded observations using the same rules the phones use.",
  sinceLastSync: "Since your last visit",
  nothingChanged: "Nothing has changed since your last visit.",
  refresh: "Refresh",
  filterAll: "All categories",
  dashNotConnected:
    "The responder database isn't connected on this deployment yet.",
  dashDevDetail:
    "For developers: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  dashEmpty: "Nothing uploaded yet.",
  loadError: "Can't reach the database.",
  loading: "Loading uploaded reports…",
  corroborationCaveat:
    "Corroboration counts distinct devices, not people. One person carrying several phones can inflate it. Stations can resolve false incidents.",
  uploadNow: "Upload now",
  uploadedCount: "uploaded",
  pendingCount: "waiting to upload",
  uploadOffline: "Nothing uploaded. No database configured on this device.",

  // Station board (FR-006 to FR-008)
  stationMode: "Station mode",
  stationLocked: "Enter the station PIN",
  stationPinHint: "The first PIN entered here becomes this phone's PIN.",
  stationWrongPin: "That PIN does not match this phone.",
  stationUnlock: "Open the board",
  stationExit: "Leave station mode",
  board: "Situation board",
  markSeen: "Mark as seen",
  seenNever: "Mark as seen to start tracking what changes.",
  seenAt: "Changes since",
  changeNew: "NEW",
  changeEscalated: "ESCALATED",
  changeCorroborated: "MORE REPORTS",
  changeResolved: "RESOLVED",
  single: "single report",
  corroborated: "corroborated",
  stronglyCorroborated: "strongly corroborated",
  statusOpen: "Open",
  statusAcknowledged: "Acknowledged",
  statusResolved: "Resolved",
  firstSeen: "First",
  lastSeen: "Latest",
  extent: "Spans",
  whyRanked: "Why ranked here",
  acknowledge: "Acknowledge",
  resolve: "Resolve",
  observationsInIncident: "Observations in this incident",
  safePanel: "Safe check-ins",
  noIncidents: "No incidents yet.",
  scoreBase: "Category",
  scoreCorroboration: "Corroboration",
  scorePeople: "People affected",
  scoreUnacknowledged: "Not yet acknowledged",
  scoreStaleness: "Age",
  scoreTotal: "Total",
  scoreFloored: "Floored at 0. Resolved incidents always sort last.",

  // Evidence and freshness (R1, DESIGN_BRIEF section 12)
  reportOne: "report",
  reportMany: "reports",
  sourceOne: "source",
  sourceMany: "sources",
  lastReported: "Last reported {t} ago",
  staleLine: "Last known {t} ago — may have changed",
  staleBadge: "STALE",
  staleCount: "{n} stale",
  timeline: "Timeline",
  timelineReport: "Report",
  phone: "phone",
  incidentChanged: "This incident changed. Back to the board.",
  chooseCategoryFirst: "Choose what is happening first.",
  pinTooShort: "Enter at least 4 digits.",

  // QR bundle transfer (R2, DESIGN_BRIEF section 12)
  shareTitle: "Pass on by QR",
  shareHint: "Let the other phone scan this. Keep it steady and turn brightness up.",
  frameCounter: "Frame {i} of {n} · Page {p} of {P}",
  nextPage: "Next page",
  pause: "Pause",
  play: "Play",
  previousFrame: "Previous frame",
  nextFrame: "Next frame",
  scanReceipt: "Scan their receipt",
  swapHint: "To get their reports too, swap: they show, you scan.",
  scanTheirPhoneFirst: "Scan their phone first (optional)",
  skippingKnown: "Skipping what that phone already has.",
  nothingToShare: "Nothing to pass on yet.",
  receiptRecorded: "Receipt scanned: that phone received this page.",
  receiptStation: "It says it is a station.",
  receiptWrong: "That receipt is for a different page.",
  cancel: "Cancel",
  scanTitle: "Receive by QR",
  showIdFirst: "Show this to the sharer first (optional)",
  scanPointAt: "Point the camera at the other phone's QR code.",
  scanProgress: "{k} of {n} frames",
  scanDone: "Received {N} ({M} new)",
  showReceipt: "Show this receipt to the sharer",
  receiveAnother: "Receive another",
  wrongBundle: "That's a different code. Keep scanning this one.",
  scanFailed: "Those frames didn't read correctly. Keep scanning.",
  allowCamera: "Allow camera",
  cameraDenied:
    "PASAbi needs the camera to receive by QR. Allow it in Settings › Expo Go › Camera.",
  cameraUnavailable:
    "Camera scanning isn't available here. Use PASAbi on a phone to scan.",

  // Reporter status (R3, BR-015, DESIGN_BRIEF section 3a)
  stepSaved: "Saved on this phone",
  stepPassed: "Passed to another phone",
  stepStation: "Reached a station",
  stepUploaded: "Uploaded from this phone",
  stepGroupedOne: "Grouped with a report from 1 other phone",
  stepGrouped: "Grouped with reports from {n} other phones",
  stepFooter:
    "This shows only what this phone knows. It does not mean responders have seen it.",

  // Known / not yet reported (R4, BR-013, DESIGN_BRIEF section 12)
  knownHeading: "Reported nearby",
  unknownHeading: "Not yet reported nearby",
  unknownItem: "{category}: no report yet",
  peopleUnknown: "People affected: not reported",
  knownEmpty: "Nothing related reported nearby yet.",
  gapsShow: "What is known nearby",
  gapsHide: "Hide what is known nearby",
};

export type Strings = typeof en;

const fil: Strings = {
  appName: "Pasabi",
  tagline: "Kapag bumagsak ang signal, ang barangay ang magpapasa.",
  newObservation: "Bagong ulat",
  categoryPrompt: "Ano ang nangyayari?",
  peopleAffected: "Bilang ng apektado (opsyonal)",
  peopleAffectedShort: "Bilang ng apektado",
  note: "Maikling paliwanag (opsyonal)",
  noteCounter: "natitirang titik",
  areaLabel: "Purok o palatandaan",
  areaRequiredNoGps: "Walang GPS, kaya kailangan ang purok o palatandaan.",
  areaRequiredCheckin:
    "Ang ligtas na ulat ay laging kailangan ng purok o palatandaan.",
  areaNeededToSave:
    "Wala pa ring lokasyon. Ilagay ang purok o palatandaan para maitala.",
  locating: "Kinukuha ang lokasyon",
  locationFound: "Nakakabit ang lokasyon",
  locationNone: "Walang lokasyon. Ilagay ang purok o palatandaan.",
  submit: "Itala ang ulat",
  saving: "Itinatala",
  saved: "Naitala.",
  rateLimited: "Anim na ulat na sa oras na ito. Subukan mamaya.",
  myData: "Aking datos",
  back: "Balik",
  carrying: "Dala",
  // Filipino does not inflect the noun; "mga" is what marks the plural.
  observationOne: "ulat",
  observationMany: "mga ulat",
  incidentOne: "insidente",
  incidentMany: "mga insidente",
  mine: "Akin",
  carried: "Dala-dala",
  deleteAction: "Burahin",
  deleteNote:
    "Ang pagbura ay para lang sa teleponong ito. Ang naipasa na sa iba ay mananatili.",
  empty: "Wala pang dala.",
  languageName: "English",
  reporterOne: "nag-ulat",
  reporterMany: "mga nag-ulat",
  spans: "lawak",

  dashboard: "Dashboard ng responder",
  dashboardIntro:
    "Muling binuo mula sa mga na-upload na ulat, gamit ang parehong tuntunin ng mga telepono.",
  sinceLastSync: "Mula noong huli kang bumisita",
  nothingChanged: "Walang nagbago mula noong huli kang bumisita.",
  refresh: "I-refresh",
  filterAll: "Lahat ng kategorya",
  dashNotConnected:
    "Hindi pa nakakonekta ang database ng responder sa deployment na ito.",
  dashDevDetail:
    "Para sa developer: itakda ang EXPO_PUBLIC_SUPABASE_URL at EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  dashEmpty: "Wala pang na-upload.",
  loadError: "Hindi maabot ang database.",
  loading: "Nilo-load ang mga na-upload na ulat…",
  corroborationCaveat:
    "Binibilang ang magkakaibang device, hindi tao. Ang may maraming telepono ay maaaring magpalaki nito. Maaaring tapusin ng istasyon ang maling insidente.",
  uploadNow: "I-upload na",
  uploadedCount: "na-upload",
  pendingCount: "naghihintay i-upload",
  uploadOffline: "Walang na-upload. Walang database sa teleponong ito.",

  stationMode: "Station mode",
  stationLocked: "Ilagay ang PIN ng istasyon",
  stationPinHint: "Ang unang PIN dito ang magiging PIN ng teleponong ito.",
  stationWrongPin: "Hindi tugma ang PIN sa teleponong ito.",
  stationUnlock: "Buksan ang board",
  stationExit: "Lumabas sa station mode",
  board: "Situation board",
  markSeen: "Markahang nakita",
  seenNever: "Markahang nakita para masubaybayan ang mga pagbabago.",
  seenAt: "Mga pagbabago mula",
  changeNew: "BAGO",
  changeEscalated: "LUMALA",
  changeCorroborated: "DAGDAG NA ULAT",
  changeResolved: "TAPOS NA",
  single: "isang ulat",
  corroborated: "may kumpirmasyon",
  stronglyCorroborated: "matibay na kumpirmasyon",
  statusOpen: "Bukas",
  statusAcknowledged: "Natanggap",
  statusResolved: "Tapos na",
  firstSeen: "Una",
  lastSeen: "Huli",
  extent: "Lawak",
  whyRanked: "Bakit narito sa ranking",
  acknowledge: "Tanggapin",
  resolve: "Tapusin",
  observationsInIncident: "Mga ulat sa insidenteng ito",
  safePanel: "Mga ligtas na ulat",
  noIncidents: "Wala pang insidente.",
  scoreBase: "Kategorya",
  scoreCorroboration: "Kumpirmasyon",
  scorePeople: "Bilang ng apektado",
  scoreUnacknowledged: "Hindi pa natatanggap",
  scoreStaleness: "Tagal",
  scoreTotal: "Kabuuan",
  scoreFloored: "Naka-floor sa 0. Ang tapos na ay laging nasa dulo.",

  // Drafts for a native speaker to review (DESIGN_BRIEF section 12).
  reportOne: "ulat",
  reportMany: "ulat",
  sourceOne: "pinagmulan",
  sourceMany: "pinagmulan",
  lastReported: "Huling ulat: {t} na ang nakalipas",
  staleLine: "Huling alam: {t} na ang nakalipas — maaaring nagbago na",
  staleBadge: "LUMA NA",
  staleCount: "{n} luma na",
  timeline: "Kasaysayan",
  timelineReport: "Ulat",
  phone: "telepono",
  incidentChanged: "Nagbago ang insidenteng ito. Bumalik sa board.",
  chooseCategoryFirst: "Piliin muna kung ano ang nangyayari.",
  pinTooShort: "Maglagay ng hindi bababa sa 4 na numero.",

  // QR, drafts for a native speaker to review (DESIGN_BRIEF section 12).
  shareTitle: "Ipasa gamit ang QR",
  shareHint:
    "Ipa-scan sa kabilang telepono. Huwag galawin at lakasan ang liwanag ng screen.",
  frameCounter: "Frame {i} ng {n} · Pahina {p} ng {P}",
  nextPage: "Susunod na pahina",
  pause: "I-pause",
  play: "Ituloy",
  previousFrame: "Nakaraang frame",
  nextFrame: "Susunod na frame",
  scanReceipt: "I-scan ang resibo nila",
  swapHint:
    "Para makuha rin ang ulat nila, magpalit: sila ang magpapakita, ikaw ang mag-i-scan.",
  scanTheirPhoneFirst: "I-scan muna ang telepono nila (opsyonal)",
  skippingKnown: "Nilaktawan ang mayroon na sa teleponong iyon.",
  nothingToShare: "Wala pang maipapasa.",
  receiptRecorded: "Na-scan ang resibo: natanggap ng teleponong iyon ang pahinang ito.",
  receiptStation: "Sinasabi nitong istasyon ito.",
  receiptWrong: "Para sa ibang pahina ang resibong iyan.",
  cancel: "Kanselahin",
  scanTitle: "Tumanggap gamit ang QR",
  showIdFirst: "Ipakita muna ito sa magpapasa (opsyonal)",
  scanPointAt: "Itutok ang camera sa QR code ng kabilang telepono.",
  scanProgress: "{k} sa {n} frame",
  scanDone: "Natanggap ang {N} ({M} bago)",
  showReceipt: "Ipakita ang resibong ito sa nagpasa",
  receiveAnother: "Tumanggap ulit",
  wrongBundle: "Ibang code iyan. Ituloy ang pag-scan sa naunang code.",
  scanFailed: "Hindi nabasa nang tama. Ituloy ang pag-scan.",
  allowCamera: "Payagan ang camera",
  cameraDenied:
    "Kailangan ng PASAbi ang camera para makatanggap gamit ang QR. Payagan ito sa Settings › Expo Go › Camera.",
  cameraUnavailable:
    "Walang camera scanning dito. Gamitin ang PASAbi sa telepono para mag-scan.",

  // Drafts for a native speaker to review (DESIGN_BRIEF section 12).
  stepSaved: "Nakatala sa teleponong ito",
  stepPassed: "Naipasa sa ibang telepono",
  stepStation: "Nakarating sa istasyon",
  stepUploaded: "Na-upload mula sa teleponong ito",
  stepGroupedOne: "Kasama ng ulat mula sa 1 pang telepono",
  stepGrouped: "Kasama ng mga ulat mula sa {n} pang telepono",
  stepFooter:
    "Ito lang ang alam ng teleponong ito. Hindi ibig sabihing nakita na ito ng mga responder.",

  // Drafts for a native speaker to review (DESIGN_BRIEF section 12).
  knownHeading: "Naiulat sa malapit",
  unknownHeading: "Wala pang ulat sa malapit",
  unknownItem: "{category}: wala pang ulat",
  peopleUnknown: "Bilang ng apektado: hindi naiulat",
  knownEmpty: "Wala pang kaugnay na ulat sa malapit.",
  gapsShow: "Ano ang alam sa malapit",
  gapsHide: "Itago ang alam sa malapit",
};

export const CATEGORY_LABELS: Record<Lang, Record<Category, string>> = {
  en: {
    MEDICAL: "Medical",
    TRAPPED: "Trapped",
    STRUCTURAL: "Damaged building",
    FLOOD: "Flood",
    ROAD_BLOCKED: "Road blocked",
    MISSING_PERSON: "Missing person",
    WATER_FOOD: "Water or food",
    SHELTER: "Shelter",
    SAFE_CHECKIN: "We are safe",
  },
  fil: {
    MEDICAL: "Medikal",
    TRAPPED: "Naipit",
    STRUCTURAL: "Sirang gusali",
    FLOOD: "Baha",
    ROAD_BLOCKED: "Baradong daan",
    MISSING_PERSON: "Nawawala",
    WATER_FOOD: "Tubig o pagkain",
    SHELTER: "Silungan",
    SAFE_CHECKIN: "Ligtas kami",
  },
};

const TABLE: Record<Lang, Strings> = { en, fil };

// ponytail: a four-line external store instead of a context provider. There
// is one value, it changes on a button press, and useSyncExternalStore is
// already in React.
let current: Lang = "en";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): Lang {
  return current;
}

export function setLanguage(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  for (const listener of listeners) listener();
  void AsyncStorage.setItem(LANG_KEY, lang);
}

/** Called once at startup. Falls back to English if nothing is stored. */
export async function restoreLanguage(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANG_KEY);
  if (stored === "en" || stored === "fil") setLanguage(stored);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useStrings(): Strings {
  return TABLE[useLang()];
}

/**
 * "1 observation" / "2 observations", and in Filipino "1 ulat" / "2 mga ulat".
 *
 * ponytail: a two-form rule, not Intl.PluralRules. English and Filipino both
 * only need one and many here. Reach for Intl if a language with dual or
 * paucal forms is ever added.
 */
export function plural(count: number, one: string, many: string): string {
  return String(count) + " " + (count === 1 ? one : many);
}

/** Fills "{t}"-style slots in a string from the tables above. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (slot, name: string) =>
    name in values ? String(values[name]) : slot,
  );
}

/** "<1 min", "12 min", "3 h", "2 d". The units read the same in Filipino. */
export function formatAge(seconds: number): string {
  if (seconds < 60) return "<1 min";
  if (seconds < 3600) return String(Math.floor(seconds / 60)) + " min";
  if (seconds < 86400) return String(Math.floor(seconds / 3600)) + " h";
  return String(Math.floor(seconds / 86400)) + " d";
}

export function corroborationLabel(
  level: CorroborationLevel,
  t: Strings,
): string {
  if (level === "strongly_corroborated") return t.stronglyCorroborated;
  if (level === "corroborated") return t.corroborated;
  return t.single;
}

export function statusLabel(status: IncidentStatus, t: Strings): string {
  if (status === "resolved") return t.statusResolved;
  if (status === "acknowledged") return t.statusAcknowledged;
  return t.statusOpen;
}

export function changeLabel(flag: IncidentChange, t: Strings): string {
  if (flag === "new") return t.changeNew;
  if (flag === "escalated") return t.changeEscalated;
  if (flag === "newly_corroborated") return t.changeCorroborated;
  return t.changeResolved;
}
