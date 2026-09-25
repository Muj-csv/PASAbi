import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  applyPolicy,
  CAPACITY_STATION,
  compute,
  SyncSession,
  type Observation,
  type SyncContext,
} from "@pasabi/core";
import { MockNetwork } from "@pasabi/transport";

/**
 * PHASE-2 task 3: simulated encounters in the browser.
 *
 * This runs the REAL SyncProtocol over the mock transport. The web build has
 * no peer radio at all (ARCHITECTURE section 7), so a green run here proves
 * the protocol converges and proves nothing about Bluetooth or Wi-Fi. It is
 * necessary evidence, never sufficient.
 */

const NOW = 1759000000;

function uuid(n: number): string {
  return "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
}

function seed(
  n: number,
  deviceId: string,
  category: Observation["category"],
  lat: number,
): Observation {
  return {
    id: uuid(n),
    type: "REPORT",
    category,
    device_id: deviceId,
    lat,
    lon: 120.9842,
    created_at: NOW - 600 * n,
  };
}

class SimDevice {
  observations: Observation[];

  constructor(
    readonly id: string,
    readonly label: string,
    initial: Observation[],
  ) {
    this.observations = [...initial];
  }

  context(): SyncContext {
    return {
      deviceId: this.id,
      role: "resident",
      now: () => NOW,
      observations: () => this.observations,
      apply: (incoming) => {
        const merged = [...this.observations];
        const known = new Set(merged.map((o) => o.id));
        for (const o of incoming) if (!known.has(o.id)) merged.push(o);
        this.observations = applyPolicy(merged, CAPACITY_STATION, NOW);
      },
      freeCapacity: () => CAPACITY_STATION - this.observations.length,
    };
  }
}

function freshDevices(): SimDevice[] {
  return [
    new SimDevice("dev-a", "A resident", [
      seed(1, "dev-a", "FLOOD", 14.5995),
      seed(2, "dev-a", "MEDICAL", 14.6995),
    ]),
    new SimDevice("dev-b", "B volunteer", [
      seed(3, "dev-b", "ROAD_BLOCKED", 14.7995),
    ]),
    new SimDevice("dev-c", "C station", [
      seed(4, "dev-c", "WATER_FOOD", 14.8995),
      seed(5, "dev-c", "SHELTER", 14.9995),
    ]),
  ];
}

async function meet(a: SimDevice, b: SimDevice): Promise<number> {
  const network = new MockNetwork();
  const ta = network.device(a.id);
  const tb = network.device(b.id);
  const sessionA = new SyncSession(a.context(), b.id, (p) => ta.send(b.id, p));
  const sessionB = new SyncSession(b.context(), a.id, (p) => tb.send(a.id, p));

  const pending: Promise<void>[] = [];
  await ta.start({
    onPeerFound: () => {},
    onPeerLost: () => {},
    onPayload: (_f, p) => {
      pending.push(sessionA.receive(p));
    },
  });
  await tb.start({
    onPeerFound: () => {},
    onPeerLost: () => {},
    onPayload: (_f, p) => {
      pending.push(sessionB.receive(p));
    },
  });

  network.bringTogether(a.id, b.id);
  await sessionA.begin();
  await Promise.all([sessionA.finished, sessionB.finished]);
  while (pending.length > 0) {
    await Promise.all(pending.splice(0, pending.length));
  }
  return network.sent.length;
}

export default function Sim() {
  const [devices, setDevices] = useState<SimDevice[]>(freshDevices);
  const [log, setLog] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  const [a, b, c] = devices;

  const run = async (x: SimDevice, y: SimDevice): Promise<void> => {
    const payloads = await meet(x, y);
    setLog((l) => [
      x.label.charAt(0) +
        " met " +
        y.label.charAt(0) +
        ": " +
        payloads +
        " payloads, both now hold " +
        x.observations.length,
      ...l,
    ]);
    setTick((t) => t + 1);
  };

  const reset = (): void => {
    setDevices(freshDevices());
    setLog([]);
    setTick((t) => t + 1);
  };

  const keys = devices.map((d) =>
    compute(d.observations, NOW)
      .map((i) => i.key.slice(-4))
      .join(","),
  );
  const converged = keys.every((k) => k === keys[0]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Encounter simulation</Text>
      <Text style={styles.muted}>
        The real SyncProtocol over the mock transport. A browser has no peer
        radio, so this shows the protocol converging and says nothing about
        Bluetooth or Wi-Fi.
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => void run(a, b)}>
          <Text style={styles.btnText}>A meets B</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => void run(b, c)}>
          <Text style={styles.btnText}>B meets C</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => void run(a, c)}>
          <Text style={styles.btnText}>A meets C</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={reset}>
          <Text style={styles.btnGhostText}>Reset</Text>
        </Pressable>
      </View>

      <Text style={converged ? styles.ok : styles.pending}>
        {converged
          ? "Converged: all three devices show the same incidents"
          : "Not yet converged"}
      </Text>

      {devices.map((d, i) => {
        const incidents = compute(d.observations, NOW);
        return (
          <View key={d.id + String(tick)} style={styles.card}>
            <Text style={styles.cardTitle}>{d.label}</Text>
            <Text style={styles.muted}>
              {d.observations.length} observations, {incidents.length} incidents
            </Text>
            {incidents.map((inc) => (
              <Text key={inc.key} style={styles.incident}>
                {inc.category} score {inc.score}, {inc.corroboration},{" "}
                {inc.independentReporters} reporters
              </Text>
            ))}
            <Text style={styles.keys}>keys: {keys[i] || "none"}</Text>
          </View>
        );
      })}

      {log.length > 0 ? <Text style={styles.h2}>Log</Text> : null}
      {log.map((line, i) => (
        <Text key={String(i) + line} style={styles.logLine}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 48 },
  h1: { fontSize: 22, fontWeight: "700" },
  h2: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  muted: { fontSize: 13, color: "#5a6673" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: {
    backgroundColor: "#1566c0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnText: { color: "#ffffff", fontWeight: "700" },
  btnGhost: { backgroundColor: "#e8ecf1" },
  btnGhostText: { color: "#333b45", fontWeight: "700" },
  ok: { fontSize: 15, fontWeight: "700", color: "#1c6b3c" },
  pending: { fontSize: 15, fontWeight: "700", color: "#8a6d1f" },
  card: {
    borderWidth: 1,
    borderColor: "#d8dde3",
    borderRadius: 10,
    padding: 12,
    gap: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  incident: { fontSize: 13 },
  keys: { fontSize: 11, color: "#5a6673", marginTop: 4 },
  logLine: { fontSize: 12, color: "#333b45" },
});
