import axios from "axios";

/**
 * load api info from json file
 * @param {string} type  'url'|'file'
 * @param {string} value  the swagger v2/openapi v3 doc url or file path
 * @param {*} onSuccess  success callback function
 * @param {*} onError error callback function
 */
function getApiData(type, value, onSuccess, onError) {
  axios
    .get(`/info?value=${value}&type=${type}`)
    .then(response => onSuccess(response.data.body))
    .catch(onError);
}

/**
 * get workspace folders
 * @param {*} onSuccess  success callback function
 * @param {*} onError error callback function
 */
function getFolders(onSuccess, onError) {
  axios
    .get("/folder")
    .then(response => {
      onSuccess(response.data.body);
    })
    .catch(onError);
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
  axios
    .post("/generate", {
      data: { tags: tags, definitions: definitions, path: path }
    })
    .then(response => {
      if (response.data.code > 0) {
        onError({ message: response.data.message });
      } else {
        onSuccess(response.data.body);
      }
    })
    .catch(onError);
}
export default {
  getFolders,
  getApiData,
  generate
};
