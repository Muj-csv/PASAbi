// Location at startup (team decision 2026-09-30): ask on launch instead of
// waiting for the first report. Never reads the location itself for anything but
// raising the prompt; reports still get their fix in the report flow.

import { live } from "./storage/kv";

export type LocationState = "unknown" | "prompt" | "granted" | "denied" | "unavailable";

export const location = live<LocationState>("unknown");

/** Boot: learn the current answer without prompting, where the browser allows. */
export async function checkLocation(): Promise<void> {
  if (!navigator.geolocation) {
    location.set("unavailable");
    return;
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    location.set(status.state);
    status.onchange = () => location.set(status.state);
  } catch {
    // No Permissions API (older iOS): treat as not yet asked.
    location.set("prompt");
  }
}

/**
 * Raises the location prompt. "No fix yet" (timeout, no signal) still means
 * permission was given, so only an explicit refusal counts as denied.
 */
export function requestLocation(): Promise<LocationState> {
  if (!navigator.geolocation) {
    location.set("unavailable");
    return Promise.resolve("unavailable");
  }
  return new Promise((resolve) => {
    const done = (state: LocationState) => {
      location.set(state);
      resolve(state);
    };
    navigator.geolocation.getCurrentPosition(
      () => done("granted"),
      (err) => done(err.code === err.PERMISSION_DENIED ? "denied" : "granted"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  });
}
