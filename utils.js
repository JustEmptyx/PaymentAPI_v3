const {requestBody} = require("./requestBodies");

function canonicalizeXml(xml) {
    if (!xml || typeof xml !== 'string') return xml;

    // Step 1: Sort attributes in each tag / XML declaration
    xml = xml.replace(/<([a-zA-Z_?][\w:.-]*)(\s+[^>]*)?(\/?>)/g, (match, tagName, attrString, closer) => {
        if (!attrString || attrString.trim() === '') {
            return `<${tagName}${closer}`;
        }
        const attrs = [];
        const attrRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
        let m;
        while ((m = attrRegex.exec(attrString)) !== null) {
            const name = m[1];
            const value = m[2] !== undefined ? m[2] : m[3];
            attrs.push({ name, value });
        }
        if (attrs.length === 0) {
            return `<${tagName}${closer}`;
        }
        attrs.sort((a, b) => a.name.localeCompare(b.name));
        const sortedAttrs = attrs.map(a => `${a.name}="${a.value}"`).join(' ');
        return `<${tagName} ${sortedAttrs}${closer}`;
    });

    // Step 2: Minify — remove whitespace between tags, keep inside text nodes
    xml = xml.replace(/>\s+</g, '><');
    xml = xml.trim();

    return xml;
}

function sortObjectAlphabetically(obj) {
    if (typeof obj === 'string') {
        if (obj.trim().startsWith('<')) {
            return canonicalizeXml(obj);
        }
        return obj;
    }
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

function sortObjectAlphabeticallyNew(obj) {
    if (typeof obj === 'string') {
        if (obj.trim().startsWith('<')) {
            return canonicalizeXml(obj);
        }
        return obj;
    }
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectAlphabeticallyNew);
    }
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        sortedObj[key] = sortObjectAlphabeticallyNew(obj[key]);
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

function serializeRequestBody(requestBody) {
    return typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
}

module.exports = {sortObjectAlphabetically,sortObjectAlphabeticallyNew,getRequestBody,findAttribute,generateRandomHex,serializeRequestBody,canonicalizeXml}
