import * as Crypto from "expo-crypto";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  bundlePages,
  decodeId,
  decodeReceipt,
  encodeBundle,
  QR_FRAME_INTERVAL_MS,
  type Observation,
} from "@pasabi/core";

import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { QrFrame } from "@/components/QrFrame";
import { QrScanner } from "@/components/QrScanner";
import { StatusBand } from "@/components/StatusBand";
import { fill, useStrings } from "@/i18n";
import { loadObservations, markPassedOn } from "@/storage/observations";
import { ackedBy, recordReceipt } from "@/storage/qrReceipts";
import { loadStation } from "@/storage/station";
import { color, size, space, tabularNums } from "@/theme/tokens";

type Mode = "show" | "scanId" | "scanReceipt";

function newBundleId(): string {
  return Crypto.randomUUID().replace(/-/g, "").slice(0, 8).toLowerCase();
}

/**
 * FR-013 Share, ADR-008. Cycles the frames of one page, most urgent first,
 * with pause and manual stepping so nothing depends on the animation. The
 * optional "scan their phone first" skips what that phone already
 * acknowledged (D-025); scanning their receipt records that it arrived.
 */
export default function Share() {
  const t = useStrings();

  const [observations, setObservations] = useState<Observation[] | null>(null);
  const [now, setNow] = useState(0);
  const [acked, setAcked] = useState<ReadonlySet<string>>(new Set());
  const [mode, setMode] = useState<Mode>("show");
  const [pageIndex, setPageIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [station, setStation] = useState(false);
  /** bundleId -> the observation IDs that page carried, to match receipts. */
  const sent = useRef(new Map<string, string[]>());

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setObservations(await loadObservations());
        setNow(Math.floor(Date.now() / 1000));
        setStation((await loadStation()).enabled);
      })();
    }, []),
  );

  const pages = useMemo(
    () => (observations ? bundlePages(observations, now, acked) : []),
    [observations, now, acked],
  );
  const page = pages[pageIndex];

  const bundle = useMemo(() => {
    if (!page || page.length === 0) return null;
    const bundleId = newBundleId();
    return {
      bundleId,
      ids: page.map((o) => o.id),
      frames: encodeBundle(page, bundleId),
    };
  }, [page]);

  // Remember each page actually shown, after render, so a receipt scanned
  // later can be matched to the IDs it acknowledges.
  useEffect(() => {
    if (bundle) sent.current.set(bundle.bundleId, bundle.ids);
  }, [bundle]);

  const frameCount = bundle?.frames.length ?? 0;

  useEffect(() => {
    if (!playing || mode !== "show" || frameCount < 2) return;
    const timer = setInterval(
      () => setFrameIndex((i) => (i + 1) % frameCount),
      QR_FRAME_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [playing, mode, frameCount]);

  const onIdFrame = async (text: string): Promise<void> => {
    const id = decodeId(text);
    if (!id) return;
    setAcked(await ackedBy(id.deviceId));
    setPageIndex(0);
    setFrameIndex(0);
    setMode("show");
    setNote(t.skippingKnown);
  };

  const onReceipt = async (text: string): Promise<void> => {
    const receipt = decodeReceipt(text);
    if (!receipt) return;
    const ids = sent.current.get(receipt.bundleId);
    if (!ids) {
      setNote(t.receiptWrong);
      return;
    }
    await recordReceipt(receipt.deviceId, ids);
    // R3: the reporter's status moves only on evidence like this receipt.
    await markPassedOn(ids, receipt.role);
    setMode("show");
    // BR-015: the receipt's role is trusted, not verified, and says so.
    setNote(
      t.receiptRecorded +
        (receipt.role === "station" ? " " + t.receiptStation : ""),
    );
  };

  const step = (delta: number): void => {
    setPlaying(false);
    setFrameIndex((i) => (i + delta + frameCount) % frameCount);
  };

  if (observations === null) return null;

  const band = <StatusBand mode={station ? "station" : "resident"} label={t.shareTitle} />;
  // Coral is the resident "handoff" page (DESIGN_BRIEF section 4, rule 2);
  // station keeps a plain page so the ballpen band stays the only mode cue.
  const fg = station ? color.ink : color.onCoral;
  const pageStyle = [styles.page, station && styles.pageStation];

  if (mode !== "show") {
    return (
      <View style={pageStyle}>
        {band}
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={[styles.hint, { color: fg }]}>{t.scanPointAt}</Text>
          <QrScanner
            onCode={(text) =>
              void (mode === "scanId" ? onIdFrame(text) : onReceipt(text))
            }
          />
          {note ? <Text style={[styles.note, { color: fg }]}>{note}</Text> : null}
          <Button
            label={t.cancel}
            variant="quiet"
            onPress={() => setMode("show")}
          />
        </ScrollView>
      </View>
    );
  }

  const counter = fill(t.frameCounter, {
    i: frameCount > 0 ? (frameIndex % frameCount) + 1 : 0,
    n: frameCount,
    p: pageIndex + 1,
    P: pages.length,
  });

  return (
    <View style={pageStyle}>
      {band}
      <ScrollView contentContainerStyle={styles.form}>
        {bundle === null ? (
          <Notice message={t.nothingToShare} />
        ) : (
          <>
            <Text style={[styles.hint, { color: fg }]}>{t.shareHint}</Text>
            <Button
              label={t.scanTheirPhoneFirst}
              variant="quiet"
              onPress={() => {
                setNote(null);
                setMode("scanId");
              }}
            />
            <QrFrame
              value={bundle.frames[frameIndex % frameCount]}
              label={counter}
            />
            <Text style={[styles.counter, { color: fg }]}>{counter}</Text>
            <View style={styles.row}>
              <Button
                label={t.previousFrame}
                variant="secondary"
                onPress={() => step(-1)}
              />
              <Button
                label={playing ? t.pause : t.play}
                variant="secondary"
                onPress={() => setPlaying((p) => !p)}
              />
              <Button
                label={t.nextFrame}
                variant="secondary"
                onPress={() => step(1)}
              />
            </View>
            <Button
              label={t.scanReceipt}
              onPress={() => {
                setNote(null);
                setMode("scanReceipt");
              }}
            />
            {pageIndex + 1 < pages.length ? (
              <Button
                label={t.nextPage}
                variant="secondary"
                onPress={() => {
                  setPageIndex((p) => p + 1);
                  setFrameIndex(0);
                  setPlaying(true);
                  setNote(null);
                }}
              />
            ) : null}
          </>
        )}

        {note ? <Text style={[styles.note, { color: fg }]}>{note}</Text> : null}
        <Text style={[styles.muted, { color: fg, opacity: 0.8 }]}>{t.swapHint}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.coral },
  pageStation: { backgroundColor: color.paper },
  form: { padding: space[4], gap: space[3], paddingBottom: space[7] },
  hint: { fontSize: size.body, color: color.onCoral },
  counter: {
    fontFamily: "Doto_800ExtraBold",
    fontSize: 20,
    lineHeight: 25,
    textAlign: "center",
    color: color.onCoral,
    ...tabularNums,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
    justifyContent: "center",
  },
  note: { fontSize: size.body, fontWeight: "700", color: color.onCoral },
  muted: { fontSize: size.caption, color: color.ink },
});
