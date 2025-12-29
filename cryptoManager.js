const axios = require("axios");

async function scCryptoHash(config,dataB64){
    const instance = axios.create({ httpAgent: new (require('http').Agent)({ keepAlive: false }), httpsAgent: new (require('https').Agent)({ keepAlive: false }) });

    const response = await instance.post(config.url_swagger + "SCCrypto/ra/hash", dataB64, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      timeout: 50000,
    });
    return response.data;
}

async function scCryptoSign(config,dataB64){
    const instance = axios.create({ httpAgent: new (require('http').Agent)({ keepAlive: false }), httpsAgent: new (require('https').Agent)({ keepAlive: false }) });

    const response = await instance.post(config.url_swagger + "SCCrypto/ra/signd", dataB64, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      timeout: 50000,
    });
    return response.data;
}

module.exports = {
    scCryptoSign,
    scCryptoHash
}