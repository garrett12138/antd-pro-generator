const { convertFile, convertObj } = require("./converter");
const {
  arrayToMap,
  objectToArray,
  mapToObject,
  mapToArray
} = require("./utils");
const axios = require("axios");
const { paramType, operateType } = require("./constants");
const buildType = {
  URL: 1,
  FILE: 2
};
class ApiObjectBuilder {
  constructor() {
    this.isV2 = false;
    this.docUrl = undefined;
    this.jsonFilePath = undefined;
  }
  static create() {
    return new ApiObjectBuilder();
  }
  url(url) {
    this.docUrl = url;
    this.type = buildType.URL;
    return this;
  }
  jsonFile(filePath) {
    this.jsonFilePath = filePath;
    this.type = buildType.FILE;
    return this;
  }
  async build() {
    let result;
    try {
      let converResult;
      if (this.type === buildType.URL) {
        //使用convertUrl时，当url不可达捕获不到异常
        //result = { error: undefined, body: await convertUrl(this.docUrl, {}) };
        const json = await axios.get(this.docUrl);
        converResult = await convertObj(json.data, {});
      } else {
        converResult = await await convertFile(this.jsonFilePath, {});
      }
      result = { error: undefined, body: resolve(converResult.openapi) };
    } catch (e) {
      result = { error: e.message, body: undefined };
    }
    return result;
  }
}
function resolve(apiDoc) {
  const apiMap = arrayToMap(apiDoc.tags, "name", item => ({
    ...item,
    namespace: item.name,
    apis: []
  }));
  const httpMethodResolve = (obj, httpMethod) => {
    const getResponseBodyTitle = responses => {
      if (responses && responses["200"] && responses["200"].content) {
        const consumes = objectToArray(responses["200"].content);
        if (consumes.length > 0) {
          let schema = undefined;
          if (consumes[0].schema.$ref) {
            schema = consumes[0].schema.$ref;
          } else if (
            consumes[0].schema.items &&
            consumes[0].schema.items.$ref
          ) {
            schema = consumes[0].schema.items.$ref;
          }

          return schema
            ? schema.replace("#/components/schemas/", "").replace(/_/g, "")
            : "";
        }
      }
      return "";
    };
    const getRequestBodyTitle = requestBody => {
      if (requestBody && requestBody.content) {
        const produces = objectToArray(requestBody.content);
        if (produces.length > 0 && produces[0].schema.$ref) {
          return produces[0].schema.$ref
            .replace("#/components/schemas/", "")
            .replace(/_/g, "");
        }
      }
      return "";
    };
    const api = {
      method: httpMethod,
      paramCount: obj.parameters ? obj.parameters.length : 0,
      pathParams: [],
      queryParams: [],
      formParams: [],
      headerParams: [],
      name: obj.operationId,
      effectName: obj.operationId,
      description: obj.description,
      summary: obj.summary,
      requestBody: obj.requestBody,
      responses: obj.responses,
      responseBodyTitle: getResponseBodyTitle(obj.responses),
      requestBodyTitle: getRequestBodyTitle(obj.requestBody),
      tag: obj.tags[0]
    };
    if (obj.parameters !== undefined) {
      obj.parameters.map(param => {
        switch (param.in) {
          case paramType.PATH:
            api.pathParams.push(param);
            break;
          case paramType.QUERY:
            api.queryParams.push(param);
            break;
          case paramType.HEADER:
            api.headerParams.push(param);
            break;
          default:
            console.error("未知参数形式:" + param.in);
        }
      });
    }
    if (obj.requestBody && obj.requestBody.content) {
      const formInfo =
        obj.requestBody.content["application/x-www-form-urlencoded"];
      if (formInfo !== undefined) {
        const requiredSet = new Set(formInfo.schema.required);
        const params = objectToArray(
          formInfo.schema.properties,
          (props, name) => ({
            ...props,
            name,
            in: "form",
            required: requiredSet.has(name) ? true : false,
            schema: { type: props.type, format: props.format }
          })
        );
        api.formParams = params;
      }
    }
    return api;
  };
  const pathResolve = (item, apiPath) => {
    const apis = objectToArray(item, httpMethodResolve);
    apis.map(api => {
      api.path = apiPath;
    });
    return apis;
  };
  const apiList = [];
  objectToArray(apiDoc.paths, pathResolve).map(array => {
    array.map(api => {
      apiList.push(api);
    });
  });
  for (let api of apiList.values()) {
    if (!apiMap.has(api.tag)) {
      apiMap.set(api.tag, { name: api.tag, description: "", apis: [] });
    }
    apiMap.get(api.tag).apis.push(api);
  }
  const definitions = objectToArray(
    apiDoc.components.schemas,
    (shcema, name) => ({ ...shcema, name })
  );
  return { tags: mapToArray(apiMap), definitions: definitions };
}
module.exports = ApiObjectBuilder;
