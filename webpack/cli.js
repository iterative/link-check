const webpack = require("webpack");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const { merge } = require("webpack-merge");
const common = require("./common");

const cliConfig = {
  entry: "./cli.ts",
  plugins: [
    new webpack.BannerPlugin({
      banner: "#!/usr/bin/env node",
      entryOnly: true,
      raw: true,
    }),
  ],
  output: {
    filename: "cli.js",
    path: path.resolve(__dirname, "..", "dist"),
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
};

module.exports = merge(common, cliConfig);
