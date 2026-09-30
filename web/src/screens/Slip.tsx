/**
 * R3 Saved slip, the signature moment: prove the report exists and say
 * honestly how far it has gone (BR-015). Coral page, white slip. Stamps
 * appear only from flags this phone holds; SAVED presses in on arrival.
 */
import { compute, propagationFor } from "@pasabi/core";
import { useState } from "react";

import { Button, Notice, SlipCard, slipStamps, slipStatus, StatusBand } from "../components/kit";
import { clock, peopleText } from "../design/format";
import { useT } from "../design/i18n";
import { useNow } from "../hooks";
import { navigate } from "../router";
import { observations } from "../storage/observations";

import { slipTitle } from "./Home";

export function Slip({ id, fresh }: { id: string; fresh: boolean }) {
  const t = useT();
  const held = observations.use();
  const now = useNow();
  const o = held.find((x) => x.id === id);

  // The flags when this screen opened: a flag that turns true while it is
  // open (a receipt scanned meanwhile) gets the press and the buzz.
  const [opened] = useState(() =>
    fresh || !o ? { ...o!, passed_on: false, reached_station: false, uploaded: false } : o,
  );
  const grouped = o ? (propagationFor(held, compute(held, now)).get(o.id)?.groupedWith ?? 0) : 0;

  if (!o) {
    return (
      <main className="screen coral">
        <StatusBand mode="resident" />
        <div className="pad stack gap4" style={{ paddingTop: 24 }}>
          <Notice message={t("slip.missing")} />
          <Button onCoral label={t("action.done")} onClick={() => navigate("/", { replace: true })} />
        </div>
      </main>
    );
  }

  const stamps = slipStamps(o, t, opened);
  // SAVED presses in only on arrival from the report flow.
  stamps[0].justEarned = fresh;

  const detail = [
    o.people ? peopleText(t, o.people) : null,
    o.note ? `"${o.note}"` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const others = grouped - 1;

  return (
    <main className="screen coral">
      <StatusBand mode="resident" />
      <div className="pad stack gap4" style={{ paddingTop: 24 }}>
        <SlipCard id={o.id} time={clock(o.created_at)} title={slipTitle(o, t)} detail={detail || undefined} stamps={stamps} />
        <h1 className="heading">{slipStatus(o, t)}</h1>
        {others >= 1 ? (
          <p className="body">{others === 1 ? t("slip.grouped.one") : t("slip.grouped", { n: others })}</p>
        ) : null}
      </div>
      <div className="spacer" />
      <div className="pinned stack gap2">
        <Button onCoral label={t("action.passItOn")} onClick={() => navigate("/pass")} />
        <div>
          <Button variant="quiet" resident label={t("action.done")} onClick={() => navigate("/", { replace: true })} />
        </div>
      </div>
    </main>
  );
}
