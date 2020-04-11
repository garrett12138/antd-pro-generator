import Hash from "hash.js";
import { commandType } from "antd-generator-core";
let vscode;
try {
  vscode = acquireVsCodeApi();
  window.addEventListener("message", event => {
    const data = event.data;
    console.log(event);
    if (data.hashCode === undefined) {
      console.error("invalid message format,event.data.hashCode not defined");
      //throw new Error('invalid message format,event.data.hashCode not defined');
    }
    if (!callbackStack.has(data.hashCode)) {
      console.error("callback func not found!");
      //throw new Error('callback func not found!')
    }
    const callback = callbackStack.get(data.hashCode);
    callbackStack.delete(data.hashCode);
    callback(data);
  });
} catch (e) {
  vscode = {};
  vscode.postMessage = data => console.log(data);
}
const callbackStack = new Map();

function getHashCode(seed) {
  let random1 = Math.random();
  let time = new Date().getTime();
  let random2 = Math.random();
  let str = `${seed}${random1}${time}${random2}`;
  return Hash.sha256()
    .update(str)
    .digest("hex");
}

function sendMassge(data, onSuccess, onError) {
  console.log("pre send message", data);
  let hashCode = getHashCode(JSON.stringify(data));
  let seed = Math.ceil(Math.random() * 10000);
  while (callbackStack.has(hashCode)) {
    seed++;
    hashCode = getHashCode(JSON.stringify(data) + seed);
  }
  data.hashCode = hashCode;
  vscode.postMessage(data);
  console.log("after send message", data);
  callbackStack.set(hashCode, data => {
    if (data.code === 0) {
      onSuccess(data.body);
    } else {
      onError({ code: data.code, message: data.message });
    }
  });
}

/**
 * load api info from json file
 * @param {string} type  'url'|'file'
 * @param {string} value  the swagger v2/openapi v3 doc url or file path
 * @param {*} onSuccess  success callback function
 * @param {*} onError error callback function
 */
function getApiData(type, value, onSuccess, onError) {
  sendMassge(
    { cmd: commandType.GET_APPINFO, body: { type, value } },
    onSuccess,
    onError
  );
}

/**
 * get workspace folders
 * @param {*} onSuccess  success callback function
 * @param {*} onError error callback function
 */
function getFolders(onSuccess, onError) {
  sendMassge(
    { cmd: commandType.GET_WORKSPACE_FOLDERS, body: {} },
    onSuccess,
    onError
  );
}

/**
 * generate service and mock code
 * @param {Object} tags
 * @param {Object} definitions
 * @param {string} path
 * @param {*} onSuccess  success callback function
 * @param {*} onError error callback function
 */
function generate(tags, definitions, path, onSuccess, onError) {
  sendMassge(
    {
      cmd: commandType.GENERATE,
      body: { tags: tags, definitions: definitions, path: path }
    },
    onSuccess,
    onError
  );
}
export default {
  getFolders,
  getApiData,
  generate
};
