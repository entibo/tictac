const webpack = require("webpack")
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: ["./index.js", "./style.scss"],
  output: {
    filename: "./dist/main.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: __dirname,
        loader: "babel-loader",
        exclude: /node_modules/
      }
    ],
    rules: [{
      test: /\.scss$/,
      use: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
    }]
  },
  plugins: [
    new ExtractTextPlugin("./dist/style.css")
  ]
};