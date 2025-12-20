
const uuid = require('uuid')
const {create} = require("axios");

const { execSync } = require('child_process');
const readline = require("readline-sync");
const axios = require("axios");
const {requestBody} =  require('./requestBodies.js')
const fs = require("fs");
const {format} = require("date-fns");
const {setRequestBody} = require("./requestBodies");
const {getClientAssertion,createTokenWithClientAssertion} = require("./clientSecretJWTAuth")
const {stringify} = require("uuid");
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class UnixDate{
    unixTimestamp = 0
    constructor(){
        this.unixTimestamp = Math.floor(Date.now() / 1000);
    }

    getCurrentDate(){
        return this.unixTimestamp
    }
    getNextDayDate(){
        return this.unixTimestamp + 3600
    }

    getDateNsecondsAgo(n){
        return this.unixTimestamp  - n
    }

    getFormattedDate(unixTime) {
        // Преобразуем Unix-время в миллисекунды (умножаем на 1000)
        const date = new Date(unixTime * 1000);
        // Используем метод toUTCString() для форматирования даты
        return date.toUTCString();
    }

    getISOWithTimeZone(unixTime, timeZoneOffset = '+03:00') {
        // Преобразуем Unix-время в миллисекунды
        const date = new Date(unixTime  * 1000 );

        // Получаем компоненты даты
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        // Формируем строку в формате ISO 8601 с временной зоной
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timeZoneOffset}`;
    }

    getShortedDate(){
        const date = new Date(unixTime  * 1000 );

        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
        const day = String(date.getUTCDate()).padStart(2, '0');

        return `${year}${month}${day}`;
    }

}

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
let unixDate = new UnixDate()
const currentDate = new Date();
let authType = "OBclientCredentials" // PAUapikey, OBclientCredentials
function setAuthType(authTypeInner){
    authType = authTypeInner
}
async function createFile(fileName,data){
  fs.writeFileSync(fileName,data,function(error){if(error) throw error
  console.log('accountList file created')
  })
}

async function appendToDefinedFile(fileName,tagName,data){
  fs.appendFileSync(fileName,
      "\n\n" + "!========================================="+tagName+"=========================================!\n\n"+
      data, function(error){
   if(error) throw error;
   console.log('Данные успешно записаны записать файл');
  });
}

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


async function createTokenPISP(config,test){
    let response
  if(!test) {
      response = await fetch(config.url_kc + "auth/realms/SCRealm/protocol/openid-connect/token", {
          method: "POST",
          headers: {
              "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
              client_id: config.client_id_pisp,
              client_secret: config.client_secret_pisp,
              grant_type: "client_credentials",
              scope: "SC-APPS payments openid"
              // scope: "SC-APPS openid"
          })
      });
  } else {
      response = await fetch(config.url_kc+"auth/realms/SCRealm/protocol/openid-connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
        client_id: config.client_id_pisp,
        client_secret: config.client_secret_pisp,
        grant_type: "client_credentials",
        scope: "SC-APPS openid"
        // scope: "SC-APPS openid"
    })
  });
  }
    return response.json()
}

async function createTokenQPISP(config){
  let local_config = {client_id:config.client_id_qpisp,client_secret:config.client_secret_qpisp,url_kc:config.url_kc,alg: "BELTM256",typ: "JOSE", url_swagger:config.url_swagger, scope:"SC-APPS instant-payments openid"}
  let client_assertion = await getClientAssertion(local_config,false)
  appendToDefinedFile("logs.txt","client_assertion",client_assertion.toString())
  let token = await createTokenWithClientAssertion(local_config,client_assertion)
  return token
}

async function createTokenTPE(config){
  let local_config = {client_id:config.client_id_tpe,client_secret:config.client_secret_tpe,url_kc:config.url_kc,alg: "BELTM256",typ: "JOSE", url_swagger:config.url_swagger, scope:"SC-APPS instant-invoices openid"}
  let client_assertion = await getClientAssertion(local_config,false)
  appendToDefinedFile("logs.txt","client_assertion",client_assertion.toString())
  let token = await createTokenWithClientAssertion(local_config,client_assertion)
  return token
}

async function createDboClientToken(config){
    const response = await fetch(config.url_swagger+"auth/realms/SCRealm/protocol/openid-connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
        client_id: config.client_id_dbo,
        client_secret: config.client_secret_dbo,
        grant_type: "client_credentials",
        scope: "SC-APPS online-banking"
    })
  });
  return response.json()
}
function addYearsToDate(date, years) {
    const resultDate = new Date(date);
    resultDate.setFullYear(resultDate.getFullYear() + years);
    return formatDate(resultDate);
}

function subtractYearsFromDate(date, years) {
    const resultDate = new Date(date);
    resultDate.setFullYear(resultDate.getFullYear() - years);
    return formatDate(resultDate);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}



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

async function generateHeader(config, additionalInfo){
  let headerRaw

  if(authType == "OBclientCredentials") {
  headerRaw = {"alg": "BIGNS128",
  "crit": [
    "http://openbanking.asb.by/asn1",
    "http://openbanking.asb.by/crptPrvdr",
    "http://openbanking.asb.by/signDtTm",
    "http://openbanking.asb.by/signedData",
    // "http://openbanking.asb.by/debtorIdentification"
  ],
  "http://openbanking.asb.by/asn1": true,
  "http://openbanking.asb.by/crptPrvdr": 1,
  "http://openbanking.asb.by/signDtTm": unixDate.getISOWithTimeZone(unixDate.getDateNsecondsAgo(-10800)),
  "http://openbanking.asb.by/signedData": {
    "pars": [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "content-type",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
      "x-idempotency-key"
    ]
  },
  // "http://openbanking.asb.by/debtorIdentification":"privateIdentification",
  "typ": "JOSE"}
  } else {
  headerRaw = {"alg": "BIGNS128",
  "crit": [
    "http://openbanking.asb.by/asn1",
    "http://openbanking.asb.by/crptPrvdr",
    "http://openbanking.asb.by/signDtTm",
    "http://openbanking.asb.by/signedData",
    // "http://openbanking.asb.by/debtorIdentification"
  ],
  "http://openbanking.asb.by/asn1": true,
  "http://openbanking.asb.by/crptPrvdr": 1,
  "http://openbanking.asb.by/signDtTm": unixDate.getISOWithTimeZone(unixDate.getDateNsecondsAgo(-10800)),
  "http://openbanking.asb.by/signedData": {
    "pars": [
      "@method",
      "@target-uri",
      "content-digest",
      "content-type",
      "x-api-key",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
      "x-idempotency-key"
    ]
  },
  // "http://openbanking.asb.by/debtorIdentification":"organisationIdentification",
  "typ": "JOSE"}
}
  if(additionalInfo.includes("NoIdempotencyKey")){
    let tempArr = headerRaw["http://openbanking.asb.by/signedData"]["pars"]
    delete tempArr.splice(tempArr.indexOf("x-idempotency-key"),1)
    headerRaw["http://openbanking.asb.by/signedData"]["pars"] = tempArr
  }
  if(additionalInfo.includes("NoContentType")){
    let tempArr = headerRaw["http://openbanking.asb.by/signedData"]["pars"]
    delete tempArr.splice(tempArr.indexOf("content-type"),1)
    headerRaw["http://openbanking.asb.by/signedData"]["pars"] = tempArr
  }
  return headerRaw
}

function getRequestBody(project,method){
    let body = requestBody(project,method).body
    return body
}

async function getPayloadByMethodRoute(config,method,authToken,hmac,fapiInteractionId,idempotencyKey,domesticConsentId,ASPSPsession) {
    let body
    switch (method) {
        case "paymentConsents/domestic":
        body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            } :  {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "DELETEconsentDomestic":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } :  {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "payments/domestic":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            } : {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "PATCHpaymentConsents/domestic":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "PATCH",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            } : {
            "pars": {
                "@method": "PATCH",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "PUTpaymentConsentsCreateExternalRepresentation":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createExternalRepresentation",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            } : {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createExternalRepresentation",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            }
            break
        case "PUTpaymentConsentsCreateExternalRepresentationSpecialPart":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createSpecialPartExternalRepresentation",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            } : {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createSpecialPartExternalRepresentation",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            }
            break
        case "GETpaymentConsents/PSUorPAU":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "GETconsentsList/PSUorPAU":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "GETconsentsList":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "GETconsentStatusDBO":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "paymentConsents/instant":
        body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            } :  {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "payments/instant":
        body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/instant",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            } :  {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/instant",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "GETconsentStatus":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "DELETEpaymentConsents/instant":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            } : {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "DELETEpaymentConsentsDomesticDBO":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+domesticConsentId + "/PSUorPAU/V087_TEST1",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            } : {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+domesticConsentId + "/PSUorPAU/V087_TEST1",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "GETpaymentConsents/instant":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            } : {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "GETUrlPatchPaymentsConsentInstant":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@authority": config.url_swagger.split("/")[2],
                "@path": "/instantAuth",
                "@query-param;name=ASPSPsession": config.ASPSPsession,
                "@query-param;name=QPISPsession": encodeURIComponent(config.url_swagger + "instantPSUredirect?session=" + config.QPISPsession),
                "@scheme": "https"
                }
            } : {
            "pars": {
                "@authority": config.url_swagger.split("/")[2],
                "@path": "/instantAuth",
                "@query-param;name=ASPSPsession": config.ASPSPsession,
                "@query-param;name=QPISPsession": encodeURIComponent(config.url_swagger + "instantPSUredirect?session=" + config.QPISPsession),
                "@scheme": "https"
                }
            }
            break
        case "GETpaymentStatusDomestic":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key": idempotencyKey
                }
            }
            break
        case "GETpaymentConsents/instant/balances":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/balances",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/balances",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "GETpaymentConsents/instant/accounts":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/accounts",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/accounts",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "POSTpaymentInstant/invoice":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/invoices/instant",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            } : {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/invoices/instant",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            }
            break
        case "PATCHpaymentInstant/invoice":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "PATCH",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/invoices/instant",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            } : {
            "pars": {
                "@method": "PATCH",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/invoices/instant",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            }
            break
        case "GETpaymentsDomesticByDomesticId":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "GETpaymentsDomesticByDomesticIdDBO":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticConsentId + "PSUorPAU/V087_TEST1",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticConsentId + "PSUorPAU/V087_TEST1",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "POSTpaymentConsentsDomesticTax":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            } : {
            "pars": {
                "@method": "POST",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            }
            break
        case "GETpaymentConsentsDomesticTax":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "GETpaymentConsentsDomesticTaxDBO":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId +"/PSUorPAU/PISP2TEST",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "GET",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId +"/PSUorPAU/test.client-12",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "PATCHpaymentConsentsDomesticTax":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "PATCH",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            } : {
            "pars": {
                "@method": "PATCH",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                "x-idempotency-key":idempotencyKey
                }
            }
            break
        case "PUTpaymentConsentsCreateExternalRepresentationDomesticTax":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/createExternalRepresentation",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            } : {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/createExternalRepresentation",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            }
            break
        case "PUTpaymentConsentsExternalRepresentationSpecialPartDomesticTax":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createSpecialPartExternalRepresentation",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            } : {
            "pars": {
                "@method": "PUT",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createSpecialPartExternalRepresentation",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "content-type": "application/json;charset=utf-8",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId
                }
            }
            break
        case "DELETEpaymentConsentsDomesticTax":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId,
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
            break
        case "DELETEpaymentConsentsDomesticTaxDBO":
            body = authType == "OBclientCredentials" ? {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId + "/PSUorPAU/V087_TEST1",
                "authorization": "Bearer "+ authToken,
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            } : {
            "pars": {
                "@method": "DELETE",
                "@target-uri": config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/"+domesticConsentId + "/PSUorPAU/V087_TEST1",
                "content-digest": "belt-hash256=:"+ hmac +":",
                "x-api-key": config.apikey,
                "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
                "x-fapi-customer-ip-address": "192.168.247.72",
                "x-fapi-interaction-id": fapiInteractionId,
                }
            }
    }
    return body
}

async function createPaymentBody(requestBodyName,domesticConsentId){
    let requestBody = getRequestBody("pispAuth",requestBodyName)
    requestBody.data.domesticConsentId = domesticConsentId
    if(!requestBody.data.initiation.debtor) {
        requestBody.data.initiation.debtor = {
            "name": "ОАО \"Клиент для Open API 2 ИД 217 УНП 100218304\"",
            "countryOfResidence": "BY",
            "countryNameOfResidence": "Республика Беларусь",
            "organisationIdentification": [{"code": "TXID", "identification": "INN100218304"}],
            "privateIdentification": [],
            "postalAddress": {
                "country": "BY",
                "countrySubDivision": "МИНСК",
                "districtName": "МИНСК",
                "townName": "г. МИНСК",
                "townLocationName": "5000000000",
                "postCode": "220000",
                "streetName": "ул. Такая-то",
                "buildingNumber": "6",
                "room": "13",
                "addressLine": ["220000, Республика Беларусь, г. МИНСК, ул. Такая-то, д.6 кв. 13", "СОАТО 5000000000"]
            },
            "contactDetails": {
                "name": "Тестовая Тест",
                "phoneNumber": "+375-17123456789",
                "mobileNumber": "+375-29123456789",
                "faxNumber": "+375-17123456780",
                "emailAddress": "V087_TEST1@V087_TEST1.info"
            }
        }
    }
    if(!requestBody.data.initiation.debtorAccount){
        // requestBody.data.initiation.debtorAccount = {"schemeName":"BY.NBRB.IBAN","identification":"BY15AKBB30121554000000000010"}
    }

    requestBody = sortObjectAlphabetically(requestBody)
    await appendToDefinedFile("logs.txt","payments_savedBody",JSON.stringify(requestBody))
    return requestBody
}

function savePaymentBody(body){
    setRequestBody("pispAuth","payments/domestic",body)
}

async function createPaymentConsent(config,access_token){
    let requestBodyName = "paymentConsents/domestic7"
    let requestBody = sortObjectAlphabetically(getRequestBody("pispAuth",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "paymentConsents/domestic"
    let signature = await generateSignature(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName)
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic", {
    // const response = await fetch("http://192.168.166.213:9100/openbanking/paymentConsents/domestic",{
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(sortObjectAlphabetically(getRequestBody("pispAuth",requestBodyName)))
  });
  await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(getRequestBody("pispAuth",requestBodyName)))
  return response.json();
}

async function createPayment(config,access_token){
    let requestBodyName = "payments/domestic"
    let requestBody = sortObjectAlphabetically(getRequestBody("pispAuth",requestBodyName))
    await appendToDefinedFile("logs.txt","payments_requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "payments/domestic"
    let signature = await generateSignature(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName)
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","payments_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic", {
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(getRequestBody("pispAuth",requestBodyName))
  });

  response.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
  });
  return response.json();
}
async function getAccListPayments(config,access_token,consentId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentConsents/PSUorPAU"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let signature = await generateSignatureGETaccountsList(config,method,access_token,fapiInteractionId,idempotencyKey,consentId);
    authType = latestAuthType
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","accListPayments_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accountsList/login/V087_TEST1/paymentConsents/"+consentId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  return response.json();
}

async function getAccListPaymentsKEYCLOAK(config,access_token,consentId){
    access_token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJRdnA4X3VvNjhlaHZ0UlVRODl4LTRtMWRVMEFWQnJzSXpHTVM0YXVEZ3BvIn0.eyJleHAiOjE3NTk5MzQ5MDUsImlhdCI6MTc1OTg0ODUwNSwianRpIjoiM2FmNTRhZTgtNDAzMy00Y2FmLWFiNjEtZGQ1NjEyYThhZDUxIiwiaXNzIjoiaHR0cHM6Ly9zYy1tYXAtdGVzdHZlcnNpb24tdmlwLnNvZnRjbHViLmJ5Ojc4OTEvYXV0aC9yZWFsbXMvU0NSZWFsbSIsImF1ZCI6InJlYWxtLW1hbmFnZW1lbnQiLCJzdWIiOiJmNzg1YmQxZC1lZTk1LTQ3NGMtYjc2YS1mYzdkNjRmYjRiOGIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJLRVlDTE9BS19PUEVOQVBJIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIlNDLU1BUF9HRVRfQVBJLVBBWU1FTlRDT05TRU5UU19QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktUEFZTUVOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfUE9TVF9BUEktUEFZTUVOVElOVEVOVFMiLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5UQ09OU0VOVFNfQU5ZX0xPR0lOX0FOWV9DTElFTlRfQU5ZXyIsIlNDLU1BUF9ERUxFVEVfQVBJLVBBWU1FTlRDT05TRU5UU19BTllfIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTTElTVF9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktQ0hFQ0tfTE9HSU5fQU5ZXyIsIlNDLU1BUF9ST0xFX0FQSS1HRVRDT05URU5UIiwiU0MtTUFQX0dFVF9BUEktUkVRVUVTVE9UUDRTTVMiLCJTQy1NQVBfUk9MRV9BUEktU0VUQ09OVEVOVCIsIlNDLU1BUF9QVVRfQVBJLUFDQ09VTlRDT05TRU5UU19DUkVBVEVTUEVDSUFMUEFSVEVYVEVSTkFMUkVQUkVTRU5UQVRJT04iLCJTQy1NQVBfUEFUQ0hfQVBJLUFDQ09VTlRDT05TRU5UUyIsIlNDLU1BUF9QQVRDSF9BUEktUEFZTUVOVElOVEVOVFMiLCJTQy1NQVBfTkJSQl9SV19LRVlDTE9BSy1PUEVOQVBJX1NDT1BFX0FDQ0VTUyIsIlNDLU1BUF9QQVRDSF9BUEktUEFZTUVOVENPTlNFTlRTX0RPTUVTVElDVEFYIiwiU0MtTUFQX1BPU1RfQVBJLUFDQ09VTlRJTlRFTlRTIiwiU0MtTUFQX0RFTEVURV9BUEktQUNDT1VOVElOVEVOVFNfQU5ZXyIsIlNDLU1BUF9HRVRfQVBJLUFDQ09VTlRJTlRFTlRTX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX1BBWU1FTlRDT05TRU5UU19BTllfIiwiU0MtTUFQX0dFVF9BUEktUEFZTUVOVFNfUFNVT1JQQVVfQU5ZXyIsIlNDLU1BUF9HRVRfQVBJLUFDQ09VTlRTTElTVF9MT0dJTl9BTllfQ0xJRU5UX0FOWV9BQ0NPVU5UQ09OU0VOVFNfQU5ZXyIsIlNDLU1BUF9ERUxFVEVfQVBJLVBBWU1FTlRDT05TRU5UU19BTllfTE9HSU5fQU5ZX0NMSUVOVF9BTllfIiwiU0MtTUFQX1BVVF9BUEktUEFZTUVOVENPTlNFTlRTX0NSRUFURVNQRUNJQUxQQVJURVhURVJOQUxSRVBSRVNFTlRBVElPTiIsIlNDLU1BUF9QT1NUX0FQSS1DSEVDS19BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX0NMSUVOVF9BTllfUEFZTUVOVENPTlNFTlRTIiwiU0MtTUFQX1BBVENIX0FQSS1BQ0NPVU5USU5URU5UUyIsIlNDLU1BUF9ST0xFX0FQSS1BQ0NFU1MiLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5USU5URU5UU19BTllfIiwiU0MtTUFQX0RFTEVURV9BUEktUEFZTUVOVElOVEVOVFNfQU5ZXyIsIlNDLU1BUF9OQlJCX1JXX09CLUFDQ09VTlRTX0FDQ0VTUyIsIlNDLU1BUF9QVVRfQVBJLUFDQ09VTlRDT05TRU5UU19DUkVBVEVFWFRFUk5BTFJFUFJFU0VOVEFUSU9OIiwiU0MtTUFQX1JPTEVfQVBJLVNZU1RFTUVWRU5UTk9USUZJQ0FUSU9OIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVFNMSVNUX0xPR0lOX0FOWV9BQ0NPVU5UQ09OU0VOVFNfQU5ZXyIsIlNDLU1BUF9QVVRfQVBJLVBBWU1FTlRDT05TRU5UU19DUkVBVEVFWFRFUk5BTFJFUFJFU0VOVEFUSU9OIiwiU0MtTUFQX1BBVENIX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUMiLCJTQy1NQVBfREVMRVRFX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX0NMSUVOVF9BTllfUEFZTUVOVENPTlNFTlRTX0FOWV8iLCJTQy1NQVBfUFVUX0FQSS1PVFBTRU5EIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTTElTVF9BTllfIiwiU0MtTUFQX1BBVENIX0FQSS1QQVlNRU5UQ09OU0VOVFMiLCJTQy1NQVBfUE9TVF9BUEktUEFZTUVOVENPTlNFTlRfQ09NTU9OUEFSVEVYVEVSTkFMUkVQUkVTRU5UQVRJT05SRVFVRVNUIiwiU0MtTUFQX0RFTEVURV9BUEktQUNDT1VOVENPTlNFTlRTX0FOWV9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX05CUkJfUldfT0ItUEFZTUVOVFNfQUNDRVNTIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTX0FOWV9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTRVhURVJOQUxSRVBSRVNFTlRBVElPTl9BTllfIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LXJlYWxtIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19fSwic2NvcGUiOiJTQy1BUFBTIGtleWNsb2FrLW9wZW5hcGkiLCJjbGllbnRIb3N0IjoiMTkyLjE2OC4xNjYuMjEzIiwiY2xpZW50SWQiOiJLRVlDTE9BS19PUEVOQVBJIiwiY2xpZW50X2dsb2JhbF9pZCI6IjY2NiIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1LRVlDTE9BS19PUEVOQVBJIiwiY2xpZW50QWRkcmVzcyI6IjE5Mi4xNjguMTY2LjIxMyIsImNsaWVudF9ndWlkIjoiMThhZmYwYTMtOWQ5MS00ODQxLTk0N2QtYjkxM2M5OTExZjgzIn0.TdcmjuzsPLQbVP8XGENt5GjpUq7Qf-xMkdSW7f1qtzRL0mXnVO_lf82uO4JDZv5hvedzEZ8p4H0kP1UigmY9atRQ_NFgsQFK6d-wvFH2xKNGWuOchVqKVzoWEhwCd3YGYD5UbaJVnOcMC-QPcl_OsoonJqDbZRXcQONUkQLyjQkeJrtFpN_5rPvnWZE_zDSEwR1u9SFABGLiTbtZfUFSRKCHXCgMyDalPiEc8cq3iMINHpo7ahfzrn56ZvVEQ84qVvOvuBHEbeDzPuPp_eYqnBwUNiznEkNw2JaoFcg3ZFt65bSrbxYX2hBst2Uip2oUj-YKVAajSercM2SIDtNJFQ"
    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","accListPayments_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accountsList/login/test.client-12/client/PISP2TEST/paymentConsents/"+consentId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  return response.json();
}

async function getAccListPaymentsKEYCLOAKcheck(config,access_token,consentId){
    access_token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJRdnA4X3VvNjhlaHZ0UlVRODl4LTRtMWRVMEFWQnJzSXpHTVM0YXVEZ3BvIn0.eyJleHAiOjE3NTk5MzQ5MDUsImlhdCI6MTc1OTg0ODUwNSwianRpIjoiM2FmNTRhZTgtNDAzMy00Y2FmLWFiNjEtZGQ1NjEyYThhZDUxIiwiaXNzIjoiaHR0cHM6Ly9zYy1tYXAtdGVzdHZlcnNpb24tdmlwLnNvZnRjbHViLmJ5Ojc4OTEvYXV0aC9yZWFsbXMvU0NSZWFsbSIsImF1ZCI6InJlYWxtLW1hbmFnZW1lbnQiLCJzdWIiOiJmNzg1YmQxZC1lZTk1LTQ3NGMtYjc2YS1mYzdkNjRmYjRiOGIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJLRVlDTE9BS19PUEVOQVBJIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIlNDLU1BUF9HRVRfQVBJLVBBWU1FTlRDT05TRU5UU19QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktUEFZTUVOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfUE9TVF9BUEktUEFZTUVOVElOVEVOVFMiLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5UQ09OU0VOVFNfQU5ZX0xPR0lOX0FOWV9DTElFTlRfQU5ZXyIsIlNDLU1BUF9ERUxFVEVfQVBJLVBBWU1FTlRDT05TRU5UU19BTllfIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTTElTVF9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktQ0hFQ0tfTE9HSU5fQU5ZXyIsIlNDLU1BUF9ST0xFX0FQSS1HRVRDT05URU5UIiwiU0MtTUFQX0dFVF9BUEktUkVRVUVTVE9UUDRTTVMiLCJTQy1NQVBfUk9MRV9BUEktU0VUQ09OVEVOVCIsIlNDLU1BUF9QVVRfQVBJLUFDQ09VTlRDT05TRU5UU19DUkVBVEVTUEVDSUFMUEFSVEVYVEVSTkFMUkVQUkVTRU5UQVRJT04iLCJTQy1NQVBfUEFUQ0hfQVBJLUFDQ09VTlRDT05TRU5UUyIsIlNDLU1BUF9QQVRDSF9BUEktUEFZTUVOVElOVEVOVFMiLCJTQy1NQVBfTkJSQl9SV19LRVlDTE9BSy1PUEVOQVBJX1NDT1BFX0FDQ0VTUyIsIlNDLU1BUF9QQVRDSF9BUEktUEFZTUVOVENPTlNFTlRTX0RPTUVTVElDVEFYIiwiU0MtTUFQX1BPU1RfQVBJLUFDQ09VTlRJTlRFTlRTIiwiU0MtTUFQX0RFTEVURV9BUEktQUNDT1VOVElOVEVOVFNfQU5ZXyIsIlNDLU1BUF9HRVRfQVBJLUFDQ09VTlRJTlRFTlRTX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX1BBWU1FTlRDT05TRU5UU19BTllfIiwiU0MtTUFQX0dFVF9BUEktUEFZTUVOVFNfUFNVT1JQQVVfQU5ZXyIsIlNDLU1BUF9HRVRfQVBJLUFDQ09VTlRTTElTVF9MT0dJTl9BTllfQ0xJRU5UX0FOWV9BQ0NPVU5UQ09OU0VOVFNfQU5ZXyIsIlNDLU1BUF9ERUxFVEVfQVBJLVBBWU1FTlRDT05TRU5UU19BTllfTE9HSU5fQU5ZX0NMSUVOVF9BTllfIiwiU0MtTUFQX1BVVF9BUEktUEFZTUVOVENPTlNFTlRTX0NSRUFURVNQRUNJQUxQQVJURVhURVJOQUxSRVBSRVNFTlRBVElPTiIsIlNDLU1BUF9QT1NUX0FQSS1DSEVDS19BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX0NMSUVOVF9BTllfUEFZTUVOVENPTlNFTlRTIiwiU0MtTUFQX1BBVENIX0FQSS1BQ0NPVU5USU5URU5UUyIsIlNDLU1BUF9ST0xFX0FQSS1BQ0NFU1MiLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5USU5URU5UU19BTllfIiwiU0MtTUFQX0RFTEVURV9BUEktUEFZTUVOVElOVEVOVFNfQU5ZXyIsIlNDLU1BUF9OQlJCX1JXX09CLUFDQ09VTlRTX0FDQ0VTUyIsIlNDLU1BUF9QVVRfQVBJLUFDQ09VTlRDT05TRU5UU19DUkVBVEVFWFRFUk5BTFJFUFJFU0VOVEFUSU9OIiwiU0MtTUFQX1JPTEVfQVBJLVNZU1RFTUVWRU5UTk9USUZJQ0FUSU9OIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVFNMSVNUX0xPR0lOX0FOWV9BQ0NPVU5UQ09OU0VOVFNfQU5ZXyIsIlNDLU1BUF9QVVRfQVBJLVBBWU1FTlRDT05TRU5UU19DUkVBVEVFWFRFUk5BTFJFUFJFU0VOVEFUSU9OIiwiU0MtTUFQX1BBVENIX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUMiLCJTQy1NQVBfREVMRVRFX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX0NMSUVOVF9BTllfUEFZTUVOVENPTlNFTlRTX0FOWV8iLCJTQy1NQVBfUFVUX0FQSS1PVFBTRU5EIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTTElTVF9BTllfIiwiU0MtTUFQX1BBVENIX0FQSS1QQVlNRU5UQ09OU0VOVFMiLCJTQy1NQVBfUE9TVF9BUEktUEFZTUVOVENPTlNFTlRfQ09NTU9OUEFSVEVYVEVSTkFMUkVQUkVTRU5UQVRJT05SRVFVRVNUIiwiU0MtTUFQX0RFTEVURV9BUEktQUNDT1VOVENPTlNFTlRTX0FOWV9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX05CUkJfUldfT0ItUEFZTUVOVFNfQUNDRVNTIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTX0FOWV9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTRVhURVJOQUxSRVBSRVNFTlRBVElPTl9BTllfIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LXJlYWxtIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19fSwic2NvcGUiOiJTQy1BUFBTIGtleWNsb2FrLW9wZW5hcGkiLCJjbGllbnRIb3N0IjoiMTkyLjE2OC4xNjYuMjEzIiwiY2xpZW50SWQiOiJLRVlDTE9BS19PUEVOQVBJIiwiY2xpZW50X2dsb2JhbF9pZCI6IjY2NiIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1LRVlDTE9BS19PUEVOQVBJIiwiY2xpZW50QWRkcmVzcyI6IjE5Mi4xNjguMTY2LjIxMyIsImNsaWVudF9ndWlkIjoiMThhZmYwYTMtOWQ5MS00ODQxLTk0N2QtYjkxM2M5OTExZjgzIn0.TdcmjuzsPLQbVP8XGENt5GjpUq7Qf-xMkdSW7f1qtzRL0mXnVO_lf82uO4JDZv5hvedzEZ8p4H0kP1UigmY9atRQ_NFgsQFK6d-wvFH2xKNGWuOchVqKVzoWEhwCd3YGYD5UbaJVnOcMC-QPcl_OsoonJqDbZRXcQONUkQLyjQkeJrtFpN_5rPvnWZE_zDSEwR1u9SFABGLiTbtZfUFSRKCHXCgMyDalPiEc8cq3iMINHpo7ahfzrn56ZvVEQ84qVvOvuBHEbeDzPuPp_eYqnBwUNiznEkNw2JaoFcg3ZFt65bSrbxYX2hBst2Uip2oUj-YKVAajSercM2SIDtNJFQ"
    let bodyReq = {"data":{"ASPSP":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"OB":{"OBid":"4ac193ef-c8a9-4386-b8f1-6808748e6eba","OBname":"iBankASB","OBuserId":"0010624695","OBuserName":"Митрофан Доромидонтович Белуга","countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"PISP":{"PISP":"PISP2TEST","PISPid":"0d7330b9-4ee9-4df3-8b01-abf008382ed3","PISPidentification":[{"PISPname":"Тестовый PISP клиент","countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","organisationIdentification":{"extendedOrganisationIdentificationIdentification":[{"code":"COID","codeName":"Идентификация организации, присвоенная уполномоченным органом страны (например, корпоративный регистрационный номер)","identification":"112.191180347.0~~~~~~~)","identificationInformation":"112.191180347.0-0-0-0-0-0-0-0-9"},{"code":"BANK","codeName":"Уникальное и однозначное значение,  установленное конкретным банком или аналогичным финансовым учреждением для идентификации отношений, определенных между банком и его клиентом","identification":"0d7330b9$ee9$df3(b01-abf008382ed3","identificationInformation":"0d7330b9-4ee9-4df3-8b01-abf008382ed3"}],"organisationIdentification":{"code":"TXID","codeName":"Номер, присвоенный налоговым органом для идентификации организации (для РБ - УНП)","identification":"INB192837465","identificationStatusName":"Банк"}}}]},"PSUorPAU":{"PSUorPAU":"test.client-12","PSUorPAUid":"424a622c-9cfb-4894-83b5-a19c18fc4285","PSUorPAUname":"Митрофан Белуга"},"account":[{"accountDescription":"ТЕСТ ДУБЛЬ 105119","accountDetails":{"identification":"BY18AKBB24210001836040070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513434","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"ТЕСТ ДУБЛЬ 105743","accountDetails":{"identification":"BY43AKBB24270001176000070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513446","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"Текущие счета физ.лиц(01.06.2011)","accountDetails":{"identification":"BY30AKBB30140013907240070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513456","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Deleted"},{"accountDescription":"ТЕСТ Текущие счета физ.лиц USD(01.06.2011","accountDetails":{"identification":"BY84AKBB30141000781130070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513459","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"USD","currencyName":"Доллар США","status":"Enabled"},{"accountDescription":"ТЕСТ  Классик Без.свыше года(24м  c 29.10.2018)","accountDetails":{"identification":"BY95AKBB34140020411170070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513474","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Disabled"},{"accountDescription":"ТЕСТ Классик Отзывный с фиксированной процентной ставкой  USD(36м)","accountDetails":{"identification":"BY74AKBB34141004913460070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513476","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"USD","currencyName":"Доллар США","status":"Disabled"},{"accountDescription":"ТЕСТ Классик Отзывный с фиксированной процентной ставкой  EUR(18м)","accountDetails":{"identification":"BY78AKBB34142001465720070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513479","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"EUR","currencyName":"Евро","status":"Disabled"},{"accountDescription":"ТЕСТ Классик Безотзывный с фиксированной процентной ставкой RUB (24м)","accountDetails":{"identification":"BY64AKBB34143000800340070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513481","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"RUB","currencyName":"Российский рубль","status":"Disabled"},{"accountDescription":"ТЕСТ Безотзывный \"Китайская шкатулка\"  (13м)","accountDetails":{"identification":"BY51AKBB34144000003880070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513483","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"CNY","currencyName":"Китайский юань","status":"Disabled"},{"accountDescription":"Текущие счета физ.лиц(01.06.2011)","accountDetails":{"identification":"BY36CLUB30140000508280070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9634147","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"Текущие счета физ.лиц(01.06.2011)","accountDetails":{"identification":"BY21AKBB30140012426250070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9819535","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"Текущие-дивиденды (01.06.2011)","accountDetails":{"identification":"BY85AKBB30140000518940070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9819540","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"}],"authorisation":{"authorisationType":"Single"},"charge":[{"chargeAmount":"0.06","chargeBearer":"DEBT","currency":"BYN","currencyName":"Белорусский рубль","type":"COMM","typeName":"Commission – Плата за оказанные услуги"}],"creationDateTime":"2025-10-07T18:32:46+03:00","initiation":{"amount":"6.00","creditor":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","name":"Авдотья Никитишна Килька","organisationIdentification":[],"postalAddress":{"addressLine":["addressLine"],"buildingNumber":"1","country":"BY","countrySubDivision":"Минская область","districtName":"Минский район","postCode":"200018","room":"2","streetName":"Якубовского","townLocationName":"Фрунзенский","townName":"Минск"},"privateIdentification":[{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}]},"creditorAccount":{"identification":"BY21AKBB30140012426250070000","schemeName":"BY.NBRB.IBAN"},"currency":"BYN","currencyName":"Белорусский рубль","debtor":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","name":"Митрофан Доромидонтович Белуга","organisationIdentification":[],"postalAddress":{"addressLine":["addressLine"],"buildingNumber":"1","country":"BY","countrySubDivision":"Минская область","districtName":"Минский район","postCode":"200018","room":"2","streetName":"Якубовского","townLocationName":"Фрунзенский","townName":"Минск"},"privateIdentification":[{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}]},"enclosedFile":[],"endToEndIdentification":"01.20240629.8bd17819bcf8d8da","instructionIdentification":"795SDBO20240629E5AE1D70F25F431F84DD","listAccounts":[],"listPassportData":[],"localInstrument":"BY.NBRB.BISS.NORMAL","regulatoryReporting":[],"remittanceInformation":{"categoryPurposeCode":"OTHR","proprietaryPurpose":"190401.21","referredDocument":[{"invoicer":"invoicer1","number":"111111","relatedDate":"2025-07-01","remittedAmount":"1.00","type":"BOLD"}],"unstructured":"1Назначение платежа в неструктурированной виде длиной 140 символов 12Назначение платежа в неструктурированной виде длиной 140 символов 23Назначение платежа в неструктурированной виде длиной 140 символов 3"},"requestedExecutionDate":"2024-06-29","ultimateCreditor":{"countryNameOfResidence":"Республика Гаити","countryOfResidence":"HT","name":"Авдотья Никитишна Килька","organisationIdentification":[],"postalAddress":{"addressLine":["addressLine"],"buildingNumber":"1","country":"BY","countrySubDivision":"Минская область","districtName":"Минский район","postCode":"200018","room":"2","streetName":"Якубовского","townLocationName":"Фрунзенский","townName":"Минск"},"privateIdentification":[{"code":"CCPT","codeName":"Документ, удостоверяющий личность","identification":"09.20220202.BU1718BU","identificationDocumentTypeName":"Действительный национальный паспорт гражданина иностранного государства или документ, его заменяющий","issuer":"Гаитянским самым главным"}]}},"paymentConsentId":"e245ba6a-4eb5-497aa2ff-4436f3db489c","status":"AwaitingAuthorisation","statusUpdateDateTime":"2025-10-07T18:32:46+03:00"},"risk":{"paymentContextCode":"90401"}}
    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","accListPaymentscheck_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/check/accountsList/login/test.client-12/client/PISP2TEST/paymentConsents", {
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(bodyReq)
  });
  return response.json();
}

async function getConsentListDBO(config,access_token,consentId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETconsentsList/PSUorPAU"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let signature = await generateSignatureGETconsentsListDBO(config,method,access_token,fapiInteractionId,idempotencyKey,consentId);
    authType = latestAuthType
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "fromCreationDate":"2023-01-01",
      "toCreationDate":"2028-12-31",
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","accListPaymentsDBO_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/PSUorPAU/V087_TEST1?fromCreationDate=2023-05-16&toCreationDate=2025-05-20&type=listAccountConsent&size=13", {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
    // const errorText = await response.text(); // Получаем текст ответа
    // console.error("Error response:", errorText);
  return response.json();
  // return response.text()
}

async function getConsentList(config,access_token,consentId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETconsentsList"
    let latestAuthType = authType;
    let signature = await generateSignatureGETconsentsList(config,method,access_token,fapiInteractionId,idempotencyKey,consentId,["NoContentType","NoIdempotencyKey"]);
    authType = latestAuthType
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "fromCreationDate":"2023-01-01",
      "toCreationDate":"2028-12-31",
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "fromCreationDate":"2023-01-01",
      "toCreationDate":"2028-12-31",
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","accListPayments_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents?fromCreationDate=2023-05-16&toCreationDate=2025-05-20", {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
    // const errorText = await response.text(); // Получаем текст ответа
    // console.error("Error response:", errorText);
  return response.json();
  // return response.text()
}

async function getPaymentsDomesticByDomesticId(config,access_token,domesticId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentsDomesticByDomesticId"
    let latestAuthType = authType;
    let signature = await generateSignatureGETpaymentsDomesticByDomesticId(config,method,access_token,fapiInteractionId,idempotencyKey,domesticId,["NoContentType","NoIdempotencyKey"]);
    authType = latestAuthType
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }

    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","GETpaymentsDomesticByDomesticId_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/" + domesticId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
    // const errorText = await response.text(); // Получаем текст ответа
    // console.error("Error response:", errorText);
  return response.json();
  // return response.text()
}

async function getPaymentsDomesticByDomesticId(config,access_token,domesticId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentsDomesticByDomesticId"
    let latestAuthType = authType;
    let signature = await generateSignatureGETpaymentsDomesticByDomesticId(config,method,access_token,fapiInteractionId,idempotencyKey,domesticId,["NoContentType","NoIdempotencyKey"]);
    authType = latestAuthType
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }

    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","GETpaymentsDomesticByDomesticId_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/" + domesticId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
    // const errorText = await response.text(); // Получаем текст ответа
    // console.error("Error response:", errorText);
  return response.json();
  // return response.text()
}

async function getPaymentsDomesticByDomesticIdDBO(config,access_token,domesticId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentsDomesticByDomesticIdDBO"
    let latestAuthType = authType;
    let signature = await generateSignatureGETpaymentsDomesticByDomesticIdDBO(config,method,access_token,fapiInteractionId,idempotencyKey,domesticId);
    authType = latestAuthType
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","getPaymentsDomesticByDomesticIdDBO_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/" + domesticId + "/PSUorPAU/V087_TEST1", {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  return response.json();
  // return response.text()
}

async function getConsentStatusDBO(config,access_token,consentId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETconsentStatusDBO"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let signature = await generateSignatureGETConsentStatusDBO(config,method,access_token,fapiInteractionId,idempotencyKey,consentId);
    authType = latestAuthType
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList ={
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","GETconsentStatusDBO_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+consentId+"/PSUorPAU/V087_TEST1", {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  return response.json();
}

async function getConsentStatus(config,access_token,consentId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETconsentStatus"
    let signature = await generateSignatureGETConsentStatus(config,method,access_token,fapiInteractionId,idempotencyKey,consentId);
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    let headersList = {}

    if(authType == "OBclientCredentials")
     headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    else{
        headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'x-api-key': config.apikey,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","GETconsentStatus",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+consentId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  return response.json();
}

async function deletePaymentConsentsDomestic(config,access_token,consentId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "DELETEconsentDomestic"
    let signature = await generateSignatureDELETEConsentDomestic(config,method,access_token,fapiInteractionId,idempotencyKey,consentId);
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList ={
      'accept': 'application/json;charset=utf-8',
      'x-api-key': config.apikey,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","DELETEconsentDomestic",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+consentId, {
    method: "DELETE",
    mode: "cors",
    headers: headersList,
  });
    const errorText = await response.text(); // Получаем текст ответа
    console.error("Error response:", errorText);
}

async function deletePaymentConsentsDomesticDBO(config,access_token,consentId){
    let requestBody = ""
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "DELETEpaymentConsentsDomesticDBO"
    let signature = await generateSignatureDELETEConsentDomesticDBO(config,method,access_token,fapiInteractionId,idempotencyKey,consentId);
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList ={
      'accept': 'application/json;charset=utf-8',
      'authorization': "Bearer "+access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","DELETEconsentDomestic",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+consentId + "/PSUorPAU/V087_TEST1", {
    method: "DELETE",
    mode: "cors",
    headers: headersList,
  });
    const errorText = await response.text(); // Получаем текст ответа
    console.error("Error response:", errorText);
}

function sortObjectAlphabeticallyOld(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
    }
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        sortedObj[key] = sortObjectAlphabeticallyOld(obj[key]);
    }
    return sortedObj;
}

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

            // Приводим значения к строкам для сравнения
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
    if (obj === null || typeof obj !== 'object') {
        return obj; // Если это не объект, возвращаем его как есть
    }

    if (Array.isArray(obj)) {
        // Сортируем массивы, но не ключи объектов в них
        return obj.map(sortObjectAlphabeticallyNew);
    }

    const sortedKeys = Object.keys(obj).sort(); // Сортируем ключи объекта
    const sortedObj = {};

    for (const key of sortedKeys) {
        // Рекурсивно сортируем вложенные объекты
        sortedObj[key] = sortObjectAlphabeticallyNew(obj[key]);
    }

    return sortedObj;
}

function renameKeyInObject(obj, oldKey, newKey) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const updatedObj = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentKey = key === oldKey ? newKey : key;

      updatedObj[currentKey] = renameKeyInObject(obj[key], oldKey, newKey);
    }
  }

  return updatedObj;
}

async function createSpecialPartObject(config,imitIns){
  const currentDate = new Date();
  const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  currentDate.setMinutes(currentDate.getMinutes()+2)
  const updatedFormattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return {
    "specialPart":
        {
          "HMAC": imitIns,
          "OTP": config.client_otp,
          "OTPdateTime": formattedDate,
          "mobileNumber": config.mobile_number,
          "signatureDateTime": updatedFormattedDate,
          "status": "Authorised",
          "statusUpdateDateTime": formattedDate,
          "subjectKeyIdentifier": "B6D7498EE0E67A368E921810E53849B0C7A69646"
        }
  }
}

async function createMACkey(config){
  let hashedOTP
  let base64OTP = await convertToBase64(config.client_otp)
  hashedOTP = base64OTP
  let data = {
      "Auth": {
        "CryptoType": "1"
      },
      "DataB64": hashedOTP
    }
  // https://sc-map-rrb-vip.softclub.by:8008//SCCrypto/ra/hash
  console.log(JSON.stringify(data))
  const response = await fetch(config.url_swagger + "SCCrypto/ra/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data)
  });
  return response.json()
}

async function createImitationInsert(config,requestBodyWithExternalRepresentation){

  let buff = new Buffer(JSON.stringify(requestBodyWithExternalRepresentation));
  let extendedBodyHash = buff.toString('base64');

  console.log(config.MAC_KEY)
  console.log(extendedBodyHash)
  await createMACkey(config).then((data)=>{config.MAC_KEY = data.ResultB64})

  console.log("generated MAC_KEY" + config.MAC_KEY)
  let data = {
      "Auth": {
        "CryptoType": 3,
        "ConnectStr": "hash=1.2.112.0.2.0.34.101.31.53"
      },
      "DataB64": extendedBodyHash,
      "MACKeyB64": config.MAC_KEY
    }

  console.log(JSON.stringify(data))
  //
  const response = await fetch(config.url_swagger+"SCCrypto/ra/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function createExternalRepresentation(config, requestBody){
    let token = await createDboClientToken(config)
    let access_token = token.access_token

    let requestBodyName = "PUTpaymentConsentsCreateExternalRepresentation"
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "PUTpaymentConsentsCreateExternalRepresentation"
    let signature = await generateSignature(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,["NoIdempotencyKey"])
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":"
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","fullRequest","method: PUT \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(sortObjectAlphabeticallyNew(getRequestBody("pispAuth",requestBodyName))))
  const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createExternalRepresentation", {
    method: "PUT",
    mode: "cors",
    headers: headersList,
    body: sortObjectAlphabeticallyNew(JSON.stringify(requestBody))
  });
  return response.json();
}

async function createExternalRepresentationSpecialPart(config, requestBody){
    let token = await createDboClientToken(config)
    let access_token = token.access_token

    let requestBodyName = "PUTpaymentConsentsCreateExternalRepresentationSpecialPart"
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "PUTpaymentConsentsCreateExternalRepresentationSpecialPart"
    let signature = await generateSignature(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,["NoIdempotencyKey"])
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createSpecialPartExternalRepresentation", {
    method: "PUT",
    mode: "cors",
    headers: headersList,
    body:sortObjectAlphabeticallyNew(JSON.stringify(requestBody))
  });
  await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(sortObjectAlphabeticallyNew(getRequestBody("pispAuth",requestBodyName))))
  return response.json();
}

async function generateSpecPart(config,requestBodyWithExternalRepresentation){
    let imitIns = await createImitationInsert(config,requestBodyWithExternalRepresentation)
    let specPart = await createSpecialPartObject(config,imitIns.ResultB64)
    setRequestBody("pispAuth","PUTpaymentConsentsCreateExternalRepresentationSpecialPart",specPart)
    let externalRepresentationSpecialPart = await createExternalRepresentationSpecialPart(config,specPart)
    specPart.specialPart.externalRepresentationSpecialPart = externalRepresentationSpecialPart.data.externalRepresentationSpecialPart
    return specPart
}
async function generatePaymentConsentAuthoriseBody(config,accList){
    if (!accList.data.initiation.debtor) {
        accList.data.initiation.debtor = {
            "name": "ОАО \"Клиент для Open API 2 ИД 217 УНП 100218304\"",
            "countryOfResidence": "BY",
            "countryNameOfResidence": "Республика Беларусь",
            "organisationIdentification": [{
                "code": "TXID",
                "codeName": "Номер, присвоенный налоговым органом для идентификации организации (для РБ - УНП)",
                "identification": "INN100218304",
                "identificationStatusName": "Индивидуальный предприниматель"
            }],
            "postalAddress": {
                "country": "BY",
                "countrySubDivision": "МИНСК",
                "districtName": "МИНСК",
                "townName": "г. МИНСК",
                "townLocationName": "5000000000",
                "postCode": "220000",
                "streetName": "ул. Такая-то",
                "buildingNumber": "6",
                "room": "13",
                "addressLine": ["220000, Республика Беларусь, г. МИНСК, ул. Такая-то, д.6 кв. 13", "СОАТО 5000000000"]
            },
            "contactDetails": {
                "name": "Тестовая Тест",
                "phoneNumber": "+375-17123456789",
                "mobileNumber": "+375-29123456789",
                "faxNumber": "+375-17123456780",
                "emailAddress": "V087_TEST1@V087_TEST1.info"
            }
        }
    }
    if(!accList.data.initiation.debtorAccount) {
        accList.data.initiation.debtorAccount = {"schemeName":"BY.NBRB.IBAN","identification":"BY15AKBB30121554000000000010"}
    }
    if(!accList.data.initiation.debtorAgent) {
        accList.data.initiation.debtorAgent = {"identification": "AKBBBY2X", "name": "ОАО 'АСБ Беларусбанк'"}
    }
    if(!accList.data.initiation.creditorAgent) {
        accList.data.initiation.creditorAgent = {"identification": "AKBBBY2X", "name": "ОАО 'АСБ Беларусбанк'"}
    }
    if(!accList.data.initiation.remittanceInformation) {
        accList.data.initiation.remittanceInformation = {
            "categoryPurposeCode": "OTHR",
            "proprietaryPurpose": "190401.21",
            "referredDocument": [],
            "unstructured": "1Назначение платежа в неструктурированной виде длиной 140 символов 12Назначение платежа в неструктурированной виде длиной 140 символов 23Назначение платежа в неструктурированной виде длиной 140 символов 3"
        }
    }
    delete accList.data.account
    // accList.data.statusUpdateDateTime = accList.data.statusUpdateDateTime.split('+')[0]
    // accList.data.creationDateTime = accList.data.creationDateTime.split('+')[0]
    let sortedAccList = sortObjectAlphabetically(accList)
    let requestBody = sortedAccList
    setRequestBody("pispAuth","PUTpaymentConsentsCreateExternalRepresentation",requestBody)
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let externalRepresentation = await createExternalRepresentation(config, requestBody)
    authType = latestAuthType
    requestBody.data.externalRepresentation = externalRepresentation.data.externalRepresentation
    requestBody = sortObjectAlphabetically(requestBody)

    latestAuthType = authType;
    authType = "OBclientCredentials"
    let specPart = await generateSpecPart(config, requestBody)
    authType = latestAuthType
    requestBody.specialPart = specPart.specialPart
    requestBody = renameKeyInObject(requestBody,"paymentConsentId","domesticConsentId")
    requestBody = sortObjectAlphabetically(requestBody)
    return requestBody
}
async function authorisePayment(config,access_token,accList){
    let requestBodyName = "PATCHpaymentConsents/domestic1"
    let requestBody = await generatePaymentConsentAuthoriseBody(config,accList)
    setRequestBody("pispAuth",requestBodyName,requestBody)
    let savedBody = getRequestBody("pispAuth",requestBodyName)
    console.log(savedBody)
    await appendToDefinedFile("logs.txt","authorisationBody",JSON.stringify(requestBody))
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "PATCHpaymentConsents/domestic"
    let signature = await generateSignature(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName)
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic", {
        method: "PATCH",
        mode: "cors",
        headers: headersList,
        body: JSON.stringify(requestBody)
    })
    return response.json()
}

async function generatePayload(config,method,authToken,fapiInteractionId,idempotencyKey,requestBodyName,domesticConsentId,projectName = "pispAuth"){
    let requestBody = ""
    if (requestBodyName){
        requestBody = sortObjectAlphabeticallyNew(getRequestBody(projectName, requestBodyName))
    }
    let cryptoHashBody
    if (requestBody == "") {
        cryptoHashBody = {
            "Auth": {
                "CryptoType": 1,
            },
            "DataB64": ""
        }
    } else{
        cryptoHashBody = {
            "Auth": {
                "CryptoType": 1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    }
    let hash = await scCryptoHash(config,cryptoHashBody)
    let payload = await getPayloadByMethodRoute(config,method,authToken,hash.ResultB64,fapiInteractionId,idempotencyKey,domesticConsentId)
    return payload
}

async function generatePayloadNoSort(config,method,authToken,fapiInteractionId,idempotencyKey,requestBodyName,domesticConsentId,projectName = "pispAuth"){
    let requestBody = ""
    if (requestBodyName){
        requestBody = sortObjectAlphabeticallyOld(getRequestBody(projectName, requestBodyName))
    }
    let cryptoHashBody
    if (requestBody == "") {
        cryptoHashBody = {
            "Auth": {
                "CryptoType": 1,
            },
            "DataB64": ""
        }
    } else{
        cryptoHashBody = {
            "Auth": {
                "CryptoType": 1,
            },
            "DataB64": convertToBase64(JSON.stringify(requestBody))
        }
    }
    let hash = await scCryptoHash(config,cryptoHashBody)
    let payload = await getPayloadByMethodRoute(config,method,authToken,hash.ResultB64,fapiInteractionId,idempotencyKey,domesticConsentId)
    return payload
}

async function generateSignature(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName)
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETaccountsList(config,method,token,fapiInteractionId,idempotencyKey,domesticConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/accountsList/login/V087_TEST1/paymentConsents/"+domesticConsentId
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETconsentsListDBO(config,method,token,fapiInteractionId,idempotencyKey,domesticConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/PSUorPAU/V087_TEST1?fromCreationDate=2023-05-16&toCreationDate=2025-05-20&type=listAccountConsent&size=13"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETconsentsList(config,method,token,fapiInteractionId,idempotencyKey,domesticConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents?fromCreationDate=2023-05-16&toCreationDate=2025-05-20"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETpaymentsDomesticByDomesticId(config,method,token,fapiInteractionId,idempotencyKey,domesticId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)

    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticId
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETpaymentsDomesticByDomesticIdDBO(config,method,token,fapiInteractionId,idempotencyKey,domesticId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETConsentStatusDBO(config,method,token,fapiInteractionId,idempotencyKey,domesticId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,false,domesticId)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic/"+domesticId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETConsentStatus(config,method,token,fapiInteractionId,idempotencyKey,domesticConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials") {
        header["http://openbanking.asb.by/signedData"].pars = [
            "@method",
            "@target-uri",
            "authorization",
            "content-digest",
            "x-fapi-auth-date",
            "x-fapi-customer-ip-address",
            "x-fapi-interaction-id",
        ]
    } else {
        header["http://openbanking.asb.by/signedData"].pars = [
            "@method",
            "@target-uri",
            "content-digest",
            "x-api-key",
            "x-fapi-auth-date",
            "x-fapi-customer-ip-address",
            "x-fapi-interaction-id",
        ]
    }
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,false,domesticConsentId,"pispAuth")
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureDELETEConsentDomestic(config,method,token,fapiInteractionId,idempotencyKey,domesticConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "content-digest",
      "x-api-key",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,false,domesticConsentId)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureDELETEConsentDomesticDBO(config,method,token,fapiInteractionId,idempotencyKey,domesticConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,false,domesticConsentId)
    payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId + "/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

// -------------------------------------------------------------
// =============================================================
// -------------------------------------------------------------

async function createPaymentInstantConsent(config,access_token){
    let requestBodyName = "paymentConsents/instant1"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = sortObjectAlphabetically(getRequestBody("qpispAuth",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "paymentConsents/instant"
    let signature = await generateSignatureQPISP(config,method,access_token,fapiInteractionId,idempotencyKey,false, requestBodyName)
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant", {
    // const response = await fetch("http://192.168.166.213:9100/openbanking/paymentConsents/instant",{
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(sortObjectAlphabetically(getRequestBody("qpispAuth",requestBodyName)))
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(getRequestBody("qpispAuth",requestBodyName)))
  // const errorText = await response.text(); // Получаем текст ответа
  //   console.error("Error response:", errorText);
    return response.json();
}

async function postPaymentsInstant(config,access_token){
    let requestBodyName = "POSTpayments/instant1"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = sortObjectAlphabeticallyOld(getRequestBody("qpispAuth",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "payments/instant"
    let signature = await generateSignaturePaymentsInstant(config,method,access_token,fapiInteractionId,idempotencyKey,false, requestBodyName)
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/instant", {
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(sortObjectAlphabeticallyOld(getRequestBody("qpispAuth",requestBodyName)))
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(sortObjectAlphabetically(getRequestBody("qpispAuth",requestBodyName))))
  // const errorText = await response.text(); // Получаем текст ответа
  //   console.error("Error response:", errorText);
    return response.json();
}

async function createPaymentInstantInvoice(config,access_token){
    let requestBodyName = "paymentInstant/invoice1"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = sortObjectAlphabetically(getRequestBody("tpeAuth",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "POSTpaymentInstant/invoice"
    let signature = await generateSignaturePOSTinstantInvoice(config,method,access_token,fapiInteractionId,idempotencyKey,false, requestBodyName)
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/invoices/instant", {
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(sortObjectAlphabetically(getRequestBody("tpeAuth",requestBodyName)))
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(getRequestBody("tpeAuth",requestBodyName)))
  // const errorText = await response.text(); // Получаем текст ответа
  //   console.error("Error response:", errorText);
    return response.json();
}

async function patchPaymentInstantInvoice(config,access_token){
    let requestBodyName = "PATCHpaymentInstant/invoice1"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = sortObjectAlphabetically(getRequestBody("tpeAuth",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(JSON.stringify(requestBody))
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "PATCHpaymentInstant/invoice"
    let signature = await generateSignaturePATCHinstantInvoice(config,method,access_token,fapiInteractionId,idempotencyKey,false, requestBodyName)
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/invoices/instant", {
    method: "PATCH",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(sortObjectAlphabetically(getRequestBody("tpeAuth",requestBodyName)))
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(sortObjectAlphabetically(getRequestBody("tpeAuth",requestBodyName))))
  // const errorText = await response.text(); // Получаем текст ответа
  //   console.error("Error response:", errorText);
  response.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
  });
    return response.json();
}

async function generateURLforPatchPaymentConsentInstant(config,access_token,ASPSPsession_id){
    config.ASPSPsession = ASPSPsession_id
    config.QPISPsession = "2715eb91-f1f8-4ed0-818d2ae1d2b9e76e"

    let requestBodyName = "GETUrlPatchPaymentsConsentInstant1"
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": ""
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETUrlPatchPaymentsConsentInstant"
    let signature = await generateSignatureURLforPatchPaymentConsentInstant(config,method,access_token,fapiInteractionId,idempotencyKey,false, requestBodyName)
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    authType = latestAuthType
    let getRequestStringObject = config.url_swagger + "instantAuth?ASPSPsession="+config.ASPSPsession+"&QPISPsession="+encodeURIComponent(config.url_swagger+"instantPSUredirect?session="+config.QPISPsession)+"&jws_signature="+signature
    console.log(getRequestStringObject)
    await appendToDefinedFile("logs.txt","getRequestStringObject",getRequestStringObject)
    return getRequestStringObject;
}

async function deletePaymentInstantConsent(config,access_token,instantConsentId){
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = ""
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": ""
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "DELETEpaymentConsents/instant"
    let signature = await generateSignatureQPISPdeletePaymentConsentInstant(config,method,access_token,fapiInteractionId,idempotencyKey,instantConsentId,["NoIdempotencyKey"])
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+instantConsentId, {
    method: "DELETE",
    mode: "cors",
    headers: headersList
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: DELETE \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify("NO BODY FOR DELETE METHOD"))
  const errorText = await response.text(); // Получаем текст ответа
    console.error("Error response:", errorText);
}

async function getStatusPaymentInstantConsent(config,access_token,instantConsentId){
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = ""
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": ""
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentConsents/instant"
    let signature = await generateSignatureQPISPgetStatusPaymentConsentInstant(config,method,access_token,fapiInteractionId,idempotencyKey,instantConsentId,["NoIdempotencyKey"])
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      "x-idempotency-key": idempotencyKey,
      "x-jws-signature": signature,
      "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant/"+instantConsentId, {
    method: "GET",
    mode: "cors",
    headers: headersList
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: GETstatusPaymentInstantConsent \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify("NO BODY FOR GET METHOD"))
  // const errorText = await response.text(); // Получаем текст ответа
  //   console.error("Error response:", errorText);
    return response.json();
}

async function getBalancesPaymentInstantConsent(config,access_token,instantConsentId){
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = ""
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": ""
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentConsents/instant/balances"
    let signature = await generateSignatureQPISPgetBalancesPaymentConsentInstant(config,method,access_token,fapiInteractionId,idempotencyKey,instantConsentId,["NoIdempotencyKey"])
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      'x-accountConsentId':instantConsentId,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      // "x-jws-signature": signature,
      // "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-accountConsentId':instantConsentId,
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      // "x-idempotency-key": idempotencyKey,
      // "x-jws-signature": signature,
      // "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/balances", {
    method: "GET",
    mode: "cors",
    headers: headersList
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: DELETE \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify("NO BODY FOR GET METHOD"))
  // const errorText = await response.text(); // Получаем текст ответа
  //   console.error("Error response:", errorText);
    return response.json();
}

async function getAccountsPaymentInstantConsent(config,access_token,instantConsentId){
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let requestBody = ""
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": ""
    }
    await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentConsents/instant/accounts"
    let signature = await generateSignatureQPISPgetAccountsPaymentConsentInstant(config,method,access_token,fapiInteractionId,idempotencyKey,instantConsentId,["NoIdempotencyKey"])
    await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
    let headersList = authType == 'OBclientCredentials' ? {
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ access_token,
      'Accept-Language': 'ru',
      'x-accountConsentId':instantConsentId,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      // "x-jws-signature": signature,
      // "content-digest": "belt-hash256=:"+ hmac +":",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    } : {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Accept-Language': 'ru',
      'x-accountConsentId':instantConsentId,
      'x-api-key': config.apikey,
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
      "x-fapi-customer-ip-address": "192.168.247.72",
      "x-fapi-interaction-id": fapiInteractionId,
      // "x-idempotency-key": idempotencyKey,
      // "x-jws-signature": signature,
      // "content-digest": "belt-hash256=:"+ hmac +":",
      // "content-digest": "belt-hash256=:FE5PPAAEcWQ8DqOrZPW2sBiCKg1LjXIFaAN+JWey1oQw=:",
      "x-customer-user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accounts", {
    method: "GET",
    mode: "cors",
    headers: headersList
  });
    authType = latestAuthType
  await appendToDefinedFile("logs.txt","fullRequest","method: GET /accounts \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify("NO BODY FOR GET METHOD"))
  // const errorText = await response.text(); // Получаем текст ответа
  //   console.error("Error response:", errorText);
    return response.json();
}

async function generateSignatureQPISP(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "content-type",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
      "x-idempotency-key"
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"paymentConsents/instant1",instantConsentId,"qpispAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignaturePaymentsInstant(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "content-type",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
      "x-idempotency-key"
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    // let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"POSTpayments/instant1",instantConsentId,"qpispAuth")
    let payload = await generatePayloadNoSort(config,method,token,fapiInteractionId,idempotencyKey,"POSTpayments/instant1",instantConsentId,"qpispAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignaturePOSTinstantInvoice(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "content-type",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
      "x-idempotency-key"
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"paymentInstant/invoice1",instantConsentId,"tpeAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignaturePATCHinstantInvoice(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "content-type",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
      "x-idempotency-key"
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"PATCHpaymentInstant/invoice1",instantConsentId,"tpeAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureURLforPatchPaymentConsentInstant(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,requestBodyName,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@authority",
      "@path",
      "@query-param;name=ASPSPsession",
      "@query-param;name=QPISPsession",
      "@scheme"
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,instantConsentId,"qpispAuth")
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureQPISPdeletePaymentConsentInstant(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id"
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"DELETEpaymentConsents/instant1",instantConsentId,"qpispAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureQPISPgetStatusPaymentConsentInstant(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"GETpaymentConsents/instant1",instantConsentId,"qpispAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureQPISPgetBalancesPaymentConsentInstant(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"GETpaymentConsents/instant/balances",instantConsentId,"qpispAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureQPISPgetAccountsPaymentConsentInstant(config,method,token,fapiInteractionId,idempotencyKey,instantConsentId,additionalInfo = []){
    let header = await generateHeader(config,additionalInfo)
    header["http://openbanking.asb.by/signedData"].pars = [
      "@method",
      "@target-uri",
      "authorization",
      "content-digest",
      "x-fapi-auth-date",
      "x-fapi-customer-ip-address",
      "x-fapi-interaction-id",
    ]
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,method,token,fapiInteractionId,idempotencyKey,"GETpaymentConsents/instant/accounts",instantConsentId,"qpispAuth")
    // payload["pars"]["@target-uri"] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic/"+domesticConsentId+"/PSUorPAU/V087_TEST1"
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + convertToBase64(headerB64 + "." + payloadB64))
    let hash = await scCryptoSign(config,signBody)
    await appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

const generateRandomHex = length =>
    Array.from({ length }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');

async function modifyPATCHpaymentInvoiceBody(uri_paymentLink,instantConsentId,invoiceInstantId,instructionIdentification,endToEndIdentification){
    let body = await getRequestBody("tpeAuth","PATCHpaymentInstant/invoice1")
    body.data.paymentLink[0]["URI"] = uri_paymentLink
    body.data.instantConsentId = instantConsentId
    body.data.invoiceInstantId = invoiceInstantId
    body.data.modification.paymentEndToEndIdentification = "01." + unixDate.getShortedDate() + "." + generateRandomHex(16)
    body.data.modification.paymentInstructionIdentification = "795SDBO" + unixDate.getShortedDate() + generateRandomHex(16)
    body.data.modification.modificationIdentification = "795SPPU" + unixDate.getShortedDate() + generateRandomHex(16)
    await appendToDefinedFile("logs.txt","patchInstantInvoice_modifiedBody",JSON.stringify(body))
    await setRequestBody("tpeAuth","PATCHpaymentInstant/invoice1",body)
}

async function modifyPOSTpaymentsInstant(instantConsentId, instructionIdentification, endToEndIdentification,initiation,instruction){
    let body = await getRequestBody("qpispAuth","POSTpayments/instant1")
    body.data.instantConsentId = instantConsentId
    body.data.instruction = instruction
    body.data.initiation = initiation
    body.data.instruction.remittanceInformation.referredDocument.forEach(item => {
        delete item.lineDetails;
    });
    delete body.data.instruction.paymentEndToEndIdentification
    delete body.data.instruction.paymentInstructionIdentification
    delete body.data.instruction.debtor
    delete body.data.instruction.debtorAgent
    delete body.data.instruction.instantPaymentType
    body.data.initiation.localInstrument = body.data.instruction.localInstrument
    delete body.data.instruction.localInstrument
    delete body.data.instruction.modificationIdentification
    body.data.instruction.instructionIdentification = instructionIdentification
    body.data.instruction.endToEndIdentification = endToEndIdentification


    await appendToDefinedFile("logs.txt","POSTpaymentsinstant_modifiedBody",JSON.stringify(body))
    await setRequestBody("qpispAuth","POSTpayments/instant1",body)
}

async function modifyPostPaymentsDomesticDomesticIdBody(domesticConsentId){
    let body = await getRequestBody("pispAuth","payments/domestic")
    body.data.domesticConsentId = domesticConsentId
    await appendToDefinedFile("logs.txt","POSTpaymentsinstant_modifiedBody",JSON.stringify(body))
    await setRequestBody("pispAuth","payments/domestic",body)
}

async function main1() {
    const config = {
        alg: "BELTM256",
        typ: "JOSE",
        url_kc: "https://sc-map-testversion-vip.softclub.by:7891/",
        url_swagger: "https://sc-map-testversion-vip.softclub.by:8008/",
        client_id_pisp: "PISP2TEST",
        client_secret_pisp: "Cgxb4O9UWS4HZwrpbf3bfefdrZTStubt",
        client_id_qpisp: "BELKARTPAY_NPC_TEST",
        client_secret_qpisp: "aES5biV0eWVkVWUHzD36it5X2yE7DSkF",
        client_id_tpe: "ENTERPRISESOFT",
        client_secret_tpe: "Nisll6ytlAAtYGqb7W1Kus539rfLAZuP",
        client_id_dbo:"digitalChannels",
        client_secret_dbo:"rvDMLEf5Njz6L5BGpst4dLP1hMrBWxEV",
        apikey: "c0bf747d-3cb0-41af-ae87-08d062517c9b", //V087_TEST1
        // apikey: "5bcda088-5cdb-4f98-8cc6-b1c42eb19c39", //V087_TEST1
        client_otp: "asb123",
        mobile_number: "+375-255427989"
    }

    // const config = {
    //     alg: "BELTM256",
    //     typ: "JOSE",
    //     url_kc: "https://open-banking-akbb.softclub.by/",
    //     url_swagger: "https://open-banking-akbb.softclub.by/",
    //     // url_swagger:"192.168.166.122:10081/",
    //     client_id_pisp: "PISPTEST",
    //     client_secret_pisp: "P9XzSwdBkRw17nu1V2CSM3eogszWC0XQ",
    //     client_id_qpisp: "BELKARTPAY_NPC_TEST",
    //     client_secret_qpisp: "veZxbezDPxbOw4l0RIzfCO7TDNALvHUV",
    //     client_id_dbo: "digitalChannelsNew",
    //     client_secret_dbo: "mnoSdqcDruzrrBqev06ZLkHOGE3xRayy",
    //     client_id_tpe: "ENTERPRISESOFT",
    //     client_secret_tpe: "VUpshCxrbwRlCbTFDFpQhOUh78zeUPlU",
    //     apikey: "0788319d-048e-449b-b785-b0e740ddc5ac", //V093_TEST1
    //     // apikey: "5bcda088-5cdb-4f98-8cc6-b1c42eb19c39", //V087_TEST1
    //     client_otp: "asb123",
    //     mobile_number: "+375-255427989"
    // }

    await createFile("logs.txt",unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(1)),)
    let pispAccessToken
    let pispToken = await createTokenPISP(config)
    pispAccessToken = pispToken.access_token
    let qpispAccessToken
    let qpispToken = await createTokenQPISP(config)
    qpispAccessToken = qpispToken.access_token
    await appendToDefinedFile("logs.txt", "QPISPaccessToken", JSON.stringify(qpispAccessToken))
    let tpeAccessToken
    let tpeToken = await createTokenTPE(config)
    tpeAccessToken = tpeToken.access_token
    await appendToDefinedFile("logs.txt", "TPEaccessToken", JSON.stringify(tpeAccessToken))
    let dboClientAccessToken
    let dboClientToken = await createDboClientToken(config)
    dboClientAccessToken = dboClientToken.access_token
    await appendToDefinedFile("logs.txt","PISPtoken",pispAccessToken.toString())
    console.log(pispToken)
    console.log("pisp_access_token : "+pispAccessToken)


    // let consentCreateResponse = await createPaymentConsent(config,pispAccessToken)
    // console.log(JSON.stringify(consentCreateResponse))
    // await appendToDefinedFile("logs.txt","consentCreate_response",JSON.stringify(consentCreateResponse))
    // let domesticConsentId = consentCreateResponse.data.domesticConsentId
    // await deletePaymentConsentsDomestic(config,dboClientAccessToken,domesticConsentId)
    // let requestBodyName = "paymentConsents/domestic1"
    // savePaymentBody(await createPaymentBody(requestBodyName,domesticConsentId))
    //
    // let consentListDBO = await getConsentListDBO(config,dboClientAccessToken,domesticConsentId)
    // console.log(JSON.stringify(consentListDBO))
    // await appendToDefinedFile("logs.txt","consentList",JSON.stringify(consentListDBO))
    //
    // let consentList = await getConsentList(config,pispAccessToken,domesticConsentId)
    // console.log(JSON.stringify(consentList))
    // await appendToDefinedFile("logs.txt","consentList",JSON.stringify(consentList))
    //
    // let consentStatusDBO = await getConsentStatusDBO(config,dboClientAccessToken,domesticConsentId)
    // console.log(JSON.stringify(consentStatusDBO))
    // await appendToDefinedFile("logs.txt","consentStatusDBO",JSON.stringify(consentStatusDBO))
    //
    // let consentStatus = await getConsentStatus(config,pispAccessToken,domesticConsentId)
    // console.log(JSON.stringify(consentStatus))
    // await appendToDefinedFile("logs.txt","consentStatus",JSON.stringify(consentStatus))
    //
    // let accListPayments = await getAccListPayments(config,dboClientAccessToken,domesticConsentId)
    // console.log(JSON.stringify(accListPayments))
    // await appendToDefinedFile("logs.txt","accListPayments",JSON.stringify(accListPayments))
    //
    // await getAccListPayments(config,dboClientAccessToken,domesticConsentId)
    // console.log(JSON.stringify(accListPayments))
    // await appendToDefinedFile("logs.txt","accListPayments",JSON.stringify(accListPayments))
    //
    // let accListKeycloak = await getAccListPaymentsKEYCLOAK(config,"",domesticConsentId)
    // console.log(JSON.stringify(accListKeycloak))
    // await appendToDefinedFile("logs.txt","accListPayments",JSON.stringify(accListKeycloak))
    //
    // let accListCheck = await getAccListPaymentsKEYCLOAKcheck(config,"",domesticConsentId)
    // console.log(JSON.stringify(accListCheck))
    // await appendToDefinedFile("logs.txt","accListPaymentsCheck",JSON.stringify(accListCheck))

    let externalRepresentationRequestBody = sortObjectAlphabeticallyNew(getRequestBody("pispAuth", "PUTpaymentConsentsCreateExternalRepresentation"))
    let externalRepresentation = await createExternalRepresentation(config, externalRepresentationRequestBody)
    console.log(JSON.stringify(externalRepresentation))
    await appendToDefinedFile("logs.txt","externalRepresentationForPredefinedBody",JSON.stringify(externalRepresentation))

    let specPartRequestBody = sortObjectAlphabeticallyNew(getRequestBody("pispAuth","PUTpaymentConsentsCreateExternalRepresentationSpecialPart"))
    let externalRepresentationSpecialPart = await createExternalRepresentationSpecialPart(config,specPartRequestBody)
    console.log(JSON.stringify(externalRepresentationSpecialPart))
    await appendToDefinedFile("logs.txt","externalRepresentationSpecialPartForPredefinedBody",JSON.stringify(externalRepresentationSpecialPart))

    // let authorisedPayment = await authorisePayment(config, dboClientAccessToken, accListPayments)
    // console.log(JSON.stringify(authorisedPayment))
    // await appendToDefinedFile("logs.txt","authorisedPayment_response",JSON.stringify(authorisedPayment))
    //
    // let consentStatus1 = await getConsentStatusDBO(config,dboClientAccessToken,domesticConsentId)
    // console.log(JSON.stringify(consentStatus1))
    // await appendToDefinedFile("logs.txt","consentStatusAuthorised",JSON.stringify(consentStatus1))
    //
    // await deletePaymentConsentsDomestic(config,dboClientAccessToken,domesticConsentId)
    // authType = "OBclientCredentials"
    // await deletePaymentConsentsDomesticDBO(config,dboClientAccessToken,domesticConsentId)
    // let consentStatus2 = await getConsentStatusDBO(config,dboClientAccessToken,domesticConsentId)
    // console.log(JSON.stringify(consentStatus2))
    // await appendToDefinedFile("logs.txt","consentStatus2",JSON.stringify(consentStatus2))
    //
    // await modifyPostPaymentsDomesticDomesticIdBody(domesticConsentId)
    // let payment = await createPayment(config,pispAccessToken)
    // console.log(JSON.stringify(payment))
    // await sleep(5000)
    // await appendToDefinedFile("logs.txt","payments_response",JSON.stringify(payment))
    //
    // let paymentStatusDomestic = await getPaymentsDomesticByDomesticId(config,pispAccessToken,payment.data.domesticId)
    // console.log(JSON.stringify(paymentStatusDomestic))
    // await appendToDefinedFile("logs.txt","paymentStatusDomestic",JSON.stringify(paymentStatusDomestic))
    //
    // let paymentStatusDomesticDBO = await getPaymentsDomesticByDomesticIdDBO(config,dboClientAccessToken,payment.data.domesticId)
    // console.log(JSON.stringify(paymentStatusDomesticDBO))
    // await appendToDefinedFile("logs.txt","paymentStatusDomesticDBO",JSON.stringify(paymentStatusDomesticDBO))

}

main1()

module.exports = {sortObjectAlphabetically,getRequestBody,appendToDefinedFile,generateSignature,convertToBase64,scCryptoHash,generateHeader,generatePayload,convertToBase64URL,convertBase64UrlToBase64,scCryptoSign,createTokenPISP,UnixDate,convertBase64ToBase64Url,setAuthType,createDboClientToken,authType,getAccListPayments,createImitationInsert,createSpecialPartObject,createExternalRepresentationSpecialPart,renameKeyInObject,createExternalRepresentation}
