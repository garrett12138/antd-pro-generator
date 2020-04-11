const commandType = {
  GET_APPINFO: "getAppInfo",
  GET_WORKSPACE_FOLDERS: "getWorkSpaceFolders",
  GENERATE: "generateCode"
};
const paramType = {
  QUERY: "query",
  PATH: "path",
  FORM: "formData",
  BODY: "body",
  HEADER: "header"
};
const operateType = {
  NONE: 0,
  PUT_REDUCER: 1,
  SHOW_SUCCESS: 2
};
module.exports = { commandType, paramType, operateType };
