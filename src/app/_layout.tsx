import { Stack } from "expo-router";
import { useEffect } from "react";

import { restoreLanguage } from "@/i18n";
import { restoreStationMode } from "@/storage/station";
import { color } from "@/theme/tokens";

export default function RootLayout() {
  useEffect(() => {
    void restoreLanguage();
    // BR-008: a device that was a station before a restart must keep station
    // capacity, or its first write would evict down to resident size.
    void restoreStationMode();
  }, []);

  return (
    // DESIGN_BRIEF section 7: light only this round, and the page ground is
    // set on purpose rather than inherited from React Navigation's default.
    <Stack
      screenOptions={{
        headerTitleStyle: { fontWeight: "700", color: color.textPrimary },
        headerStyle: { backgroundColor: color.surface },
        contentStyle: { backgroundColor: color.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Pasabi" }} />
      <Stack.Screen name="my-data" options={{ title: "Pasabi" }} />
      <Stack.Screen name="station" options={{ title: "Pasabi" }} />
      <Stack.Screen name="incident/[key]" options={{ title: "Pasabi" }} />
      <Stack.Screen name="dashboard" options={{ title: "Pasabi" }} />
      <Stack.Screen name="share" options={{ title: "Pasabi" }} />
      <Stack.Screen name="scan" options={{ title: "Pasabi" }} />
    </Stack>
  );
}
