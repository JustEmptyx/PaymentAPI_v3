const {requestBody} = require("./requestBodies");

function sortObjectAlphabetically(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectAlphabetically).sort((a, b) => {
            const keyA = Object.keys(a)[0];
            const keyB = Object.keys(b)[0];
            const valueA = a[keyA];
            const valueB = b[keyB];

            
            const strA = typeof valueA === 'string' ? valueA : String(valueA);
            const strB = typeof valueB === 'string' ? valueB : String(valueB);

            return strA.localeCompare(strB);
        });
    }
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        sortedObj[key] = sortObjectAlphabetically(obj[key]);
    }
    return sortedObj;
}

function findAttribute(obj, attributeName) {
    let result = {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key) && key === attributeName) {
            result.key = key;
            result.value = obj[key];
            break;
        }
    }

    return Object.keys(result).length ? result : null;
}

function getRequestBody(project,method){
    let body = requestBody(project,method).body
    return body
}

const generateRandomHex = length =>
    Array.from({ length }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');

module.exports = {sortObjectAlphabetically,getRequestBody,findAttribute,generateRandomHex}
