const uuid = require("uuid");
const paf = require("./PISPauth")
const {setRequestBody} = require("./requestBodies");
const {format} = require("date-fns");
const {setAuthType} = require("./PISPauth");
let unixDate = new paf.UnixDate()

let authType = "PAUapikey" // PAUapikey, OBclientCredentials
paf.setAuthType("PAUapikey")
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function generateSignaturePOSTpaymentConsentslistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,additionalInfo = []){
    let header = {"alg": "BIGNS128",
  "crit": [
    "http://openbanking.asb.by/asn1",
    "http://openbanking.asb.by/crptPrvdr",
    "http://openbanking.asb.by/signDtTm",
    "http://openbanking.asb.by/signedData",
    "http://openbanking.asb.by/debtorIdentification"
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
  "http://openbanking.asb.by/debtorIdentification":"organisationIdentification",
  "typ": "JOSE"}

    if(authType == "OBclientCredentials"){
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
    } else {
    header["http://openbanking.asb.by/signedData"].pars = [
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
    }

    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,undefined,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignaturePOSTpaymentslistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    } else {
    header["http://openbanking.asb.by/signedData"].pars = [
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
    }
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,undefined,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignaturePATCHpaymentConsentslistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    } else {
    header["http://openbanking.asb.by/signedData"].pars = [
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
    }
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,undefined,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETpaymentConsentslistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETpaymentConsentslistAccountsDBO(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETpaymentslistAccountsDBO(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureDELETEpaymentslistAccountsDBO(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureGETpaymentslistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureDELETEpaymentslistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}


async function generateSignatureDELETEpaymentConsentslistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignatureDELETEpaymentConsentslistAccountsDBO(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignaturePUTcreateExternalRepresentationlistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}

async function generateSignaturePUTcreateExternalRepresentationSpecialPartlistAccounts(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,additionalInfo = []){
    let header = await paf.generateHeader(config,additionalInfo)
    if(authType == "OBclientCredentials"){
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
    await paf.appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await paf.generatePayloadNew(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId,"listAccounts")
    await paf.appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = paf.convertToBase64URL(JSON.stringify(header))
    let payloadB64 = paf.convertToBase64URL(JSON.stringify(payload))
    await paf.appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await paf.appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"B6D7498EE0E67A368E921810E53849B0C7A69646",
            "Password":"12345678"
        },
        "DataB64": paf.convertToBase64(headerB64 + "." + payloadB64),
        "OptAddAllCert":false,
        "OptAddCert":true,
        "OptCheckPrivateKey":true,
        "OptReturnSignCert":true
    }
    await paf.appendToDefinedFile("logs.txt","signBody",JSON.stringify(signBody))
    console.log("DataB64 \r\n" + paf.convertToBase64(headerB64 + "." + payloadB64))
    let hash = await paf.scCryptoSign(config,signBody)
    await paf.appendToDefinedFile("logs.txt","signedBody",JSON.stringify(hash))
    console.log("signedData" + JSON.stringify(hash))
    let signature = headerB64 +".."+ paf.convertBase64ToBase64Url(hash.ResultB64)

    return signature
}


async function createPaymentConsentslistAccounts(config,access_token){
    let requestBodyName = "POSTpaymentConsents/listAccounts1"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "POSTpaymentConsentslistAccounts"
    let signature = await generateSignaturePOSTpaymentConsentslistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts", {
    // const response = await fetch("http://192.168.166.214:9100/openbanking/paymentConsents/domestic",{
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName)))
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  return response.json();
}

async function postPaymentslistAccounts(config,access_token){
    let requestBodyName = "POSTpaymentslistAccounts1"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "POSTpaymentslistAccounts"
    let signature = await generateSignaturePOSTpaymentslistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/listAccounts", {
    // const response = await fetch("http://192.168.166.214:9100/openbanking/paymentConsents/domestic",{
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName)))
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  return response.json();
}

async function generateSpecPartlistAccounts(config,requestBodyWithExternalRepresentation){
    let imitIns = await paf.createImitationInsert(config,requestBodyWithExternalRepresentation)
    let specPart = await createSpecialPartObjectlistAccounts(config,imitIns.ResultB64)
    console.log("specialPart \n" + JSON.stringify(specPart))
    setRequestBody("listAccounts","PUTpaymentConsentsCreateExternalRepresentationSpecialPartlistAccounts",specPart)
    let externalRepresentationSpecialPart = await createExternalRepresentationSpecialPartlistAccounts(config,specPart)
    specPart.specialPart.externalRepresentationSpecialPart = externalRepresentationSpecialPart.data.externalRepresentationSpecialPart
    return specPart
}

async function createSpecialPartObjectlistAccounts(config,imitIns){
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
async function createExternalRepresentationlistAccounts(config, requestBody){
    await paf.appendToDefinedFile("logs.txt","EXTERNAL REPRESENTATION","")
    let token = await paf.createDboClientToken(config)
    let access_token = token.access_token

    let requestBodyName = "PUTpaymentConsentsCreateExternalRepresentationlistAccounts"
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "PUTpaymentConsentsCreateExternalRepresentationlistAccounts"
    let signature = await generateSignaturePUTcreateExternalRepresentationlistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,["NoIdempotencyKey"])
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

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
    await paf.appendToDefinedFile("logs.txt","fullRequest","method: PUT \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  // const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts/createExternalRepresentation", {
  //   method: "PUT",
  //   mode: "cors",
  //   headers: headersList,
  //   body: JSON.stringify(requestBody)
  // });
  let response = {"data":{"externalRepresentation":"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Pi9TdHJ1Y3RQYXJlbnRzIDAvVGFicy9TL1RyaW1Cb3hbMCAwIDU5NSA4NDJdL1R5cGUvUGFnZT4+CmVuZG9iagoxMiAwIG9iagpbOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFIgOSAwIFJdCmVuZG9iago5IDAgb2JqCjw8L0tbMCAxIDIgMyA0IDUgNiA3IDggOSAxMCAxMSAxMiAxMyAxNCAxNSAxNiAxNyAxOCAxOSAyMCAyMSAyMiAyMyAyNCAyNSAyNiAyNyAyOCAyOSAzMCAzMSAzMiAzMyAzNCAzNSAzNiAzNyAzOCAzOSA0MCA0MSA0MiA0MyA0NCA0NSA0Nl0vUCA4IDAgUi9QZyA2IDAgUi9TL1NwYW4vVHlwZS9TdHJ1Y3RFbGVtPj4KZW5kb2JqCjggMCBvYmoKPDwvQTw8L0JCb3hbMjguMzUgMzM1LjY1IDU2Ni42NSA4MTMuNjVdL08vTGF5b3V0L1NwYWNlQWZ0ZXIgNC9TcGFjZUJlZm9yZSA0Pj4vSyA5IDAgUi9QIDUgMCBSL1MvUC9UeXBlL1N0cnVjdEVsZW0+PgplbmRvYmoKNSAwIG9iago8PC9LIDggMCBSL1AgNCAwIFIvUy9Eb2N1bWVudC9UeXBlL1N0cnVjdEVsZW0+PgplbmRvYmoKNCAwIG9iago8PC9LWzUgMCBSXS9QYXJlbnRUcmVlIDEzIDAgUi9QYXJlbnRUcmVlTmV4dEtleSAxL1JvbGVNYXA8PD4+L1R5cGUvU3RydWN0VHJlZVJvb3Q+PgplbmRvYmoKMSAwIG9iago8PC9MYW5nKHJ1LXJ1KS9NYXJrSW5mbzw8L01hcmtlZCB0cnVlPj4vTWV0YWRhdGEgMTEgMCBSL091dHB1dEludGVudHNbPDwvRGVzdE91dHB1dFByb2ZpbGUgMTQgMCBSL0luZm8oc1JHQiBJRUM2MTk2Ni0yLjEpL091dHB1dENvbmRpdGlvbigpL091dHB1dENvbmRpdGlvbklkZW50aWZpZXIoQ3VzdG9tKS9TL0dUU19QREZBMS9UeXBlL091dHB1dEludGVudD4+XS9QYWdlcyAyIDAgUi9TdHJ1Y3RUcmVlUm9vdCA0IDAgUi9UeXBlL0NhdGFsb2c+PgplbmRvYmoKMyAwIG9iago8PC9DcmVhdGlvbkRhdGUoRDoyMDI1MTAwMjE1NDgyMCswMycwMCcpL01vZERhdGUoRDoyMDI1MTAwMjE1NDgyMCswMycwMCcpL1Byb2R1Y2VyKGlUZXh0riBDb3JlIDguMC4xIFwoQUdQTCB2ZXJzaW9uXCkgqTIwMDAtMjAyMyBBcHJ5c2UgR3JvdXAgTlYpL1RpdGxlKP7/XDAwNCFcMDA0PlwwMDQzXDAwNDtcMDA0MFwwMDRBXDAwNDhcMDA0NVwwMDAgXDAwND1cMDA0MFwwMDAgXDAwND9cMDA0PlwwMDQ7XDAwNENcMDA0R1wwMDQ1XDAwND1cMDA0OFwwMDQ1XDAwMCBcMDA0OFwwMDQ9XDAwNERcMDA0PlwwMDRAXDAwNDxcMDA0MFwwMDRGXDAwNDhcMDA0OFwwMDAgXDAwND5cMDAwIFwwMDRBXDAwNEdcMDA0NVwwMDRCXDAwNDBcMDA0RVwwMDAgXDAwNDpcMDA0O1wwMDQ4XDAwNDVcMDA0PVwwMDRCXDAwNDApPj4KZW5kb2JqCjE1IDAgb2JqCjw8L0FzY2VudCA2OTMvQ0lEU2V0IDE3IDAgUi9DYXBIZWlnaHQgNjkzL0Rlc2NlbnQgLTE2NS9GbGFncyAzMy9Gb250QkJveFstMzE2IC0xNzAgNjY1IDgzMF0vRm9udEZpbGUyIDE2IDAgUi9Gb250TmFtZS9LU0lNVUIrVWJ1bnR1TW9uby1SZWd1bGFyL0l0YWxpY0FuZ2xlIDAvU3RlbVYgODAvU3R5bGU8PC9QYW5vc2U8MDAwMDAyMGIwNTA5MDMwNjAyMDMwMjA0Pj4+L1R5cGUvRm9udERlc2NyaXB0b3I+PgplbmRvYmoKMTYgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCAxNDczOS9MZW5ndGgxIDI3MzEyPj5zdHJlYW0KeJztvQl4HEeZMPxW9xw9d899aWZ67pFG0oxmJI0ky9botGT5kCXLlizLtnzkcgJ2lDhWMFGsxIniGGyOsBCyHEkgwG4WmTjBhgABTMJhO9lA2EBI7M36hzwLBj5yEGCt+d+qbsmSCXz7P///fN/3PH+mXd1V1dVV9dZ7v1VKgACAAW4HHrLb994kGdbYVmPNkwCc6qrdV9+w9xsdpzD/FIAmevX1E1c9Gf4fcQDhAkDTTdfsHNvxpib4MkD7EH5Tfw1WqOvgESwfxXLsmhtu2rfl84MXsXwcQB+5/r3bx+CXjdj3qhcBHB03jO3bbbhd9xDAtjJsL+2+cefuDy/LPIzlZgByaPsNY7vf2tfXArD9+zj+XWsGMrnpb196HuC6Pmy/Ff63/7hdSsZUep0+yHMApRGsf5zV6ktvld4Cvdyy9AcwY3sztvgDqcXk5XaTfVirK/0R/gw6rP/jOw7Sz+7rWK4L703Qjfc2Vt8PgzAOS7G+HUvdeN+Hdevw2cVa9bNVuhtrmrGmnuW7MV+1oP+K/2/X5H/dj3hLfyy2DA2uG+hf27dm9aqVvSt6upd3dXa0t7UWW5YtbV7S1NhQqK/LVFdVphLxWDQS8jisosVk0OsErUat4jkClZ3Rrq3STGLrjCoR7e6uouXoGFaMLajYOiNhVdfiNjPSVtZMWtyyiC2vuqJlUW5ZnG9JRKkZmqsqpc6oNHOmIyqdIBvXDmH+Ax3RYWnmIsuvYnlVghVMWAiH8Qup03NNhzRDtkqdM117rznUubUD+ztm0LdH23fqqyrhmN6AWQPmZlLR3cdIahlhGS7V2XSMA8FEh53h451jO2b61g51dvjD4WFWB+2srxlN+4yW9SVdS+cM90rHKp86dPiECNu2po07ojvGNg3N8GP40SG+89Chu2es6ZnyaMdM+a0XPAjyzpnKaEfnTDqKnfX2zw9AZtRxMSodehNw8tGLv1lcM6bUaOLim0CzFMT5ZcL3c3nAueEMEb5wmM7l3hNF2IaFmdvXDsllCbb5vwLFTHp4httK3zw198Y5SN/cPvdm/vOt0TBFVedW5d/eazwzt2+Tqipx9dm/OP7D99IMn9i6bfs19Dm281C0o0Net3VDM8UOzBTHFFg7j2Uz2H5sKwJxLV2GtUMzmejuGUe0TW6AFRLFwbUDQ+wT5bMZR/sMbN2ufDWT6eyg85I6D23tkCdI+4quHToJ+dL5Y7WS/7E81MIwnceMqx2Rkug8NLTjqpnQVv8OpM+rpCF/eKY4jMs3HB3aOUyxFBVnys/jcGE2IvsKYbui9VxjCrk2LkhDnJ8fptjCCqkLb9G2ZnwhIrpYkWK0rVkaIn6Ya4ajKC1oblE/WODj7d30FU8/be/2h4fD8u/vTMmvzEkdnxEW9CVixfyc5HH+5tTk1nRC5VLnzo4FE1zUqVqZoNLbO8+To2uhDIxfCBSd3XOv+DhyLtZx2A2rolj0SDPQJw1Fd0aHo0hDxb4hChtda4bf3oFo79qNQwzbCpWsW1SS3zfMv1NyM1w7EmBX2j+HU1Zezsrzxe4rXvfMvZYOCdHegUO056jSIUiHemYASbaIzNlgq1X4twvFW7RrLCqJUtehsROl27cdOlYsHtrdufWaJtpPtGfHoejAULOfTa9/6P3+W+lwNuglvevaqipR+LQdi5LptceKZHpg49BJEZX+9LqhYxxpG6bU77kGAURh1yntoIuzf/iaQ1uHKWmDCxcS/5EZEl0GM1x02THCaYwz+ujOthlDtI3Wt9D6FrleQ+u1iBbiIqjqOMihtvgO91u0crTgLxpUvE4LgpqooANazmTOEPGnZ8RXztRk89awNYkpR47mZn/C/faSLccdurSXKhs4Sx4gce4RMIHjq+RDRqPFrDUBfmu1NWYu1mSJ02HmtNFqvq6OxHm1RpVXadQ890iVq3HpErd7ydImVyXrZ09pmExx3wARJk+CtnT+MRus0p4o/f4xK6zSnMDy3NMMq8gJ+T0+X6P1hLbDejM+izoTrNJ78KbGt0WnBVZxEt4sOh0IvNEKlo2CDjL5ljyC9/LZXM6ar8lCGn8kLf+IRuN0BDm3NpGoq60vuMnto9vcmZ5c1fieG2+s5A50P/nehh2b1qebB//9/ftfHWiGRfO3AYohC86HToPOJ4MZrYfO3oNTVot0QvRGRKsNVmpppVWns+HcHGAVdBuhJZ9ZPLe5ibnr6+tqq7lkweViq5ocH93uzrKJBRoHGyt3LZzZsn3v3V6uzK0a+3iGvIoWbaxo0ai0BqLXm4wqjui0elyKMy+fyTN8YS6H6Lbn6/LOvDPqjNZFq7/Q/cUvdn+BVJw40XXyJPZ1X2k32QL3gh1CRbPa/FEQBKcD7Ib71Zug5eIvZMSfvdhYk3Uv4wtsCfM5eb732aJBj1YKVAXiCXemK7tGJVjcDj7tTJXXJQIthaQG+z8M/0auIXGkSdNjHI8PpKUMm5QzevgXvyDx1TJMx0pvkA74AMIkPgEf1eju5+n4hNJc3KGJRpSBSUcqHEmlIuFUMVhdHQxVV2OX1aXXydPcBH7rhjS89US5aDLDyjilJqSi+AkZeyGlHKJYdGCFnzVzeURY5aIk5cAGxy0irBTpF1iLz+eKZnxjpm3MFMsCfRVRnkH2fO24PwAr4UTpqWLSXwYrjwLpQ1fjKDwF5+H3oIGiztgNRzSf1jyr4TVFf7BbQ9tKWKvRRDyHbVWRw8bKFp7wn9ERnc6SPOLcEDhiGULwWy5aGzOjZ0aRfC6Kr9BCOj16Jj26J12TTV/xIwtWSa0gidbEkcSiETNHeSCfW8aR2pDXJ0k+b2j2z7vGtl133baxXaTDWFYdiVSXGeeepNWXSPh8qVT8gUceeYCm/EhHKtUxkleeFGe9eHsCrX0R2ooJzmNEJkhRNpZwcQF0eo36Xl6vt1nV+g8KgyCKBn49ckM+c6blYk4m0EtnxDO5DAPGXl9fyFvzznBd3mrmtb35reVNN88+dpchFE/Zya8dSzOXXurqIl/ROx02jUwzjXj7BuK9Eo6ehMrS748bjLCyEoVJ0aDTw8qkh94jtGzBaQU8lEFdgkUWJY/hk1cED68IHo5i1caerxX9WOE7DAYDVOsPW6ricTEWCx2pGNJ/0DTIcJPLkEw+Q1FzNpcRLy5CCaEMYuadYWc4UVtXu4wrLOPrFExok8t4SsoPe8tr/ZZUzEMCs/eQssqC31UeslsDCZcvHfZoygWpqkEaGyVnpOamBr+lorLC0qU2qCu6i41+V0VFlcef8BrNDrumSedzi8PymixBXvgarkkO3ni8mmIjeaL04mPy8zkKY5JSLFse+kKAVTF8HqdLE8bVYJkAbUpXTJHT9HlcwE/K6DrhizLlhZOyEh3E7KF8o6ZswiSiWjRROsBilUjb0VuEclM5zYiHQyH+cLzW7dbpMvmI7oN6vS+bhSMVG97rmnRxLpf9iI+Sfy4zSm9I9hcbifh0LoPL/MrFfOZiLs1kPLmSB9LpQo7J1Gi0jtJ6XW0iGtFok/XIDkHkAI1WFrXRiCx2f7Kmvay6OewMuDJJT0tFutkhOQdra7qqXPlUtstf2NDsrqkIa0Wxq7mljrJFu86dCuXTXlOLJeypXBKt6bCZ17anOnNlWoOBXy64gOrhGCLieeYFO+GGYtt3LOTHasJ/RU24B9XkZQd50nHawT3qIGqHxfEBUDsA1BaT8169VnCDSwuOD+pNJuPgjOU5C/eQhVjUlGtGR6keuZjL4UKIr7yQw9zdYvru958io/jbghcuyShSGWMiKuvDBNkoH7MuWbEu3dfT0zf7a+L0F2qrbN/7aeqa9+5Kz97S8alPkV2BrlV9SZl22hjt7IIkzBSNHsrFxhSlBw1Fu6joawt7Mv2sVurVSr2a0s1cvZ49f/+YjrHTedqOU9iOlosxbBiJuA7z5VG41y+ZTKKf+FP+IwDW6Ael9Waz9YiwgRFBy0VqeyDco0gB4sUco4ErBKB9MWJl5CMd4HqEnVEz/7W7bvUVBps8mQoJ0dmeT9WHLe7G7b0aLVovpOJVwqtUZL/6+pHyLsSl3qBCXNpCKVekLmavXNXTneoyV+WqEbf1uEbf5t4DPqiCH5yEGDKAHSHxeZCTvJTgvSmE0EV5irKEU1kiyikUdFbGplb6NChPHXsyZhQVbsXnU5TDRPreqOgZqq5UdO0SOCJPB0sftms09owhfFikdkHQf8RgNqsTRzwbNEco2cgaBMkGNcgortxfCyqFbaiEciO9zHEKXcpEAXlH45hTHMhM9TUjU/3aug0d1UZPo1TbU+lwVXfnrr7qe1Kdnxj81bFgymcovL3x3s050kWcmRX1BrNU1xWPLF8SP/R1o1FvNyQ760LeRMa5tCjTXAvenmG8Ei/azIcBNOrDOlFj0ak/qF0PKGiprqAkf1E2QPMUo3VhJ871k+rypq7I7E/IdLCrpVqz/NP3TZZ3d0b3fuSRAdo3j94jxdUE+NEqWEKkx5s8uG4NCrE2KOZAni4oI/MMtd0yKVz1VBYbpDxIwqkUIidKRVw0a2W2gywi/fRrZBCvQupO2qtewbNOLhfziFCLpKc3zBkZQzVQ0asTGFt5kAA09L3Go6M5QTaBmXSmNnGxEmsM5abEYWj01UPlYbcbltYfNpnKDgvNvsZGW9hQXs7XHLENhY/wGxRsW/OoWa3U4qSSkmL8IlY0iviq8R0wv+DH7KxqjhrJCaqy5mWm+jIFJJHc5g0KF1qw5NvbdzatrLI3pQZ92c50bnmloz569ex30JAIh6oC5v7uVOV5ozdVFkj6DEs6ElWfXb01VNMcqOv3ZrdHllWXBTON/rpV7ppxMRpE5RezNS4VXW3EYgr77TZ/WCxfLrqY3cshPmfJtxCfLiiHRynvMdaKUSVErTSJGnGSaGbsx7hsAfe9VkzhQls97EaxkbVRbCBOjSLyl9GjN8BKoyhLqxcVaXW+GMQutYHDkE4etqhUlgqf+4hWr+cjRxxDqiP84CIOe5oyFxJq7h2NM20yV1/QKCtMF9elxYr62rrLy0m+dfxxfvc9Lk+TVNct89ZV1zwtFXzIWxmZt8j4ya+TruEbDKZQXUcisrwpcfirRoPepk92oV0Xr3YuRYaCUkm2p8lzXAKsyGFadm8HsWggYDWqoY8I5jXpdC1bVx2++zXyoAVX9kLR7ZINJZHaxR4qcxxUfdsVG8l2ovT2Y14msd5+zCdLMMYSVsVqps+ihX5nEtFCNlCECLSxWTawikUr85awZLeKOl7k96l0DpVKRxyiHm3JfRa9w2LRi6LqCCo/j8pNuAmH3c6Lel2riu+wUG8214IOX942t/Di2VFr49LM3R6mEcVTp+Zy5lPqU6fQa70CHeFkVEtVQz7Iu3mNRptPJMhH47+NrbNW1NQHrwrUZSqsf3DXe77vrnvwwbb7H3xoxYqHHry/DT3vzw9tfITJlvrSX8h3uT2oB8qhAW4trn1fjlyXIxPV5Dr8l7g1we2KvC/CHfTe5+Xuc5MDLvJROzloJ0fNaBreaebUZuLM7hXF2F5PU4V/XFQTdaPTP1FREarbb2gN7Yd2Rls22fZhwls2fWqyo4t+bqryrNSilOU2M3E0vHOBEkzO51Cgn7akUimLJVmeFKv7loTN3rA937n3e1x5KNRY6feW1wfWtXpzKY8rlvH5koKa4zUqbkil4TkxsazaVR7za829zZs2k8TLhNf7K6OhCq+hQ+9KBPwJj55wVA+h3D2NfCrBV0+CXzap/ZQCrOwp2+kuWiEyXp3TjMwWdyp0Rp9fpQ1TTmJR7E58fp++szAb38xMTkpoRLHbqdA8jpRFK14rurFXJOKIZ68Qtlrt+02dkhTYz3cpRgWa74rtPs+vo/OicBGjurWJyx5UfYGcjq6pKox2JMu7NtfFV8U9bU3lrdVef7Y9GShGfA57cs2tA2v29Vc43B2JaNumxuLmZUGLXZZhlG5OI92YoQw6iyYP0zx2xnFGxVHlKZO4MOPaC0HLuKgl2oB3v77Vul8tEwWjByQHed6EKeuklWlu4lpg95LT6d6rm5e1tCxrvro3Pfuk11fVlfWNbTF59aR+/b7eiIUbskRW7pv9Gu9fMtp6217EHtXJ1Lk7jfLAAPXFgFbL83qTWjcOyJscGIUJtVqnmiCtugnKiRfnrLM5+4IuZ96Kfg8LOYSdI2Rk9o+vvUZC3K6ub3a91IX9o6tCPsn6Txedglpj4Mi4RmM0gXZC10o0Eyrab27OSbx0JodOIjKx4hyiZesk0X2z39y3j7Rx8dkweoXnumi/RUWOuWCsWOCD/TzozLp9Au8QBN7FA7/P7kJBgja64LGbx9EhFTkRLe5Wu5nnRWur2CHocOR8S4ut0ZvJ5z0spqSAJRvbTK4IaSpSUGyg9IhW80lrFHUueq/kpzU3d0jdnUudo96m1s5of3/rLVXcrp6j3f7uwa256qGVLe7ZF7lds79p/3DLwnVWg4QyUaseB07kOE7Dt6onOLa2MqbP1mTjzjAOQk7PHunv6uJ2XXqJfi/h7Sf4vQ/+dBJ8slj2UbaysyczSDxYLvpoXMIjILe5BZTCKhMxGgkv+BmtvX3cghzDiG41DcY14FdLCakkxEiAvM9gdBgMRoOm3kfiPmLyge99ZpPDbDYB2DXjnCdAA3K0f86D2gBR2cURTl1mto97KZf6fAHs3Eu8Dr/Z12q04LRNJo2jw0BagQnxTH6PHLzL7UlTIZcb3YNEfXGBPEcPx5q/nJepfs8exfC35102hgY+yqNRyMT6X7aucli1fYTjeW5j9ybC8zzp4wWDRbeSFEjth2fPPlJ/212HWmd/SXyt99x9W/3Kz3zq/uWM9gssprAL9eXqYtYHxAQkoSOooHScDhF1m1nnMOvM41a7mjImQd60WVrVulZth1lWTAgUxRpl0Et3zztoNdmwQilINBST10aaC/VlvevKl+azwd6Bu/deWzdr43b17r72vT3kF5fuo7IigHL0RZSjdgjB/SchKBusQYop6l+XMdnnYXeXYs26ZOVLjRzqfjBTxzQX1zIpZpF2rkJLiSOKNTxrzdPWvr36sGMvFA1iN0ju/ZauwH5155zYSV8WOwt8r3lbUXbACg4UQvWyDApITWtzNf1N4XBTf01ubZO0rq2zC3+dbaR+4NY1SSoqB27tSyT6bh24dWrqVkyynOxhfsEelDk+2Fi0+qg14vOgRHd7lJkzUFikhhrO3r3qMqdTPw4G0SAZENd+3YTTCYYO635opdNXpNRm5OfMZSDsso0bRYcZdagbhaaTzf3XhYGC/8Ybu/tt6XS525c1dvT2cHvK8l3psWt/xW1TaVRkOeH+3Ny5H+dKaeZZxRbYWVyaop5ZlMZCOJrjdcY5IWQ0giDE90I6ZB0Hm2jjbBVGXpwIhWz+/Z5W27z8YSI1l1ug9615RQLJxgy1J6n0SaBBHlEmj4oqKc9fVvbky815SzwRF4eCy8Mat6prAJV+Sty95+futK4u1ljucsVqyL80bvB4lnb2RLvvLCdvUMh4bpufcL/T+zOJWLXfQHkC6ZDG2WrgxaKhkjpRlZT+korvk1R8npiiv2I0DID1UUWz+xWN7lM0vEPR5g5lO8BBtTZFqkMhYjsVHMvMzHa0wEqDRB0ijlqMLL7odPJ7E/nq6rK9YBJNnCk3LBCh3BsWMxnYX97lcnn3i53zSh49IlvjKFvKfOadQgeyAyzHjZLVPIugytsFSL9s5yDIO2XXiIYW/rOlzZPK+YKFtPeqEW9NRVjvc3Slq9rs4UpfoqXKe8NV4aaqiM7rWN2UzQbKQ269MZiqj68d0erN2k6jp6rKF/O7DKJU2Zxeu0FnNms6DAHZF07i7QzKHi3qAwvhxzVoFAucekLbSjXinD48e+ks3YeJojCJ1pEzX+r/EmrWSy9x8S7aRxZxdQr78MKKoskiUbvCItLFNSiRBYMSuzNQSWGnb2zjTr8wrvbZNa2m/UDNIyaPF7A6tTHrUGrN+YE0a+b+XFiVdfVbQ5VlZZUha78ru8okNa2rJR+bHc+0JEQx0ZIhH5i9rnZdkyTD58XbSzg3J1xfbLU5zYLVohOdZqMOqUktWE0giDpxn1VwWAWr1YmiF8xO8z4TOEwmcLpNJp3LKraaTa06ocM57wXQuVLP66yioc2n0FDwZJjoteBPlryoraOoovm8u5DnXS43ud0QjCSd0a7gcHgo99mRianhh7Mbo/6O7u5Qw4c6VzzaR2IXL86eW/2FdfLccTLkNRbrXlUsFwyC2rDPaHEYLUbLOBHU6n0q4lARFUEMGQ2tFoEQtaqVzrElj844nSRF3ct3p98vniIe8RLmBMyiqVSHPJx3UVe6kMdZOp9fuj2+KdCbrl4e2JjY1vzLHd/cvu4Tawc/0bfta1e/JsvGptKbZIa8hDZkFsaLrhSNW4SYA+uXDMhv1Mm1URmvR/PZxoK3Olipp6IyRglCFZt05KqrjVOBGu09EBEjnBCJWGDas7aqqmLa0qfwDvq1KC3lQMIitxaZpVCXUGxiFxOh1oUGs3vO10jW15dCNaJY5XVXRlxLK2uXV9oCW3KJ7oZItLA8VpPRedORdNGqt65ZouIPqTVaW8BVFSWf8VW3JWdfUZtNyEupQsRicDuTkt2o6RCMCP9yhP809zjYIAy3FSvKsoiUMur8l1HZ5KZFdwNTFVQ16qnq0HvkuCVTGiwuqVd2FAMoubxTQhTskyASQYxYbatc06a14eA08LgUeWqJMobYLAvjReLDvihglrQWrC5Z+ckLcL+lMZpZkfdLTf25wnrfgD1h7VxtDmbCgXoz+ZbOHisO1zdsbImIAne/+dJH1OrBwVhLlc9tYjRXg3B+F/EchvaT4EA0UnDMVDgGaE4QfFHrlAWNAw4iXq9rOrBWpzNOq/sWOjij8x5OYd6ZWeTNuGXM1aS6Rusi7Ql7uFAWK2bKfJm2lLQkaox2VzSMtsd/1bKpOaAzLjdq7ejrVLaUO7TGTpMh1DyCg6dwno8iPsw407GiDVGBUsWPzjySokJ5L1K5rlcUBF3/YhArwuZJa1SY8tIdMm8E+OlwsM8w7VhrEVdRPXixRY5cphdFVcg85dHp44ov9tXIRnN9IJwJmlcuDaX1A/51Dbn+Jslf25OJN5jJe0xuX1VLbO0Qqrkt5ktDiO+WjQ31w8WYTc94i8LyDK65B2F5ltpcchw3SFfdbKYQiXTn0KIEmRQHtqijFaLA+I4pPasSZtQqrbRUKcplGY+cEvllwXE58vei4sM+N7cJXozqKXGqjEZVNKyectB1ckTUd4XDYDAI05a1ZdPQp+xFWWX7Jv13orwk53I6w4xA59BOV81dyxZUS/jNV80eVw+uqlwmGiyra5pHmoOJZas/sSwfyEQcPHnp5lsC3b1moUuwxYvDtcs2NQefXtLpilV7lDjuq0gDflhPaZUpdqbHK+jGPw2xaalYMpm8AbdvUkWAIwJXZjZbp/WrfOSgW9UDK6i0ZH5fhnEb3eS47J5Txy9fdwUNUx/T+tlt24I1rbFYj2RxtUWc8TLx618n93ZW1KO0EQ3L0SD0V0XKO2dvnsPvacQvtak/XhSDFJ1BKjuC1DMqmzNFypQtDs9cBfOjLGa2VSzSbUSzLGOLVkrhRpHetezONhV1ihtPLWrHFIR9U3qKPL3kRvkamFav/bsWdVyxpOeisNpa2RahmCOnQw2rq6tWNYRCDauqqlc3hAY7mhrb2xubOl4rDBej0eJwobCxJRpt2VhYMzKyZvUIPaqJMnME4f4549G9J0Eq/Z4phZAShQkpWzO2OdeA0jELRFNCRo0Hq4wUZI5KWI5afzBliWo9k+AlgjfCTwf6vL16ZF0KV8vFd5SWcTkqYZUjUwVFZCICZRlKblm5NJI0KNw76M+voBw74B8sUAb+1dphjWr2JZPLV7U0Vkf51fBV7mrGvkxWoglFXiTPgRt2F1sdertbtBpsbtEMFoNNrdHp7XqbwXbArnfY9Xa7m4AFRLd4wAIOiwXcXovF4LHbekRLj0G/wk0p8X9qW2Dh1Kl5+4J6nqjBk9S+0FL7Yr8+EInbbKm4ZBgMb6l+ZPT940OfqBqRHFlKv7l81t482fiLBx/8tyW3L6Pzj5WGyBmcv0SEYpuX2roeqrfcVLe7RabMjFTE4M1Gi1ZaFCW6VUQPo4iUhEUJ6yz0hZFSZgXWaxvovh07rsKsQE3KSMvUVlDTrFqiWYuy4WuhMkiOr32/2IyY1tAoucdhcRxwehxOp0ejt+gP6DQOnU5jsehCTuKMSJKkI7qwx6LR6JAMep2OHr2uh/n21I9B40feuVsco1UeVxzVWfxzy5KK2kfo61C/Hu0jM0+JJq8Lm2sK7oZt0ka9P5J0iWXoBq+X1lRZk9VNcXuVsEGtSddc9/pEanTb9qrqjSNb6qbeuCbVlLDpVbINtYdLkDu4I+zMSPwkOEtPFUWLrdtp4Yv44HU2jREgkzuTI5kz6VfOpGuy9sj84RdNfkH+cw5JcjhDofswOTFxiaDbHQi43cG5J8Xvcry9gvh1oYdYrwE1HDBoHAZwGDR2ERx2BxwQ7Q7RDqLDofaIhkkwEcHkNohqR4/Z0mNaodasYK5hHh3Zxjn2ooL+23er0iJ8+241mpN3C3RZ1XRdC0pwCtkr75Rty9/6O9qbbdvsDS0t3oGBwnsqx9ITJcfSrp5QqLU5Zz1HnvtOdks+f/18nPK7zN4NwUTR5aGerIcaUQ4m/+weOarPHEBBUWHqua0AtRJ8YgZWmUAjmVpR1IZJYNwklU2glQwT5lbrfn37wgDiO2guu1PZhGLGVdjJzwWyo06Xa7ptyWgxPHlLdCBM1n890pT2eqpakst8AS7+eUfVirrtYxodN9Y16zcFsrF4TZnxbZ6wvRFlv4PT0J16LCuwchrUCxR2G8rKnzHYvYgth3Vcbxj3gp4Ieq/eqxLHTX733JkJt6Le3SxmS9lUpYJx3med0Le6jaoJC2GH7+h2fYtiSucRLnaYpzGD9rV4kQKMaqyO7mwWwnTzvo7X0q1769bVsWjMquZ54k2ufpjjNJag/0ef+3X2hok7u9svvfTrz3Hx9tz1u66qIucYHEo8EeFKXRHLWlnMlAs9AqcXiNoat3KC1WjdxwsOnheM4zo7rwR3bby1w9BhFFq5VqqLW5QAKM728lkDGt3NW9k5gyg9qFPoDWbzS8vX9ZbVNTRHuF2zsZ73Xru799J95Ld11+69ewDnVZxf72o2TyVuieUsKytxLizn2LyrlD1h6geLMK7V8eMqgZtQUzeYulTySjLlEqZesDVsJTe/1U/u5+LoB++6dB/2qcSPsM88G0PZk8ByYtEYBqguujXjPG/QjutN3LjBqOEmDB0CohHXIJdhYej541cX6cE169wVruod7d3UO3sVDciSptmncfz7cBnpuaQfcnugDNLwsZMQQsthG7KLLks5R0ftYp1HtheoYcg8Exp01WTpLnADsotKRLGrElASl6lBvc9d5nCXud0p27gVpx3ZCwIRhEq32j6RShlsHYH9htYy2R+Ww1wscrRZiXfkcrK+WrwLlr98mC/IudG0ikYiVInZ5zwD6pc2WmKxqKW2+cb3iqnypKV/Oe/QmsPoKj7gr4m7XOVN0Xp9RWxFR7Pbu75pbBvdKbr0qdeJs7G1I8yljch1iWqf7nccj+uv+Ky4/h2Mx6pKbzAfLgJ18NmiM0tXIUu3CiuoJquguQQVJzQAFKZixI6LYxeoCUlNNhM1rHT0kIS4SP6wQxQqZQeXPotB/K5qSuP3awpQNyXW1+XuAZ5P+ad9q1LThrVzAkj2NP6W8czcvPkTJsp5LnZgAlXS/O647PPd5esIb9/hzffVL1tTbXM27ezzRstcRp3G7EmG1m+y6P2ZeDgbtBiDuUSsxUY+6fLcekNmfVsy07erefXBq9qNKrWK57s5nlfzhuHfVKxcEvFXL40El1SVRd1073F56W30C3+BtpwfOeb2k5Clvj7q8axiemYVR5etoNEEKxPUnDWwivPFKkprlMI0lMLStqlUSpiqrvXDJISIEMqnzXf5/bx7OtrHT5etXbQNuXnhPuR87GzBVmO0cNn5ddqp0L7y7NXH9bU+XybqtEuV3rH12RZntNLlTJkH69f7fOvrY1314UggUR1uWt3C8Vpb0O0K2rRLA+VOr1nFkTtmf6nXkFMaPV28aMZszmcrGsJm5OddyHMnUL+qwVc08lr1JGhUB4nsVMji4qy8LxW17iKr/kKeU/wBf2mSPIffoRUIq6gd8LZyfOO1YoS6c1MaDREnBeOkzuueIqZJ8BjMboEcNK2wHdT0yL4XtRJwhBeokHhBERO4LOyoCpPnOGrcGqWbs/5YMGLVEGJLrp791WrSvEewS+6u9Maxa5fM7n3mwIFnSGdqeP2aEJNZii+KPNPNZJaWylGcaw18obiFBro5g0FjdVkPiAaHKBoMKCsOaAwOjcYQi5UHvcEDoZgjFIrFKjIVB8pjjvLyWAZck15vSKMR8+XloRxkMjGX14vNPdme8oqeUHCFZ4VoXaFRKwYcuzEjThZ5ijkse5u5/MJNMXyqPYvKBHUFoYoC2WTeGqlT9miwQK26ujwJGsv8Pv2AGI3FRGdlRdzcrw+Go5YeMRoO6vvNiYq0U6RyqF/vKysz9hCTM1+bc/oamwoux5K2rpCvqbHW8cJPHbWNS3yhrrYlDlehqcnrpIeevyfH7rpxHb+F/FIJ9xYNIRpCDklWxUVXzmDNuzqUbTTKoSsN3W42yOfe2PERU2JKEAJTYjU64AAuIriqTOG7IhHe7fZN29dWVpZP830LIs/yucXNowtOLl5mmwWhI3nPnto4Bdfc3gk9wahsomjXh9ckE131ktnlNSbye8aaN9isltWFtubm/LZN+VxDc1mPj5wymExSPmGTfDaVuS7b3mMTutT2hBSraIsEQjGzcf681RNIQ1boK9bEBNJjHbZOWPkGK0lbiVXghTuNVofRaOUnwW6cBB0RdGgV9Bh6jMIKbsVlq2DzFWYBxbVsEERl84A8sda/ZEm9c0Wfu76pqYw8N5sl2yKbxjbHMfuV5MjIQJDSOJsP93Euwf0acxr+KE6TnlIxOAM66CNgo6dUsJ1iP6ON5pTjsaU/kkcRDif0F21GtidkkO80BKqds89ouKXopSIQJq1WnWPS7ta5HCvgoLVHd1CQhVuLfL5sjm8paihONCx+WVjG1dZRK+PXvNaod/SvNFbmLSaThtgGyL3B9vbWssZ+oUuoiQZXrlsXRxjvlWnOj7ef4fxisL/Yu1G8TuTS4hKxV+TFkC90p0l0mESfe4ee9OtJrb5Dz0X1RC+BdKdJ7zCZ9CbePWV1JYCf0qniPrEH9D0hkyS5VSvYAeq84pv+NMd2THHqCxBB90rnt0rtNPBNeVCJMCubRhRN1fwtAuH7iFZn0Kyy16bK6xwrNQadhuvjea3JaXdZ+s0uu5OsH3l0dWHvvr112aM7dhzN1mG2sPr4ulBdQ0tFRUtDnQwvxQ/FhwEai+gQov8iqCZBTdRGfQ9/0CKEBE4QBLWmR72CUDKihgrSUMv8HhdyRhjNEOavIO+SRweeGsB/Z9Ap/sY3YF4enmbysH/RmFpIFB04pI6NKKgF/uDlcS7OEysdQDYXWefkKnLv7M30j1lp30p8BPseYGUl9orlLjZWE96+poxlJ/ykBlREkPdnDmp7VCsu789sHl28Q/O1f+j/B6ZuyL2d8liKr499b2JniXw49s/RFtKACZJ0pzckH2cJsb17ekSNel/GFLWFhBQlckEyK8dtleO3zE7i5k6dcuyoNY24TkGECJGANjkpwpTTx4tiecpftsqkmg74erT8dFJcaelV4m4syefy8y9fFC/lci/jwi00hQoOl9uq0bA/XEHVHq2j22VoC9UVnHSPDJnm+qWVlUu/UrlsWWVPor02GKxtT/QkOmimI/Ha6kGOrOAGX+cGV2P20tkHidS8oVDY0CyRn5hfvVxgPoEcz8E1GpFxrehpaq97dJOgmiQmQUa3UY+KWDjIqxEJZxkM4isyxl+gfz3CFLCivr6Iavd7A9/o73rmAEqhveQQ67teoSM3LCnGHCwi4qAnMh10Y1lrmNR7yaTLo5q2Wg3uHsMKoUeh3zk3RBbqdiUizY6o0DAFGop10425WNY+MKD1hiJiqi3jI89N11Vo1S/NZh/j1GqVNdFSfc+8P8LgyxY92kl0P4RJgwmlsFFH1GqCuDpIbRkKXsaaX+SRXHZI8lbZI2GwhWb/nRyazdK+522c1mLcPGkwaC2Ta7gt3Je5b3EqTjPJW/WTWpFuTveYOf1BtVZeyBwVNcpIL4wqg5G8dcGC4kw29+Ka/lPvqt7VdFRlXXFspOuq0lsMJiNiMwwDJ8EjH5p1Kvu87M8HwvQPq6YsbiK4Q5PBqEU1GYiEVsA9NptJe49vrWRipggbvUW20F+59MocXdITys45lZmkgY4F8QI1ipLjYsAoREzh8urPrjbEHWX5pHtDZ7QlTO5fvfqXvPrTHF9eXZX6z2O81hprSq3r1hn0VCLQeOlbKA+eQxs7BNvo6RpmKvgoh1FTwa3YDjQQQCMdNA5QDLNTvMivahq146e8YatxMiQJ9zgcFrinbK2FEs5F63y0Y0F0dKHZ7HLxV0Ay21S0h6u8voLduPSBAbEYSHXXh8a3ZjZUNpVXuySnnkFCPrYADDmG8ybqoJfAhz7v3fLqG1hIm+1+0d324kpK7GZ6ENlMDRxepKqSp2We+qnhKVfKP2WU1Fl1Uc2rDdpJCX3PZGza2qc5aDGEDJxgMAi6HmFFcBrk2K8i19mJsEu5V0ZziwPcarqNrkj5y4cWkwuOjJA+bybh41tXry7yvkTG48slPe5kzQZfJOKjyeDIrmk+RZ57ZunarMNd2Lx8+eaC+/V1w8PrBoeG5D0cxs+/QLjj9K8PJYRzFTuhKlJrL8VMPcraJlo2NdC/bDFqeM0BrdGh1Rp53hL3TnqSWm14CixEsCSwyndXPO7wrggedPRp5Uic4mpnFvnaiNuFxzRo0DuSSCo6OJGY275AAVGXmAvp54nD7DUEap3rDGXBoDkXDdQur1jSVzagTwfzy4r5tccJSY9V+Ar5jM3Wnkg2JR16Ybb++DmOr6iqisz5CdwRLkH9BKKBO0wA7qLIc5ZYvR3VOVSv4SCChlS6tpbKmps4P5nkPo7axvlVg55X6VXoWWRePktjnfTvQ+3zhijdJvpzQ5fQgjokEBGWCZ2cvzFvDUSjAWuehjmo8j99+tZvHDRtsTS/CTqebVH/4P/65o/o84efX/Oj2VOl9dwn+GVY1AEnf0Hv/LLSesy8URopjXCfUOoX/GcPyBssGkR/j8MBtKfqwYa8eBb24NUI1XAfHIZj0Im5XiwvQUurDdu0QB6vY/B+9JKqMW1CatBhfTWmEbyqUdIOY76IeQkKKJl6MBXwSkIWV0QCL97r4Qjq/b34rQAPoe5fjj2l8GrBtBzfLmf3crynWNqFY7dABwTBjr3FsM818BO8xzH/UbQZKnDm3XgdwLkU4ChCcx/Wp7H+RqBGwW6ErQ0+ja3ozu8TOFoV8qwJ++hAaCM4kxYc7TDm3oeQVcN+uA2+hCOXIaQPYH4YBrEHK1rDm3CEy5cf244o17By2RjUc1cXpqxymXDGyxHay1dIgZte9cpVYBDPXdWYOpQrhm9iOGrTfKpWsDCX6sGB46dwNn+dqq9IVeiv2bA9xdaVqR5XbpjhoaikEYbfy8mmzHQuBVCzys/UfCog3grYk/xsm09JXO25lEW43ilJiGkTQluPazaXPjv/9XI4hbh+H0zBN+FT8E+wg7WfS/Q7L9wE18IkYvMuuAXuxNJtDKsL6+oQf0ZwIocblMuJX1uwXIaJ5SkPszzNGbAmwda9BuGvxjGOIZxB5I84luiVRIqRr5vgbhzvdhzvFrgZx70FS+9U9zzO/iTeKdcdRlpNKZyxBuE9qlDvp5FiW5ACNzHsUqwYcBYVDOM2vCgNJTF5MaEwYvB3IP6KjIsCaCc8yzATYFj34xfLGUe2YjmNPdsYLuiq2/C9CaGkq+2hR+Sx70Zs1QTL8JufwAREge5B+0HNcLMd7zGFJofZWKl3xGbVPMX6kebnKLCIo8/RigepcbnSM31HeZzS09w3ASZn5D7mKHoAMvOjyvQ2wGhtbtQgzp1SeRWuTAwtJArV3PdBJQWUp0xrcYSYzkGnzIGuzArsaZCtsw6/TLD1p1/R0zFOxEIlUuEOeARlzD04Nr32oMw4jFcfu6hsoFhL4Nw24lWP/VRhTRHLOlxfncL3NmynYq0K+I5KyiqKO5wzpSuKby+W6jHRr2N4p7K2EeGpwhntwlmnUBJ244wpf5iwLEtPKlubsL0Pe1s+/z39ZgmWZCnjwO9rmHyvZ99SObIc+6ESJ8lgD7A1CuLcWli5h/W1C1OY9aWinhuOTmkuy6CxMYlJ31WxtjKeKM0mcT60L5q8WGtj6yNftK1NuYZZr9VsRqZFPUkI3fAimhph9F/F0txcKE3R+dK0UC5VI+Q6RrVykkfexdY0hvwWQphS2OtNCm50TOJRbFCe0qGWKCClyLihVGJC3LiQliknUtpIIte2sHWXaWU5wllUcNHCtNxyhg2qvXSlJ0vTpSdguHSidBuYSlQ3dSpQJpRvqNR/GDVzEd8tvjSlN0udpaHSvtK20r+UHsYv56/SsdLjJW3JW/KVtEov81fpjtL07M9m/3P2N7M/w/e++dVXrtJM6XhJU/Lg15pSd6l7gT5KlR4s3TX709nX8J3qr/o9OPv67KnZkiIV5q/Sp0t3zr4w+6uSu8SV1pea2dw7GZwypCkFUtr6ChhLJ0tfmH27ZCilS67S1tKGd4DljkWwXDn2x0rvmz09+0rJPPunUkep4or+UYuXvlV6FZ8n4TFMU8jHl/u+s3RXabA0jJjeCtfBHQpW5FVCXY9jH0RpvhXfXDErSrGlq0ptiJMevD6+YD67Sw+U3lO6H6nl4zjeFRi8EjN/tXKy7GiBphKVFjqk1ufZNfd7foGN9/yiOzv4/d+6X/nr+G+mw2hWrqTnOOXEoTHMfRQT/e/AvS0n1W5MvwfQqAC00wBCEc3WHQD64wAGEcB4HoBGUs0NfztZrgcQ8VvrwwA2tMhtX1ic6F8CsTSDCcdy4tyc6HS6TqPZvk9OHvRkvE8B+HAevs9cTv5NmF77+6kMUwD7C2I/Iexb2g8Qjv3PU6QM03/9/RTFtYpX/h+cHng3vZv+36fEynfTu+nddGVKpt5N76Z30/+xCe3PZPflhFWQEhekjyvpC0o6oaTvA5QbMZVhqvw7afpvpwrUmxX/DJB+DaDyvwCq0L6uQju0Cm3mjAcgizZmFu3o7C8w/Qag5jBAbj8mfJ9DOzjfjAllTH4TJpxbHudVexoTtq9DuOqeBKjHfuqPyqmAbRtEOTUKmN6WU1Pq3fRu+n+Qbno3vZveTe+md9P/DxMBUItkHQzCe0ALHIhs1wbUj2i/DDyQovnTD335Ia74j75w1ycnKkL0v91qvN9o6/qHie7QfeNyxbqPYsWHx+2hD413h45gqw/iy8P48l4sH8DnoTsqQvfc1R2axncH8d0d2HYK6yfx/T587sf6L098a+LZCb44EYp27cW6rxEC7QSKkcFr2q8evKp95+CO9rHB7e1bB7e1bxnc3D46uKl9ZHBj+/DgzAlstoJYduK/yZ1HdvLZMSKOZce2jh0dmxk7P6b58hYCoyQ7unX06Cg/1L5+cEP74ODA0VWD/Ud7B9ceXTHYd7RnsGukbbBzpHVw3QB295iLqMkJcrT3BP+r/t4ZoW9khkzPxAfovbh244xmegYGN44MHSPkg8MHP/ABaAv0zgQGhmY+ExjunenGTJFmbscMBI65oG04nYa5QyDjN43jv5vGL/9lKr4bl/8ODJSK9Nx/4BPk9zd5WKyXV1KZfGJAtZ/iiJVVqq34fBVuBw1sY6cNTBCA20gNKZBuspYMkC1kjNxCJsmHyIc5N+fn6rkCt4b7MPck9wz3A+5l3srfxR/iD/NH+c/yX+Rn+B/wZ1VbVNtVN6v+FDwYfD3kDAVCnaFVoQ2h4dBIaDT0/tDx0KnQj0MvhX4XeiM0KzklnxSUIlJCykpNUoe0W5qQ7pH+WfoX6bh0MmwPu8KRcCJcHd4c4SKaiCViizgjvkgwko50R7ZGdsYhzsWNcTHuiHviZfFYvDJeG2+OXx+fjn8k/sPzpd9d+j33pvXtwF+40qVSia2GwGCU4DMkRxpID+kn68hWso3sI7eTD5OPcB6uDGFsYDA+jTC+iDDeyU8jjB/kP8Q/xH+JP8b/UAWqbaobVYeCtwf/EIKQJySFukN9CoxbQreHngg9Hfpp6OXQH0JvSXbJI5VJEoOxkcF4k3T7O8A4oMBoRRi98zDu+Bsw9iGMH1JghDc1b+v/QhiMpPSn0pulC6X/KL1U+kXp5dIrACX0Bko/R9iHZ5+HoVIrrCslYACssw8CzP4DvvsIvluCF7CzllBCj2D2sdmvzD48e/TVX75664WfXfi3Cy9c+PGFf73w3IVnL5y9cObCjy788MIPLjxz4ekLpy58d25T4XzxfBPAv1ecL53/r/NvnXvi1XOvvnghdv6GV286t+78vvMDAOc+fu6+cx/A573nps8dPDdxbvRc17n2c7889x/nXjz3yrlnz/3w3Nlz3z335LnHz30ZW02du/Wlc9FzjgsAxmndw0i7//FXp17o77kF6crfaSX9hJUu3195x32Rv/X7GnwTvgNPs/zTf6fdvyjPb/63en1gQf6HC+43wATsglvgVqTOAaTPQbKebCBDcC3jx21kO9kBN5Od/E/5F/nv8N/nf8g/xz+NvPcj/jR/hj/L/4R/ln+e/1f+x/wLMA438feinH4vbIfdsAd2wtVwDdwI18M+MkXuINPkHnKI3EsOkw+QO8lBche5m/wj+bSaqP6oekutU4PqTbWgKqleV2tUl1R/UKtV/6X6vZpX/Vn1OzWn+pPqDbVWNav6H2qV6i9qi9qselt1jnyJ/DP5J/IoaDj2/7gh8NdnlYBTchz8/Z/8JQ8qUKOU0iL/6kAPBjAiH5vp3ySDFWxgBwc4wQVu8IAXfOBH6UbPcYSQ08MQgSjEIA4JdqaiHCogzc4QVKPeykIN5ID+3zLq2PmXBrb/vgSaYSksgxYoQiu0QTt0QCd0wXLoBvoXMr2wElbBalgDfbAW+pGbqDZcDxtgCDXhRhiBTTAKm2ELbIUxoOc9PgMPwsPwz3AMvgpPwtfhG/AtpJKnkKpOwXfhe0hV34dn4AdIAafhLJyBZ+FfkZ5fQFr9Kfwb4uxeeD/cBlOIuQ8hNd4Dd8JeOAJ3kM/DZ+Ex8hAcJo+QL9D/iDq5H/H3AH+CPAwH4T7yKfg2/Bjuh/1wN3kQdpDPkU/CXfAxuAreB5+ET8EMozakEkYdlE6eJ1+EnyPtvQd1AqUSislr4MNIPzvhOvhH+BzS7efhIfgCfBG+BI8gzSOvwqPwODwBx4kRroWb4ZBMp/ARspPsIFsoBskb5CjiEFCu0jPEh+UneRlX/89Ya1DreA3Hc6rzwJX6QBqZI4CO1lWt9O8hS5e4x0sjUMMvgy9JuKLrkTI4gf0flSTg/28AsVJOCmVuZHN0cmVhbQplbmRvYmoKMTAgMCBvYmoKPDwvQmFzZUZvbnQvS1NJTVVCK1VidW50dU1vbm8tUmVndWxhci9EZXNjZW5kYW50Rm9udHNbMTggMCBSXS9FbmNvZGluZy9JZGVudGl0eS1IL1N1YnR5cGUvVHlwZTAvVG9Vbmljb2RlIDE5IDAgUi9UeXBlL0ZvbnQ+PgplbmRvYmoKMiAwIG9iago8PC9Db3VudCAxL0tpZHNbNiAwIFJdL1R5cGUvUGFnZXM+PgplbmRvYmoKMTEgMCBvYmoKPDwvTGVuZ3RoIDI5ODMvU3VidHlwZS9YTUwvVHlwZS9NZXRhZGF0YT4+c3RyZWFtCjw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMS4wLWpjMDAzIj4KICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyIKICAgICAgICB4bWxuczpwZGZhaWQ9Imh0dHA6Ly93d3cuYWlpbS5vcmcvcGRmYS9ucy9pZC8iCiAgICAgIGRjOmZvcm1hdD0iYXBwbGljYXRpb24vcGRmIgogICAgICB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0xMC0wMlQxNTo0ODoyMCswMzowMCIKICAgICAgeG1wOk1vZGlmeURhdGU9IjIwMjUtMTAtMDJUMTU6NDg6MjArMDM6MDAiCiAgICAgIHBkZjpQcm9kdWNlcj0iaVRleHTCriBDb3JlIDguMC4xIChBR1BMIHZlcnNpb24pIMKpMjAwMC0yMDIzIEFwcnlzZSBHcm91cCBOViIKICAgICAgcGRmYWlkOnBhcnQ9IjEiCiAgICAgIHBkZmFpZDpjb25mb3JtYW5jZT0iQSI+CiAgICAgIDxkYzp0aXRsZT4KICAgICAgICA8cmRmOkFsdD4KICAgICAgICAgIDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+0KHQvtCz0LvQsNGB0LjQtSDQvdCwINC/0L7Qu9GD0YfQtdC90LjQtSDQuNC90YTQvtGA0LzQsNGG0LjQuCDQviDRgdGH0LXRgtCw0YUg0LrQu9C40LXQvdGC0LA8L3JkZjpsaT4KICAgICAgICA8L3JkZjpBbHQ+CiAgICAgIDwvZGM6dGl0bGU+CiAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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MDAxODYwMyAwMDAwMCBuIAowMDAwMDAxODY1IDAwMDAwIG4gCjAwMDAwMjE2NjIgMDAwMDAgbiAKMDAwMDAyMTY5OCAwMDAwMCBuIAowMDAwMDAzMzQwIDAwMDAwIG4gCjAwMDAwMDM1ODggMDAwMDAgbiAKMDAwMDAyNDM4NyAwMDAwMCBuIAowMDAwMDI0NDY3IDAwMDAwIG4gCjAwMDAwMjUwOTEgMDAwMDAgbiAKdHJhaWxlcgo8PC9JRCBbPGY0YjM0ZTM5ZWY5MjRjY2UzYTg3ZjI2OGMxZjgxMjM2YmJmNjk0M2FjM2FlNTJmZDZiZjcxNGE4ZmI3YmU1MTg5MjcyNTRlNTZjYjc4MGFhNzkwMTk2MjEzODU4YWRmNThmZDljZmM3M2FmNWMwMjgyYWI1MmFlMzFhMzRkMzIzPjxmNGIzNGUzOWVmOTI0Y2NlM2E4N2YyNjhjMWY4MTIzNmJiZjY5NDNhYzNhZTUyZmQ2YmY3MTRhOGZiN2JlNTE4OTI3MjU0ZTU2Y2I3ODBhYTc5MDE5NjIxMzg1OGFkZjU4ZmQ5Y2ZjNzNhZjVjMDI4MmFiNTJhZTMxYTM0ZDMyMz5dL0luZm8gMyAwIFIvUm9vdCAxIDAgUi9TaXplIDIwPj4KJWlUZXh0LUNvcmUtOC4wLjEKc3RhcnR4cmVmCjI1ODY3CiUlRU9GCg=="}}
  // return response.json();
  return response
}

async function createExternalRepresentationSpecialPartlistAccounts(config, requestBody){
    await paf.appendToDefinedFile("logs.txt","EXTERNAL REPRESENTATION SPECIAL PART","")
    let token = await paf.createDboClientToken(config)
    let access_token = token.access_token

    let requestBodyName = "PUTpaymentConsentsCreateExternalRepresentationSpecialPartlistAccounts"
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody = {
        "Auth":{
            "CryptoType":1,
        },
        "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64

    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "PUTpaymentConsentsExternalRepresentationSpecialPartlistAccounts"
    let signature = await generateSignaturePUTcreateExternalRepresentationSpecialPartlistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,["NoIdempotencyKey"])
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))

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
    let response = {"data":{"externalRepresentationSpecialPart":"JVBERi0xLjcKJeLjz9MKNyAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDY2MT4+c3RyZWFtCnicxVZLbtwwDN37FD5BR/8PMJhFJinQRRZFfQGNP4ssivb+m1LSk61BMKqbSdKFQIqSaPHxUebhx6/wsz8eD8/nb489O536h8dz97t7GLrDV95z1g9LJ9wXqXvHeBTD1B2ZmAQTC2ditiRJny8kVZKMSSbGifQ522dHa4yGJl0yxqfT8EJOaGNUnobue/f0fO4OV3fhrbtYv92l7UY03bgqpPGSw7m6bgzLIowpXT/ZY+iLzKHOOVTJoi3kEKM9wrEYmkc5Zb9xb4GBRSgUDfrWPMIX6ZNP8BJM2GNokBRRahqBBsEsLEkaQuV52uewLmGLusd3FHzQEBrnPWwuy+RrhF+d9fU7Hr40zkTd7UmlbObA1jmwG8YFx0KpWSfMM45LtFT2GWsSeHP4mNbz+7DWwE4DT4b5CF1nrKSFv5DPJtw1dJvtbMZZA3vU5R68VBMvU1EfMW1YVDElDhqUKAcfwd2IWeK53Pi+8pZjPgPPMc0zdgH5Efns6pennJR8JDmpnM+R5MT3lr1uxq7fo15vxLDy7eb9wRFXcYK4pVBTyiHXpuJGAG+IE6rUoYVtxBkaSsNG+5Xd7Ov+UPmP51Sc78HTNPFU99bevVjeU2+lrmzOw9vrzTYxknt/Na7pRvzL31MBVrbSeGf5+OYd+N5QeLMTsFedQCl/sz0ZiCXSJdOgUGgrxbwequcI8S4fQY/xHnrwZitiqlbk1fvbaoPe9D5f0r+OsfEj3+pdoDQbK/OfG6sU0ApgDab8OyPTXTzmzYrMLE2NkkejFDbGpSbN5ZEaOIemKaDRKk0U9qUzGky+QJZzhdGXzb9AdaRmrPj08OOxz+9KZrNDM5/Uob2qnltJvGLwOybyc56bNQd/ANCEEzEKZW5kc3RyZWFtCmVuZG9iago2IDAgb2JqCjw8L0NvbnRlbnRzIDcgMCBSL01lZGlhQm94WzAgMCA1OTUgODQyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEwIDAgUj4+Pj4vU3RydWN0UGFyZW50cyAwL1RhYnMvUy9UcmltQm94WzAgMCA1OTUgODQyXS9UeXBlL1BhZ2U+PgplbmRvYmoKMTIgMCBvYmoKWzkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSIDkgMCBSXQplbmRvYmoKOSAwIG9iago8PC9LWzAgMSAyIDMgNCA1IDYgNyA4IDkgMTAgMTEgMTIgMTNdL1AgOCAwIFIvUGcgNiAwIFIvUy9TcGFuL1R5cGUvU3RydWN0RWxlbT4+CmVuZG9iago4IDAgb2JqCjw8L0E8PC9CQm94WzI4LjM1IDY2NS42NSA1NjYuNjUgODEzLjY1XS9PL0xheW91dC9TcGFjZUFmdGVyIDQvU3BhY2VCZWZvcmUgND4+L0sgOSAwIFIvUCA1IDAgUi9TL1AvVHlwZS9TdHJ1Y3RFbGVtPj4KZW5kb2JqCjUgMCBvYmoKPDwvSyA4IDAgUi9QIDQgMCBSL1MvRG9jdW1lbnQvVHlwZS9TdHJ1Y3RFbGVtPj4KZW5kb2JqCjQgMCBvYmoKPDwvS1s1IDAgUl0vUGFyZW50VHJlZSAxMyAwIFIvUGFyZW50VHJlZU5leHRLZXkgMS9Sb2xlTWFwPDw+Pi9UeXBlL1N0cnVjdFRyZWVSb290Pj4KZW5kb2JqCjEgMCBvYmoKPDwvTGFuZyhydS1ydSkvTWFya0luZm88PC9NYXJrZWQgdHJ1ZT4+L01ldGFkYXRhIDExIDAgUi9PdXRwdXRJbnRlbnRzWzw8L0Rlc3RPdXRwdXRQcm9maWxlIDE0IDAgUi9JbmZvKHNSR0IgSUVDNjE5NjYtMi4xKS9PdXRwdXRDb25kaXRpb24oKS9PdXRwdXRDb25kaXRpb25JZGVudGlmaWVyKEN1c3RvbSkvUy9HVFNfUERGQTEvVHlwZS9PdXRwdXRJbnRlbnQ+Pl0vUGFnZXMgMiAwIFIvU3RydWN0VHJlZVJvb3QgNCAwIFIvVHlwZS9DYXRhbG9nPj4KZW5kb2JqCjMgMCBvYmoKPDwvQ3JlYXRpb25EYXRlKEQ6MjAyNTA0MjYxNDI4MDIrMDMnMDAnKS9Nb2REYXRlKEQ6MjAyNTA0MjYxNDI4MDIrMDMnMDAnKS9Qcm9kdWNlcihpVGV4dK4gQ29yZSA4LjAuMSBcKEFHUEwgdmVyc2lvblwpIKkyMDAwLTIwMjMgQXBy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YW0KPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4xLjAtamMwMDMiPgogIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgeG1sbnM6cGRmPSJodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvIgogICAgICAgIHhtbG5zOnBkZmFpZD0iaHR0cDovL3d3dy5haWltLm9yZy9wZGZhL25zL2lkLyIKICAgICAgZGM6Zm9ybWF0PSJhcHBsaWNhdGlvbi9wZGYiCiAgICAgIHhtcDpDcmVhdGVEYXRlPSIyMDI1LTA0LTI2VDE0OjI4OjAyKzAzOjAwIgogICAgICB4bXA6TW9kaWZ5RGF0ZT0iMjAyNS0wNC0yNlQxNDoyODowMiswMzowMCIKICAgICAgcGRmOlByb2R1Y2VyPSJpVGV4dMKuIENvcmUgOC4wLjEgKEFHUEwgdmVyc2lvbikgwqkyMDAwLTIwMjMgQXByeXNlIEdyb3VwIE5WIgogICAgICBwZGZhaWQ6cGFydD0iMSIKICAgICAgcGRmYWlkOmNvbmZvcm1hbmNlPSJBIj4KICAgICAgPGRjOnRpdGxlPgogICAgICAgIDxyZGY6QWx0PgogICAgICAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7QodC+0LPQu9Cw0YHQuNC1INC90LAg0L/QvtC70YPRh9C10L3QuNC1INC40L3RhNC+0YDQvNCw0YbQuNC4INC+INGB0YfQtdGC0LDRhSDQutC70LjQtdC90YLQsDwvcmRmOmxpPgogICAgICAgIDwvcmRmOkFsdD4KICAgICAgPC9kYzp0aXRsZT4KICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PgplbmRzdHJlYW0KZW5kb2JqCjEzIDAgb2JqCjw8L051bXNbMCAxMiAwIFJdPj4KZW5kb2JqCjE0IDAgb2JqCjw8L0FsdGVybmF0ZS9EZXZpY2VSR0IvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCAyNTk2L04gMz4+c3RyZWFtCnicnZZ3VFPZFofPvTe9UJIQipTQa2hSAkgNvUiRLioxCRBKwJAAIjZEVHBEUZGmCDIo4ICjQ5GxIoqFAVGx6wQZRNRxcBQblklkrRnfvHnvzZvfH/d+a5+9z91n733WugCQ/IMFwkxYCYAMoVgU4efFiI2LZ2AHAQzwAANsAOBws7NCFvhGApkCfNiMbJkT+Be9ug4g+fsq0z+MwQD/n5S5WSIxAFCYjOfy+NlcGRfJOD1XnCW3T8mYtjRNzjBKziJZgjJWk3PyLFt89pllDznzMoQ8GctzzuJl8OTcJ+ONORK+jJFgGRfnCPi5Mr4mY4N0SYZAxm/ksRl8TjYAKJLcLuZzU2RsLWOSKDKCLeN5AOBIyV/w0i9YzM8Tyw/FzsxaLhIkp4gZJlxTho2TE4vhz89N54vFzDAON40j4jHYmRlZHOFyAGbP/FkUeW0ZsiI72Dg5ODBtLW2+KNR/Xfybkvd2ll6Ef+4ZRB/4w/ZXfpkNALCmZbXZ+odtaRUAXesBULv9h81gLwCKsr51Dn1xHrp8XlLE4ixnK6vc3FxLAZ9rKS/o7/qfDn9DX3zPUr7d7+VhePOTOJJ0MUNeN25meqZExMjO4nD5DOafh/gfB/51HhYR/CS+iC+URUTLpkwgTJa1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MCBuIAowMDAwMDAxMDAyIDAwMDAwIG4gCjAwMDAwMTUwNTMgMDAwMDAgbiAKMDAwMDAxNTI0NSAwMDAwMCBuIAowMDAwMDAwOTAwIDAwMDAwIG4gCjAwMDAwMTgzMDQgMDAwMDAgbiAKMDAwMDAxODM0MCAwMDAwMCBuIAowMDAwMDAyMDc4IDAwMDAwIG4gCjAwMDAwMDIzMjYgMDAwMDAgbiAKMDAwMDAyMTAyOSAwMDAwMCBuIAowMDAwMDIxMTA5IDAwMDAwIG4gCjAwMDAwMjE2NDkgMDAwMDAgbiAKdHJhaWxlcgo8PC9JRCBbPDliYzYxZGQyN2RhZmM1YzRmMDIyNjhlZWE2YzU1ZGM5ZTNmYmQwZmU1ZWEwYTAzOGNiYmU5ZWQ3MGI0ZjJkY2IwZGJjNDJlZmZmYzczMjM2ZDY0NWQ2NTNjMTc1YTc3MWQ3NTQwZWM5MDE4NTc0MDJiOGNkNjQxY2IyMGU5ZmUxPjw5YmM2MWRkMjdkYWZjNWM0ZjAyMjY4ZWVhNmM1NWRjOWUzZmJkMGZlNWVhMGEwMzhjYmJlOWVkNzBiNGYyZGNiMGRiYzQyZWZmZmM3MzIzNmQ2NDVkNjUzYzE3NWE3NzFkNzU0MGVjOTAxODU3NDAyYjhjZDY0MWNiMjBlOWZlMT5dL0luZm8gMyAwIFIvUm9vdCAxIDAgUi9TaXplIDIwPj4KJWlUZXh0LUNvcmUtOC4wLjEKc3RhcnR4cmVmCjIyMzE1CiUlRU9GCg=="}}
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  // return response.json();
    return response
}

async function generatePaymentConsentlistAccountsAuthoriseBody(config,accList,createPaymentConsentslistAccountsResponse){
    delete accList.data.account
    delete accList.data.initiation.enclosedFile
    delete accList.data.initiation.listPassportData
    // accList.data.statusUpdateDateTime = accList.data.statusUpdateDateTime.split('+')[0]
    // accList.data.creationDateTime = accList.data.creationDateTime.split('+')[0]
    let sortedAccList = paf.sortObjectAlphabeticallyNew(accList)
    let requestBody = sortedAccList
    setRequestBody("listAccounts","PUTpaymentConsentsCreateExternalRepresentationlistAccounts",requestBody)
    let latestAuthType = authType;
    authType = "OBclientCredentials"
    let externalRepresentation = await createExternalRepresentationlistAccounts(config, requestBody)
    authType = latestAuthType
    requestBody.data.externalRepresentation = externalRepresentation.data.externalRepresentation
    requestBody = paf.sortObjectAlphabeticallyNew(requestBody)

    latestAuthType = authType;
    authType = "OBclientCredentials"
    let specPart = await generateSpecPartlistAccounts(config, requestBody)
    authType = latestAuthType
    requestBody.specialPart = specPart.specialPart
    requestBody = paf.renameKeyInObject(requestBody,"paymentConsentId","listAccountsConsentId")
    requestBody = paf.sortObjectAlphabeticallyNew(requestBody)

    return requestBody
}

async function patchPaymentConsentlistAccounts(config,access_token,accList,createPaymentConsentslistAccountsResponse){
    let requestBodyName = "PATCHpaymentConsents/listAccounts1"
    let requestBody = await generatePaymentConsentlistAccountsAuthoriseBody(config,accList,createPaymentConsentslistAccountsResponse)
    setRequestBody("listAccounts",requestBodyName,requestBody)
    let savedBody = paf.getRequestBody("listAccounts",requestBodyName)
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "PATCHpaymentConsentslistAccounts"
    let signature = await generateSignaturePATCHpaymentConsentslistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts", {
    // const response = await fetch("http://192.168.166.214:9100/openbanking/paymentConsents/domestic",{
    method: "PATCH",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName)))
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: PATCH \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  return response.json();
}

async function getPaymentConsentslistAccounts(config,access_token,listAccountsConsentId){
    let requestBodyName = "GETpaymentConsents/listAccounts"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
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
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentConsentslistAccounts"
    let signature = await generateSignatureGETpaymentConsentslistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts/" + listAccountsConsentId, {
    // const response = await fetch("http://192.168.166.214:9100/openbanking/paymentConsents/domestic",{
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: GET \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  return response.json();
}

async function getPaymentConsentslistAccountsDBO(config,access_token,listAccountsConsentId){
    let latestAuthType = authType
    let requestBodyName = "GETpaymentConsents/listAccountsDBO"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    authType = "OBclientCredentials"
    paf.setAuthType("OBclientCredentials")
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentConsentslistAccountsDBO"
    let signature = await generateSignatureGETpaymentConsentslistAccountsDBO(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts/" + listAccountsConsentId +"/PSUorPAU/V087_TEST1", {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: GET \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  authType = latestAuthType
  paf.setAuthType(latestAuthType)
  return response.json();
}

async function getPaymentslistAccountsDBO(config,access_token,listAccountsId){
    let latestAuthType = authType
    let requestBodyName = "GETpayments/listAccountsDBO"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    authType = "OBclientCredentials"
    paf.setAuthType("OBclientCredentials")
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentslistAccountsDBO"
    let signature = await generateSignatureGETpaymentslistAccountsDBO(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/listAccounts/" + listAccountsId +"/PSUorPAU/V087_TEST1", {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: GET \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  authType = latestAuthType
  paf.setAuthType(latestAuthType)
  return response.json();
}

async function deletePaymentslistAccountsDBO(config,access_token,listAccountsId){
    let latestAuthType = authType
    let requestBodyName = "DELETEpayments/listAccountsDBO"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    authType = "OBclientCredentials"
    paf.setAuthType("OBclientCredentials")
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "DELETEpaymentslistAccountsDBO"
    let signature = await generateSignatureDELETEpaymentslistAccountsDBO(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/listAccounts/" + listAccountsId +"/PSUorPAU/V087_TEST1", {
    method: "DELETE",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: GET \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  authType = latestAuthType
  paf.setAuthType(latestAuthType)
  return response.json();
}

async function getPaymentslistAccounts(config,access_token,listAccountsId){
    let requestBodyName = "GETpayments/listAccounts"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "GETpaymentslistAccounts"
    let signature = await generateSignatureGETpaymentslistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/listAccounts/" + listAccountsId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: GET \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  return response.json();
}

async function deletePaymentslistAccounts(config,access_token,listAccountsId){
    let requestBodyName = "DELETEpayments/listAccounts"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    // let requestBody = getRequestBody("pispAuth",requestBodyName)
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "DELETEpaymentslistAccounts"
    let signature = await generateSignatureDELETEpaymentslistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/payments/listAccounts/" + listAccountsId, {
    method: "DELETE",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: GET \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  return response.json();
}

async function deletePaymentConsentslistAccounts(config,access_token,listAccountsConsentId){
    let requestBodyName = "DELETEpaymentConsentslistAccounts"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "DELETEpaymentConsentslistAccounts"
    let signature = await generateSignatureDELETEpaymentConsentslistAccounts(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts/" + listAccountsConsentId, {
    method: "DELETE",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: DELETE \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  // return response.json();
}

async function deletePaymentConsentslistAccountsDBO(config,access_token,listAccountsConsentId){
    let prevAuthType = authType
    authType = "OBclientCredentials"
    setAuthType("OBclientCredentials")
    let requestBodyName = "DELETEpaymentConsentslistAccountsDBO"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("listAccounts",requestBodyName))
    await paf.appendToDefinedFile("logs.txt","requestBody",JSON.stringify(requestBody))
    let cryptoHashBody
    if(requestBody!= ""){
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": paf.convertToBase64(JSON.stringify(requestBody))
        }
    } else {
        cryptoHashBody = {
            "Auth":{
                "CryptoType":1,
            },
            "DataB64": ""
        }
    }
    await paf.appendToDefinedFile("logs.txt","cryptoHashBody",JSON.stringify(cryptoHashBody))
    let hmac = await paf.scCryptoHash(config,cryptoHashBody)
    hmac = hmac.ResultB64
    await paf.appendToDefinedFile("logs.txt","content-digest",hmac.toString())
    let fapiInteractionId = uuid.v4()
    let idempotencyKey = uuid.v4()
    let method = "DELETEpaymentConsentslistAccountsDBO"
    let signature = await generateSignatureDELETEpaymentConsentslistAccountsDBO(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName,listAccountsConsentId)
    await paf.appendToDefinedFile("logs.txt","signature",JSON.stringify(signature))
    console.log(JSON.stringify(signature))
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
    await paf.appendToDefinedFile("logs.txt","headersList",JSON.stringify(headersList))
    console.log(JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts/" + listAccountsConsentId + "/PSUorPAU/V087_TEST1", {
    method: "DELETE",
    mode: "cors",
    headers: headersList,
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: DELETE \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("listAccounts",requestBodyName)))
  authType = prevAuthType
  setAuthType(prevAuthType)
  // return response.json();
}

async function modifyPATCHpaymentConsentlistAccountsBody(endToEndIdentification,instructionIdentification){
    let body = await paf.getRequestBody("tpeAuth","PATCHpaymentInstant/invoice1")
    body.data.modification.paymentEndToEndIdentification = endToEndIdentification
    body.data.modification.paymentInstructionIdentification = instructionIdentification
    await paf.appendToDefinedFile("logs.txt","patchInstantInvoice_modifiedBody",JSON.stringify(body))
    await paf.setRequestBody("tpeAuth","PATCHpaymentInstant/invoice1",body)
}

async function modifyPostPaymentslistAccountsBody(listAccountsConsentId,initiation){
    let body = await paf.getRequestBody("listAccounts","POSTpaymentslistAccounts1")
    body.data.listAccountsConsentId = listAccountsConsentId
    body.data.initiation = initiation
    await paf.appendToDefinedFile("logs.txt","POSTpaymentslistAccounts1_modifiedBody",JSON.stringify(body))
    await setRequestBody("listAccounts","POSTpaymentslistAccounts1",body)
}

async function getAccListPaymentsKEYCLOAK(config,access_token,consentId){
    access_token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJRdnA4X3VvNjhlaHZ0UlVRODl4LTRtMWRVMEFWQnJzSXpHTVM0YXVEZ3BvIn0.eyJleHAiOjE3NTk5MzQ5MDUsImlhdCI6MTc1OTg0ODUwNSwianRpIjoiM2FmNTRhZTgtNDAzMy00Y2FmLWFiNjEtZGQ1NjEyYThhZDUxIiwiaXNzIjoiaHR0cHM6Ly9zYy1tYXAtdGVzdHZlcnNpb24tdmlwLnNvZnRjbHViLmJ5Ojc4OTEvYXV0aC9yZWFsbXMvU0NSZWFsbSIsImF1ZCI6InJlYWxtLW1hbmFnZW1lbnQiLCJzdWIiOiJmNzg1YmQxZC1lZTk1LTQ3NGMtYjc2YS1mYzdkNjRmYjRiOGIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJLRVlDTE9BS19PUEVOQVBJIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIlNDLU1BUF9HRVRfQVBJLVBBWU1FTlRDT05TRU5UU19QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktUEFZTUVOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfUE9TVF9BUEktUEFZTUVOVElOVEVOVFMiLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5UQ09OU0VOVFNfQU5ZX0xPR0lOX0FOWV9DTElFTlRfQU5ZXyIsIlNDLU1BUF9ERUxFVEVfQVBJLVBBWU1FTlRDT05TRU5UU19BTllfIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTTElTVF9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktQ0hFQ0tfTE9HSU5fQU5ZXyIsIlNDLU1BUF9ST0xFX0FQSS1HRVRDT05URU5UIiwiU0MtTUFQX0dFVF9BUEktUkVRVUVTVE9UUDRTTVMiLCJTQy1NQVBfUk9MRV9BUEktU0VUQ09OVEVOVCIsIlNDLU1BUF9QVVRfQVBJLUFDQ09VTlRDT05TRU5UU19DUkVBVEVTUEVDSUFMUEFSVEVYVEVSTkFMUkVQUkVTRU5UQVRJT04iLCJTQy1NQVBfUEFUQ0hfQVBJLUFDQ09VTlRDT05TRU5UUyIsIlNDLU1BUF9QQVRDSF9BUEktUEFZTUVOVElOVEVOVFMiLCJTQy1NQVBfTkJSQl9SV19LRVlDTE9BSy1PUEVOQVBJX1NDT1BFX0FDQ0VTUyIsIlNDLU1BUF9QQVRDSF9BUEktUEFZTUVOVENPTlNFTlRTX0RPTUVTVElDVEFYIiwiU0MtTUFQX1BPU1RfQVBJLUFDQ09VTlRJTlRFTlRTIiwiU0MtTUFQX0RFTEVURV9BUEktQUNDT1VOVElOVEVOVFNfQU5ZXyIsIlNDLU1BUF9HRVRfQVBJLUFDQ09VTlRJTlRFTlRTX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX1BBWU1FTlRDT05TRU5UU19BTllfIiwiU0MtTUFQX0dFVF9BUEktUEFZTUVOVFNfUFNVT1JQQVVfQU5ZXyIsIlNDLU1BUF9HRVRfQVBJLUFDQ09VTlRTTElTVF9MT0dJTl9BTllfQ0xJRU5UX0FOWV9BQ0NPVU5UQ09OU0VOVFNfQU5ZXyIsIlNDLU1BUF9ERUxFVEVfQVBJLVBBWU1FTlRDT05TRU5UU19BTllfTE9HSU5fQU5ZX0NMSUVOVF9BTllfIiwiU0MtTUFQX1BVVF9BUEktUEFZTUVOVENPTlNFTlRTX0NSRUFURVNQRUNJQUxQQVJURVhURVJOQUxSRVBSRVNFTlRBVElPTiIsIlNDLU1BUF9QT1NUX0FQSS1DSEVDS19BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX0NMSUVOVF9BTllfUEFZTUVOVENPTlNFTlRTIiwiU0MtTUFQX1BBVENIX0FQSS1BQ0NPVU5USU5URU5UUyIsIlNDLU1BUF9ST0xFX0FQSS1BQ0NFU1MiLCJTQy1NQVBfR0VUX0FQSS1QQVlNRU5USU5URU5UU19BTllfIiwiU0MtTUFQX0RFTEVURV9BUEktUEFZTUVOVElOVEVOVFNfQU5ZXyIsIlNDLU1BUF9OQlJCX1JXX09CLUFDQ09VTlRTX0FDQ0VTUyIsIlNDLU1BUF9QVVRfQVBJLUFDQ09VTlRDT05TRU5UU19DUkVBVEVFWFRFUk5BTFJFUFJFU0VOVEFUSU9OIiwiU0MtTUFQX1JPTEVfQVBJLVNZU1RFTUVWRU5UTk9USUZJQ0FUSU9OIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVFNMSVNUX0xPR0lOX0FOWV9BQ0NPVU5UQ09OU0VOVFNfQU5ZXyIsIlNDLU1BUF9QVVRfQVBJLVBBWU1FTlRDT05TRU5UU19DUkVBVEVFWFRFUk5BTFJFUFJFU0VOVEFUSU9OIiwiU0MtTUFQX1BBVENIX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUMiLCJTQy1NQVBfREVMRVRFX0FQSS1QQVlNRU5UQ09OU0VOVFNfRE9NRVNUSUNfQU5ZX1BTVU9SUEFVX0FOWV8iLCJTQy1NQVBfR0VUX0FQSS1BQ0NPVU5UU0xJU1RfTE9HSU5fQU5ZX0NMSUVOVF9BTllfUEFZTUVOVENPTlNFTlRTX0FOWV8iLCJTQy1NQVBfUFVUX0FQSS1PVFBTRU5EIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTTElTVF9BTllfIiwiU0MtTUFQX1BBVENIX0FQSS1QQVlNRU5UQ09OU0VOVFMiLCJTQy1NQVBfUE9TVF9BUEktUEFZTUVOVENPTlNFTlRfQ09NTU9OUEFSVEVYVEVSTkFMUkVQUkVTRU5UQVRJT05SRVFVRVNUIiwiU0MtTUFQX0RFTEVURV9BUEktQUNDT1VOVENPTlNFTlRTX0FOWV9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX05CUkJfUldfT0ItUEFZTUVOVFNfQUNDRVNTIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTX0FOWV9QU1VPUlBBVV9BTllfIiwiU0MtTUFQX0dFVF9BUEktQUNDT1VOVENPTlNFTlRTRVhURVJOQUxSRVBSRVNFTlRBVElPTl9BTllfIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LXJlYWxtIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19fSwic2NvcGUiOiJTQy1BUFBTIGtleWNsb2FrLW9wZW5hcGkiLCJjbGllbnRIb3N0IjoiMTkyLjE2OC4xNjYuMjEzIiwiY2xpZW50SWQiOiJLRVlDTE9BS19PUEVOQVBJIiwiY2xpZW50X2dsb2JhbF9pZCI6IjY2NiIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1LRVlDTE9BS19PUEVOQVBJIiwiY2xpZW50QWRkcmVzcyI6IjE5Mi4xNjguMTY2LjIxMyIsImNsaWVudF9ndWlkIjoiMThhZmYwYTMtOWQ5MS00ODQxLTk0N2QtYjkxM2M5OTExZjgzIn0.TdcmjuzsPLQbVP8XGENt5GjpUq7Qf-xMkdSW7f1qtzRL0mXnVO_lf82uO4JDZv5hvedzEZ8p4H0kP1UigmY9atRQ_NFgsQFK6d-wvFH2xKNGWuOchVqKVzoWEhwCd3YGYD5UbaJVnOcMC-QPcl_OsoonJqDbZRXcQONUkQLyjQkeJrtFpN_5rPvnWZE_zDSEwR1u9SFABGLiTbtZfUFSRKCHXCgMyDalPiEc8cq3iMINHpo7ahfzrn56ZvVEQ84qVvOvuBHEbeDzPuPp_eYqnBwUNiznEkNw2JaoFcg3ZFt65bSrbxYX2hBst2Uip2oUj-YKVAajSercM2SIDtNJFQ"
    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      "x-api-key": "9ksf8pIjM2LDwDgatRAFbHyIUM91UfyChq1VmJo3rLrZhL8SEB",
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
    }
    console.log(JSON.stringify(headersList))
    await paf.appendToDefinedFile("logs.txt","accListPayments_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accountsList/login/V087_TEST1/client/PISP2TEST/paymentConsents/"+consentId, {
    method: "GET",
    mode: "cors",
    headers: headersList,
  });
  return response.json();
}

async function getAccListPaymentsKEYCLOAKcheck(config,access_token,consentId,bodyReq){
     // let bodyReq = {"data":{"ASPSP":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"OB":{"OBid":"4ac193ef-c8a9-4386-b8f1-6808748e6eba","OBname":"iBankASB","OBuserId":"0010624695","OBuserName":"Митрофан Доромидонтович Белуга","countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"PISP":{"PISP":"PISP2TEST","PISPid":"0d7330b9-4ee9-4df3-8b01-abf008382ed3","PISPidentification":[{"PISPname":"Тестовый PISP клиент","countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","organisationIdentification":{"extendedOrganisationIdentificationIdentification":[{"code":"COID","codeName":"Идентификация организации, присвоенная уполномоченным органом страны (например, корпоративный регистрационный номер)","identification":"112.191180347.0~~~~~~~)","identificationInformation":"112.191180347.0-0-0-0-0-0-0-0-9"},{"code":"BANK","codeName":"Уникальное и однозначное значение,  установленное конкретным банком или аналогичным финансовым учреждением для идентификации отношений, определенных между банком и его клиентом","identification":"0d7330b9$ee9$df3(b01-abf008382ed3","identificationInformation":"0d7330b9-4ee9-4df3-8b01-abf008382ed3"}],"organisationIdentification":{"code":"TXID","codeName":"Номер, присвоенный налоговым органом для идентификации организации (для РБ - УНП)","identification":"INB192837465","identificationStatusName":"Банк"}}}]},"PSUorPAU":{"PSUorPAU":"test.client-12","PSUorPAUid":"424a622c-9cfb-4894-83b5-a19c18fc4285","PSUorPAUname":"Митрофан Белуга"},"account":[{"accountDescription":"ТЕСТ ДУБЛЬ 105119","accountDetails":{"identification":"BY18AKBB24210001836040070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513434","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"ТЕСТ ДУБЛЬ 105743","accountDetails":{"identification":"BY43AKBB24270001176000070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513446","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"Текущие счета физ.лиц(01.06.2011)","accountDetails":{"identification":"BY30AKBB30140013907240070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513456","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Deleted"},{"accountDescription":"ТЕСТ Текущие счета физ.лиц USD(01.06.2011","accountDetails":{"identification":"BY84AKBB30141000781130070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513459","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"USD","currencyName":"Доллар США","status":"Enabled"},{"accountDescription":"ТЕСТ  Классик Без.свыше года(24м  c 29.10.2018)","accountDetails":{"identification":"BY95AKBB34140020411170070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513474","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Disabled"},{"accountDescription":"ТЕСТ Классик Отзывный с фиксированной процентной ставкой  USD(36м)","accountDetails":{"identification":"BY74AKBB34141004913460070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513476","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"USD","currencyName":"Доллар США","status":"Disabled"},{"accountDescription":"ТЕСТ Классик Отзывный с фиксированной процентной ставкой  EUR(18м)","accountDetails":{"identification":"BY78AKBB34142001465720070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513479","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"EUR","currencyName":"Евро","status":"Disabled"},{"accountDescription":"ТЕСТ Классик Безотзывный с фиксированной процентной ставкой RUB (24м)","accountDetails":{"identification":"BY64AKBB34143000800340070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513481","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"RUB","currencyName":"Российский рубль","status":"Disabled"},{"accountDescription":"ТЕСТ Безотзывный \"Китайская шкатулка\"  (13м)","accountDetails":{"identification":"BY51AKBB34144000003880070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9513483","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"CNY","currencyName":"Китайский юань","status":"Disabled"},{"accountDescription":"Текущие счета физ.лиц(01.06.2011)","accountDetails":{"identification":"BY36CLUB30140000508280070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9634147","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"Текущие счета физ.лиц(01.06.2011)","accountDetails":{"identification":"BY21AKBB30140012426250070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9819535","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"},{"accountDescription":"Текущие-дивиденды (01.06.2011)","accountDetails":{"identification":"BY85AKBB30140000518940070000","schemeName":"BY.NBRB.IBAN"},"accountId":"PA9819540","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","partyId":"PC14566912","partyName":"Митрофан Доромидонтович Белуга","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}},"currency":"BYN","currencyName":"Белорусский рубль","status":"Enabled"}],"authorisation":{"authorisationType":"Single"},"charge":[{"chargeAmount":"0.06","chargeBearer":"DEBT","currency":"BYN","currencyName":"Белорусский рубль","type":"COMM","typeName":"Commission – Плата за оказанные услуги"}],"creationDateTime":"2025-10-07T18:32:46+03:00","initiation":{"amount":"6.00","creditor":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","name":"Авдотья Никитишна Килька","organisationIdentification":[],"postalAddress":{"addressLine":["addressLine"],"buildingNumber":"1","country":"BY","countrySubDivision":"Минская область","districtName":"Минский район","postCode":"200018","room":"2","streetName":"Якубовского","townLocationName":"Фрунзенский","townName":"Минск"},"privateIdentification":[{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}]},"creditorAccount":{"identification":"BY21AKBB30140012426250070000","schemeName":"BY.NBRB.IBAN"},"currency":"BYN","currencyName":"Белорусский рубль","debtor":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","name":"Митрофан Доромидонтович Белуга","organisationIdentification":[],"postalAddress":{"addressLine":["addressLine"],"buildingNumber":"1","country":"BY","countrySubDivision":"Минская область","districtName":"Минский район","postCode":"200018","room":"2","streetName":"Якубовского","townLocationName":"Фрунзенский","townName":"Минск"},"privateIdentification":[{"code":"NIDN","codeName":"Идентификационный номер","identification":"3010190K002PB2"}]},"enclosedFile":[],"endToEndIdentification":"01.20240629.8bd17819bcf8d8da","instructionIdentification":"795SDBO20240629E5AE1D70F25F431F84DD","listAccounts":[],"listPassportData":[],"localInstrument":"BY.NBRB.BISS.NORMAL","regulatoryReporting":[],"remittanceInformation":{"categoryPurposeCode":"OTHR","proprietaryPurpose":"190401.21","referredDocument":[{"invoicer":"invoicer1","number":"111111","relatedDate":"2025-07-01","remittedAmount":"1.00","type":"BOLD"}],"unstructured":"1Назначение платежа в неструктурированной виде длиной 140 символов 12Назначение платежа в неструктурированной виде длиной 140 символов 23Назначение платежа в неструктурированной виде длиной 140 символов 3"},"requestedExecutionDate":"2024-06-29","ultimateCreditor":{"countryNameOfResidence":"Республика Гаити","countryOfResidence":"HT","name":"Авдотья Никитишна Килька","organisationIdentification":[],"postalAddress":{"addressLine":["addressLine"],"buildingNumber":"1","country":"BY","countrySubDivision":"Минская область","districtName":"Минский район","postCode":"200018","room":"2","streetName":"Якубовского","townLocationName":"Фрунзенский","townName":"Минск"},"privateIdentification":[{"code":"CCPT","codeName":"Документ, удостоверяющий личность","identification":"09.20220202.BU1718BU","identificationDocumentTypeName":"Действительный национальный паспорт гражданина иностранного государства или документ, его заменяющий","issuer":"Гаитянским самым главным"}]}},"paymentConsentId":"e245ba6a-4eb5-497aa2ff-4436f3db489c","status":"AwaitingAuthorisation","statusUpdateDateTime":"2025-10-07T18:32:46+03:00"},"risk":{"paymentContextCode":"90401"}}
    let headersList ={
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      "x-api-key": "9ksf8pIjM2LDwDgatRAFbHyIUM91UfyChq1VmJo3rLrZhL8SEB",
      'Accept-Language': 'ru',
      "x-fapi-auth-date": unixDate.getFormattedDate(unixDate.getDateNsecondsAgo(600)),
    }
    console.log(JSON.stringify(headersList))
    await paf.appendToDefinedFile("logs.txt","accListPaymentscheck_headers",JSON.stringify(headersList))
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/check/accountsList/login/test.client-12/client/PISP2TEST/paymentConsents", {
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(bodyReq)
  });
  return response.json();
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
        client_id_dbo: "digitalChannels",
        client_secret_dbo: "rvDMLEf5Njz6L5BGpst4dLP1hMrBWxEV",
        // client_id_dbo:"iBankASB",
        // client_secret_dbo:"zoVP6g4yTFsW64a6hAbSMe43mQrWxmJl",
        apikey: "dcbeebf6-1d34-4bb0-82cf-bcfe185e037f", //V087_TEST1
        // apikey: "ed999501-fe4e-4f18-845e-d69eab692941", //test-client.12
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
    //     // apikey: "0788319d-048e-449b-b785-b0e740ddc5ac", //V093_TEST1
    //     apikey: "Q3ET50eu0IgFQojiBn1M5Ypw5eRuuS90O5fhYSXMWcDFTWdtVt", //V087_TEST1
    //     client_otp: "asb123",
    //     mobile_number: "+375-255427989"
    // }
    authType = "PAUapikey"
    setAuthType("PAUapikey")
     let pispAccessToken
    let pispToken = await paf.createTokenPISP(config)
    pispAccessToken = pispToken.access_token
    await paf.appendToDefinedFile("logs.txt","PISPtoken",pispAccessToken.toString())
    console.log(pispToken)
    console.log("pisp_access_token : "+pispAccessToken)
    let dboClientAccessToken
    let dboClientToken = await paf.createDboClientToken(config)
    dboClientAccessToken = dboClientToken.access_token

    let createPaymentConsentslistAccountsResponse = await createPaymentConsentslistAccounts(config,pispAccessToken)
    // let createPaymentConsentslistAccountsResponse = {"data":{"charge":[],"creationDateTime":"2025-10-20T19:19:23.514437627+03:00","initiation":{"amount":"201.00","creditor":{"countryOfResidence":"BY","name":"ST-”KRYSHKOVSKAYA short“ короткое наименование","organisationIdentification":[{"code":"TXID","identification":"INN101103846"}],"privateIdentification":[]},"creditorAccount":{"identification":"BY48AKBB30121272200458000933","schemeName":"BY.NBRB.IBAN"},"creditorAgent":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"currency":"BYN","endToEndIdentification":"01.20250412.8bd17819bcf8d8da","instructionIdentification":"795SDBO20250412E5AE1D70F25F431F84DD","listAccounts":[{"IBAN":"BY21AKBB30140012426250070000","amount":"100.00","name":"Белуга Митрофан Доромидонтович"},{"IBAN":"BY06AKBB30140012426260070000","amount":"101.00","name":"Килька Авдотья Никитишна"}],"localInstrument":"BY.NBRB.BISS.NORMAL","requestedExecutionDate":"2025-12-12"},"link":"https://dc.asb.by/paymentСonsents/listAccounts/15582e04-8249-4957a675-0ba7c95535fb","listAccountsConsentId":"15582e04-8249-4957a675-0ba7c95535fb","status":"AwaitingAuthorisation","statusUpdateDateTime":"2025-10-20T19:19:23.514437627+03:00"},"links":{"self":"https://sc-map-testversion-vip.softclub.by:8008/oapi-channel/open-banking/v1.0/paymentConsents/listAccounts/15582e04-8249-4957a675-0ba7c95535fb"},"meta":{"totalPages":1}}
    console.log(JSON.stringify(createPaymentConsentslistAccountsResponse))
    await paf.appendToDefinedFile("logs.txt","createPaymentConsentslistAccountsResponse",JSON.stringify(createPaymentConsentslistAccountsResponse))

    // let accListKEYCLOAK = await getAccListPaymentsKEYCLOAK(config,"",createPaymentConsentslistAccountsResponse.data.listAccountsConsentId)
    // console.log(JSON.stringify(accListKEYCLOAK))
    // await paf.appendToDefinedFile("logs.txt","accListPaymentsKEYCLOAK",JSON.stringify(accListKEYCLOAK))

    // let accListcheck = await getAccListPaymentsKEYCLOAKcheck(config,"",createPaymentConsentslistAccountsResponse.data.listAccountsConsentId,JSON.stringify(accListKEYCLOAK))
    // console.log(JSON.stringify(accListcheck))
    // await paf.appendToDefinedFile("logs.txt","accListPaymentscheck",JSON.stringify(accListcheck))

    // let getPaymentConsentslistAccountsResponse = await getPaymentConsentslistAccounts(config,pispAccessToken,createPaymentConsentslistAccountsResponse.data.listAccountsConsentId)
    // console.log(JSON.stringify(getPaymentConsentslistAccountsResponse))
    // await paf.appendToDefinedFile("logs.txt","getPaymentConsentslistAccountsResponse",JSON.stringify(getPaymentConsentslistAccountsResponse))

    // let getPaymentConsentslistAccountsDBOResponse = await getPaymentConsentslistAccountsDBO(config,dboClientAccessToken,createPaymentConsentslistAccountsResponse.data.listAccountsConsentId)
    // console.log(JSON.stringify(getPaymentConsentslistAccountsDBOResponse))
    // await paf.appendToDefinedFile("logs.txt","getPaymentConsentslistAccountsDBOResponse",JSON.stringify(getPaymentConsentslistAccountsDBOResponse))

    // let deletePaymentConsentslistAccountsResponse = await deletePaymentConsentslistAccounts(config,pispAccessToken,createPaymentConsentslistAccountsResponse.data.listAccountsConsentId)
    // let deletePaymentConsentslistAccountsDBOResponse = await deletePaymentConsentslistAccountsDBO(config,dboClientAccessToken,createPaymentConsentslistAccountsResponse.data.listAccountsConsentId)

    // getPaymentConsentslistAccountsResponse = await getPaymentConsentslistAccounts(config,pispAccessToken,createPaymentConsentslistAccountsResponse.data.listAccountsConsentId)
    // console.log(JSON.stringify(getPaymentConsentslistAccountsResponse))
    // await paf.appendToDefinedFile("logs.txt","getPaymentConsentslistAccountsResponse",JSON.stringify(getPaymentConsentslistAccountsResponse))

    // let accListPaymentslistAccounts = await paf.getAccListPayments(config,dboClientAccessToken,createPaymentConsentslistAccountsResponse.data.listAccountsConsentId)
    // console.log(JSON.stringify(accListPaymentslistAccounts))
    // await paf.appendToDefinedFile("logs.txt","accListPaymentslistAccounts",JSON.stringify(accListPaymentslistAccounts))


    // let patchPaymentConsentlistAccountsResponse = await patchPaymentConsentlistAccounts(config,dboClientAccessToken,accListPaymentslistAccounts,createPaymentConsentslistAccountsResponse)
    // console.log(JSON.stringify(patchPaymentConsentlistAccountsResponse))
    // await paf.appendToDefinedFile("logs.txt","patchPaymentConsentlistAccountsResponse",JSON.stringify(patchPaymentConsentlistAccountsResponse))

    // await modifyPostPaymentslistAccountsBody(createPaymentConsentslistAccountsResponse.data.listAccountsConsentId,createPaymentConsentslistAccountsResponse.data.initiation)
    // let postPaymentslistAccountsResponse = await postPaymentslistAccounts(config,pispAccessToken)
    // console.log(JSON.stringify(postPaymentslistAccountsResponse))
    // await paf.appendToDefinedFile("logs.txt","createPaymentslistAccountsResponse",JSON.stringify(postPaymentslistAccountsResponse))

    // let listAccountsId = postPaymentslistAccountsResponse.data.listAccountsId
    // let getPaymentslistAccountsDBOResponse = await getPaymentslistAccountsDBO(config,dboClientAccessToken,listAccountsId)
    // console.log(JSON.stringify(getPaymentslistAccountsDBOResponse))
    // await paf.appendToDefinedFile("logs.txt","getPaymentlistAccountsDBOResponse",JSON.stringify(getPaymentslistAccountsDBOResponse))
    //
    // let getPaymentslistAccountsResponse = await getPaymentslistAccounts(config,dboClientAccessToken,listAccountsId)
    // console.log(JSON.stringify(getPaymentslistAccountsResponse))
    // await paf.appendToDefinedFile("logs.txt","getPaymentlistAccountsResponse",JSON.stringify(getPaymentslistAccountsResponse))

    // await deletePaymentslistAccountsDBO(config,dboClientAccessToken,listAccountsId)
    // console.log(JSON.stringify(deletePaymentslistAccountsDBOResponse))
    // await paf.appendToDefinedFile("logs.txt","deletePaymentlistAccountsDBOResponse",JSON.stringify(deletePaymentslistAccountsDBOResponse))

    // getPaymentslistAccountsDBOResponse = await getPaymentslistAccountsDBO(config,dboClientAccessToken,listAccountsId)
    // console.log(JSON.stringify(getPaymentslistAccountsDBOResponse))
    // await paf.appendToDefinedFile("logs.txt","getPaymentlistAccountsDBOResponse",JSON.stringify(getPaymentslistAccountsDBOResponse))

    // await deletePaymentslistAccounts(config,dboClientAccessToken,listAccountsId)
    // console.log(JSON.stringify(deletePaymentslistAccountsResponse))
    // await paf.appendToDefinedFile("logs.txt","deletePaymentlistAccountsResponse",JSON.stringify(deletePaymentslistAccountsResponse))

    // let getPaymentslistAccountsDBOResponse = await getPaymentslistAccountsDBO(config,dboClientAccessToken,listAccountsId)
    // console.log(JSON.stringify(getPaymentslistAccountsDBOResponse))
    // await paf.appendToDefinedFile("logs.txt","getPaymentlistAccountsDBOResponse",JSON.stringify(getPaymentslistAccountsDBOResponse))
}

main1()