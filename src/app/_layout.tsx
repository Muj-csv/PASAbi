import { Stack } from "expo-router";
import { useEffect } from "react";

import { restoreLanguage } from "@/i18n";

export default function RootLayout() {
  useEffect(() => {
    void restoreLanguage();
  }, []);

  return (
    <Stack screenOptions={{ headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="index" options={{ title: "Pasabi" }} />
      <Stack.Screen name="my-data" options={{ title: "Pasabi" }} />
    </Stack>
  );
}
