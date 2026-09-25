import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import type { Category } from "@pasabi/core";

export type Lang = "en" | "fil";

const LANG_KEY = "pasabi.lang.v1";

const en = {
  appName: "Pasabi",
  tagline: "When the towers fall, the barangay passes it on.",
  newObservation: "New observation",
  categoryPrompt: "What is happening?",
  peopleAffected: "People affected (optional)",
  note: "Short note (optional)",
  noteCounter: "characters left",
  areaLabel: "Purok or landmark",
  areaRequiredNoGps: "No GPS fix, so a purok or landmark is required.",
  areaRequiredCheckin: "A safe check-in always needs a purok or landmark.",
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
  observationsWord: "observations",
  incidentsWord: "incidents",
  mine: "Mine",
  carried: "Carried",
  deleteAction: "Delete",
  deleteNote:
    "Deleting removes it from this phone only. Copies already carried by others stay.",
  empty: "Nothing carried yet.",
  languageName: "Filipino",
  reporters: "reporters",
  spans: "spans",
};

export type Strings = typeof en;

const fil: Strings = {
  appName: "Pasabi",
  tagline: "Kapag bumagsak ang signal, ang barangay ang magpapasa.",
  newObservation: "Bagong ulat",
  categoryPrompt: "Ano ang nangyayari?",
  peopleAffected: "Bilang ng apektado (opsyonal)",
  note: "Maikling paliwanag (opsyonal)",
  noteCounter: "natitirang titik",
  areaLabel: "Purok o palatandaan",
  areaRequiredNoGps: "Walang GPS, kaya kailangan ang purok o palatandaan.",
  areaRequiredCheckin:
    "Ang ligtas na ulat ay laging kailangan ng purok o palatandaan.",
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
  observationsWord: "mga ulat",
  incidentsWord: "mga insidente",
  mine: "Akin",
  carried: "Dala-dala",
  deleteAction: "Burahin",
  deleteNote:
    "Ang pagbura ay para lang sa teleponong ito. Ang naipasa na sa iba ay mananatili.",
  empty: "Wala pang dala.",
  languageName: "English",
  reporters: "nag-ulat",
  spans: "lawak",
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
