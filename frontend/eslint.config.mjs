import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // API responses are loosely typed by design throughout this app.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
