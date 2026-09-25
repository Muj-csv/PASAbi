const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...(Array.isArray(expoConfig) ? expoConfig : [expoConfig]),
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*"],
  },
  {
    // CLAUDE.md: packages/core is pure TypeScript. No react, no react-native,
    // no DOM, no platform imports. Enforced here so it cannot drift.
    files: ["packages/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-*",
                "react-native",
                "react-native/*",
                "expo",
                "expo-*",
                "@expo/*",
                "@react-native*",
                "@/*",
              ],
              message:
                "packages/core must stay pure TypeScript (CLAUDE.md). Move platform code to src/ or packages/transport/.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "packages/core must not touch the DOM." },
        { name: "document", message: "packages/core must not touch the DOM." },
        { name: "navigator", message: "packages/core must not touch the DOM." },
      ],
    },
  },
];
