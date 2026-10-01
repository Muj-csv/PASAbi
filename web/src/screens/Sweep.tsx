/**
 * Purok Sweep (P4, spec §4.3): go to an information gap, check each
 * category, record what is seen AND what is not. Works offline; findings are
 * observations and travel like any other. Nothing here ever says "safe".
 */
import { useState } from "react";

import { areaGaps, normalizeArea, SAFE_CHECKIN, type Category } from "@pasabi/core";

import { BackBar, Button, ModeBand, Notice } from "../components/kit";
import { clock } from "../design/format";
import { useT } from "../design/i18n";
import { Pictogram } from "../design/pictograms";
import { navigate } from "../router";
import { deviceIdSync } from "../storage/device";
import { createReport, nowSeconds, observations } from "../storage/observations";
import { expectedAreas } from "../storage/station";
import { completeSweep, recordAnswer, recordNotSeen, sweeps, type SweepAnswer } from "../storage/sweeps";

const ANSWER_KEY = { seen: "sweep.seen", not_seen: "sweep.notSeen", couldnt: "sweep.couldnt" } as const;

export function SweepScreen({ sweepId }: { sweepId: string }) {
  const t = useT();
  const sweep = sweeps.use().find((s) => s.sweepId === sweepId);
  const [confirming, setConfirming] = useState<Category | null>(null);

  if (!sweep) {
    return (
      <main className="screen">
        <ModeBand />
        <BackBar label={t("inc.back")} fallback="/station" />
        <div className="pad" style={{ paddingTop: 24 }}>
          <Notice message={t("inc.gone")} />
        </div>
      </main>
    );
  }

  const area = sweep.targetArea;
  const answer = async (c: Category, a: SweepAnswer) => {
    if (a === "seen") {
      if (c === SAFE_CHECKIN) {
        const id = await createReport({ category: c, area_text: area }, deviceIdSync());
        await recordAnswer(sweepId, c, "seen", id);
      } else {
        // The full report flow, pre-filled; it comes back here when saved.
        navigate(`/report?category=${c}&area=${encodeURIComponent(area)}&sweep=${sweepId}`);
      }
      return;
    }
    if (a === "not_seen") {
      if (confirming !== c) {
        setConfirming(c); // spec §4.3: confirm before it joins the evidence
        return;
      }
      setConfirming(null);
      await recordNotSeen(sweepId, c, area, deviceIdSync());
      return;
    }
    await recordAnswer(sweepId, c, "couldnt");
  };

  const complete = async () => {
    const now = nowSeconds();
    const gap = areaGaps(observations.get(), now, expectedAreas.get()).find((g) => g.area === normalizeArea(area));
    await completeSweep(sweepId, gap?.reasons ?? []);
  };

  const done = sweep.completedAt !== null;
  return (
    <main className="screen">
      <ModeBand />
      <BackBar label={t("inc.back")} fallback="/station" />
      <div className="pad stack gap3" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <h1 className="title">{t("sweep.title", { area })}</h1>
        <p className="caption ink2 num">
          {done ? t("sweep.done", { time: clock(sweep.completedAt!) }) : t("sweep.started", { time: clock(sweep.startedAt) })}
        </p>
        {!done ? <p className="body">{t("sweep.hint")}</p> : null}

        {sweep.requestedCategories.map((c) => {
          const given = sweep.answers[c];
          return (
            <div key={c} className="stack gap2 ruled" style={{ paddingBottom: 12 }}>
              <span className="row gap2 body strong">
                <Pictogram category={c} size={22} />
                {t.cat(c)}
                {given ? <span className="ink2" style={{ fontWeight: 400 }}>· {t(ANSWER_KEY[given])}</span> : null}
              </span>
              {!done && !given ? (
                <div className="row gap2 wrap">
                  <div>
                    <Button variant="secondary" small label={t("sweep.seen")} onClick={() => void answer(c, "seen")} />
                  </div>
                  {c !== SAFE_CHECKIN ? (
                    <div>
                      <Button
                        variant="secondary"
                        small
                        label={confirming === c ? t("sweep.confirmNotSeen") : t("sweep.notSeen")}
                        onClick={() => void answer(c, "not_seen")}
                      />
                    </div>
                  ) : null}
                  <div>
                    <Button variant="quiet" small label={t("sweep.couldnt")} onClick={() => void answer(c, "couldnt")} />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {done ? (
          <>
            <p className="body num">{t("sweep.collected", { n: sweep.observationsCollected.length })}</p>
            <p className="body strong">
              {sweep.remainingUnknowns && sweep.remainingUnknowns.length > 0
                ? t("sweep.remaining", { list: sweep.remainingUnknowns.map((c) => t.cat(c)).join(" · ") })
                : t("sweep.allChecked")}
            </p>
            <p className="caption ink2">{t.caveats.noReport}</p>
            <Button label={t("action.done")} onClick={() => navigate("/station", { replace: true })} />
          </>
        ) : (
          <Button label={t("sweep.complete")} onClick={() => void complete()} />
        )}
      </div>
    </main>
  );
}
