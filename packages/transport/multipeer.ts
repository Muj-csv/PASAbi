// The iOS Multipeer Connectivity transport (ADR-007), reached through the
// PasabiNearby Capacitor plugin in native/ios/. Only exists inside the native
// app (D-033); in the browser multipeerAvailable() is false and nothing here
// runs. This file is the only place the native plugin is touched.
//
// Multipeer finds nearby iPhones over Bluetooth and peer-to-peer Wi-Fi and
// reports a peer only once a session is connected, so "found" here already
// means "can be sent to". It gives no signal strength or direction.

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

import type { PeerId, Transport, TransportListener } from "./types";

/** Bonjour service type: 1–15 lowercase letters, digits or hyphens. Must
 *  match NSBonjourServices in the iOS Info.plist (native/README.md). */
export const SERVICE_TYPE = "pasabi-obs";

/** What iOS says about Bluetooth for this app. */
export type BluetoothState = "on" | "off" | "unauthorized" | "unsupported";

interface NearbyPlugin {
  requestBluetooth(): Promise<{ state: BluetoothState }>;
  openSettings(): Promise<void>;
  start(options: { displayName: string; serviceType: string }): Promise<void>;
  stop(): Promise<void>;
  send(options: { peer: string; data: string }): Promise<void>;
  addListener(event: "peerFound" | "peerLost", fn: (e: { peer: string }) => void): Promise<PluginListenerHandle>;
  addListener(event: "payload", fn: (e: { peer: string; data: string }) => void): Promise<PluginListenerHandle>;
  addListener(event: "bluetoothState", fn: (e: { state: BluetoothState }) => void): Promise<PluginListenerHandle>;
}

/**
 * Asks iOS about Bluetooth: raises the permission prompt the first time and
 * iOS's own "Turn On Bluetooth" alert when it is off. Never switches it on.
 */
export async function requestBluetooth(): Promise<BluetoothState> {
  return (await Native.requestBluetooth()).state;
}

/**
 * Opens PASAbi's page in the phone's Settings, where Bluetooth permission is
 * given back after a refusal. No platform lets an app flip Bluetooth itself
 * without the person (iOS: never; Android: its own one-tap dialog, planned).
 */
export async function openAppSettings(): Promise<void> {
  await Native.openSettings();
}

/** Bluetooth switched on or off while the app runs. */
export function onBluetoothState(fn: (state: BluetoothState) => void): void {
  void Native.addListener("bluetoothState", (e) => fn(e.state));
}

const Native = registerPlugin<NearbyPlugin>("PasabiNearby");

export function multipeerAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PasabiNearby");
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function fromBase64(text: string): Uint8Array {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export class MultipeerTransport implements Transport {
  readonly name = "multipeer";
  /** ARCHITECTURE §4's ceiling; SyncProtocol packs batches under it. */
  readonly maxPayloadBytes = 30000;
  private handles: PluginListenerHandle[] = [];

  /** The device ID doubles as the Multipeer display name (36 chars < 63). */
  constructor(readonly deviceId: PeerId) {}

  async start(listener: TransportListener): Promise<void> {
    await this.stopListening();
    this.handles = await Promise.all([
      Native.addListener("peerFound", (e) => listener.onPeerFound(e.peer)),
      Native.addListener("peerLost", (e) => listener.onPeerLost(e.peer)),
      Native.addListener("payload", (e) => listener.onPayload(e.peer, fromBase64(e.data))),
    ]);
    await Native.start({ displayName: this.deviceId, serviceType: SERVICE_TYPE });
  }

  async stop(): Promise<void> {
    await Native.stop();
    await this.stopListening();
  }

  private async stopListening(): Promise<void> {
    await Promise.all(this.handles.map((h) => h.remove()));
    this.handles = [];
  }

  /** The plugin invites and accepts on its own; found peers are connected. */
  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}

  async send(to: PeerId, payload: Uint8Array): Promise<void> {
    await Native.send({ peer: to, data: toBase64(payload) });
  }
}
