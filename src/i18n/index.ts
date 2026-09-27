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
  saved: "Recorded. It passes on when you meet another phone.",
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
  saved: "Naitala. Ipapasa ito kapag may makasalubong na telepono.",
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
