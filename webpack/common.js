const path = require("path");

module.exports = {
  context: path.join(__dirname, "..", "src"),
  mode: "production",
  optimization: {
    emitOnErrors: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
