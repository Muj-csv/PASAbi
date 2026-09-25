import { StyleSheet, Text, View } from "react-native";

import { PROTO_VERSION } from "@pasabi/core";

/**
 * Phase 0 placeholder. Its only job is to prove that routing renders on iOS,
 * Android and web, and that the @pasabi/core path alias resolves in Metro.
 * The real screens arrive in Phase 1.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pasabi</Text>
      <Text style={styles.subtitle}>
        When the towers fall, the barangay passes it on.
      </Text>
      <Text style={styles.meta}>core wire protocol v{PROTO_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  title: { fontSize: 32, fontWeight: "700" },
  subtitle: { fontSize: 16, textAlign: "center", opacity: 0.8 },
  meta: { fontSize: 12, opacity: 0.5, marginTop: 16 },
});
