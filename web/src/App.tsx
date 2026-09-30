import { useEffect } from "react";

import { BluetoothAsk } from "./components/nearby";
import { useNow } from "./hooks";
import { navigate, usePath } from "./router";
import { Home } from "./screens/Home";
import { IncidentDetail } from "./screens/Incident";
import { Ledger } from "./screens/Ledger";
import { Mine } from "./screens/Mine";
import { PassOn } from "./screens/PassOn";
import { Receive } from "./screens/Receive";
import { Report } from "./screens/Report";
import { Responder, ResponderIncident } from "./screens/Responder";
import { Settings } from "./screens/Settings";
import { Slip } from "./screens/Slip";
import { StationStatus } from "./screens/StationStatus";
import { observations } from "./storage/observations";
import { station } from "./storage/station";

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to]);
  return null;
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
      {/* D-033: asked once as the app starts, native app only. */}
      <BluetoothAsk />
    </>
  );
}

function Page() {
  const [path, query = ""] = usePath().split("?");
  const isStation = station.use().enabled;
  const param = (prefix: string) => decodeURIComponent(path.slice(prefix.length));

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
    if (path.startsWith("/station/incident/")) {
      return <StationIncident key={path} incidentKey={param("/station/incident/")} />;
    }
  }
  return <Redirect to="/" />;
}
