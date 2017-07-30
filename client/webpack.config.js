const webpack = require("webpack")
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: ["./index.js", "./style.scss"],
  output: {
    filename: "./dist/main.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin("./dist/style.css")
  ]
};