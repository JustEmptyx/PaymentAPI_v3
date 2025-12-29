function convertToBase64URL(inputStr){
  let buff = new Buffer(inputStr);
    return buff.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function convertToBase64(inputStr){
  let buff = new Buffer(inputStr);
  return buff.toString('base64')
}

function convertBase64ToBase64Url(stringBase64){
    return stringBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function convertBase64UrlToBase64(base64UrlString) {
    let base64String = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = base64String.length % 4; if (paddingLength > 0) {
        base64String += '='.repeat(4 - paddingLength);
    }
    return base64String;
}

function decodeBase64(base64String) {
    return Buffer.from(base64String, 'base64').toString();
}

function decodeBase64Url(base64UrlString) {
    const base64String = convertBase64UrlToBase64(base64UrlString); return decodeBase64(base64String);
}

module.exports = {
    convertToBase64,
    convertToBase64URL,
    convertBase64UrlToBase64,
    convertBase64ToBase64Url,
    decodeBase64,
    decodeBase64Url
}