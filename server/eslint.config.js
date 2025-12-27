import js from "@eslint/js";
import pluginSecurity from "eslint-plugin-security";
import globals from "globals";

export default [
  js.configs.recommended,
  pluginSecurity.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
      "security/detect-object-injection": "off",
    },
  },
];
