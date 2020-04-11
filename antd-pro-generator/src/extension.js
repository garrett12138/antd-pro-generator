// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const {
  ApiObjectBuilder,
  generate,
  commandType
} = require("antd-generator-core");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // register service generator
  let serviceDisposable = vscode.commands.registerCommand(
    "extension.antdGenerator",
    function() {
      const _servicePanel = vscode.window.createWebviewPanel(
        "AntdesignCodeGenerator", // viewType
        "Ant Design Pro Code Generator", // 视图标题
        vscode.ViewColumn.One, // 显示在编辑器的哪个部位
        {
          enableScripts: true, // 启用JS，默认禁用
          retainContextWhenHidden: true // webview被隐藏时保持状态，避免被重置
        }
      );
      _servicePanel.webview.html = loadHtml("index.html", context);
      _servicePanel.webview.onDidReceiveMessage(
        message => {
          console.log("receive message", message);
          switch (message.cmd) {
            case commandType.GET_WORKSPACE_FOLDERS:
              getWorkSpaceFolders(message, _servicePanel);
              break;
            case commandType.GET_APPINFO:
              getAppInfo(message, _servicePanel);
              break;

            case commandType.GENERATE:
              generateCode(message, _servicePanel);
              break;
            default:
              let errMsg = `handler is not set for cmd:${message.cmd}`;
              send(
                {
                  cmd: message.cmd,
                  hashCode: message.hashCode,
                  code: 500,
                  msg: errMsg
                },
                _servicePanel
              );
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );
  context.subscriptions.push(serviceDisposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;

async function send(data, panel) {
  panel.webview.postMessage(data);
}

async function getAppInfo(data, panel) {
  let result = { hashCode: data.hashCode, cmd: data.cmd };
  try {
    let apiData;
    if (data.body.type === "url") {
      apiData = await ApiObjectBuilder.create()
        .url(data.body.value)
        .build();
    } else {
      apiData = await ApiObjectBuilder.create()
        .jsonFile(data.body.value)
        .build();
    }
    if (apiData.body) {
      result.body = apiData.body;
      result.code = 0;
      result.message = "";
    } else {
      vscode.window.showErrorMessage(e.message);
      result.code = 500;
      result.message = apiData.error;
    }
  } catch (e) {
    vscode.window.showErrorMessage(e.message);
    result.code = 500;
    result.message = e.message;
  }
  send(result, panel);
}

async function generateCode(data, panel) {
  let result = { hashCode: data.hashCode, cmd: data.cmd };
  try {
    generate(data.body);
    result.code = 0;
    result.message = "";
  } catch (e) {
    vscode.window.showErrorMessage(e.message);
    result.code = 500;
    result.message = e.message;
  }
  send(result, panel);
}

function getWorkSpaceFolders(data, panel) {
  let result = { hashCode: data.hashCode, cmd: data.cmd };
  result.body = vscode.workspace.workspaceFolders.map(wsf => wsf.uri.fsPath);
  result.code = 0;
  result.message = "";
  console.log("get workspace folders", result);
  send(result, panel);
}

function loadHtml(fileName, context) {
  const absolutePath = path.resolve(context.extensionPath, "res");
  let html = fs.readFileSync(path.resolve(absolutePath, fileName), "utf-8");
  html = html.replace(
    /(<link[^\"]+href=\"|<script[^\"]+src=\"|<img.+src=\")([^\"]*)\"/g,
    (m, $1, $2) => {
      console.log("resolve path", $1, $2);
      return (
        $1 +
        vscode.Uri.file(
          context
            .asAbsolutePath($2)
            .replace(context.extensionPath, absolutePath)
        )
          .with({ scheme: "vscode-resource" })
          .toString() +
        '"'
      );
    }
  );
  return html;
}
