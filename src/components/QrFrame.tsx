import { StyleSheet, useWindowDimensions, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { color, radius, space } from "@/theme/tokens";

/**
 * DESIGN_BRIEF sections 3 and 10: as large as fits, min(width - 32, max),
 * on a white card. Modules are always qrDark on qrLight, never themed.
 *
 * ponytail: the quiet zone is 6 % of the size, not an exact 4 modules,
 * because the module count depends on the payload. That is about 5 modules
 * for a 60-observation frame (version 18) and about 2 for a short receipt,
 * which phone scanners read fine. Compute it from the QR version if a
 * scanner ever struggles.
 */
export function QrFrame({
  value,
  maxSize = 360,
  label,
}: {
  value: string;
  maxSize?: number;
  label: string;
}) {
  const { width } = useWindowDimensions();
  const outer = Math.min(width - space[4] * 2, maxSize);
  const quiet = Math.round(outer * 0.06);
  return (
    <View
      style={[styles.card, { width: outer, padding: quiet }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <QRCode
        value={value}
        size={outer - quiet * 2}
        color={color.qrDark}
        backgroundColor={color.qrLight}
        ecl="M"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    backgroundColor: color.qrLight,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.borderSubtle,
  },
});
