/* eslint-env node */
import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import json from "@eslint/json";
import markdown from "@eslint/markdown";

// Helper function to convert JSDoc warnings to errors for strict enforcement
const strictJSDocRules = () => ({
  ...Object.fromEntries(
    Object.entries(jsdoc.configs["flat/recommended"].rules).map(
      ([key, value]) => [key, value === "warn" ? "error" : value],
    ),
  ),
  // Add additional strict rules not in recommended
  "jsdoc/check-indentation": "error",
  "jsdoc/check-line-alignment": "error",
  "jsdoc/require-description": "error",
  // Allow implementations using `@inheritdoc` to omit explicit @returns
  "jsdoc/require-returns": ["error", { exemptedBy: ["throws", "inheritdoc"] }],
});

export default [
  // Apply recommended rules to all files
  eslint.configs.recommended,

  // Apply JSON recommended rules
  json.configs.recommended,

  // Disable ESLint rules that conflict with Prettier
  prettierConfig,

  {
    // Global ignores
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/lib/**",
      "**/build/**",
      "**/*.js.map",
      "**/coverage/**",
      "**/.env*",
      "**/data/**",
      "**/package-lock.json",
      "SCRATCHPAD.md",
      // Ignore generated types file globally (moved to top-level generated/)
      "generated/types/types.js",
    ],
  },

  {
    // Configuration for Node.js JavaScript files
    files: ["**/*.js"],
    ignores: ["**/public/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      // Apply strict JSDoc rules (all errors, plus additional rules)
      ...strictJSDocRules(),
      // Allow unused vars that start with underscore
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  {
    // Configuration for browser JavaScript files
    files: ["**/public/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    // Special rules for Interface classes - disable unused vars check
    files: ["**/types.js"],
    rules: {
      "no-unused-vars": "off",
    },
  },

  {
    // JSON files MUST be valid
    files: ["**/*.json"],
    language: "json/json",
    rules: {
      "no-irregular-whitespace": "off",
    },
  },

  {
    // Markdown files MUST be valid
    files: ["**/*.md"],
    plugins: { markdown },
    processor: "markdown/markdown",
    language: "markdown/commonmark",
    languageOptions: {
      // Allow YAML frontmatter in Markdown files, like in instruction files
      frontmatter: "yaml",
    },
    rules: {
      "no-irregular-whitespace": "off",
    },
  },

  {
    // JavaScript MUST be valid inside Markdown files
    files: ["**/*.md/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": "off", // The ONLY rule that relaxes JS in Markdown
      // Disable all JSDoc rules for documentation examples
      ...Object.fromEntries(
        Object.keys(jsdoc.configs["flat/recommended"].rules).map((key) => [
          key,
          "off",
        ]),
      ),
    },
  },
];
