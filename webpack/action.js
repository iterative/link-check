const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./common");

const actionConfig = {
  target: "node",
  entry: "./github-action/index.ts",
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "../README.md",
          to: "README.md",
        },
        {
          from: "github-action/action.yml",
          to: "action.yml",
        },
      ],
    }),
  ],
  output: {
    path: path.join(__dirname, "..", "github-action"),
    filename: "index.js",
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
            semicolons: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
};

module.exports = merge(common, actionConfig);
