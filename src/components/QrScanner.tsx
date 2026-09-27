import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useStrings } from "@/i18n";
import { color, radius } from "@/theme/tokens";

import { Button } from "./Button";
import { Notice } from "./Notice";

/**
 * A camera that reports every QR code it reads. Camera permission is asked
 * here, in context (FR-012 deferred onboarding). On the web build the camera
 * is not offered at all: the web is a preview and dashboard surface, and the
 * plan accepts "not available here" (IMPLEMENTATION_UPDATE R2 step 5).
 */
export function QrScanner({
  onCode,
  height = 300,
}: {
  onCode: (text: string) => void;
  height?: number;
}) {
  const t = useStrings();
  const [permission, requestPermission] = useCameraPermissions();
  // The camera reports the same code many times a second; pass each change once.
  const last = useRef("");

  if (Platform.OS === "web") {
    return <Notice message={t.cameraUnavailable} />;
  }
  if (!permission) return null;
  if (!permission.granted) {
    return permission.canAskAgain ? (
      <Button label={t.allowCamera} onPress={() => void requestPermission()} />
    ) : (
      <Notice message={t.cameraDenied} tone="warning" />
    );
  }

  return (
    <View style={[styles.frame, { height }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={(result) => {
          if (result.data === last.current) return;
          last.current = result.data;
          onCode(result.data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: color.textPrimary,
  },
});
