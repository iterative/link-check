const { merge } = require("webpack-merge");
const configs = require("./all");

module.exports = configs.map((config) =>
  merge(config, {
    mode: "development",
    devtool: "inline-source-map",
  })
);
