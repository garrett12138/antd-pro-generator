const {
  override,
  fixBabelImports,
  removeModuleScopePlugin,
  overrideDevServer,
  watchAll
} = require("customize-cra");
const path = require("path");
const workspaceDirectory = path.resolve(__dirname, "..");

/*
module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: 'css',
  }),
);
*/

/**
   
 */
/*
module.exports = override(
  config => ({
    ...config,
    output: {
      ...config.output,
      path: path.resolve(workspaceDirectory, 'ant-design-pro-dva-generator/res')
    }
  }),
  removeModuleScopePlugin(),
  //addWebpackResolve({ extensions: [".ts", ".tsx", ".js"] }),
  //addWebpackModuleRule({ test: /\.tsx?$/, exclude: /node_modules/, loader: "ts-loader" }),
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: 'css',
  }),
);
*/

module.exports = {
  webpack: override(
    config => ({
      ...config,
      output: {
        ...config.output,
        path: path.resolve(workspaceDirectory, "antd-pro-generator/res")
      }
    }),
    removeModuleScopePlugin(),
    //addWebpackResolve({ extensions: [".ts", ".tsx", ".js"] }),
    //addWebpackModuleRule({ test: /\.tsx?$/, exclude: /node_modules/, loader: "ts-loader" }),
    fixBabelImports("import", {
      libraryName: "antd",
      libraryDirectory: "es",
      style: "css"
    })
  ),
  devServer: overrideDevServer(
    // dev server plugin
    config => {
      console.log("config....", config);
      return {
        ...config,
        proxy: {
          "/": {
            target: "http://localhost:8081",
            changeOrigin: true,
            pathRewrite: {
              "^/": ""
            }
          }
        }
      };
    },
    watchAll()
  )
};
