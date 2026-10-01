/**
 * R7 Settings: language, what PASAbi saves, whether iOS may clear it, and
 * station mode behind a PIN. First unlock also asks for the station name
 * (team decision, 2026-09-29). Wrong PIN is inline, no lockout: the PIN only
 * hides a UI mode (PRD §14).
 */
import { useState, type FormEvent } from "react";

import { TransferLogSection } from "../components/fieldlog";
import { BackBar, Button, StatusBand } from "../components/kit";
import { setLang, useT } from "../design/i18n";
import { Icon } from "../design/pictograms";
import { Link, navigate } from "../router";
import { live } from "../storage/kv";
import { enableStation, station } from "../storage/station";

const PIN_MIN = 4;

/** Set once at boot from requestPersistence() (main.tsx). */
export const persisted = live(false);

export function Settings() {
  const t = useT();
  const s = station.use();
  const kept = persisted.use();
  const firstTime = s.pinHash === null;
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  // P6 (THREAT_MODEL §4): wipe PASAbi from this phone. Two taps; no modal.
  const [clearArmed, setClearArmed] = useState(false);
  const clearPhone = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    const req = indexedDB.deleteDatabase("pasabi");
    req.onsuccess = req.onerror = req.onblocked = () => location.replace("/");
  };

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    if (pin.length < PIN_MIN) {
      setError(t("pin.short"));
      return;
    }
    const ok = await enableStation(pin, firstTime ? name : undefined);
    if (!ok) {
      setError(t("pin.wrong"));
      setPin("");
      return;
    }
    navigate("/station", { replace: true });
  };

  const saves: { yes: boolean; key: Parameters<typeof t>[0] }[] = [
    { yes: true, key: "settings.saves.what" },
    { yes: true, key: "settings.saves.where" },
    { yes: true, key: "settings.saves.when" },
    { yes: false, key: "settings.saves.noName" },
    { yes: false, key: "settings.saves.noNumber" },
    { yes: false, key: "settings.saves.noAccount" },
  ];

  return (
    <main className="screen">
      <StatusBand mode="resident" />
      <BackBar label={t("nav.back")} fallback="/" resident />
      <div className="pad stack gap5" style={{ paddingTop: 16, paddingBottom: 48 }}>
        <h1 className="title">{t("settings.title")}</h1>

        <section className="stack gap2">
          <h2 className="heading">{t("settings.language")}</h2>
          <div className="segmented">
            <button aria-pressed={t.lang === "en"} onClick={() => void setLang("en")}>
              English
            </button>
            <button aria-pressed={t.lang === "fil"} onClick={() => void setLang("fil")}>
              Filipino
            </button>
          </div>
        </section>

        <section className="stack gap2">
          <h2 className="heading">{t("settings.saves")}</h2>
          <ul className="stack gap2" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {saves.map((row) => (
              <li key={row.key} className={row.yes ? "row gap3 body" : "row gap3 body ink2"}>
                <Icon name={row.yes ? "check" : "dash"} size={20} />
                {t(row.key)}
              </li>
            ))}
          </ul>
          <p className="caption ink2">{kept ? t("settings.storage.kept") : t("settings.storage.risk")}</p>
        </section>

        <section className="stack gap3">
          <h2 className="heading">{t("settings.station")}</h2>
          <p className="caption ink2">{t("settings.station.hint")}</p>
          <form className="stack gap3" onSubmit={(e) => void unlock(e)}>
            {firstTime ? (
              <label className="field">
                <span className="body strong">{t("settings.station.name")}</span>
                <input
                  className="input"
                  value={name}
                  maxLength={40}
                  placeholder={t("settings.station.namePh")}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            ) : null}
            <label className="field">
              <span className="body strong">{firstTime ? t("settings.station.setPin") : t("settings.station.pin")}</span>
              <input
                className="input pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                aria-invalid={error !== null}
                aria-describedby={error ? "pin-error" : undefined}
              />
            </label>
            {error ? (
              <p id="pin-error" className="body bold" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="secondary"
              label={firstTime ? t("settings.station.start") : t("settings.station.open")}
              disabled={firstTime && !name.trim()}
            />
          </form>
        </section>

        <TransferLogSection />

        <section className="stack gap2">
          <h2 className="heading">{t("settings.clear")}</h2>
          <p className="caption ink2">{t("settings.clearHint")}</p>
          <div>
            <Button variant="quiet" resident small label={clearArmed ? t("settings.clearConfirm") : t("settings.clear")} onClick={clearPhone} />
          </div>
        </section>

        <Link to="/responder" className="body">
          {t("settings.responder")}
        </Link>
      </div>
    </main>
  );
}
