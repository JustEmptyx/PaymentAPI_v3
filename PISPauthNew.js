
const uuid = require('uuid')
const {create} = require("axios");

const { execSync } = require('child_process');
const readline = require("readline-sync");
const axios = require("axios");
const {requestBody,setRequestBody} =  require('./requestBodies.js')
const {appendToDefinedFile,createFile} = require('./fileManager')
const {sortObjectAlphabetically,getRequestBody,findAttribute,generateRandomHex,serializeRequestBody} = require('./utils')
const {scCryptoSign,scCryptoHash} = require('./cryptoManager')
const{convertToBase64, convertToBase64URL, convertBase64UrlToBase64, convertBase64ToBase64Url, decodeBase64, decodeBase64Url} = require('./base64converter')
const fs = require("fs");
const {unixDate,UnixDate,addYearsToDate,subtractYearsFromDate} = require('./dateModule')
const { format,addMinutes,addSeconds, addMilliseconds } = require("date-fns");
const { formatInTimeZone } = require("date-fns-tz");
const {getClientAssertion,createTokenWithClientAssertion} = require("./clientSecretJWTAuth")
const {stringify} = require("uuid");
let defaultConfig = {
    alg: "BIGNS128",
    typ: "JOSE",
    url_kc: "https://sc-map-testversion-vip.softclub.by:7891/",
    url_swagger: "https://sc-map-testversion-vip.softclub.by:8008/",
    baseUrl: "http://openbanking.asb.by",
    client_id_pisp: "PISP2TEST",
    client_secret_pisp: "Cgxb4O9UWS4HZwrpbf3bfefdrZTStubt",
    client_id_qpisp: "BELKARTPAY_NPC_TEST",
    client_secret_qpisp: "aES5biV0eWVkVWUHzD36it5X2yE7DSkF",
    client_id_tpe: "ENTERPRISESOFT",
    client_secret_tpe: "Nisll6ytlAAtYGqb7W1Kus539rfLAZuP",
    client_id_dbo: "digitalChannels",
    client_secret_dbo: "rvDMLEf5Njz6L5BGpst4dLP1hMrBWxEV",
    apikey: "6026812e-3e2e-4d8d-9f86-c0128223b7df",
    client_otp: "asb12345",
    mobile_number: "+375-255427989",
    access_token: "",
    subjectKeyIdentifier: "8627DBC521A8F18A4CDDD8D396949CC333ED762E",
    password: "12345678",
    EDSsignatureSubjectKeyIdentifier:"8627DBC521A8F18A4CDDD8D396949CC333ED762E",
    EDSsignaturepassword:"12345678"
};

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
let authType = " PAUapikey" // PAUapikey, OBclientCredentials

async function createTokenPISP(config){
    let response
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
    const result = await response.json();
    if (result.access_token) {
        config.access_token = result.access_token;
    }
    return result
}

async function createTokenQPISP(config){
  let local_config = {client_id:config.client_id_qpisp,client_secret:config.client_secret_qpisp,url_kc:config.url_kc,alg: "BELTM256",typ: "JOSE", url_swagger:config.url_swagger, scope:"SC-APPS instant-payments openid"}
  let client_assertion = await getClientAssertion(local_config,false)
  appendToDefinedFile("logs.txt","client_assertion",client_assertion.toString())
  let token = await createTokenWithClientAssertion(local_config,client_assertion)
  appendToDefinedFile("logs.txt","client_assertion_token!",JSON.stringify(token))
  if (token.access_token) {
    config.access_token = token.access_token;
  }
  return token
}

async function createTokenTPE(config){
  let local_config = {client_id:config.client_id_tpe,client_secret:config.client_secret_tpe,url_kc:config.url_kc,alg: "BELTM256",typ: "JOSE", url_swagger:config.url_swagger, scope:"SC-APPS instant-invoices openid"}
  let client_assertion = await getClientAssertion(local_config,false)
  appendToDefinedFile("logs.txt","client_assertion",client_assertion.toString())
  let token = await createTokenWithClientAssertion(local_config,client_assertion)
  if (token.access_token) {
    config.access_token = token.access_token;
  }

  return token
}

async function createDboClientToken(config = {}, body = {}, enabledHeaders = []) {
    try {
        // Create a new config object that merges default with provided config
        const effectiveConfig = { ...defaultConfig, ...config };
        
        const response = await fetch(effectiveConfig.url_swagger + "auth/realms/SCRealm/protocol/openid-connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: effectiveConfig.client_id_dbo,
                client_secret: effectiveConfig.client_secret_dbo,
                grant_type: "client_credentials",
                scope: "SC-APPS online-banking"
            })
        });
        const result = await response.json();
        
        // Return both the result and the updated config
        if (result.access_token) {
            return {
                ...result,
                updatedConfig: {
                    ...effectiveConfig,
                    access_token: result.access_token
                }
            };
        }
        return result;
    } catch (error) {
        console.error('Error in createDboClientToken:', error);
        throw error;
    }
}

async function generateHeader(config, additionalInfo){
  let headerRaw
  const baseUrl = config.baseUrl || "http://openbanking.asb.by";

  if(authType == "OBclientCredentials") {
  headerRaw = {"alg": "BIGNS128",
  "crit": [
    baseUrl + "/asn1",
    baseUrl + "/crptPrvdr",
    baseUrl + "/signDtTm",
    baseUrl + "/signedData",
    // baseUrl + "/debtorIdentification"
  ],
  [baseUrl + "/asn1"]: true,
  [baseUrl + "/crptPrvdr"]: 1,
  [baseUrl + "/signDtTm"]: unixDate.getISOWithTimeZone(unixDate.getDateNsecondsAgo(-10800)),
  [baseUrl + "/signedData"]: {
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
  // baseUrl + "/debtorIdentification":"organisationIdentification",
  "typ": "JOSE"}
  } else {
  headerRaw = {"alg": "BIGNS128",
  "crit": [
    baseUrl + "/asn1",
    baseUrl + "/crptPrvdr",
    baseUrl + "/signDtTm",
    baseUrl + "/signedData",
    // baseUrl + "/debtorIdentification"
  ],
  [baseUrl + "/asn1"]: true,
  [baseUrl + "/crptPrvdr"]: 1,
  [baseUrl + "/signDtTm"]: unixDate.getISOWithTimeZone(unixDate.getDateNsecondsAgo(-10800)),
  [baseUrl + "/signedData"]: {
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
  // baseUrl + "/debtorIdentification":"privateIdentification",
  "typ": "JOSE"}
}
  if(additionalInfo.includes("NoIdempotencyKey")){
    let tempArr = headerRaw[baseUrl + "/signedData"]["pars"]
    delete tempArr.splice(tempArr.indexOf("x-idempotency-key"),1)
    headerRaw[baseUrl + "/signedData"]["pars"] = tempArr
  }
  if(additionalInfo.includes("NoContentType")){
    let tempArr = headerRaw[baseUrl + "/signedData"]["pars"]
    delete tempArr.splice(tempArr.indexOf("content-type"),1)
    headerRaw[baseUrl + "/signedData"]["pars"] = tempArr
  }
  return headerRaw
}

const si= require("./Signature");
const dateModule = require('./dateModule.js');

async function makePOSTrequest(config,projectName,projectUrl,requestBody,enabledHeaders = []){
    let requestBodyName = "POSTbody"
    await appendToDefinedFile("logs.txt","received requestBody",JSON.stringify(requestBody))
    setRequestBody(projectName,requestBodyName,sortObjectAlphabetically(requestBody))
    requestBody = getRequestBody(projectName, requestBodyName)
    await appendToDefinedFile("logs.txt","formatted requestBody",JSON.stringify(requestBody))
    let commonHeaders = {}
    if(enabledHeaders.includes("NoSignature")){
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
        }
    } else {
        let cryptoHashBody
        if(requestBody){
            cryptoHashBody = {
                "Auth":{
                    "CryptoType":1,
                },
                "DataB64": convertToBase64(serializeRequestBody(requestBody))
            }
        }
        await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
        let hmac = await scCryptoHash(config,cryptoHashBody)
        hmac = hmac.ResultB64
        await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
            "x-jws-signature": "",
            "content-digest": "belt-hash256=:"+ hmac +":"
        }
    }
    if (enabledHeaders.includes("x-fapi-interaction-id")){
        commonHeaders["x-fapi-interaction-id"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-fapi-customer-ip-address")){
        commonHeaders["x-fapi-customer-ip-address"] = "192.168.247.72"
    }
    if (enabledHeaders.includes("x-fapi-auth-date")){
        commonHeaders["x-fapi-auth-date"] = unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600))
    }
    if (enabledHeaders.includes("application/json")){
        commonHeaders["content-type"] = "application/json;charset=utf-8",
        commonHeaders["accept"] = "application/json;charset=utf-8"
    }
    if (enabledHeaders.includes("x-idempotency-key")){
        commonHeaders["x-idempotency-key"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-api-key")){
        commonHeaders["x-api-key"] = config["apikey"]
    } else {
        commonHeaders["authorization"] = "Bearer " + config["access_token"]
    }
    const debtorIdentificationHeader = (config.baseUrl || "http://openbanking.asb.by") + "/debtorIdentification";
    if (enabledHeaders.includes("privateIdentification")){
        commonHeaders[debtorIdentificationHeader] = "privateIdentification"
    }
    if (enabledHeaders.includes("organisationIdentification")){
        commonHeaders[debtorIdentificationHeader] = "organisationIdentification"
    } 
    await appendToDefinedFile("logs.txt","commonHeaders",JSON.stringify(commonHeaders))
    if(!enabledHeaders.includes("NoSignature")){
        let signature = await si.generateSignature(config,"POST",projectUrl,commonHeaders,projectName,requestBodyName)
        await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
        commonHeaders['x-jws-signature'] = signature
        console.log(JSON.stringify(signature))
    }
    if(commonHeaders[debtorIdentificationHeader]){
        delete commonHeaders[debtorIdentificationHeader];
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(commonHeaders))
    console.log(JSON.stringify(commonHeaders))
  const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0" + projectUrl, {
    method: "POST",
    mode: "cors",
    headers: commonHeaders,
    body: serializeRequestBody(requestBody)
  });
  
  // Capture breadcrumbId from response headers before reading body
  const breadcrumbId = response.headers.get('x-breadcrumb-id') || response.headers.get('breadcrumbId');
  if (breadcrumbId) {
    config.breadcrumbId = breadcrumbId;
  }
  
  await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(commonHeaders) + "\r\n" + "body: " + JSON.stringify(requestBody))
  const responseText = await response.text();
  const statusCode = response.status;
  
  // Store statusCode in config for later use
  config.lastStatusCode = statusCode;
  
    if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<')) {
        return responseText;
    }
    try {
        return JSON.parse(responseText);
    } catch (e) {
        return responseText;
    }
}

async function makeGETrequest(config,projectName,projectUrl,requestBody,enabledHeaders = []){
    let requestBodyName = "GETbody"
    let additionalInfo = {"url":requestBody}
    console.log(additionalInfo)
    await appendToDefinedFile("logs.txt","additionalInfo",JSON.stringify(additionalInfo))
    setRequestBody(projectName,requestBodyName,"")
    requestBody = getRequestBody(projectName, requestBodyName)
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let commonHeaders = {}
    if(enabledHeaders.includes("NoSignature")){
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
        }
    } else {
        let cryptoHashBody
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
        await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
        let hmac = await scCryptoHash(config,cryptoHashBody)
        hmac = hmac.ResultB64
        await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
        commonHeaders = {
            "x-jws-signature": "",
            "content-digest": "belt-hash256=:"+ hmac +":"
        }
    }
    let requestContentType = enabledHeaders.includes("application/json")? "application/json;charset=utf-8": "application/xml;charset=utf-8"
    if (enabledHeaders.includes("x-fapi-interaction-id")){
        commonHeaders["x-fapi-interaction-id"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-fapi-customer-ip-address")){
        commonHeaders["x-fapi-customer-ip-address"] = "192.168.247.72"
    }
    if (enabledHeaders.includes("x-fapi-auth-date")){
        commonHeaders["x-fapi-auth-date"] = unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600))
    }
    // if (enabledHeaders.includes("application/json")){
    //     commonHeaders["content-type"] = "application/json;charset=utf-8",
    //     commonHeaders["accept"] = "application/json;charset=utf-8"
    // }
    if (enabledHeaders.includes("x-idempotency-key")){
        commonHeaders["x-idempotency-key"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-api-key")){
        commonHeaders["x-api-key"] = config["apikey"]
    } else {
        commonHeaders['authorization'] = "Bearer " + config["access_token"]
    }
    await appendToDefinedFile("logs.txt","commonHeaders",JSON.stringify(commonHeaders))
    if (!enabledHeaders.includes("NoSignature")){
        let signature = await si.generateSignature(config,"GET",projectUrl,commonHeaders,projectName,requestBodyName,additionalInfo)
        await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
        commonHeaders['x-jws-signature'] = signature
        console.log(JSON.stringify(signature))
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(commonHeaders))
    console.log(JSON.stringify(commonHeaders))
    console.log(config.url_swagger + "oapi-channel/open-banking/v1.0" + requestBody)
    commonHeaders["content-type"] = requestContentType
    commonHeaders["accept"] = requestContentType
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0" + additionalInfo.url, {
    method: "GET",
    mode: "cors",
    headers: commonHeaders,
  });
  
  // Capture breadcrumbId from response headers before reading body
  const breadcrumbId = response.headers.get('x-breadcrumb-id') || response.headers.get('breadcrumbId');
  if (breadcrumbId) {
    config.breadcrumbId = breadcrumbId;
  }
  
  await appendToDefinedFile("logs.txt","fullRequest","method: GET \r\n mode: cors \r\n headers: " + JSON.stringify(commonHeaders) + "\r\n" + "body: " + JSON.stringify(requestBody))
  const responseText = await response.text();
  const statusCode = response.status;
  config.lastStatusCode = statusCode;
  
    if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<')) {
        return responseText;
    }
    try {
        return JSON.parse(responseText);
    } catch (e) {
        return responseText;
    }
}

async function makePATCHrequest(config,projectName,projectUrl,requestBody,enabledHeaders = []){
    let requestBodyName = "PATCHbody"
    await appendToDefinedFile("logs.txt","received requestBody",JSON.stringify(requestBody))
    setRequestBody(projectName,requestBodyName,sortObjectAlphabetically(requestBody))
    requestBody = getRequestBody(projectName, requestBodyName)
    await appendToDefinedFile("logs.txt","formatted requestBody",JSON.stringify(requestBody))
    let commonHeaders = {}
    if(enabledHeaders.includes("NoSignature")){
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
            "x-jws-signature": "",
        }
    } else {
        let cryptoHashBody
        if(requestBody){
            cryptoHashBody = {
                "Auth":{
                    "CryptoType":1,
                },
                "DataB64": convertToBase64(serializeRequestBody(requestBody))
            }
        }
        await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
        let hmac = await scCryptoHash(config,cryptoHashBody)
        hmac = hmac.ResultB64
        await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
            "x-jws-signature": "",
            "content-digest": "belt-hash256=:"+ hmac +":"
        }
    }
    if (enabledHeaders.includes("x-fapi-interaction-id")){
        commonHeaders["x-fapi-interaction-id"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-fapi-customer-ip-address")){
        commonHeaders["x-fapi-customer-ip-address"] = "192.168.247.72"
    }
    if (enabledHeaders.includes("x-fapi-auth-date")){
        commonHeaders["x-fapi-auth-date"] = unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600))
    }
    if (enabledHeaders.includes("application/json")){
        commonHeaders["content-type"] = "application/json;charset=utf-8",
        commonHeaders["accept"] = "application/json;charset=utf-8"
    }
    if (enabledHeaders.includes("x-idempotency-key")){
        commonHeaders["x-idempotency-key"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-api-key")){
        commonHeaders["x-api-key"] = config["apikey"]
    } else {
        commonHeaders["authorization"] = "Bearer " + config["access_token"]
    }
    await appendToDefinedFile("logs.txt","commonHeaders",JSON.stringify(commonHeaders))
    if (enabledHeaders.includes("NoSignature")){
        let signature = await si.generateSignatureAccounts(config,"PATCH",projectUrl,commonHeaders,projectName,requestBodyName)
        await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
        commonHeaders['x-jws-signature'] = signature
        console.log(JSON.stringify(signature))
    }
    else{
        let signature = await si.generateSignature(config,"PATCH",projectUrl,commonHeaders,projectName,requestBodyName)
        await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
        commonHeaders['x-jws-signature'] = signature
        console.log(JSON.stringify(signature))
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(commonHeaders))
    console.log(JSON.stringify(commonHeaders))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0" + projectUrl, {
    method: "PATCH",
    mode: "cors",
    headers: commonHeaders,
    body: serializeRequestBody(requestBody)
  });
  
  // Capture breadcrumbId from response headers before reading body
  const breadcrumbId = response.headers.get('x-breadcrumb-id') || response.headers.get('breadcrumbId');
  if (breadcrumbId) {
    config.breadcrumbId = breadcrumbId;
  }
  
  await appendToDefinedFile("logs.txt","fullRequest","method: PATCH \r\n mode: cors \r\n headers: " + JSON.stringify(commonHeaders) + "\r\n" + "body: " + JSON.stringify(requestBody))
  const responseText = await response.text();
  const statusCode = response.status;
  config.lastStatusCode = statusCode;
  
    if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<')) {
        return responseText;
    }
    try {
        return JSON.parse(responseText);
    } catch (e) {
        return responseText;
    }
}

async function makeDELETErequest(config,projectName,projectUrl,requestBody,enabledHeaders = []){
    let requestBodyName = "DELETEbody"
    let additionalInfo = {"url":requestBody}
    console.log(additionalInfo)
    await appendToDefinedFile("logs.txt","additionalInfo",JSON.stringify(additionalInfo))
    setRequestBody(projectName,requestBodyName,"")
    requestBody = getRequestBody(projectName, requestBodyName)
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    if(enabledHeaders.includes("NoSignature")){
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
        }
    } else {
        let cryptoHashBody
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
        await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
        let hmac = await scCryptoHash(config,cryptoHashBody)
        hmac = hmac.ResultB64
        await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
        commonHeaders = {
            "x-jws-signature": "",
            "content-digest": "belt-hash256=:"+ hmac +":"
        }
    }    
    let requestContentType = enabledHeaders.includes("application/json")? "application/json;charset=utf-8": "application/xml;charset=utf-8"
    if (enabledHeaders.includes("x-fapi-interaction-id")){
        commonHeaders["x-fapi-interaction-id"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-fapi-customer-ip-address")){
        commonHeaders["x-fapi-customer-ip-address"] = "192.168.247.72"
    }
    if (enabledHeaders.includes("x-fapi-auth-date")){
        commonHeaders["x-fapi-auth-date"] = unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600))
    }
    // if (enabledHeaders.includes("application/json")){
    //     commonHeaders["content-type"] = "application/json;charset=utf-8",
    //     commonHeaders["accept"] = "application/json;charset=utf-8"
    // }
    if (enabledHeaders.includes("x-idempotency-key")){
        commonHeaders["x-idempotency-key"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-api-key")){
        commonHeaders["x-api-key"] = config["apikey"]
    } else {
        commonHeaders['authorization'] = "Bearer " + config["access_token"]
    }
    await appendToDefinedFile("logs.txt","commonHeaders",JSON.stringify(commonHeaders))
    if (!enabledHeaders.includes("NoSignature")){
        let signature = await si.generateSignature(config,"DELETE",projectUrl,commonHeaders,projectName,requestBodyName,additionalInfo)
        await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
        commonHeaders['x-jws-signature'] = signature
        console.log(JSON.stringify(signature))
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(commonHeaders))
    console.log(JSON.stringify(commonHeaders))
    console.log(config.url_swagger + "oapi-channel/open-banking/v1.0" + requestBody)
    commonHeaders["content-type"] = requestContentType
    commonHeaders["accept"] = requestContentType
     try {
        const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0" + additionalInfo.url, {
            method: "DELETE",
            mode: "cors",
            headers: commonHeaders,
        });
        
        // Capture breadcrumbId from response headers before reading body
        const breadcrumbId = response.headers.get('x-breadcrumb-id') || response.headers.get('breadcrumbId');
        if (breadcrumbId) {
            config.breadcrumbId = breadcrumbId;
        }
        
        await appendToDefinedFile("logs.txt", "fullRequest", "method: DELETE \r\n mode: cors \r\n headers: " +
            JSON.stringify(commonHeaders) + "\r\n" + "body: " + JSON.stringify(requestBody));
        const statusCode = response.status;
        return { statusCode: statusCode.toString() };
    } catch (error) {
        console.error('Error in makeDELETErequest:', error);
        return { statusCode: "500", error: error.message };
    }
}

async function makePUTrequest(config,projectName,projectUrl,requestBody,enabledHeaders = []){
    let requestBodyName = "PUTbody"
    await appendToDefinedFile("logs.txt","received requestBody",JSON.stringify(requestBody))
    setRequestBody(projectName,requestBodyName,sortObjectAlphabetically(requestBody))
    requestBody = getRequestBody(projectName, requestBodyName)
    await appendToDefinedFile("logs.txt","formatted requestBody",JSON.stringify(requestBody))
    let commonHeaders = {}
    if(enabledHeaders.includes("NoSignature")){
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
        }
    }
    else {
        let cryptoHashBody
        if(requestBody){
            cryptoHashBody = {
                "Auth":{
                    "CryptoType":1,
                },
                "DataB64": convertToBase64(serializeRequestBody(requestBody))
            }
        }
        await appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
        let hmac = await scCryptoHash(config,cryptoHashBody)
        hmac = hmac.ResultB64
        await appendToDefinedFile("logs.txt","content-digest",hmac.toString())
        commonHeaders = {
            "content-type": "application/xml;charset=utf-8",
            "accept": "application/xml;charset=utf-8",
            "x-jws-signature": "",
            "content-digest": "belt-hash256=:"+ hmac +":"
        }
    }

    if (enabledHeaders.includes("x-fapi-interaction-id")){
        commonHeaders["x-fapi-interaction-id"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-fapi-customer-ip-address")){
        commonHeaders["x-fapi-customer-ip-address"] = "192.168.247.72"
    }
    if (enabledHeaders.includes("x-fapi-auth-date")){
        commonHeaders["x-fapi-auth-date"] = unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600))
    }
    if (enabledHeaders.includes("application/json")){
        commonHeaders["content-type"] = "application/json;charset=utf-8",
        commonHeaders["accept"] = "application/json;charset=utf-8"
    }
    if (enabledHeaders.includes("x-idempotency-key")){
        commonHeaders["x-idempotency-key"] = uuid.v4()
    }
    if (enabledHeaders.includes("x-api-key")){
        commonHeaders["x-api-key"] = config["apikey"]
    } else {
        commonHeaders["authorization"] = "Bearer " + config["access_token"]
    }
    await appendToDefinedFile("logs.txt","commonHeaders",JSON.stringify(commonHeaders))
    if(!enabledHeaders.includes("NoSignature")){
        let signature = await si.generateSignature(config,"PUT",projectUrl,commonHeaders,projectName,requestBodyName)
        await appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
        commonHeaders['x-jws-signature'] = signature
        console.log(JSON.stringify(signature))
    }
    await appendToDefinedFile("logs.txt","headersList",JSON.stringify(commonHeaders))
    console.log(JSON.stringify(commonHeaders))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0" + projectUrl, {
    method: "PUT",
    mode: "cors",
    headers: commonHeaders,
    body: serializeRequestBody(requestBody)
  });
  
  // Capture breadcrumbId from response headers before reading body
  const breadcrumbId = response.headers.get('x-breadcrumb-id') || response.headers.get('breadcrumbId');
  if (breadcrumbId) {
    config.breadcrumbId = breadcrumbId;
  }
  
  await appendToDefinedFile("logs.txt","fullRequest","method: PUT \r\n mode: cors \r\n headers: " + JSON.stringify(commonHeaders) + "\r\n" + "body: " + JSON.stringify(requestBody))
  const responseText = await response.text();
  const statusCode = response.status;
  config.lastStatusCode = statusCode;
  
    if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<')) {
        return responseText;
    }
    try {
        return JSON.parse(responseText);
    } catch (e) {
        return responseText;
    }
}

async function getAccListPaymentsKEYCLOAK(config,access_token,userLogin = "V087_TEST1",clientId = "PISP2TEST",consentId){
    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      "x-api-key": "9ksf8pIjM2LDwDgatRAFbHyIUM91UfyChq1VmJo3rLrZhL8SEB",
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","accListPayments_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accountsList/login/"+userLogin+"/client/"+clientId+"/paymentConsents/"+consentId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  return response.json();
}

async function getAccListPaymentsKEYCLOAKcheck(config,access_token,userLogin = "V087_TEST1",clientId = "PISP2TEST",bodyReq){
     let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      "x-api-key": "9ksf8pIjM2LDwDgatRAFbHyIUM91UfyChq1VmJo3rLrZhL8SEB",
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
    }
    console.log(JSON.stringify(headersList))
    await appendToDefinedFile("logs.txt","accListPaymentscheck_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/check/accountsList/login/"+userLogin+"/client/"+config.client_id_pisp+"/paymentConsents", {
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(bodyReq)
  });
  return response.json();
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

// async function createSpecialPartObject(config,imitIns,requestBodyWithExternalRepresentation){
//   const currentDate = new Date();
//   const formattedDate = formatInTimeZone(currentDate, 'Europe/Minsk', "yyyy-MM-dd'T'HH:mm:ssXXX");
//   currentDate.setMinutes(currentDate.getMinutes()+2)
//   const updatedFormattedDate = formatInTimeZone(currentDate, 'Europe/Minsk', "yyyy-MM-dd'T'HH:mm:ssXXX");
//   return {
//     "specialPart":
//         {
//           "HMAC": imitIns,
//           "OTP": config.client_otp,
//           "OTPdateTime": formattedDate,
//           "mobileNumber": config.mobile_number,
//           "signatureDateTime": updatedFormattedDate,
//           "status": "Authorised",
//           "statusUpdateDateTime": formattedDate,
//           "subjectKeyIdentifier": config.subjectKeyIdentifier
//         }
//   }
// }


async function createSpecialPartObject(config,imitIns,requestBodyWithExternalRepresentation){
  // Получаем creationDateTime из requestBodyWithExternalRepresentation
  const creationDateTimeStr = requestBodyWithExternalRepresentation.data.creationDateTime;
  
  // Парсим строку даты в объект Date
  const creationDate = new Date(creationDateTimeStr);
  
  // Добавляем 1 минуту для OTPdateTime и statusUpdateDateTime
  const dateTimePlus1Sec = addSeconds(creationDate, 1);
  
  // Добавляем 2 минуты для signatureDateTime
  const dateTimePlus2Sec = addSeconds(creationDate, 2);
  
  // Форматируем даты обратно в тот же формат (yyyy-MM-dd'T'HH:mm:ssXXX)
  const formatStr = "yyyy-MM-dd'T'HH:mm:ssXXX";
  
  const otpDateTime = formatInTimeZone(dateTimePlus1Sec, 'Europe/Minsk', formatStr);
  const signatureDateTime = formatInTimeZone(dateTimePlus2Sec, 'Europe/Minsk', formatStr);
  const statusUpdateDateTime = formatInTimeZone(dateTimePlus1Sec, 'Europe/Minsk', formatStr);
  
  return {
    "specialPart":
      {
        "HMAC": imitIns,
        "OTP": config.client_otp,
        "OTPdateTime": otpDateTime,
        "mobileNumber": config.mobile_number,
        "signatureDateTime": signatureDateTime,
        "status": "Authorised",
        "statusUpdateDateTime": statusUpdateDateTime,
        "subjectKeyIdentifier": config.subjectKeyIdentifier
      }
  }
}
async function generateClientSignatures(config,requestBodyWithExternalRepresentation){
    const creationDateTimeStr = requestBodyWithExternalRepresentation.data.creationDateTime;
    const creationDate = new Date(creationDateTimeStr);
    const dateTimePlus1Sec = addSeconds(creationDate, 1);
    const formatStr = "yyyy-MM-dd'T'HH:mm:ssXXX";
    let signatureDateTime = formatInTimeZone(dateTimePlus1Sec, 'Europe/Minsk', formatStr);
    let clientSignature = [
        {
            "EDSattributes": [ ],
            "cryptoType": 1,
            "includePreviousSignatures": false,
            "signature": "",
            "signatureDateTime": signatureDateTime,
            "signatureNumber": 1,
            "subjectKeyIdentifier": config.EDSsignatureSubjectKeyIdentifier
        }
    ]
    return clientSignature
}

async function createSpecialPartObjectEDS(config,clientSignatures,requestBodyWithExternalRepresentation){
  // Получаем creationDateTime из requestBodyWithExternalRepresentation
  const creationDateTimeStr = requestBodyWithExternalRepresentation.data.creationDateTime;
  
  const creationDate = new Date(creationDateTimeStr);
  const dateTimePlus1Sec = addSeconds(creationDate, 1);
  const dateTimePlus2Sec = addSeconds(creationDate, 2);
  const formatStr = "yyyy-MM-dd'T'HH:mm:ssXXX";
  
  const otpDateTime = formatInTimeZone(dateTimePlus1Sec, 'Europe/Minsk', formatStr);
  const signatureDateTime = formatInTimeZone(dateTimePlus2Sec, 'Europe/Minsk', formatStr);
  const statusUpdateDateTime = formatInTimeZone(dateTimePlus1Sec, 'Europe/Minsk', formatStr);
  let commonPartWithEDSattributes = {
    "data": requestBodyWithExternalRepresentation.data,
    "specialPart": {
      "clientSignatures": clientSignatures,
    }
  };
  console.log(JSON.stringify(commonPartWithEDSattributes))
  await appendToDefinedFile("logs.txt","commonPartWithEDSattributes",JSON.stringify(commonPartWithEDSattributes))
  let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":config.EDSsignatureSubjectKeyIdentifier,
            "Password":config.EDSsignaturepassword || "12345678"
        },
        "DataB64": convertToBase64(JSON.stringify(commonPartWithEDSattributes)),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
  }
  let hash = await scCryptoSign(config,signBody)
  commonPartWithEDSattributes.specialPart.clientSignatures[0].signature = hash.ResultB64
  console.log(JSON.stringify(commonPartWithEDSattributes))
  await appendToDefinedFile("logs.txt","commonPartWithEDSattributes",JSON.stringify(commonPartWithEDSattributes))
  return {
    "specialPart":
      {
        "clientSignatures":commonPartWithEDSattributes.specialPart.clientSignatures,
        "signatureDateTime": signatureDateTime,
        "status": "Authorised",
        "statusUpdateDateTime": signatureDateTime,
        "subjectKeyIdentifier": config.subjectKeyIdentifier,
        "verifiedSignatures":[],
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

  await appendToDefinedFile("logs.txt","requestBodyWithExternalRepresentation_base64_step1ImitIns",extendedBodyHash)
  console.log(config.MAC_KEY)
  console.log("requestBodyWithExternalRepresentation_base64_step1ImitIns:" + extendedBodyHash)
  await createMACkey(config).then((data)=>{config.MAC_KEY = data.ResultB64})

  console.log("generated MAC_KEY" + config.MAC_KEY)
  await appendToDefinedFile("logs.txt","generated MAC_KEY_step2ImitIns",config.MAC_KEY)
  await console.log("generated MAC_KEY_step2ImitIns"+ config.MAC_KEY)
  console.log("extendedbodyhash\n" + extendedBodyHash)
  let data = {
      "Auth": {
        "CryptoType": 3,
        "ConnectStr": "hash=1.2.112.0.2.0.34.101.31.53"
      },
      "DataB64": extendedBodyHash,
      "MACKeyB64": config.MAC_KEY
    }

  console.log(JSON.stringify(data))
    await appendToDefinedFile("logs.txt","SCCrypto_ra_hash_step3ImitIns",JSON.stringify(data))
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
    await appendToDefinedFile("logs.txt","EXTERNAL REPRESENTATION","")
    let token = await createDboClientToken(config)
    let access_token = token.access_token

    let requestBodyName = "PUTpaymentConsentsCreateExternalRepresentation"
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(serializeRequestBody(requestBody))
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
    await appendToDefinedFile("logs.txt","fullRequest","method: PUT \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(getRequestBody("pispAuth",requestBodyName)))
  // const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createExternalRepresentation", {
  //   method: "PUT",
  //   mode: "cors",
  //   headers: headersList,
  //   body: serializeRequestBody(requestBody)
  // });
    // return response.json();
    const response = {"data":{"externalRepresentation":"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IDEgMiAzIDQgNSA2IDcgOCA5IDEwIDExIDEyIDEzIDE0IDE1IDE2IDE3IDE4IDE5IDIwIDIxIDIyIDIzIDI0IDI1IDI2IDI3IDI4XS9QIDggMCBSL1BnIDYgMCBSL1MvU3Bhbi9UeXBlL1N0cnVjdEVsZW0+PgplbmRvYmoKOCAwIG9iago8PC9BPDwvQkJveFsyOC4zNSA0MTQuMTUgNTY2LjY1IDgxMy42NV0vTy9MYXlvdXQvU3BhY2VBZnRlciA0L1NwYWNlQmVmb3JlIDQ+Pi9LIDkgMCBSL1AgNSAwIFIvUy9QL1R5cGUvU3RydWN0RWxlbT4+CmVuZG9iago1IDAgb2JqCjw8L0sgOCAwIFIvUCA0IDAgUi9TL0RvY3VtZW50L1R5cGUvU3RydWN0RWxlbT4+CmVuZG9iago0IDAgb2JqCjw8L0tbNSAwIFJdL1BhcmVudFRyZWUgMTMgMCBSL1BhcmVudFRyZWVOZXh0S2V5IDEvUm9sZU1hcDw8Pj4vVHlwZS9TdHJ1Y3RUcmVlUm9vdD4+CmVuZG9iagoxIDAgb2JqCjw8L0xhbmcocnUtcnUpL01hcmtJbmZvPDwvTWFya2VkIHRydWU+Pi9NZXRhZGF0YSAxMSAwIFIvT3V0cHV0SW50ZW50c1s8PC9EZXN0T3V0cHV0UHJvZmlsZSAxNCAwIFIvSW5mbyhzUkdCIElFQzYxOTY2LTIuMSkvT3V0cHV0Q29uZGl0aW9uKCkvT3V0cHV0Q29uZGl0aW9uSWRlbnRpZmllcihDdXN0b20pL1MvR1RTX1BERkExL1R5cGUvT3V0cHV0SW50ZW50Pj5dL1BhZ2VzIDIgMCBSL1N0cnVjdFRyZWVSb290IDQgMCBSL1R5cGUvQ2F0YWxvZz4+CmVuZG9iagozIDAgb2JqCjw8L0NyZWF0aW9uRGF0ZShEOjIwMjQwMzExMTEzNDA1KzAzJzAwJykvTW9kRGF0ZShEOjIwMjQwMzExMTEzNDA1KzAzJzAwJykvUHJvZHVjZXIoaVRleHSuIENvcmUgOC4wLjEgXChBR1BMIHZlcnNpb25cKSCpMjAwMC0yMDIzIEFwcnlzZSBHcm91cCBOVikvVGl0bGUo/v9cMDA0IVwwMDQ+XDAwNDNcMDA0O1wwMDQwXDAwNEFcMDA0OFwwMDQ1XDAwMCBcMDA0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Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgeG1sbnM6cGRmPSJodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvIgogICAgICAgIHhtbG5zOnBkZmFpZD0iaHR0cDovL3d3dy5haWltLm9yZy9wZGZhL25zL2lkLyIKICAgICAgZGM6Zm9ybWF0PSJhcHBsaWNhdGlvbi9wZGYiCiAgICAgIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAzLTExVDExOjM0OjA1KzAzOjAwIgogICAgICB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMy0xMVQxMTozNDowNSswMzowMCIKICAgICAgcGRmOlByb2R1Y2VyPSJpVGV4dMKuIENvcmUgOC4wLjEgKEFHUEwgdmVyc2lvbikgwqkyMDAwLTIwMjMgQXByeXNlIEdyb3VwIE5WIgogICAgICBwZGZhaWQ6cGFydD0iMSIKICAgICAgcGRmYWlkOmNvbmZvcm1hbmNlPSJBIj4KICAgICAgPGRjOnRpdGxlPgogICAgICAgIDxyZGY6QWx0PgogICAgICAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7QodC+0LPQu9Cw0YHQuNC1INC90LAg0L/QvtC70YPRh9C10L3QuNC1INC40L3RhNC+0YDQvNCw0YbQuNC4INC+INGB0YfQtdGC0LDRhSDQutC70LjQtdC90YLQsDwvcmRmOmxpPgogICAgICAgIDwvcmRmOkFsdD4KICAgICAgPC9kYzp0aXRsZT4KICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PgplbmRzdHJlYW0KZW5kb2JqCjEzIDAg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8/sKZW5kc3RyZWFtCmVuZG9iagoxNyAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDEzPj5zdHJlYW0KeJz7/3+wAwYABHqhXwplbmRzdHJlYW0KZW5kb2JqCjE4IDAgb2JqCjw8L0Jhc2VGb250L1NRSlhKWCtVYnVudHVNb25vLVJlZ3VsYXIvQ0lEU3lzdGVtSW5mbzw8L09yZGVyaW5nKElkZW50aXR5KS9SZWdpc3RyeShBZG9iZSkvU3VwcGxlbWVudCAwPj4vQ0lEVG9HSURNYXAvSWRlbnRpdHkvRFcgMTAwMC9Gb250RGVzY3JpcHRvciAxNSAwIFIvU3VidHlwZS9DSURGb250VHlwZTIvVHlwZS9Gb250L1cgWzNbNTAwXTVbNTAwXTEwWzUwMCA1MDAgNTAwXTE0WzUwMCA1MDAgNTAwXTE5WzUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDBdMzZbNTAwIDUwMCA1MDBdNDRbNTAwXTQ2WzUwMF00OVs1MDBdNTFbNTAwXTUzWzUwMF01NVs1MDAgNTAwXTU5WzUwMCA1MDBdNjhbNTAwXTcxWzUwMCA1MDAgNTAwXTcwN1s1MDAgNTAwIDUwMF03MTFbNTAwXTcxN1s1MDBdNzIwWzUwMCA1MDAgNTAwIDUwMCA1MDBdNzI2WzUwMF03MzdbNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwXTc2Nls1MDAgNTAwXTc2OVs1MDAgNTAwXTc3Mls1MDBdXT4+CmVuZG9iagoxOSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDY4Nz4+c3RyZWFtCnicXZXPittMEMTvfgod8x2CPT0lew1Lw0dCYA/5QzZ5AFvqWQxZ2Wi9h337yFWZCUTgH6jkaXXX9KjXHx4+Pkyna7f+Np+Hx7h25TSNc7ycX+chumM8naZVsm48Ddc/d+TwfLis1svix7eXazw/TOW8ur/v1t+Xhy/X+a179/94PsZ/q/XXeYz5ND11735+eFzuH18vl1/xHNO126zcuzHKEujz4fLl8BzdmsveP4zL89P17f2y5u8/frxdojPeJyUznMd4uRyGmA/TU6zuN8vl95+Wy1cxjf883u216lj+/j17o22cUu+NZpIO3mg7SUdvtDtJgzfaXlJ4ox0lFW+0gVLaeKONkpiRmJVXgjfmJIlJilmppq035ixp540Zku68MfeS9t6Yt5JYsJhVdmLBYlbZiQWLWWWn0RvzgZIxbxHK3mQxCWVvzFuEsrfBG6HwJj9JyNXFkEaEpOyNvSzMvTf2emPeeWMvc/KdN/YyJ6tgslfZWQWTvfKCqiO3qhEMLG4VHgwsbhUee2/c0nsbbnmLSBtJ8EqkJKn3SiSTtPNKJEgavRKJ22HjrdlEpFFS8kqkkGReiVQkMS8SOjA2Mi8SprzGrVfCuI8WDE/CFD4YnoQpfDA8CfW9BcOTUN9bsGwS6nsLvpFE/vNGOkFCfW9x55VQ31vsvRLqe4uDV0J9b3H0SqjvLQavhPregkaTUN9bhFciHyUVr0TmF8AKt4NE1nYU+kUiy69Cv0hk+VXoFwnIr0K/SOikWaFfJHTSrNAvEjppVugXCcivQr9IQH4V+kUC8qvQLxKQX4V+kYD8KvSLhA6yFZpDQgfZCs0hAZqTNzcPROhs5415JVAkwSvRJ37+63f+Nglu86pNmeF1npcBw6HGyXKbKacp2ty7nC+3Vd3yW/0GO8m4iwplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAyMAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDIyMTkgMDAwMDAgbiAKMDAwMDAxNzU4NSAwMDAwMCBuIAowMDAwMDAyNDg5IDAwMDAwIG4gCjAwMDAwMDIxMjAgMDAwMDAgbiAKMDAwMDAwMjA1NyAwMDAwMCBuIAowMDAwMDAxNDM3IDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMTkyNiAwMDAwMCBuIAowMDAwMDAxNzg2IDAwMDAwIG4gCjAwMDAwMTc0NDQgMDAwMDAgbiAKMDAwMDAxNzYzNiAwMDAwMCBuIAowMDAwMDAxNTk0IDAwMDAwIG4gCjAwMDAwMjA2OTUgMDAwMDAgbiAKMDAwMDAyMDczMSAwMDAwMCBuIAowMDAwMDAyOTA3IDAwMDAwIG4gCjAwMDAwMDMxNTUgMDAwMDAgbiAKMDAwMDAyMzQyMCAwMDAwMCBuIAowMDAwMDIzNTAwIDAwMDAwIG4gCjAwMDAwMjQxMDQgMDAwMDAgbiAKdHJhaWxlcgo8PC9JRCBbPGQ0OTNlMjY5Y2IzMmVkM2U5ZGE3MGQ5YzZlOWMzMzBiYmY1NDE2ZjUwZmFhOGRjOTg4MjdmYTljMTQzMjBkNDFlMDdmOGVmYzc1NzIxNjNiZjhjYmFiYmNjMzVhNDc5YjZkNmY3Y2E4ZmExNDkyODhjNDZkZDlkNWU0ZGI3NTVmPjxkNDkzZTI2OWNiMzJlZDNlOWRhNzBkOWM2ZTljMzMwYmJmNTQxNmY1MGZhYThkYzk4ODI3ZmE5YzE0MzIwZDQxZTA3ZjhlZmM3NTcyMTYzYmY4Y2JhYmJjYzM1YTQ3OWI2ZDZmN2NhOGZhMTQ5Mjg4YzQ2ZGQ5ZDVlNGRiNzU1Zj5dL0luZm8gMyAwIFIvUm9vdCAxIDAgUi9TaXplIDIwPj4KJWlUZXh0LUNvcmUtOC4wLjEKc3RhcnR4cmVmCjI0ODU5CiUlRU9GCg=="}}
    return response
}

async function createExternalRepresentationSpecialPart(config, requestBody){
    await appendToDefinedFile("logs.txt","EXTERNAL REPRESENTATION SPECIAL PART","")
    let token = await createDboClientToken(config)
    let access_token = token.access_token

    let requestBodyName = "PUTpaymentConsentsCreateExternalRepresentationSpecialPart"
    await appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": convertToBase64(serializeRequestBody(requestBody))
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
  //   const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createSpecialPartExternalRepresentation", {
  //   method: "PUT",
  //   mode: "cors",
  //   headers: headersList,
  //   body:JSON.stringify(requestBody)
  // });
  // await appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(getRequestBody("pispAuth",requestBodyName)))
  // return response.json();
    const response = {"data":{"externalRepresentationSpecialPart":"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IDEgMiAzIDQgNSA2IDcgOCA5IDEwIDExIDEyIDEzIDE0IDE1IDE2IDE3IDE4IDE5IDIwIDIxIDIyIDIzIDI0IDI1IDI2IDI3IDI4XS9QIDggMCBSL1BnIDYgMCBSL1MvU3Bhbi9UeXBlL1N0cnVjdEVsZW0+PgplbmRvYmoKOCAwIG9iago8PC9BPDwvQkJveFsyOC4zNSA0MTQuMTUgNTY2LjY1IDgxMy42NV0vTy9MYXlvdXQvU3BhY2VBZnRlciA0L1NwYWNlQmVmb3JlIDQ+Pi9LIDkgMCBSL1AgNSAwIFIvUy9QL1R5cGUvU3RydWN0RWxlbT4+CmVuZG9iago1IDAgb2JqCjw8L0sgOCAwIFIvUCA0IDAgUi9TL0RvY3VtZW50L1R5cGUvU3RydWN0RWxlbT4+CmVuZG9iago0IDAgb2JqCjw8L0tbNSAwIFJdL1BhcmVudFRyZWUgMTMgMCBSL1BhcmVudFRyZWVOZXh0S2V5IDEvUm9sZU1hcDw8Pj4vVHlwZS9TdHJ1Y3RUcmVlUm9vdD4+CmVuZG9iagoxIDAgb2JqCjw8L0xhbmcocnUtcnUpL01hcmtJbmZvPDwvTWFya2VkIHRydWU+Pi9NZXRhZGF0YSAxMSAwIFIvT3V0cHV0SW50ZW50c1s8PC9EZXN0T3V0cHV0UHJvZmlsZSAxNCAwIFIvSW5mbyhzUkdCIElFQzYxOTY2LTIuMSkvT3V0cHV0Q29uZGl0aW9uKCkvT3V0cHV0Q29uZGl0aW9uSWRlbnRpZmllcihDdXN0b20pL1MvR1RTX1BERkExL1R5cGUvT3V0cHV0SW50ZW50Pj5dL1BhZ2VzIDIgMCBSL1N0cnVjdFRyZWVSb290IDQgMCBSL1R5cGUvQ2F0YWxvZz4+CmVuZG9iagozIDAgb2JqCjw8L0NyZWF0aW9uRGF0ZShEOjIwMjQwMzExMTEzNDA1KzAzJzAwJykvTW9kRGF0ZShEOjIwMjQwMzExMTEzNDA1KzAzJzAwJykvUHJvZHVjZXIoaVRleHSuIENvcmUgOC4wLjEgXChBR1BMIHZlcnNpb25cKSCpMjAwMC0yMDIzIEFwcnlzZSBHcm91cCBOVikvVGl0bGUo/v9cMDA0IVwwMDQ+XDAwNDNcMDA0O1wwMDQwXDAwNEFcMDA0OFwwMDQ1XDAwMCBcMDA0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Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgeG1sbnM6cGRmPSJodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvIgogICAgICAgIHhtbG5zOnBkZmFpZD0iaHR0cDovL3d3dy5haWltLm9yZy9wZGZhL25zL2lkLyIKICAgICAgZGM6Zm9ybWF0PSJhcHBsaWNhdGlvbi9wZGYiCiAgICAgIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAzLTExVDExOjM0OjA1KzAzOjAwIgogICAgICB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMy0xMVQxMTozNDowNSswMzowMCIKICAgICAgcGRmOlByb2R1Y2VyPSJpVGV4dMKuIENvcmUgOC4wLjEgKEFHUEwgdmVyc2lvbikgwqkyMDAwLTIwMjMgQXByeXNlIEdyb3VwIE5WIgogICAgICBwZGZhaWQ6cGFydD0iMSIKICAgICAgcGRmYWlkOmNvbmZvcm1hbmNlPSJBIj4KICAgICAgPGRjOnRpdGxlPgogICAgICAgIDxyZGY6QWx0PgogICAgICAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7QodC+0LPQu9Cw0YHQuNC1INC90LAg0L/QvtC70YPRh9C10L3QuNC1INC40L3RhNC+0YDQvNCw0YbQuNC4INC+INGB0YfQtdGC0LDRhSDQutC70LjQtdC90YLQsDwvcmRmOmxpPgogICAgICAgIDwvcmRmOkFsdD4KICAgICAgPC9kYzp0aXRsZT4KICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PgplbmRzdHJlYW0KZW5kb2JqCjEzIDAg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8/sKZW5kc3RyZWFtCmVuZG9iagoxNyAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDEzPj5zdHJlYW0KeJz7/3+wAwYABHqhXwplbmRzdHJlYW0KZW5kb2JqCjE4IDAgb2JqCjw8L0Jhc2VGb250L1NRSlhKWCtVYnVudHVNb25vLVJlZ3VsYXIvQ0lEU3lzdGVtSW5mbzw8L09yZGVyaW5nKElkZW50aXR5KS9SZWdpc3RyeShBZG9iZSkvU3VwcGxlbWVudCAwPj4vQ0lEVG9HSURNYXAvSWRlbnRpdHkvRFcgMTAwMC9Gb250RGVzY3JpcHRvciAxNSAwIFIvU3VidHlwZS9DSURGb250VHlwZTIvVHlwZS9Gb250L1cgWzNbNTAwXTVbNTAwXTEwWzUwMCA1MDAgNTAwXTE0WzUwMCA1MDAgNTAwXTE5WzUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDBdMzZbNTAwIDUwMCA1MDBdNDRbNTAwXTQ2WzUwMF00OVs1MDBdNTFbNTAwXTUzWzUwMF01NVs1MDAgNTAwXTU5WzUwMCA1MDBdNjhbNTAwXTcxWzUwMCA1MDAgNTAwXTcwN1s1MDAgNTAwIDUwMF03MTFbNTAwXTcxN1s1MDBdNzIwWzUwMCA1MDAgNTAwIDUwMCA1MDBdNzI2WzUwMF03MzdbNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwIDUwMCA1MDAgNTAwXTc2Nls1MDAgNTAwXTc2OVs1MDAgNTAwXTc3Mls1MDBdXT4+CmVuZG9iagoxOSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDY4Nz4+c3RyZWFtCnicXZXPittMEMTvfgod8x2CPT0lew1Lw0dCYA/5QzZ5AFvqWQxZ2Wi9h337yFWZCUTgH6jkaXXX9KjXHx4+Pkyna7f+Np+Hx7h25TSNc7ycX+chumM8naZVsm48Ddc/d+TwfLis1svix7eXazw/TOW8ur/v1t+Xhy/X+a179/94PsZ/q/XXeYz5ND11735+eFzuH18vl1/xHNO126zcuzHKEujz4fLl8BzdmsveP4zL89P17f2y5u8/frxdojPeJyUznMd4uRyGmA/TU6zuN8vl95+Wy1cxjf883u216lj+/j17o22cUu+NZpIO3mg7SUdvtDtJgzfaXlJ4ox0lFW+0gVLaeKONkpiRmJVXgjfmJIlJilmppq035ixp540Zku68MfeS9t6Yt5JYsJhVdmLBYlbZiQWLWWWn0RvzgZIxbxHK3mQxCWVvzFuEsrfBG6HwJj9JyNXFkEaEpOyNvSzMvTf2emPeeWMvc/KdN/YyJ6tgslfZWQWTvfKCqiO3qhEMLG4VHgwsbhUee2/c0nsbbnmLSBtJ8EqkJKn3SiSTtPNKJEgavRKJ22HjrdlEpFFS8kqkkGReiVQkMS8SOjA2Mi8SprzGrVfCuI8WDE/CFD4YnoQpfDA8CfW9BcOTUN9bsGwS6nsLvpFE/vNGOkFCfW9x55VQ31vsvRLqe4uDV0J9b3H0SqjvLQavhPregkaTUN9bhFciHyUVr0TmF8AKt4NE1nYU+kUiy69Cv0hk+VXoFwnIr0K/SOikWaFfJHTSrNAvEjppVugXCcivQr9IQH4V+kUC8qvQLxKQX4V+kYD8KvSLhA6yFZpDQgfZCs0hAZqTNzcPROhs5415JVAkwSvRJ37+63f+Nglu86pNmeF1npcBw6HGyXKbKacp2ty7nC+3Vd3yW/0GO8m4iwplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAyMAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDIyMTkgMDAwMDAgbiAKMDAwMDAxNzU4NSAwMDAwMCBuIAowMDAwMDAyNDg5IDAwMDAwIG4gCjAwMDAwMDIxMjAgMDAwMDAgbiAKMDAwMDAwMjA1NyAwMDAwMCBuIAowMDAwMDAxNDM3IDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMTkyNiAwMDAwMCBuIAowMDAwMDAxNzg2IDAwMDAwIG4gCjAwMDAwMTc0NDQgMDAwMDAgbiAKMDAwMDAxNzYzNiAwMDAwMCBuIAowMDAwMDAxNTk0IDAwMDAwIG4gCjAwMDAwMjA2OTUgMDAwMDAgbiAKMDAwMDAyMDczMSAwMDAwMCBuIAowMDAwMDAyOTA3IDAwMDAwIG4gCjAwMDAwMDMxNTUgMDAwMDAgbiAKMDAwMDAyMzQyMCAwMDAwMCBuIAowMDAwMDIzNTAwIDAwMDAwIG4gCjAwMDAwMjQxMDQgMDAwMDAgbiAKdHJhaWxlcgo8PC9JRCBbPGQ0OTNlMjY5Y2IzMmVkM2U5ZGE3MGQ5YzZlOWMzMzBiYmY1NDE2ZjUwZmFhOGRjOTg4MjdmYTljMTQzMjBkNDFlMDdmOGVmYzc1NzIxNjNiZjhjYmFiYmNjMzVhNDc5YjZkNmY3Y2E4ZmExNDkyODhjNDZkZDlkNWU0ZGI3NTVmPjxkNDkzZTI2OWNiMzJlZDNlOWRhNzBkOWM2ZTljMzMwYmJmNTQxNmY1MGZhYThkYzk4ODI3ZmE5YzE0MzIwZDQxZTA3ZjhlZmM3NTcyMTYzYmY4Y2JhYmJjYzM1YTQ3OWI2ZDZmN2NhOGZhMTQ5Mjg4YzQ2ZGQ5ZDVlNGRiNzU1Zj5dL0luZm8gMyAwIFIvUm9vdCAxIDAgUi9TaXplIDIwPj4KJWlUZXh0LUNvcmUtOC4wLjEKc3RhcnR4cmVmCjI0ODU5CiUlRU9GCg=="}}
    return response
}


async function abstractGETrequest(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    try {
        const response = await makeGETrequest(config, "pispAuth", "/paymentConsents/domestic/{domesticConsentId}", body, enabledHeaders);

        // Log the response (as string if it's XML, or stringified if it's an object)
        const responseForLog = typeof response === 'string' ? response : JSON.stringify(response);
        console.log(responseForLog);
        await appendToDefinedFile("logs.txt", "consentCreate_response", responseForLog);

        return response;
    } catch (error) {
        console.error('Error in getDomesticConsent:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

async function abstractDELETErequest(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    try {
        const response = await makeDELETErequest(config, "pispAuth", "abstractDELETE", body, enabledHeaders);

        // Log the response (as string if it's XML, or stringified if it's an object)
        const responseForLog = typeof response === 'string' ? response : JSON.stringify(response);
        console.log(responseForLog);
        await appendToDefinedFile("logs.txt", "consentCreate_response", responseForLog);

        return response;
    } catch (error) {
        console.error('Error in getDomesticConsent:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

async function postDomesticConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let consentCreateResponse = await makePOSTrequest(config, "pispAuth","/paymentConsents/domestic",body,enabledHeaders)
    console.log(JSON.stringify(consentCreateResponse))
    await appendToDefinedFile("logs.txt","postDomesticConsent_response",JSON.stringify(consentCreateResponse))
    return consentCreateResponse
}

async function patchDomesticConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let consentTaxCreateResponse = await makePATCHrequest(config, "pispAuth","/paymentConsents/domestic",body,enabledHeaders)
    console.log(JSON.stringify(consentTaxCreateResponse))
    await appendToDefinedFile("logs.txt","patchDomesticConsent_response",JSON.stringify(consentTaxCreateResponse))
    return consentTaxCreateResponse
}

async function postDomesticPayment(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postDomesticPaymentResponse = await makePOSTrequest(config, "pispAuth","/payments/domestic",body,enabledHeaders)
    console.log(JSON.stringify(postDomesticPaymentResponse))
    await appendToDefinedFile("logs.txt","postDomesticPayment_response",JSON.stringify(postDomesticPaymentResponse))
    return postDomesticPaymentResponse
}
async function postDomesticTaxConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let consentTaxCreateResponse = await makePOSTrequest(config, "pispAuth","/paymentConsents/domesticTax",body,enabledHeaders)
    console.log(JSON.stringify(consentTaxCreateResponse))
    await appendToDefinedFile("logs.txt","postDomesticTaxConsent_response",JSON.stringify(consentTaxCreateResponse))
    return consentTaxCreateResponse
}

async function patchDomesticTaxConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let patchDomesticTaxConsentResponse = await makePATCHrequest(config, "pispAuth","/paymentConsents/domesticTax",body,enabledHeaders)
    console.log(JSON.stringify(patchDomesticTaxConsentResponse))
    await appendToDefinedFile("logs.txt","patchDomesticTaxConsent_response",JSON.stringify(patchDomesticTaxConsentResponse))
    return patchDomesticTaxConsentResponse
}

async function postDomesticTaxPayment(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postDomesticTaxPaymentResponse = await makePOSTrequest(config, "pispAuth","/payments/domesticTax",body,enabledHeaders)
    console.log(JSON.stringify(postDomesticTaxPaymentResponse))
    await appendToDefinedFile("logs.txt","postDomesticTaxPayment_response",JSON.stringify(postDomesticTaxPaymentResponse))
    return postDomesticTaxPaymentResponse
}

async function postListAccountsConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postListAccountsConsentResponse = await makePOSTrequest(config, "pispAuth","/paymentConsents/listAccounts",body,enabledHeaders)
    console.log(JSON.stringify(postListAccountsConsentResponse))
    await appendToDefinedFile("logs.txt","postListAccountsConsentResponse_response",JSON.stringify(postListAccountsConsentResponse))
    return postListAccountsConsentResponse
}

async function patchListAccountsConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let patchListAccountsConsentResponse = await makePATCHrequest(config, "pispAuth","/paymentConsents/listAccounts",body,enabledHeaders)
    console.log(JSON.stringify(patchListAccountsConsentResponse))
    await appendToDefinedFile("logs.txt","patchListAccountsConsent_response",JSON.stringify(patchListAccountsConsentResponse))
    return patchListAccountsConsentResponse
}

async function postListAccountsPayment(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postListAccountsPaymentResponse = await makePOSTrequest(config, "pispAuth","/payments/listAccounts",body,enabledHeaders)
    console.log(JSON.stringify(postListAccountsPaymentResponse))
    await appendToDefinedFile("logs.txt","postListAccountsPayment_response",JSON.stringify(postListAccountsPaymentResponse))
    return postListAccountsPaymentResponse
}

async function postListPassportsConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postListPassportsConsentResponse = await makePOSTrequest(config, "pispAuth","/paymentConsents/listPassports",body,enabledHeaders)
    console.log(JSON.stringify(postListPassportsConsentResponse))
    await appendToDefinedFile("logs.txt","postListPassportsConsentResponse_response",JSON.stringify(postListPassportsConsentResponse))
    return postListPassportsConsentResponse
}

async function patchListPassportsConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let patchListPassportsConsentResponse = await makePATCHrequest(config, "pispAuth","/paymentConsents/listPassports",body,enabledHeaders)
    console.log(JSON.stringify(patchListPassportsConsentResponse))
    await appendToDefinedFile("logs.txt","patchListPassportsConsent_response",JSON.stringify(patchListPassportsConsentResponse))
    return patchListPassportsConsentResponse
}

async function postListPassportsPayment(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postListPassportsPaymentResponse = await makePOSTrequest(config, "pispAuth","/payments/listPassports",body,enabledHeaders)
    console.log(JSON.stringify(postListPassportsPaymentResponse))
    await appendToDefinedFile("logs.txt","postListPassportsPayment_response",JSON.stringify(postListPassportsPaymentResponse))
    return postListPassportsPaymentResponse
}

async function postRequirementConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postRequirementConsentResponse = await makePOSTrequest(config, "pispAuth","/paymentConsents/requirement",body,enabledHeaders)
    console.log(JSON.stringify(postRequirementConsentResponse))
    await appendToDefinedFile("logs.txt","postRequirementConsentResponse_response",JSON.stringify(postRequirementConsentResponse))
    return postRequirementConsentResponse
}

async function patchRequirementConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let patchRequirementConsentResponse = await makePATCHrequest(config, "pispAuth","/paymentConsents/requirement",body,enabledHeaders)
    console.log(JSON.stringify(patchRequirementConsentResponse))
    await appendToDefinedFile("logs.txt","patchRequirementConsent_response",JSON.stringify(patchRequirementConsentResponse))
    return patchRequirementConsentResponse
}

async function postRequirementPayment(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postRequirementPaymentResponse = await makePOSTrequest(config, "pispAuth","/payments/requirement",body,enabledHeaders)
    console.log(JSON.stringify(postRequirementPaymentResponse))
    await appendToDefinedFile("logs.txt","postRequirementPayment_response",JSON.stringify(postRequirementPaymentResponse))
    return postRequirementPaymentResponse
}

async function postTaxRequirementConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postTaxRequirementConsentResponse = await makePOSTrequest(config, "pispAuth","/paymentConsents/taxRequirement",body,enabledHeaders)
    console.log(JSON.stringify(postTaxRequirementConsentResponse))
    await appendToDefinedFile("logs.txt","postTaxRequirementConsentResponse_response",JSON.stringify(postTaxRequirementConsentResponse))
    return postTaxRequirementConsentResponse
}

async function patchTaxRequirementConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let patchTaxRequirementConsentResponse = await makePATCHrequest(config, "pispAuth","/paymentConsents/taxRequirement",body,enabledHeaders)
    console.log(JSON.stringify(patchTaxRequirementConsentResponse))
    await appendToDefinedFile("logs.txt","patchTaxRequirementConsent_response",JSON.stringify(patchTaxRequirementConsentResponse))
    return patchTaxRequirementConsentResponse
}

async function postTaxRequirementPayment(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postTaxRequirementPaymentResponse = await makePOSTrequest(config, "pispAuth","/payments/taxRequirement",body,enabledHeaders)
    console.log(JSON.stringify(postTaxRequirementPaymentResponse))
    await appendToDefinedFile("logs.txt","postRequirementPayment_response",JSON.stringify(postTaxRequirementPaymentResponse))
    return postTaxRequirementPaymentResponse
}

async function postVRPConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postVRPConsentResponse = await makePOSTrequest(config, "pispAuth","/paymentConsents/VRP",body,enabledHeaders)
    console.log(JSON.stringify(postVRPConsentResponse))
    await appendToDefinedFile("logs.txt","postVRPConsentResponse_response",JSON.stringify(postVRPConsentResponse))
    return postVRPConsentResponse
}

async function patchVRPConsent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let patchVRPConsentResponse = await makePATCHrequest(config, "pispAuth","/paymentConsents/VRP",body,enabledHeaders)
    console.log(JSON.stringify(patchVRPConsentResponse))
    await appendToDefinedFile("logs.txt","patchVRPConsent_response",JSON.stringify(patchVRPConsentResponse))
    return patchVRPConsentResponse
}

async function postVRPPayment(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postVRPPaymentResponse = await makePOSTrequest(config, "pispAuth","/payments/VRP",body,enabledHeaders)
    console.log(JSON.stringify(postVRPPaymentResponse))
    await appendToDefinedFile("logs.txt","postRequirementPayment_response",JSON.stringify(postVRPPaymentResponse))
    return postVRPPaymentResponse
}

async function putDomesticConsentExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putDomesticConsentExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putDomesticConsentExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putDomesticConsentExternalRepresentationResponse",JSON.stringify(putDomesticConsentExternalRepresentationResponse))
    return putDomesticConsentExternalRepresentationResponse
}

async function putDomesticTaxConsentExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putDomesticTaxConsentExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/domesticTax/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putDomesticTaxConsentExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","pputDomesticTaxConsentExternalRepresentationResponse",JSON.stringify(putDomesticTaxConsentExternalRepresentationResponse))
    return putDomesticTaxConsentExternalRepresentationResponse
}

async function putListAccountsConsentExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putListAccountsConsentExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/listAccounts/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putListAccountsConsentExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putListAccountsConsentExternalRepresentationResponse",JSON.stringify(putListAccountsConsentExternalRepresentationResponse))
    return putListAccountsConsentExternalRepresentationResponse
}

async function putListPassportsConsentExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putListPassportsConsentExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/listPassports/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putListPassportsConsentExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putListPassportsConsentExternalRepresentationResponse",JSON.stringify(putListPassportsConsentExternalRepresentationResponse))
    return putListPassportsConsentExternalRepresentationResponse
}

async function putRequirementConsentExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putRequirementConsentExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/requirement/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putRequirementConsentExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putRequirementConsentExternalRepresentationResponse",JSON.stringify(putRequirementConsentExternalRepresentationResponse))
    return putRequirementConsentExternalRepresentationResponse
}

async function putTaxRequirementConsentExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putTaxRequirementConsentExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/taxRequirement/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putTaxRequirementConsentExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putTaxRequirementConsentExternalRepresentationResponse",JSON.stringify(putTaxRequirementConsentExternalRepresentationResponse))
    return putTaxRequirementConsentExternalRepresentationResponse
}

async function putVRPConsentExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putVRPConsentExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/VRP/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putVRPConsentExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putVRPConsentExternalRepresentationResponse",JSON.stringify(putVRPConsentExternalRepresentationResponse))
    return putVRPConsentExternalRepresentationResponse
}

async function putConsentSpecialPartExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putConsentSpecialPartExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/paymentConsents/createSpecialPartExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putConsentSpecialPartExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putConsentSpecialPartExternalRepresentationResponse",JSON.stringify(putConsentSpecialPartExternalRepresentationResponse))
    return putConsentSpecialPartExternalRepresentationResponse
}

async function putAccountConsentsSpecialPartExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putAccountConsentsSpecialPartExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/accountConsents/createSpecialPartExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putAccountConsentsSpecialPartExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putAccountConsentsSpecialPartExternalRepresentationResponse",JSON.stringify(putAccountConsentsSpecialPartExternalRepresentationResponse))
    return putAccountConsentsSpecialPartExternalRepresentationResponse
}

async function putAccountConsentsExternalRepresentation(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putAccountConsentsExternalRepresentationResponse = await makePUTrequest(config, "pispAuth","/accountConsents/createExternalRepresentation",body,enabledHeaders)
    console.log(JSON.stringify(putAccountConsentsExternalRepresentationResponse))
    await appendToDefinedFile("logs.txt","putAccountConsentsExternalRepresentationResponse",JSON.stringify(putAccountConsentsExternalRepresentationResponse))
    return putAccountConsentsExternalRepresentationResponse
}

async function postPaymentIntent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    enabledHeaders.push("NoSignature")
    console.log(enabledHeaders)
    let postPaymentIntentResponse = await makePOSTrequest(config, "pispAuth","/paymentIntents",body,enabledHeaders)
    console.log(JSON.stringify(postPaymentIntentResponse))
    await appendToDefinedFile("logs.txt","postPaymentIntent_response",JSON.stringify(postPaymentIntentResponse))
    return postPaymentIntentResponse
}

async function putPaymentIntent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    enabledHeaders.push("NoSignature")
    console.log(enabledHeaders)
    let putPaymentIntentResponse = await makePUTrequest(config, "pispAuth","/paymentIntents",body,enabledHeaders)
    console.log(JSON.stringify(putPaymentIntentResponse))
    await appendToDefinedFile("logs.txt","putPaymentIntent_response",JSON.stringify(putPaymentIntentResponse))
    return putPaymentIntentResponse
}

async function postAccountIntent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postAccountIntentResponse = await makePOSTrequest(config, "pispAuth","/accountIntents",body,enabledHeaders)
    console.log(JSON.stringify(postAccountIntentResponse))
    await appendToDefinedFile("logs.txt","postAccountIntent_response",JSON.stringify(postAccountIntentResponse))
    return postAccountIntentResponse
}

async function putAccountIntent(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let putAccountIntentResponse = await makePUTrequest(config, "pispAuth","/accountIntents",body,enabledHeaders)
    console.log(JSON.stringify(putAccountIntentResponse))
    await appendToDefinedFile("logs.txt","putAccountIntent_response",JSON.stringify(putAccountIntentResponse))
    return putAccountIntentResponse
}

async function postAccountConsents(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let postAccountConsentsResponse = await makePOSTrequest(config, "pispAuth","/accountConsents",body,enabledHeaders)
    console.log(JSON.stringify(postAccountConsentsResponse))
    await appendToDefinedFile("logs.txt","postAccountConsents_response",JSON.stringify(postAccountConsentsResponse))
    return postAccountConsentsResponse
}

async function patchAccountConsents(config,body,enabledHeaders){
    console.log(config)
    console.log(body)
    console.log(enabledHeaders)
    let patchAccountConsentsResponse = await makePATCHrequest(config, "pispAuth","/accountConsents",body,enabledHeaders)
    console.log(JSON.stringify(patchAccountConsentsResponse))
    await appendToDefinedFile("logs.txt","patchAccountConsents_response",JSON.stringify(patchAccountConsentsResponse))
    return patchAccountConsentsResponse
}

async function postStatements(config, body, enabledHeaders) {
    debugger;
    console.log(config);
    console.log(body);
    console.log(enabledHeaders);
    
    // Parse the body to separate URL and payload
    let lines = body.split('\n');
    let url = lines[0].trim();
    let payloadStr = lines.slice(1).join('\n').trim();
    
    // Parse the payload JSON
    let payload;
    try {
        payload = JSON.parse(payloadStr);
    } catch (e) {
        console.error('Invalid JSON payload:', payloadStr);
        throw new Error('Invalid JSON payload');
    }
    
    let response = await makePOSTrequest(config, "pispAuth", url, payload, enabledHeaders);
    console.log(JSON.stringify(response));
    await appendToDefinedFile("logs.txt", "postStatements_response", JSON.stringify(response));
    return response;
}

async function postTransactions(config, body, enabledHeaders) {
    debugger;
    console.log(config);
    console.log(body);
    console.log(enabledHeaders);
    
    // Parse the body to separate URL and payload
    let lines = body.split('\n');
    let url = lines[0].trim();
    let payloadStr = lines.slice(1).join('\n').trim();
    
    // Parse the payload JSON
    let payload;
    try {
        payload = JSON.parse(payloadStr);
    } catch (e) {
        console.error('Invalid JSON payload:', payloadStr);
        throw new Error('Invalid JSON payload');
    }
    
    let response = await makePOSTrequest(config, "pispAuth", url, payload, enabledHeaders);
    console.log(JSON.stringify(response));
    await appendToDefinedFile("logs.txt", "postTransactions_response", JSON.stringify(response));
    return response;
}

async function prepareExternalRepresentationBody(body,type){
    let returnBody = body
    if(type == "domestic"){
        delete returnBody.data.account
    }
    if(type == "domesticTax"){
        delete returnBody.data.account
        delete returnBody.data.initiation.enclosedFile
        delete returnBody.data.initiation.listAccounts
        delete returnBody.data.initiation.listPassportData
        delete returnBody.data.charge
        returnBody = renameKeyInObject(returnBody,"paymentConsentId","domesticTaxConsentId")
    }
    if(type == "listAccounts"){
        delete returnBody.data.account
        delete returnBody.data.initiation.enclosedFile
        delete returnBody.data.initiation.listPassportData
        returnBody = renameKeyInObject(returnBody,"paymentConsentId","listAccountsConsentId")
    }
    if(type == "listPassports"){
        delete returnBody.data.account
        delete returnBody.data.initiation.enclosedFile
        delete returnBody.data.initiation.regulatoryReporting
        delete returnBody.data.initiation.listAccounts
        returnBody = renameKeyInObject(returnBody,"paymentConsentId","listPassportsConsentId")
    }
    if(type == "requirement"){
        delete returnBody.data.account
        delete returnBody.data.initiation.listPassportData
        delete returnBody.data.initiation.listAccounts
        delete returnBody.data.initiation.regulatoryReporting
        returnBody = renameKeyInObject(returnBody,"paymentConsentId","requirementConsentId")
    }
    if(type == "taxRequirement"){
        delete returnBody.data.account
        delete returnBody.data.initiation.listPassportData
        delete returnBody.data.initiation.listAccounts
        delete returnBody.data.charge
        returnBody = renameKeyInObject(returnBody,"paymentConsentId","taxRequirementConsentId")
    }
    if(type == "VRP"){
        delete returnBody.data.account
        delete returnBody.data.initiation.enclosedFile
        delete returnBody.data.initiation.listAccounts
        delete returnBody.data.initiation.listPassportData
        delete returnBody.data.initiation.regulatoryReporting
        delete returnBody.data.charge
        returnBody = renameKeyInObject(returnBody,"paymentConsentId","VRPConsentId")
    }
    let sortedAccList = sortObjectAlphabetically(returnBody)
    returnBody = sortedAccList
    return returnBody
}

async function prepareExternalRepresentationBodyAccounts(body,type){
    let returnBody = body
    let sortedAccList = sortObjectAlphabetically(returnBody)
    returnBody = sortedAccList
    return returnBody
}

async function prepareExternalRepresentationSpecialPartBody(config,requestBodyWithExternalRepresentation){
    if(requestBodyWithExternalRepresentation.data.paymentConsentId){
        requestBodyWithExternalRepresentation = renameKeyInObject(requestBodyWithExternalRepresentation,"paymentConsentId","domesticConsentId")
    }
    requestBodyWithExternalRepresentation = sortObjectAlphabetically(requestBodyWithExternalRepresentation)
    debugger;
    let imitIns = await createImitationInsert(config,requestBodyWithExternalRepresentation)
      await appendToDefinedFile("logs.txt","imitIns_step4ImitIns",imitIns)
    console.log("ImitIns\n" + imitIns) 
    let specPartObject = await createSpecialPartObject(config,imitIns.ResultB64,requestBodyWithExternalRepresentation)
    console.log("!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n!!!!!!!!!!!!!!!!!!!!\n")
    return specPartObject
}

async function prepareExternalRepresentationSpecialPartBodyEDS(config,requestBodyWithExternalRepresentation){
    requestBodyWithExternalRepresentation = sortObjectAlphabetically(requestBodyWithExternalRepresentation)
    debugger;
    let clientSignatures = await generateClientSignatures(config,requestBodyWithExternalRepresentation)
    let specPartObject = await createSpecialPartObjectEDS(config,clientSignatures,requestBodyWithExternalRepresentation)
    return specPartObject
}

async function preparePaymentsBody(type, reqConsent, resConsent){
    let returnBody = {"data":{"initiation":{}}}
    let unixDate = dateModule.unixDate
    
    // Map type to consentId field name
    const consentIdFields = {
        "domestic": "domesticConsentId",
        "domesticTax": "domesticTaxConsentId",
        "listAccounts": "listAccountsConsentId",
        "listPassports": "listPassportsConsentId",
        "requirement": "requirementConsentId",
        "taxRequirement": "taxRequirementConsentId",
        "VRP": "VRPConsentId"
    };
    
    const consentIdField = consentIdFields[type];
    
    // Добавляем consentId из ответа (унифицированная логика)
    if (consentIdField && resConsent?.data?.[consentIdField]) {
        returnBody.data[consentIdField] = resConsent.data[consentIdField];
    }
    
    // Копируем initiation из тела запроса
    if (reqConsent?.data?.initiation) {
        returnBody.data.initiation = reqConsent.data.initiation;
        returnBody.risk = reqConsent.risk;
    }
    
    if (type === "VRP" && reqConsent?.data?.initiation) {
        const { initiation } = reqConsent.data;
        const date = unixDate.getShortedDate(unixDate.getCurrentDate());
        const randomHex = generateRandomHex(16);
    
        returnBody.data.instruction = {
            instructionIdentification: `795SDBO${date}${randomHex}`,
            endToEndIdentification: `01.${date}.${randomHex}`,
        localInstrument: initiation.localInstrument,
            amount: initiation.amount ?? "10.00",
            currency: initiation.currency ?? "BYN",
            remittanceInformation: initiation.remittanceInformation,
            ...(initiation.creditor && { creditor: initiation.creditor }),
            ...(initiation.creditorAccount && { creditorAccount: initiation.creditorAccount }),
            ...(initiation.creditorAgent && { creditorAgent: initiation.creditorAgent })
        };
    }

    let sortedAccList = sortObjectAlphabetically(returnBody)
    returnBody = sortedAccList
    return returnBody
}

async function prepareAuthorisationBody(preparedAccList,extRepr,specPart,extReprSpecPart,type){
    console.log("extRepr_fromprep\n"+JSON.stringify(extRepr))
    console.log("specPart_fromprep\n"+JSON.stringify(specPart))
    console.log("extReprSpecPart\n"+JSON.stringify(extReprSpecPart))
    console.log("preparedAccList\n" + JSON.stringify(preparedAccList))
    if(preparedAccList.data.paymentConsentId){
        preparedAccList = renameKeyInObject(preparedAccList,"paymentConsentId","domesticConsentId")
    }
    let authorisationBody = preparedAccList
    console.log("authorisationBody\n"+JSON.stringify(authorisationBody))
    authorisationBody.data.externalRepresentation = extRepr.data.externalRepresentation
    console.log("authorisationBodyWithExtRepr\n"+JSON.stringify(authorisationBody))
    authorisationBody.specialPart = specPart.specialPart
    console.log("authorisationBodyWithSpecPart\n"+JSON.stringify(authorisationBody))
    authorisationBody.specialPart.externalRepresentationSpecialPart = extReprSpecPart.data.externalRepresentationSpecialPart
    console.log("authorisationBodyWithSpecPartExtRepr\n"+JSON.stringify(authorisationBody))
    
    authorisationBody = sortObjectAlphabetically(authorisationBody)
    return authorisationBody
}

async function prepareAccountsAuthorisationBody(preparedAccList,extRepr,specPart,extReprSpecPart,type){
    console.log("extRepr_fromprep\n"+JSON.stringify(extRepr))
    console.log("specPart_fromprep\n"+JSON.stringify(specPart))
    console.log("extReprSpecPart\n"+JSON.stringify(extReprSpecPart))
    console.log("preparedAccList\n" + JSON.stringify(preparedAccList))
    let authorisationBody = preparedAccList
    console.log("authorisationBody\n"+JSON.stringify(authorisationBody))
    authorisationBody.data.externalRepresentation = extRepr.data.externalRepresentation
    console.log("authorisationBodyWithExtRepr\n"+JSON.stringify(authorisationBody))
    authorisationBody.specialPart = specPart.specialPart
    console.log("authorisationBodyWithSpecPart\n"+JSON.stringify(authorisationBody))
    authorisationBody.specialPart.externalRepresentationSpecialPart = extReprSpecPart.data.externalRepresentationSpecialPart
    console.log("authorisationBodyWithSpecPartExtRepr\n"+JSON.stringify(authorisationBody))
    
    authorisationBody = sortObjectAlphabetically(authorisationBody)
    return authorisationBody
}

async function prepareAccountsEDSAuthorisationBody(config, preparedAccList,extRepr,specPart,extReprSpecPart,type){
    const creationDateTimeStr = preparedAccList.data.creationDateTime;
    const creationDate = new Date(creationDateTimeStr);
    const dateTimePlus1Sec = addSeconds(creationDate, 1);
    const formatStr = "yyyy-MM-dd'T'HH:mm:ssXXX";
    let signatureDateTime = formatInTimeZone(dateTimePlus1Sec, 'Europe/Minsk', formatStr);
    const statusUpdateDateTime = formatInTimeZone(dateTimePlus1Sec, 'Europe/Minsk', formatStr);

    console.log("extRepr_fromprep\n"+JSON.stringify(extRepr))
    console.log("specPart_fromprep\n"+JSON.stringify(specPart))
    console.log("extReprSpecPart\n"+JSON.stringify(extReprSpecPart))
    console.log("preparedAccList\n" + JSON.stringify(preparedAccList))
    let authorisationBody = preparedAccList
    console.log("authorisationBody\n"+JSON.stringify(authorisationBody))
    authorisationBody.data.externalRepresentation = extRepr.data.externalRepresentation
    console.log("authorisationBodyWithExtRepr\n"+JSON.stringify(authorisationBody))
    authorisationBody.specialPart =  {
          "clientSignatures":specPart.specialPart.clientSignatures,
          "externalRepresentationSpecialPart":extReprSpecPart.data.externalRepresentationSpecialPart,
          "signatureDateTime": signatureDateTime,
          "status": "Authorised",
          "statusUpdateDateTime": statusUpdateDateTime,
          "subjectKeyIdentifier": config.subjectKeyIdentifier
        }
    console.log("authorisationBodyWithSpecPartExtRepr\n"+JSON.stringify(authorisationBody))
    
    authorisationBody = sortObjectAlphabetically(authorisationBody)
    return authorisationBody
}

async function generateAISPrequestObject(config, client_id, client_secret, consent_id) {
    let header = {"alg":config.alg == "BIGNS128" ? "BELTM256" : "HS256","typ":config.typ}
    let body = {"alg":config.alg == "BIGNS128" ? "BELTM256" : "HS256","client_id":client_id,"consent_id":consent_id,"max_age":0,"redirect_uri":config.url_swagger+"oauth2-redirect.html","response_type":"code","scope":"SC-APPS accounts openid"}
    let cryptoHashBody = convertToBase64(convertToBase64URL(JSON.stringify(header))+"."+convertToBase64URL(JSON.stringify(body)))
    let dataB64 = {
        "Auth":{
            "CryptoType":3,
            "ConnectStr":"hash=1.2.112.0.2.0.34.101.31.53"
        },
        "DataB64" : cryptoHashBody,
        "MACKeyB64" : convertToBase64(client_secret)
    }
    let res = await scCryptoHash(config,dataB64)

    return convertToBase64URL(JSON.stringify(header))+"."+convertToBase64URL(JSON.stringify(body)) + "." + convertBase64ToBase64Url(res.ResultB64)
}

async function generatePISPrequestObject(config, client_id, client_secret, consent_id) {
    let header = {"alg":config.alg == "BIGNS128" ? "BELTM256" : "HS256","typ":config.typ}
    let body = {"alg":config.alg == "BIGNS128" ? "BELTM256" : "HS256","client_id":client_id,"consent_id":consent_id,"max_age":0,"redirect_uri":config.url_swagger+"oauth2-redirect.html","response_type":"code","scope":"SC-APPS payments openid"}
    let cryptoHashBody = convertToBase64(convertToBase64URL(JSON.stringify(header))+"."+convertToBase64URL(JSON.stringify(body)))
    let dataB64 = {
        "Auth":{
            "CryptoType":3,
            "ConnectStr":"hash=1.2.112.0.2.0.34.101.31.53"
        },
        "DataB64" : cryptoHashBody,
        "MACKeyB64" : convertToBase64(client_secret)
    }
    let res = await scCryptoHash(config,dataB64)

    return convertToBase64URL(JSON.stringify(header))+"."+convertToBase64URL(JSON.stringify(body)) + "." + convertBase64ToBase64Url(res.ResultB64)
}

module.exports = {defaultConfig,
    createTokenQPISP,createTokenTPE,createTokenPISP,createDboClientToken,
    postPaymentIntent,putPaymentIntent,
    abstractGETrequest, abstractDELETErequest,
    postDomesticConsent,patchDomesticConsent,postDomesticPayment,putDomesticConsentExternalRepresentation,
    postDomesticTaxConsent,patchDomesticTaxConsent,postDomesticTaxPayment,putDomesticTaxConsentExternalRepresentation,
    postListAccountsConsent,patchListAccountsConsent,postListAccountsPayment,putListAccountsConsentExternalRepresentation,
    postListPassportsConsent,patchListPassportsConsent,postListPassportsPayment,putListPassportsConsentExternalRepresentation,
    postRequirementConsent,patchRequirementConsent,postRequirementPayment,putRequirementConsentExternalRepresentation,
    postTaxRequirementConsent,patchTaxRequirementConsent,postTaxRequirementPayment,putTaxRequirementConsentExternalRepresentation,
    postVRPConsent,patchVRPConsent,postVRPPayment,putVRPConsentExternalRepresentation,
    postAccountIntent,putAccountIntent,prepareExternalRepresentationBodyAccounts,
    postAccountConsents, patchAccountConsents,prepareAccountsAuthorisationBody,prepareExternalRepresentationSpecialPartBodyEDS,prepareAccountsEDSAuthorisationBody,
    postStatements, postTransactions,
    makePOSTrequest,
prepareExternalRepresentationBody,prepareExternalRepresentationSpecialPartBody,putConsentSpecialPartExternalRepresentation,putAccountConsentsSpecialPartExternalRepresentation,putAccountConsentsExternalRepresentation,prepareAuthorisationBody,preparePaymentsBody,
    getRequestBody,scCryptoHash,generateHeader,scCryptoSign,createImitationInsert,createSpecialPartObject,createExternalRepresentationSpecialPart,renameKeyInObject,createExternalRepresentation,generateRandomHex,getAccListPaymentsKEYCLOAKcheck,getAccListPaymentsKEYCLOAK,
    generateAISPrequestObject,generatePISPrequestObject}
