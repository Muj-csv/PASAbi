import * as Location from "expo-location";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { CATEGORIES, SAFE_CHECKIN, type Category } from "@pasabi/core";

import { CATEGORY_LABELS, useLang, useStrings } from "@/i18n";
import { getDeviceId, newObservationId } from "@/storage/device";
import { addObservation, canCreateNow } from "@/storage/observations";

const NOTE_MAX = 140;
/** FR-001: if there is no fix within 30 s, area text is required instead. */
const FIX_TIMEOUT_MS = 30000;

type Fix = { lat: number; lon: number; accuracy_m?: number };
type FixState = "locating" | "found" | "none";

function useLocation(): { state: FixState; fix: Fix | null } {
  const [state, setState] = useState<FixState>("locating");
  const [fix, setFix] = useState<Fix | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setState((s) => (s === "locating" ? "none" : s));
    }, FIX_TIMEOUT_MS);

    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          if (!cancelled) setState("none");
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setFix({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy_m: position.coords.accuracy ?? undefined,
        });
        setState("found");
      } catch {
        // No fix is a normal outcome indoors or during a storm, not an error
        // worth blocking on. The form falls back to area text.
        if (!cancelled) setState("none");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { state, fix };
}

/** FR-001. Works entirely offline: nothing here touches the network. */
export default function NewObservation() {
  const t = useStrings();
  const lang = useLang();
  const { state: fixState, fix } = useLocation();

  const [category, setCategory] = useState<Category | null>(null);
  const [people, setPeople] = useState("");
  const [note, setNote] = useState("");
  const [areaText, setAreaText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needArea, setNeedArea] = useState(false);

  // R-7: a check-in is counted per area, so it always needs one. Without a
  // GPS fix, area text is the only thing that can group an observation.
  // Keyed on whether a fix actually exists, not on needArea alone, so a fix
  // arriving late clears the requirement instead of leaving submit stuck.
  const areaRequired =
    category === SAFE_CHECKIN ||
    (fix === null && (fixState === "none" || needArea));
  const areaMissing = areaRequired && areaText.trim().length === 0;
  const canSubmit = category !== null && !areaMissing && !busy;

  const submit = async (): Promise<void> => {
    if (category === null || areaMissing) return;

    // Field visibility cannot cover the window where location is still
    // resolving: areaRequired is false there, so submit is enabled, and an
    // observation saved in that window would carry neither a fix nor an area
    // and could never group with anything. Validate the real condition, at
    // the moment it actually matters.
    if (fix === null && areaText.trim().length === 0) {
      setNeedArea(true);
      setMessage(t.areaNeededToSave);
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const deviceId = await getDeviceId();
      if (!(await canCreateNow(deviceId))) {
        setMessage(t.rateLimited);
        return;
      }
      const seconds = Math.floor(Date.now() / 1000);
      const parsedPeople = Number.parseInt(people, 10);
      await addObservation({
        id: newObservationId(),
        type: "REPORT",
        category,
        device_id: deviceId,
        created_at: seconds,
        people: Number.isFinite(parsedPeople) ? parsedPeople : undefined,
        note: note.trim() ? note.trim() : undefined,
        area_text: areaText.trim() ? areaText.trim() : undefined,
        lat: fix?.lat,
        lon: fix?.lon,
        accuracy_m: fix?.accuracy_m,
        received_at: seconds,
        hops: 0,
        own: true,
        uploaded: false,
      });
      setCategory(null);
      setPeople("");
      setNote("");
      setMessage(t.saved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.prompt}>{t.categoryPrompt}</Text>

      <View style={styles.grid}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={[styles.chip, category === c && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: category === c }}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextOn]}>
              {CATEGORY_LABELS[lang][c]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.locationRow}>
        {fixState === "locating" ? <ActivityIndicator /> : null}
        <Text style={styles.muted}>
          {fixState === "locating"
            ? t.locating
            : fixState === "found"
              ? t.locationFound
              : t.locationNone}
        </Text>
      </View>

      {areaRequired ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t.areaLabel}</Text>
          <TextInput
            value={areaText}
            onChangeText={setAreaText}
            style={styles.input}
            placeholder="Purok 3"
          />
          <Text style={styles.hint}>
            {category === SAFE_CHECKIN
              ? t.areaRequiredCheckin
              : t.areaRequiredNoGps}
          </Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>{t.peopleAffected}</Text>
        <TextInput
          value={people}
          onChangeText={(v) => setPeople(v.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.note}</Text>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, NOTE_MAX))}
          style={[styles.input, styles.noteInput]}
          multiline
        />
        <Text style={styles.hint}>
          {NOTE_MAX - note.length} {t.noteCounter}
        </Text>
      </View>

      <Pressable
        onPress={() => void submit()}
        disabled={!canSubmit}
        style={[styles.submit, !canSubmit && styles.submitOff]}
        accessibilityRole="button"
      >
        <Text style={styles.submitText}>{busy ? t.saving : t.submit}</Text>
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Link href="/my-data" style={styles.link}>
        {t.myData}
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 48 },
  prompt: { fontSize: 20, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#c3cad2",
    minWidth: 140,
    flexGrow: 1,
  },
  chipOn: { borderColor: "#1566c0", backgroundColor: "#e8f1fc" },
  chipText: { fontSize: 17, fontWeight: "600", textAlign: "center" },
  chipTextOn: { color: "#0f4c92" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#c3cad2",
    borderRadius: 8,
    padding: 12,
    fontSize: 17,
  },
  noteInput: { minHeight: 88, textAlignVertical: "top" },
  hint: { fontSize: 13, color: "#5a6673" },
  muted: { fontSize: 14, color: "#5a6673" },
  submit: {
    backgroundColor: "#1566c0",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  submitOff: { backgroundColor: "#9bb4d0" },
  submitText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  message: { fontSize: 15, color: "#1c6b3c", fontWeight: "600" },
  link: { fontSize: 16, color: "#1566c0", paddingVertical: 8 },
});
