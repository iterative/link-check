const webpack = require('webpack')
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  context: path.join(__dirname, 'src'),
  mode: 'production',
  target: 'node',
  optimization: {
    emitOnErrors: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  entry: './cli.ts',
  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      entryOnly: true,
      raw: true
    })
  ],
  output: {
    filename: 'cli.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false
          }
        },
        extractComments: false
      })
    ]
  }
}
