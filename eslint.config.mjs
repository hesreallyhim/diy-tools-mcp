import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores([
    "**/dist/",
    "**/coverage/",
    "**/node_modules/",
    "**/*.js",
    "**/*.mjs",
    "**/*.cjs",
    "**/functions/",
    "**/function-code/",
    "**/test-*-functions/",
    "**/test-fixtures/",
    "**/INTERNAL/",
    "**/node_modules/",
    "**/dist/",
    "**/build/",
    "**/coverage/",
    "**/*.js",
    "**/*.mjs",
    "**/*.cjs",
    "**/jest.config.js",
    "**/functions/",
    "**/function-code/",
    "**/test-*-functions/",
    "**/test-*-integration/",
    "**/test-executor-functions/",
    "**/test-manager-functions/",
    "**/test-security/",
    "**/test-fixtures/",
    "**/*.tsbuildinfo",
    "**/.tmp/",
    "**/.temp/",
    "**/tmp/",
    "**/temp/",
    "**/examples/",
    "**/INTERNAL/",
]), {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
    ),

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.jest,
        },

        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.eslint.json",
        },
    },

    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "warn",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],

        "@typescript-eslint/no-non-null-assertion": "warn",

        "no-console": ["warn", {
            allow: ["warn", "error"],
        }],

        "prefer-const": "error",
    },
}]);