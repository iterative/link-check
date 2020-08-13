const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./common");

const cliConfig = {
  entry: "./cli.ts",
  plugins: [
    new webpack.BannerPlugin({
      banner: "#!/bin/node",
      entryOnly: true,
      raw: true,
    }),
  ],
  externals: ({ request }, cb) =>
    /^\.+/.test(request) ? cb() : cb(null, "commonjs " + request),
  output: {
    filename: "cli.js",
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
