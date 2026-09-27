import * as Location from "expo-location";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  CATEGORIES,
  compute,
  propagationFor,
  SAFE_CHECKIN,
  type Category,
  type Propagation,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { StatusSteps } from "@/components/StatusSteps";
import { CATEGORY_LABELS, useLang, useStrings } from "@/i18n";
import { getDeviceId, newObservationId } from "@/storage/device";
import { addObservation, canCreateNow } from "@/storage/observations";
import { color, radius, size, space, TOUCH_TARGET } from "@/theme/tokens";

const NOTE_MAX = 140;
/** FR-001: if there is no fix within 30 s, area text is required instead. */
const FIX_TIMEOUT_MS = 30000;

/** DESIGN_BRIEF section 3: an even 2-column grid, "We are safe" below it. */
const REPORT_CATEGORIES = CATEGORIES.filter((c) => c !== SAFE_CHECKIN);
const CATEGORY_ROWS: Category[][] = [];
for (let i = 0; i < REPORT_CATEGORIES.length; i += 2) {
  CATEGORY_ROWS.push(REPORT_CATEGORIES.slice(i, i + 2));
}

type Fix = { lat: number; lon: number; accuracy_m?: number };
type FixState = "locating" | "found" | "none";
type Problem = "category" | "area" | null;
type Message = { text: string; tone: "info" | "error" } | null;

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
  const router = useRouter();

  const scroll = useRef<ScrollView>(null);
  const areaY = useRef(0);

  const [category, setCategory] = useState<Category | null>(null);
  const [people, setPeople] = useState("");
  const [note, setNote] = useState("");
  const [areaText, setAreaText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [savedStatus, setSavedStatus] = useState<Propagation | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [needArea, setNeedArea] = useState(false);

  // R-7: a check-in is counted per area, so it always needs one. Without a
  // GPS fix, area text is the only thing that can group an observation.
  // Keyed on whether a fix actually exists, not on needArea alone, so a fix
  // arriving late clears the requirement instead of leaving it stuck.
  const areaRequired =
    category === SAFE_CHECKIN ||
    (fix === null && (fixState === "none" || needArea));

  const choose = (c: Category): void => {
    setCategory(c);
    if (problem === "category") setProblem(null);
  };

  /**
   * The button is always enabled (DESIGN_BRIEF section 8): a tap with
   * something missing names it inline and scrolls to it, instead of a grey
   * button that never says why.
   */
  const submit = async (): Promise<void> => {
    setMessage(null);
    setSavedStatus(null);
    if (category === null) {
      setProblem("category");
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    // Also covers the window where location is still resolving: a report
    // saved then would carry neither a fix nor an area and could never
    // group with anything.
    if ((areaRequired || fix === null) && areaText.trim().length === 0) {
      setNeedArea(true);
      setProblem("area");
      scroll.current?.scrollTo({ y: areaY.current, animated: true });
      return;
    }
    setProblem(null);

    setBusy(true);
    try {
      const deviceId = await getDeviceId();
      if (!(await canCreateNow(deviceId))) {
        setMessage({ text: t.rateLimited, tone: "error" });
        return;
      }
      const seconds = Math.floor(Date.now() / 1000);
      const parsedPeople = Number.parseInt(people, 10);
      const id = newObservationId();
      const kept = await addObservation({
        id,
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
      // FR-015: say only what this phone knows, starting with "saved here".
      setSavedStatus(
        propagationFor(kept, compute(kept, seconds)).get(id) ?? null,
      );
    } finally {
      setBusy(false);
    }
  };

  const areaHint =
    category === SAFE_CHECKIN
      ? t.areaRequiredCheckin
      : problem === "area"
        ? t.areaNeededToSave
        : t.areaRequiredNoGps;

  const chip = (c: Category, wide = false) => (
    <Pressable
      key={c}
      onPress={() => choose(c)}
      style={[styles.chip, wide && styles.chipWide, category === c && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: category === c }}
    >
      <Text style={[styles.chipText, category === c && styles.chipTextOn]}>
        {CATEGORY_LABELS[lang][c]}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.page}>
      <Text style={styles.prompt}>{t.categoryPrompt}</Text>
      {problem === "category" ? (
        <Text style={styles.problem} accessibilityRole="alert">
          {t.chooseCategoryFirst}
        </Text>
      ) : null}

      <View style={styles.grid}>
        {CATEGORY_ROWS.map((row) => (
          <View key={row.join()} style={styles.gridRow}>
            {row.map((c) => chip(c))}
          </View>
        ))}
      </View>
      <View style={styles.safeRow}>{chip(SAFE_CHECKIN, true)}</View>

      <View style={styles.locationRow}>
        {fixState === "locating" ? <ActivityIndicator color={color.accent} /> : null}
        <Text style={styles.muted}>
          {fixState === "locating"
            ? t.locating
            : fixState === "found"
              ? t.locationFound
              : t.locationNone}
        </Text>
      </View>

      {areaRequired ? (
        <View
          style={styles.field}
          onLayout={(e) => {
            areaY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.label}>{t.areaLabel}</Text>
          <TextInput
            value={areaText}
            onChangeText={(v) => {
              setAreaText(v);
              if (problem === "area") setProblem(null);
            }}
            style={[styles.input, problem === "area" && styles.inputProblem]}
            placeholder="Purok 3"
            placeholderTextColor={color.textSecondary}
            accessibilityLabel={t.areaLabel}
          />
          <Text style={problem === "area" ? styles.problem : styles.hint}>
            {areaHint}
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
          accessibilityLabel={t.peopleAffected}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.note}</Text>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, NOTE_MAX))}
          style={[styles.input, styles.noteInput]}
          multiline
          accessibilityLabel={t.note}
        />
        <Text style={styles.muted}>
          {NOTE_MAX - note.length} {t.noteCounter}
        </Text>
      </View>

      <Button
        label={t.submit}
        onPress={() => void submit()}
        busy={busy}
        busyLabel={t.saving}
      />

      {message ? (
        <Text
          style={message.tone === "error" ? styles.problem : styles.message}
          accessibilityRole={message.tone === "error" ? "alert" : undefined}
        >
          {message.text}
        </Text>
      ) : null}

      {savedStatus ? (
        <View style={styles.statusPanel} accessibilityLiveRegion="polite">
          <Text style={styles.message}>{t.saved}</Text>
          <StatusSteps status={savedStatus} />
        </View>
      ) : null}

      {/* FR-004: prominent pass-on and receive actions, by QR this round. */}
      <View style={styles.qrRow}>
        <Button
          label={t.shareTitle}
          variant="secondary"
          onPress={() => router.push("/share")}
        />
        <Button
          label={t.scanTitle}
          variant="secondary"
          onPress={() => router.push("/scan")}
        />
      </View>

      <Link href="/my-data" style={styles.link}>
        {t.myData}
      </Link>

      <Link href="/station" style={styles.link}>
        {t.stationMode}
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space[4], gap: space[4], paddingBottom: space[7] },
  prompt: { fontSize: size.h3, fontWeight: "700", color: color.textPrimary },
  grid: { gap: space[2] },
  gridRow: { flexDirection: "row", gap: space[2] },
  safeRow: { marginTop: space[2] },
  chip: {
    flex: 1,
    minHeight: TOUCH_TARGET + space[3],
    justifyContent: "center",
    paddingVertical: space[3],
    paddingHorizontal: space[2],
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  chipWide: { flex: 0 },
  chipOn: { borderColor: color.accent, backgroundColor: color.surfaceHover },
  chipText: {
    fontSize: size.body,
    fontWeight: "600",
    textAlign: "center",
    color: color.textPrimary,
  },
  chipTextOn: { color: color.accentHover },
  locationRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
  field: { gap: space[1] },
  label: { fontSize: size.body, fontWeight: "600", color: color.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.control,
    backgroundColor: color.surface,
    padding: space[3],
    fontSize: size.body,
    color: color.textPrimary,
  },
  inputProblem: { borderColor: color.danger, borderWidth: 2 },
  noteInput: { minHeight: 88, textAlignVertical: "top" },
  hint: { fontSize: size.caption, color: color.warning },
  problem: { fontSize: size.body, color: color.danger, fontWeight: "600" },
  muted: { fontSize: size.caption, color: color.textSecondary },
  // Recorded is not "help is coming": plain text, never green (BR-017).
  message: { fontSize: size.body, color: color.textPrimary, fontWeight: "600" },
  link: { fontSize: size.body, color: color.accent, paddingVertical: space[2] },
  qrRow: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  statusPanel: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    borderRadius: radius.card,
    padding: space[3],
    gap: space[2],
  },
});
