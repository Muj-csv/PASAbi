/**
 * R2 Report, one question per step (SCREENS.md): what · how many · what did
 * you see · where. Save is pinned from the moment a category is chosen, so
 * steps can be skipped. Works entirely offline. The people step is asked
 * for every category (team decision, 2026-09-29).
 */
import { useEffect, useState } from "react";

import { canCreate, type Category } from "@pasabi/core";

import { Button, Notice, StatusBand } from "../components/kit";
import { clock, retryAt } from "../design/format";
import { useT } from "../design/i18n";
import { Pictogram, REPORT_ORDER } from "../design/pictograms";
import { goBack, navigate } from "../router";
import { deviceIdSync } from "../storage/device";
import { createReport, nowSeconds, observations } from "../storage/observations";

const NOTE_MAX = 140;
/** FR-001: no fix within 30 s → the purok or landmark becomes required. */
const FIX_TIMEOUT_MS = 30000;

type Fix = { lat: number; lon: number; accuracy_m?: number };

/** GPS runs in the background from step 1. Never shows metres (SCREENS.md). */
function useFix(): { state: "finding" | "found" | "none"; fix: Fix | null } {
  const [state, setState] = useState<"finding" | "found" | "none">(() =>
    navigator.geolocation ? "finding" : "none",
  );
  const [fix, setFix] = useState<Fix | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    let done = false;
    const timer = setTimeout(() => !done && setState("none"), FIX_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        done = true;
        setFix({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy_m: p.coords.accuracy });
        setState("found");
      },
      () => {
        done = true;
        setState("none");
      },
      { enableHighAccuracy: false, timeout: FIX_TIMEOUT_MS, maximumAge: 60000 },
    );
    return () => clearTimeout(timer);
  }, []);
  return { state, fix };
}

export function Report() {
  const t = useT();
  const { state: gps, fix } = useFix();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [people, setPeople] = useState<number | null>(1);
  const [note, setNote] = useState("");
  const [area, setArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [limited, setLimited] = useState<number | null>(null);

  const hasPlace = fix !== null || area.trim().length > 0;

  const back = () => (step > 1 ? setStep(step - 1) : goBack("/"));

  const save = async () => {
    if (!category || busy) return;
    // Without a fix, the purok or landmark is required: go and ask for it.
    if (!hasPlace) {
      setStep(4);
      return;
    }
    const me = deviceIdSync();
    const now = nowSeconds();
    if (!canCreate(observations.get(), me, now)) {
      setLimited(retryAt(observations.get(), me, now));
      return;
    }
    setBusy(true);
    try {
      const id = await createReport(
        { category, people: people ?? undefined, note, area_text: area, fix },
        me,
      );
      navigate(`/slip/${id}?new=1`, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const dots = [1, 2, 3, 4].map((i) => (i <= step ? "●" : "○")).join("");

  return (
    <main className="screen">
      <StatusBand mode="resident" />
      <div className="back-bar" style={{ borderBottom: 0 }}>
        <button className="back-link resident" onClick={back}>
          {t("nav.back")}
        </button>
        <span className="progress-dots" aria-label={`${step} / 4`}>
          {dots}
        </span>
      </div>

      <div className="pad stack gap4 grow" style={{ paddingTop: 8, paddingBottom: 24 }}>
        {limited ? (
          <Notice message={t("home.rateLimit", { time: clock(limited) })} />
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="title">{t("report.q1")}</h1>
            <div className="cat-grid">
              {REPORT_ORDER.map((c) => (
                <button
                  key={c}
                  className="cat-btn"
                  aria-pressed={category === c}
                  onClick={() => {
                    setCategory(c);
                    setStep(2);
                  }}
                >
                  <Pictogram category={c} size={28} />
                  <span>{t.cat(c)}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="title">{t("report.q2")}</h1>
            <div className="stepper" style={{ paddingTop: 24 }}>
              <button aria-label={t("nav.less")} onClick={() => setPeople(Math.max(1, (people ?? 1) - 1))}>
                −
              </button>
              <span className="display num" aria-live="polite" style={{ minWidth: 88, textAlign: "center" }}>
                {people ?? "?"}
              </span>
              <button aria-label={t("nav.more")} onClick={() => setPeople(Math.min(999, (people ?? 0) + 1))}>
                +
              </button>
            </div>
            <div style={{ alignSelf: "center" }}>
              <Button
                variant="quiet"
                resident
                label={t("report.notSure")}
                onClick={() => {
                  setPeople(null);
                  setStep(3);
                }}
              />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1 className="title">{t("report.q3")}</h1>
            <label className="field">
              <textarea
                className="input"
                value={note}
                maxLength={NOTE_MAX}
                placeholder={t("report.q3.ph")}
                onChange={(e) => setNote(e.target.value)}
                aria-label={t("report.q3")}
              />
              <span className="caption ink2 num" style={{ alignSelf: "flex-end" }}>
                {note.length}/{NOTE_MAX}
              </span>
            </label>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h1 className="title">{t("report.q4")}</h1>
            <p className="row gap2 body">
              <span aria-hidden="true">{gps === "found" ? "●" : "○"}</span>
              {gps === "found" ? t("report.gps.ok") : gps === "finding" ? t("report.gps.finding") : t("report.gps.none")}
            </p>
            <label className="field">
              <span className="body strong">
                {fix ? t("report.landmark.optional") : t("report.landmark")}
              </span>
              <input
                className="input"
                value={area}
                maxLength={80}
                onChange={(e) => setArea(e.target.value)}
                aria-required={!fix}
              />
            </label>
          </>
        ) : null}
      </div>

      {category ? (
        <div className="pinned stack gap2">
          {step === 2 || step === 3 ? (
            <Button variant="secondary" label={t("report.next")} onClick={() => setStep(step + 1)} />
          ) : null}
          <Button
            label={t("report.save")}
            onClick={() => void save()}
            disabled={busy || (step === 4 && !hasPlace)}
          />
        </div>
      ) : null}
    </main>
  );
}
