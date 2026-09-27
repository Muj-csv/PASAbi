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
import { fill, useStrings } from "@/i18n";
import { loadObservations, markPassedOn } from "@/storage/observations";
import { ackedBy, recordReceipt } from "@/storage/qrReceipts";
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
  /** bundleId -> the observation IDs that page carried, to match receipts. */
  const sent = useRef(new Map<string, string[]>());

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setObservations(await loadObservations());
        setNow(Math.floor(Date.now() / 1000));
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

  if (mode !== "show") {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.h2}>
          {mode === "scanId" ? t.scanTheirPhoneFirst : t.scanReceipt}
        </Text>
        <Text style={styles.hint}>{t.scanPointAt}</Text>
        <QrScanner
          onCode={(text) =>
            void (mode === "scanId" ? onIdFrame(text) : onReceipt(text))
          }
        />
        {note ? <Text style={styles.note}>{note}</Text> : null}
        <Button
          label={t.cancel}
          variant="secondary"
          onPress={() => setMode("show")}
        />
      </ScrollView>
    );
  }

  const counter = fill(t.frameCounter, {
    i: frameCount > 0 ? (frameIndex % frameCount) + 1 : 0,
    n: frameCount,
    p: pageIndex + 1,
    P: pages.length,
  });

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h2}>{t.shareTitle}</Text>

      {bundle === null ? (
        <Notice message={t.nothingToShare} />
      ) : (
        <>
          <Text style={styles.hint}>{t.shareHint}</Text>
          <Button
            label={t.scanTheirPhoneFirst}
            variant="secondary"
            onPress={() => {
              setNote(null);
              setMode("scanId");
            }}
          />
          <QrFrame
            value={bundle.frames[frameIndex % frameCount]}
            label={counter}
          />
          <Text style={styles.counter}>{counter}</Text>
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

      {note ? <Text style={styles.note}>{note}</Text> : null}
      <Text style={styles.muted}>{t.swapHint}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space[4], gap: space[3], paddingBottom: space[7] },
  h2: { fontSize: size.h2, fontWeight: "700", color: color.textPrimary },
  hint: { fontSize: size.body, color: color.textPrimary },
  counter: {
    fontSize: size.h3,
    fontWeight: "700",
    textAlign: "center",
    color: color.textPrimary,
    ...tabularNums,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
    justifyContent: "center",
  },
  note: { fontSize: size.body, fontWeight: "600", color: color.textPrimary },
  muted: { fontSize: size.caption, color: color.textSecondary },
});
