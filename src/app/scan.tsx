import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  BundleAssembler,
  encodeId,
  encodeReceipt,
  type Role,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { QrFrame } from "@/components/QrFrame";
import { QrScanner } from "@/components/QrScanner";
import { ScanProgress } from "@/components/ScanProgress";
import { StatusBand } from "@/components/StatusBand";
import { fill, useStrings } from "@/i18n";
import { getDeviceId } from "@/storage/device";
import { receiveObservations } from "@/storage/observations";
import { loadStation } from "@/storage/station";
import { color, size, space, tabularNums } from "@/theme/tokens";

type Done = { bundleId: string; received: number; added: number };

/**
 * FR-013 Scan, ADR-008. Collects frames in any order, applies the page
 * through receiveObservations() (the one ingest path, R0), then shows a
 * one-frame receipt for the sharer to scan back.
 */
export default function Scan() {
  const t = useStrings();

  const [me, setMe] = useState<{ deviceId: string; role: Role } | null>(null);
  const assembler = useRef(new BundleAssembler());
  const applying = useRef(false);
  const [progress, setProgress] = useState({ received: 0, total: 0 });
  const [warning, setWarning] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    void (async () => {
      const deviceId = await getDeviceId();
      const station = await loadStation();
      setMe({ deviceId, role: station.enabled ? "station" : "resident" });
    })();
  }, []);

  const onCode = async (text: string): Promise<void> => {
    if (done !== null || applying.current) return;
    const before = assembler.current.received;
    const result = assembler.current.accept(text);

    if (result.kind === "progress") {
      setProgress({ received: result.received, total: result.total });
      setWarning(null);
    } else if (result.kind === "wrong-bundle") {
      setWarning(t.wrongBundle);
    } else if (result.kind === "invalid") {
      // Unreadable codes are ignored silently (DESIGN_BRIEF section 11); say
      // something only if a whole bundle failed to decode and was dropped.
      if (before > 0 && assembler.current.received === 0) {
        setProgress({ received: 0, total: 0 });
        setWarning(t.scanFailed);
      }
    } else {
      applying.current = true;
      try {
        const added = await receiveObservations(result.observations);
        setDone({
          bundleId: result.bundleId,
          received: result.observations.length,
          added,
        });
      } finally {
        applying.current = false;
      }
    }
  };

  const reset = (): void => {
    assembler.current.reset();
    setProgress({ received: 0, total: 0 });
    setWarning(null);
    setDone(null);
  };

  if (me === null) return null;

  const band = <StatusBand mode={me.role === "station" ? "station" : "resident"} label={t.scanTitle} />;

  if (done !== null) {
    return (
      <View style={styles.page}>
        {band}
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.done}>
            {fill(t.scanDone, { N: done.received, M: done.added })}
          </Text>
          <Text style={styles.hint}>{t.showReceipt}</Text>
          <QrFrame
            value={encodeReceipt({
              bundleId: done.bundleId,
              role: me.role,
              deviceId: me.deviceId,
            })}
            label={t.showReceipt}
          />
          <Button label={t.receiveAnother} onPress={reset} />
          <Text style={styles.muted}>{t.swapHint}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {band}
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.idBlock}>
          <QrFrame
            value={encodeId(me.role, me.deviceId)}
            maxSize={160}
            label={t.showIdFirst}
          />
          <Text style={styles.muted}>{t.showIdFirst}</Text>
        </View>
        <Text style={styles.hint}>{t.scanPointAt}</Text>
        <QrScanner onCode={(text) => void onCode(text)} />
        {progress.total > 0 ? (
          <ScanProgress received={progress.received} total={progress.total} />
        ) : null}
        {warning ? <Text style={styles.warning}>{warning}</Text> : null}
        <Text style={styles.muted}>{t.swapHint}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper },
  form: { padding: space[4], gap: space[3], paddingBottom: space[7] },
  hint: { fontSize: size.body, color: color.ink },
  idBlock: { alignItems: "center", gap: space[1] },
  done: {
    fontFamily: "Doto_800ExtraBold",
    fontSize: 44,
    lineHeight: 48,
    color: color.ink,
    ...tabularNums,
  },
  warning: { fontSize: size.body, fontWeight: "700", color: color.ink },
  muted: { fontSize: size.caption, color: color.ink2 },
});
