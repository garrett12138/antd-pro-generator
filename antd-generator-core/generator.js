const fs = require("fs");
const path = require("path");
const { operateType } = require("./constants");

/**
 * {
 * path:"",
 * tags:[],
 * definitions:[]
 * }
 */
function generate(genParam) {
  const { path: outPath, tags, definitions } = genParam;
  if (!fs.existsSync(outPath)) {
    fs.mkdirSync(outPath);
  }
  const srcPath = path.join(outPath, "src");
  if (!fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath);
  }
  const mockPath = path.join(outPath, "mock");
  if (!fs.existsSync(mockPath)) {
    fs.mkdirSync(mockPath);
  }
  const servicePath = path.join(srcPath, "services");
  if (!fs.existsSync(servicePath)) {
    fs.mkdirSync(servicePath);
  }
  const modelPath = path.join(srcPath, "models");
  if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath);
  }
  generateService(tags, servicePath);
  generateMock(tags, mockPath, definitions);

  const models = tags.map(tag => {
    const { name, namespace } = tag;
    const states = [];
    const reducers = [];
    const effects = [];
    for (let api of tag.apis.values()) {
      const {
        effectName,
        summary,
        operate,
        reducer,
        effect,
        state,
        successText,
        name: serviceFunction
      } = api;
      if (effect) {
        effects.push({
          name: effectName,
          summary: summary,
          service: name,
          serviceFunction,
          operate,
          reducer,
          state,
          successText
        });
        if (operate === operateType.PUT_REDUCER) {
          states.push({ name: state, type: "object", value: "undefined" });
          reducers.push({ name: reducer, stateName: state });
        }
      }
    }
    return { name, namespace, states, reducers, effects };
  });
  generateModels(
    models.filter(m => m.effects.length > 0),
    modelPath
  );
}

function generateModels(models, distPath) {
  for (let model of models.values()) {
    generateModel(model, distPath);
  }
}

function generateMethods(methods) {
  let result = "import request from '@/utils/request';";
  methods.map(m => {
    result += generateMethod(m);
  });
  const beautify = require("js-beautify").js;
  return beautify(result, {
    indent_size: 4,
    space_in_empty_paren: true,
    jslint_happy: true
  });
}

function generateService(tags, distPath) {
  const beautify = require("js-beautify").js;
  tags.map(tag => {
    result = `/**
        * api client for ${tag.name}}
        */
        import request from '@/utils/request';
        `;
    tag.apis.map(m => {
      try {
        result += generateMethod(m);
      } catch (error) {
        console.error("生成方法出现异常", m, error);
        throw error;
      }
    });
    result = beautify(result, {
      indent_size: 4,
      space_in_empty_paren: true,
      jslint_happy: true
    });
    let filePath = path.join(distPath, tag.name + ".js");
    let i = 0;
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath);
    }
    while (fs.existsSync(filePath)) {
      i++;
      filePath = path.join(distPath, tag.name + "." + i + ".js");
    }
    fs.writeFileSync(filePath, result);
  });
}

function generateMock(tags, distPath, definitions) {
  const beautify = require("js-beautify").js;
  tags.map(tag => {
    let mock = "";
    tag.apis.map(m => {
      mock += generateMockMethod(m, definitions) + ",";
    });
    let result = `
    import Mock from 'mockjs';        
    export default {
        ${mock}
    }`;
    result = beautify(result, {
      indent_size: 4,
      space_in_empty_paren: true,
      jslint_happy: true
    });
    let filePath = path.join(distPath, tag.name + ".js");
    let i = 0;
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath);
    }
    while (fs.existsSync(filePath)) {
      i++;
      filePath = path.join(distPath, tag.name + "." + i + ".js");
    }
    fs.writeFileSync(filePath, result);
  });
}

function generateMethod(method) {
  const params = [
    ...method.queryParams,
    ...method.pathParams,
    ...method.formParams
  ];
  const paramArr = new Array();
  paramArr.push("errorHandler");
  params.map(pm => {
    paramArr.push(pm.name);
  });
  if (
    method.requestBody &&
    method.requestBody.content &&
    method.formParams.length === 0
  ) {
    paramArr.push("...rest");
  }
  const paramStr = paramArr.join(",");

  let rs = "";
  let paramName = "params";
  let paramType = "*";
  let paramDescription = `参数 {${paramStr}}`;

  rs += `
    /**
    * @summary ${method.summary}
    * @description ${method.description}`;
  rs += `
    * @param {${paramType}} ${paramName} ${paramDescription} `;

  rs += `\n*/`;
  rs += `export async function ${method.name} (${paramName}) {`;
  rs += `  let options = { method: '${method.method.toUpperCase()}' };`;
  rs += `const { ${paramStr}} = ${paramName};`;

  rs += ` if(errorHandler&&typeof(errorHandler)==='function'){
        options.errorHandler=errorHandler;
    }`;
  rs += `let url = '${method.path}';`;
  if (method.paramCount > 0) {
    if (method.pathParams.length > 0) {
      method.pathParams.map(pm => {
        rs += `url = url.replace('{${pm.name}}',${pm.name});`;
      });
    }
    if (method.queryParams.length > 0) {
      let qs = method.queryParams
        .map(pm => {
          return pm.name + "=${" + pm.name + "}";
        })
        .join("&");
      rs += " url += `?" + qs + "`;";
    }
    if (method.headerParams.length > 0) {
      const names = method.headerParams.map(pm => pm.name).join(",");
      rs += `  options.headers={${names}, ...options.headers}`;
    }
    if (method.formParams.length > 0) {
      rs += `  let formData = new FormData();`;
      method.formParams.map(pm => {
        rs += ` formData.append('${pm.name}',${pm.name});`;
      });

      rs += `options.data=formData;`;
    }
  }
  if (
    method.requestBody &&
    method.requestBody.content &&
    method.formParams.length === 0
  ) {
    rs += `options.data=rest;`;
  }
  rs += ` return request(url, options);
    } `;
  return rs;
}

function getDefaultvalue(type) {
  let defaultValueMap = new Map();
  defaultValueMap.set("integer", 0);
  defaultValueMap.set("number", 0.0);
  defaultValueMap.set("boolean", false);
  defaultValueMap.set("string", "");
  defaultValueMap.set("array", []);
  defaultValueMap.set("object", {});
  if (defaultValueMap.has(type)) {
    return defaultValueMap.get(type);
  } else {
    return "";
  }
}

function getDefaultObject(ref, definitions) {
  let obj = {};
  if (!definitions.has(ref)) {
    return obj;
  }
  let def = definitions.get(ref);
  def.properties.forEach((v, k) => {
    if (v.ref != undefined) {
      obj[k] = getDefaultObject(v.ref, definitions);
    } else {
      obj[k] = getDefaultvalue(v.type);
    }
  });
  return obj;
}
function generateMockMethod(method, definitions) {
  let resultStr = `const result = 200; `;

  let rs = "";
  let url = method.method.toUpperCase() + " " + method.path;
  if (method.pathParams) {
    method.pathParams.map(p => {
      url = url.replace(`{${p.name}}`, `:${p.name}`);
    });
  }
  rs = `'${url}': (req, res) => {
        ${resultStr}
        res.send(result);
    }`;
  return rs;
}
function generateModel(model, distPath) {
  let serviceApiMap = new Map();
  for (let effect of model.effects.values()) {
    if (!serviceApiMap.has(effect.service)) {
      serviceApiMap.set(effect.service, new Set());
      const set = new Set();
      set.add;
    }
    serviceApiMap.get(effect.service).add(effect.serviceFunction);
  }
  let refStr = "";
  serviceApiMap.forEach((v, k) => {
    const apiList = [];
    for (let apiName of v.values()) {
      apiList.push(apiName);
    }
    let apiArr = apiList.join(",");
    refStr += `import { ${apiArr} } from '@/services/${k}';`;
  });
  refStr += "import {message} from 'antd';";
  let stateStr = model.states.map(s => `${s.name}:${s.value}`).join(",");

  let effectStr = model.effects
    .map(ef => {
      let operateStr = "";

      switch (ef.operate) {
        case operateType.PUT_REDUCER:
          operateStr += `const response = yield call(${ef.serviceFunction}, payload);
                            yield put({ type: '${ef.reducer}', payload: response });`;
          break;
        case operateType.SHOW_SUCCESS:
          operateStr += `const response = yield call(${ef.serviceFunction}, payload);`;
          operateStr += `if(response!==undefined&&response!==null){
                          message.success('${ef.successText}');
                          }`;
          break;
        default:
      }
      return `*${ef.name}({ payload }, { call ${
        ef.operate === operateType.PUT_REDUCER ? ", put" : ""
      } }) {
            ${operateStr}
        }`;
    })
    .join(",");

  let reducerStr = model.reducers
    .map(r => {
      return `${r.name}(state, action) {
        return {
            ...state,
            ${r.stateName}: action.payload
        }
    }`;
    })
    .join(",");
  let js = `${refStr}
    export default {
        namespace: '${model.namespace}',
        //todo:适当修改state默人值及effects,reducers中的代码以适应自己的业务逻辑
        state: {
            ${stateStr}    
        },
        effects: {
           ${effectStr}
        },
        reducers: {
            ${reducerStr}
        }
    }`;
  const beautify = require("js-beautify").js;
  js = beautify(js, {
    indent_size: 4,
    space_in_empty_paren: true,
    jslint_happy: true
  });
  let filePath = path.join(distPath, model.name + ".js");
  let i = 0;
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
  }
  while (fs.existsSync(filePath)) {
    i++;
    filePath = path.join(distPath, model.name + "." + i + ".js");
  }
  fs.writeFileSync(filePath, js);
}
module.exports = {
  generate
};
