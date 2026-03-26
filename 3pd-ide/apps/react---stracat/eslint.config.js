// eslint.config.js
import js from "@eslint/js";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
      },
    },
    plugins: {
      react,
      "jsx-a11y": jsxA11y,
      "@typescript-eslint": ts,
    },
    rules: {
      // Core recommended rules
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...ts.configs.recommended.rules,

      // React Hooks rules now come from eslint-plugin-react
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React 17+ JSX transform
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
    },
  },
  prettier,
];
