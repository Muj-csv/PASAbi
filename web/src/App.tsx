import { useEffect } from "react";

import { StartupAsk } from "./components/startup";
import { useNow } from "./hooks";
import { navigate, usePath } from "./router";
import { Home } from "./screens/Home";
import { IncidentDetail } from "./screens/Incident";
import { Ledger } from "./screens/Ledger";
import { Mine } from "./screens/Mine";
import { PassOn } from "./screens/PassOn";
import { PassportView } from "./screens/Passport";
import { Receive } from "./screens/Receive";
import { Report } from "./screens/Report";
import { Responder, ResponderIncident, ResponderPassport } from "./screens/Responder";
import { Settings } from "./screens/Settings";
import { Slip } from "./screens/Slip";
import { StationStatus } from "./screens/StationStatus";
import { SweepScreen } from "./screens/Sweep";
import { Readiness } from "./screens/Readiness";
import { observations } from "./storage/observations";
import { station } from "./storage/station";

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to]);
  return null;
}

function StationPassport({ incidentKey }: { incidentKey: string }) {
  const held = observations.use();
  const now = useNow();
  return <PassportView incidentKey={incidentKey} held={held} now={now} responder={false} />;
}

function StationIncident({ incidentKey }: { incidentKey: string }) {
  const held = observations.use();
  const now = useNow();
  return <IncidentDetail incidentKey={incidentKey} held={held} now={now} readOnly={false} />;
}

/**
 * Routes (IMPLEMENTATION_PWA §3). Station mode owns "/" while it is on;
 * station routes send a resident to Settings, where the PIN lives.
 */
export function App() {
  return (
    <>
      <Page />
      {/* Location, asked at every launch until on (2026-09-30). */}
      <StartupAsk />
    </>
  );
}

function Page() {
  const [path, query = ""] = usePath().split("?");
  const isStation = station.use().enabled;
  const param = (prefix: string) => decodeURIComponent(path.slice(prefix.length));

  // P2: /station|responder/incident/:key/passport
  const passport = /^\/(station|responder)\/incident\/(.+)\/passport$/.exec(path);
  if (passport) {
    const key = decodeURIComponent(passport[2]);
    if (passport[1] === "responder") return <ResponderPassport key={path} incidentKey={key} />;
    if (!isStation) return <Redirect to="/settings" />;
    return <StationPassport key={path} incidentKey={key} />;
  }

  if (path === "/") return isStation ? <Redirect to="/station" /> : <Home />;
  if (path === "/report") return <Report />;
  if (path.startsWith("/slip/")) return <Slip key={path} id={param("/slip/")} fresh={query.includes("new=1")} />;
  if (path === "/mine") return <Mine />;
  if (path === "/pass") return <PassOn />;
  if (path === "/receive") return <Receive />;
  if (path === "/settings") return <Settings />;
  if (path === "/responder") return <Responder />;
  if (path.startsWith("/responder/incident/")) return <ResponderIncident incidentKey={param("/responder/incident/")} />;

  if (path === "/station" || path.startsWith("/station/")) {
    if (!isStation) return <Redirect to="/settings" />;
    if (path === "/station") return <Ledger />;
    if (path === "/station/status") return <StationStatus />;
    if (path === "/station/ready") return <Readiness />;
    if (path.startsWith("/station/sweep/")) return <SweepScreen key={path} sweepId={param("/station/sweep/")} />;
    if (path.startsWith("/station/incident/")) {
      return <StationIncident key={path} incidentKey={param("/station/incident/")} />;
    }
  }
  return <Redirect to="/" />;
}
