// Does the native app ask for Bluetooth at startup? Runs the real boot code
// (restoreNearby) against a fake iOS side of the Capacitor bridge, the same
// fake used in the browser check on 2026-10-01, which found that a first
// launch never showed the ask. This proves the app's decisions; iOS's own
// prompt and "Turn On Bluetooth" alert can only be seen on a real iPhone.
import "fake-indexeddb/auto";

import { beforeAll, describe, expect, it } from "vitest";

type Call = string;
const calls: Call[] = [];
let btState = "on";
const listeners: Record<string, ((d: unknown) => void)[]> = {};

// Must exist before @capacitor/core is first imported (it reads them once).
beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  g.webkit = { messageHandlers: { bridge: { postMessage() {} } } };
  g.Capacitor = {
    PluginHeaders: [
      {
        name: "PasabiNearby",
        methods: ["requestBluetooth", "openSettings", "start", "stop", "send", "removeListener"]
          .map((name) => ({ name, rtype: "promise" }))
          .concat([{ name: "addListener", rtype: "callback" }]),
      },
    ],
    nativePromise(_plugin: string, method: string) {
      calls.push(method);
      return Promise.resolve(method === "requestBluetooth" ? { state: btState } : undefined);
    },
    nativeCallback(_plugin: string, _method: string, options: { eventName: string }, cb: (d: unknown) => void) {
      calls.push("listen:" + options.eventName);
      (listeners[options.eventName] ??= []).push(cb);
      return Promise.resolve("cb");
    },
  };
});

async function boot() {
  // Same order as main.tsx: the device ID is loaded before anything starts.
  await (await import("./storage/device")).getDeviceId();
  const nearby = await import("./nearby");
  await nearby.restoreNearby();
  return nearby;
}

describe("startup ask (native app)", () => {
  it("first launch: waits to ask until the sheet explains, then asks on Allow", async () => {
    const { bluetooth, allowBluetooth, nearby } = await boot();
    expect(nearby.get().available).toBe(true);
    // Nothing asked yet, and the state tells the StartupAsk sheet to show.
    expect(calls).not.toContain("requestBluetooth");
    expect(bluetooth.get()).toBe("ask");

    await allowBluetooth(); // the sheet's Allow
    expect(calls).toContain("requestBluetooth"); // iOS shows its prompt here
    expect(calls.indexOf("start")).toBeGreaterThan(calls.indexOf("requestBluetooth"));
    expect(bluetooth.get()).toBe("on");
  });

  it("later launch with Bluetooth off: asks iOS right away, starts once it's on", async () => {
    const { bluetooth, restoreNearby } = await import("./nearby");
    calls.length = 0;
    btState = "off";
    await restoreNearby(); // allowed before, so it asks without the sheet
    expect(calls).toContain("requestBluetooth"); // iOS's "Turn On Bluetooth" alert
    expect(bluetooth.get()).toBe("off");

    btState = "on";
    listeners.bluetoothState?.forEach((cb) => cb({ state: "on" }));
    expect(bluetooth.get()).toBe("on");
  });

  it("Bluetooth off: every Allow asks iOS again (its Turn On alert); it never flips it", async () => {
    const { allowBluetooth } = await import("./nearby");
    calls.length = 0;
    btState = "off";
    await allowBluetooth();
    await allowBluetooth();
    expect(calls.filter((c) => c === "requestBluetooth")).toHaveLength(2);
    // No plugin method exists that could switch Bluetooth on.
    expect(calls.every((c) => ["requestBluetooth", "start", "openSettings"].includes(c) || c.startsWith("listen:"))).toBe(true);
  });

  it("permission refused: Open Settings goes to PASAbi's Settings page", async () => {
    const { allowBluetooth, bluetooth, openBluetoothSettings } = await import("./nearby");
    calls.length = 0;
    btState = "unauthorized";
    await allowBluetooth();
    expect(bluetooth.get()).toBe("unauthorized");
    await openBluetoothSettings();
    expect(calls).toContain("openSettings");
  });
});
