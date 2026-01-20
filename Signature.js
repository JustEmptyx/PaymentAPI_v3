const {convertBase64ToBase64Url,convertToBase64URL,convertToBase64} = require('./base64converter')
const {createFile,appendToDefinedFile} = require('./fileManager')
const {scCryptoHash,scCryptoSign} = require('./cryptoManager')
const { UnixDate,unixDate } = require('./dateModule');
const {sortObjectAlphabetically,getRequestBody, findAttribute} = require('./utils')


async function generateSignature(config,methodType,methodUri,commonHeaders,projectName,requestBodyName,additionalInfo = {}){
    let header = await generateHeader(config,commonHeaders)
    await appendToDefinedFile("logs.txt","header",JSON.stringify(header))
    console.log("Header \r\n" +JSON.stringify(header))
    let payload = await generatePayload(config,methodType,methodUri,commonHeaders,projectName,requestBodyName,additionalInfo)
    await appendToDefinedFile("logs.txt","payloadPars",JSON.stringify(payload))
    console.log("Payload \r\n" +JSON.stringify(payload))
    let headerB64 = convertToBase64URL(JSON.stringify(header))
    let payloadB64 = convertToBase64URL(JSON.stringify(payload))
    await appendToDefinedFile("logs.txt","headerB64",JSON.stringify(headerB64))
    await appendToDefinedFile("logs.txt","payloadB64",JSON.stringify(payloadB64))
    let signBody = {
        "Auth":{
            "CryptoType":1,
            "KeyID":"8627DBC521A8F18A4CDDD8D396949CC333ED762E",
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

async function generateHeader(config, commonHeaders){
  let headerRaw = {"alg": "BIGNS128",
  "crit": [
    "http://openbanking.asb.by/asn1",
    "http://openbanking.asb.by/crptPrvdr",
    "http://openbanking.asb.by/signDtTm",
    "http://openbanking.asb.by/signedData",
  ],
  "http://openbanking.asb.by/asn1": true,
  "http://openbanking.asb.by/crptPrvdr": 1,
  "http://openbanking.asb.by/signDtTm": unixDate.getISOWithTimeZone(unixDate.getDateNsecondsAgo(-10800)),
  "http://openbanking.asb.by/signedData": {
    "pars": [
      "@method",
      "@target-uri",
      "content-digest",
    ]
  },
  "typ": "JOSE"}
  if (findAttribute(commonHeaders,"x-api-key")){
    headerRaw["http://openbanking.asb.by/signedData"]["pars"].push("x-api-key")
  }
  if (findAttribute(commonHeaders,"authorization")){
    headerRaw["http://openbanking.asb.by/signedData"]["pars"].push("authorization")
  }
  if (findAttribute(commonHeaders,"x-idempotency-key")){
    headerRaw["http://openbanking.asb.by/signedData"]["pars"].push("x-idempotency-key")
  }
  if (findAttribute(commonHeaders,"content-type")){
    headerRaw["http://openbanking.asb.by/signedData"]["pars"].push("content-type")
  }
  if (findAttribute(commonHeaders,"debtorIdentification")){
    headerRaw.crit.push("http://openbanking.asb.by/debtorIdentification")
    headerRaw["http://openbanking.asb.by/debtorIdentification"] = commonHeaders["debtorIdentification"]
  }
  if(findAttribute(commonHeaders,"x-fapi-auth-date")){
    headerRaw["http://openbanking.asb.by/signedData"]["pars"].push("x-fapi-auth-date")
  }
  if(findAttribute(commonHeaders,"x-fapi-customer-ip-address")){
    headerRaw["http://openbanking.asb.by/signedData"]["pars"].push("x-fapi-customer-ip-address")
  }
  if(findAttribute(commonHeaders,"x-fapi-interaction-id")){
    headerRaw["http://openbanking.asb.by/signedData"]["pars"].push("x-fapi-interaction-id")
  }
  headerRaw["http://openbanking.asb.by/signedData"].pars.sort()
  return sortObjectAlphabetically(headerRaw)
}

async function generatePayload(config,methodType,methodUrl,commonHeaders,projectName = "pispAuth",requestBodyName,additionalInfo){
    let requestBody = ""
    if (requestBodyName){
        requestBody = sortObjectAlphabetically(getRequestBody(projectName, requestBodyName))
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
    let payload = await getPayloadByMethodRouteNew(config, methodType,methodUrl,commonHeaders,additionalInfo)
    return payload
}

async function getPayloadByMethodRouteNew(config, methodType,methodUrl,commonHeaders,additionalInfo){
    let body = {"pars":{}}
    switch(methodType) {
        case "POST":
            body.pars = {
                "@method": "POST",
                "content-digest": commonHeaders["content-digest"],
                "content-type": commonHeaders["content-type"],
                "x-idempotency-key": commonHeaders["x-idempotency-key"],
            }
            switch(methodUrl){
                case "/paymentConsents/domestic":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic"
                    break;
                case "/payments/domestic":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domestic"
                    break;
                case "/paymentConsents/instant":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant"
                    break;
                case "/payments/instant":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/instant"
                    break;
                case "/invoices/instant":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/invoices/instant"
                    break;
                case "/paymentConsents/domesticTax":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax"
                    break;
                case "/payments/domesticTax":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/domesticTax"
                    break;
                case "/paymentConsents/listAccounts":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts"
                    break;
                case "/payments/listAccounts":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/listAccounts"
                    break;
                case "/paymentConsents/listPassports":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listPassports"
                    break;
                case "/payments/listPassports":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/listPassports"
                    break;
                case "/paymentConsents/requirement":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/requirement"
                    break;
                case "/payments/requirement":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/requirement"
                    break;
                case "/paymentConsents/taxRequirement":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/taxRequirement"
                    break;
                case "/payments/taxRequirement":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/taxRequirement"
                    break;
                case "/paymentConsents/VRP":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/VRP"
                    break;
                case "/payments/VRP":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/payments/VRP"
                    break;
            }
            break;
        case "GET":
            body.pars = {
                "@method": "GET",
                "@target-uri":config.url_swagger + "oapi-channel/open-banking/v1.0" + additionalInfo.url,
                "content-digest": commonHeaders["content-digest"],
            }
            break;
        case "PATCH":
            body.pars = {
                "@method": "PATCH",
                "content-digest": commonHeaders["content-digest"],
                "content-type": commonHeaders["content-type"],
                "x-idempotency-key": commonHeaders["x-idempotency-key"],
            }
            switch(methodUrl){
                case "/paymentConsents/domestic":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domestic"
                    break;
                case "/paymentConsents/instant":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/instant"
                    break;
                case "/paymentConsents/domesticTax":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax"
                    break;
                case "/paymentConsents/listAccounts":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts"
                    break;
                case "/paymentConsents/listPassports":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listPassports"
                    break;
                case "/paymentConsents/requirement":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/requirement"
                    break;
                case "/paymentConsents/taxRequirement":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/taxRequirement"
                    break;
                case "/paymentConsents/VRP":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/VRP"
                    break;
            }
            break;
        case "DELETE":
            body.pars = {
                "@method": "DELETE",
                "@target-uri":config.url_swagger + "oapi-channel/open-banking/v1.0" + additionalInfo.url,
                "content-digest": commonHeaders["content-digest"],
            }
            break;
        case "PUT":
            body.pars = {
                "@method": "PUT",
                "content-digest": commonHeaders["content-digest"],
                "content-type": commonHeaders["content-type"],
            }
            switch(methodUrl){
                case "/paymentConsents/createExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createExternalRepresentation"
                    break;
                case "/paymentConsents/domesticTax/createExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax/createExternalRepresentation"
                    break;
                case "/paymentConsents/listAccounts/createExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listAccounts/createExternalRepresentation"
                    break;
                case "/paymentConsents/listPassports/createExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/listPassports/createExternalRepresentation"
                    break;
                case "/paymentConsents/requirement/createExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/requirement/createExternalRepresentation"
                    break;
                case "/paymentConsents/taxRequirement/createExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/taxRequirement/createExternalRepresentation"
                    break;
                case "/paymentConsents/VRP/createExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/VRP/createExternalRepresentation"
                    break;
                case "/paymentConsents/createSpecialPartExternalRepresentation":
                    body.pars['@target-uri'] = config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/createSpecialPartExternalRepresentation"
                    break;
            }
            break;
    }
    if (findAttribute(commonHeaders,"x-api-key")){
        body.pars["x-api-key"] = commonHeaders["x-api-key"]
    }
    if (findAttribute(commonHeaders,"authorization")){
        body.pars["authorization"] = commonHeaders["authorization"]
    }
    if (findAttribute(commonHeaders,"x-fapi-auth-date")){
        body.pars["x-fapi-auth-date"] = commonHeaders["x-fapi-auth-date"]
    }
    if (findAttribute(commonHeaders,"x-fapi-customer-ip-address")){
        body.pars["x-fapi-customer-ip-address"] = commonHeaders["x-fapi-customer-ip-address"]
    }
    if (findAttribute(commonHeaders,"x-fapi-interaction-id")){
        body.pars["x-fapi-interaction-id"] = commonHeaders["x-fapi-interaction-id"]
    }
    return sortObjectAlphabetically(body)
}

module.exports = {
    generateSignature,
    getPayloadByMethodRouteNew
}