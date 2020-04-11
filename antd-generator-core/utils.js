function objectToMap(object, resolve) {
    const resolveFunc = resolve ? resolve : (property, propertyName) => property;
    const map = new Map();
    Object.keys(object).map(key => { map.set(key, resolveFunc(object[key], key)) });
    return map;
}

function objectToArray(object, resolve) {
    const resolveFunc = resolve ? resolve : (property, propertyName) => property;
    return Object.keys(object).map(key => resolveFunc(object[key], key));

}
function arrayToMap(array, key, resolve) {
    const keyFunc = typeof (key) === 'function' ? keyName : (item) => item[key];
    const resolveFunc = resolve ? resolve : (item) => item;
    const map = new Map();
    array.map(item => { map.set(keyFunc(item), resolveFunc(item)) });
    return map;
}

function mapToObject(map) {
    const obj = {};
    map.forEach((value, key) => { obj[key] = value });
    return obj;
}
function mapToArray(map, resolve) {
    const resolveFunc = resolve ? resolve : (value, key) => value;
    const array = [];
    map.forEach((value, key) => {
        array.push(resolveFunc(value));
    });
    return array;
}


module.exports = {
    objectToMap,
    arrayToMap,
    mapToObject,
    mapToArray,
    objectToArray
}