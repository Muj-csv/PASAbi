import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useStrings } from "@/i18n";
import { color, size, TOUCH_TARGET } from "@/theme/tokens";

import { Icon } from "./pictograms";

const NAV_HEIGHT = 60;

/**
 * Resident-persona bottom navigation (reference design section 9/17):
 * Home and My reports, the two resident-facing routes that actually exist.
 * There's no Settings screen to name a third tab after, so this stays two
 * items rather than inventing one (existing-features rule, DESIGN_BRIEF).
 * Fixed to the bottom on the two resident screens only — Station and the
 * responder dashboard are separate personas with their own controls.
 */
export function BottomNav({ active }: { active: "home" | "myData" }) {
  const t = useStrings();
  const router = useRouter();

  const tab = (
    key: "home" | "myData",
    label: string,
    icon: "home" | "ledger",
    href: "/" | "/my-data",
  ) => {
    const isActive = active === key;
    return (
      <Pressable
        key={key}
        onPress={() => router.push(href)}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Icon name={icon} size={24} color={isActive ? color.ink : color.ink3} />
        <Text style={[styles.label, isActive && styles.labelOn]}>{label}</Text>
        {isActive ? <View style={styles.activeMark} /> : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {tab("home", t.navHome, "home", "/")}
      {tab("myData", t.navMyReports, "ledger", "/my-data")}
    </View>
  );
}

export { NAV_HEIGHT };

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: NAV_HEIGHT,
    flexDirection: "row",
    backgroundColor: color.paper,
    borderTopWidth: 1,
    borderTopColor: color.rule,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: { fontSize: size.tab.fontSize, fontWeight: "600", color: color.ink3 },
  labelOn: { color: color.ink, fontWeight: "700" },
  activeMark: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: color.ballpen,
  },
});
