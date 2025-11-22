import globals from "globals";
import * as tseslint from "typescript-eslint";

// Use flat config array directly for ESLint flat config (no wrapper object or key)
export default [
  // JavaScript files config
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: { ...globals.browser },
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-undef": "error",
      "no-console": "warn",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      curly: "error",
      strict: ["error", "global"],
      "no-empty": "error",
      "no-fallthrough": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-return-await": "error",
    },
  },
  // TypeScript files config
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: { ...globals.browser },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-var-requires": "error",
      "no-console": "warn",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      curly: "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "no-empty": "error",
      "no-fallthrough": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-return-await": "error",
    },
  },
];
