module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
  extends: [
    "airbnb-base",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  plugins: ["import", "prettier", "@typescript-eslint"],
  env: {
    browser: false,
    es6: true,
  },
  rules: {
    // prettier
    "prettier/prettier": ["error"],
    // TypeScript
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/no-object-literal-type-assertion": "off",
    "no-console": "off",
    // import
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        mjs: "never",
        ts: "never",
      },
    ],
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".ts", ".json"],
      },
    },
    "import/extensions": [".js", ".ts", ".mjs"],
  },
  overrides: [
    {
      files: ["webpack/**/*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "import/no-extraneous-dependencies": "off",
      },
    },
    {
      files: ["*.test.js"],
      rules: {
        "no-undef": "off",
      },
    },
    {
      files: ["**/*.ts"],
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
  ],
  ignorePatterns: ["dist/**", "github-action/**"],
};
