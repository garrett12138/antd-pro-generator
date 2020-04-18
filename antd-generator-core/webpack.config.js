"use strict";

const path = require("path");
const configTogenerator = {
  target: "node",

  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "..", "antd-pro-generator", "lib"),
    filename: "index.js",
    libraryTarget: "commonjs",
    devtoolModuleFilenameTemplate: "../[resource-path]"
  },
  devtool: "source-map"
};
const config = {
  target: "node",

  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    libraryTarget: "commonjs",
    devtoolModuleFilenameTemplate: "../[resource-path]"
  },
  devtool: "source-map"
};
module.exports = [config, configTogenerator];
