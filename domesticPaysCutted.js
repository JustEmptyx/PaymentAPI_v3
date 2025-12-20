const uuid = require("uuid");
const paf = require("./PISPauth")
const {setRequestBody} = require("./requestBodies");
const {format} = require("date-fns");
const {setAuthType} = require("./PISPauth");
let unixDate = new paf.UnixDate()

let startTime = ""
let authType = "OBclientCredentials" // PAUapikey, OBclientCredentials
paf.setAuthType("OBclientCredentials")
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function generateSignaturePOSTpaymentConsentsDomesticTax(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,additionalInfo = []){
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
    let payload = await paf.generatePayload(config,method,token,fapiInteractionId,idempotencyKey,requestBodyName,undefined,"pispAuthTax")
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

async function createPaymentConsentsDomesticTax(config,access_token){
    let requestBodyName = "POSTpaymentConsents/domesticTax1"
    let requestBody = paf.sortObjectAlphabeticallyNew(paf.getRequestBody("pispAuthTax",requestBodyName))
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
    let method = "POSTpaymentConsentsDomesticTax"
    let signature = await generateSignaturePOSTpaymentConsentsDomesticTax(config,method,access_token,fapiInteractionId,idempotencyKey,requestBodyName)
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
    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/paymentConsents/domesticTax", {
    // const response = await fetch("http://192.168.166.214:9100/openbanking/paymentConsents/domestic",{
    method: "POST",
    mode: "cors",
    headers: headersList,
    body: JSON.stringify(paf.sortObjectAlphabeticallyNew(paf.getRequestBody("pispAuthTax",requestBodyName)))
  });
  await paf.appendToDefinedFile("logs.txt","fullRequest","method: POST \r\n mode: cors \r\n headers: " + JSON.stringify(headersList) + "\r\n" + "body: " + JSON.stringify(paf.getRequestBody("pispAuthTax",requestBodyName)))
  return response.json();
}

async function modifyPostPaymentConsentsDomesticTaxBody(){
    let body = await paf.getRequestBody("pispAuthTax","POSTpaymentConsents/domesticTax1")
    body.data.initiation.endToEndIdentification = "01." + unixDate.getShortedDate(unixDate.getCurrentDate()) + "." + paf.generateRandomHex(16)
    body.data.initiation.instructionIdentification = "795SDBO" + unixDate.getShortedDate(unixDate.getCurrentDate()) + paf.generateRandomHex(16)
    await paf.appendToDefinedFile("logs.txt","POSTpaymentConsents/domesticTax1_modifiedBody",JSON.stringify(body))
    await setRequestBody("pispAuthTax","POSTpaymentConsents/domesticTax1",body)
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
        apikey: "93f076e2-4ba4-4a01-9e0e-c3384254afa5", //V087_TEST1
        // apikey: "ed999501-fe4e-4f18-845e-d69eab692941", //test-client.12
        client_otp: "asb123",
        mobile_number: "+375-255427989"
    }

     let pispAccessToken
    let pispToken = await paf.createTokenPISP(config)
    pispAccessToken = pispToken.access_token
    await paf.appendToDefinedFile("logs.txt","PISPtoken",pispAccessToken.toString())
    console.log(pispToken)
    console.log("pisp_access_token : "+pispAccessToken)
    let dboClientAccessToken
    let dboClientToken = await paf.createDboClientToken(config)
    dboClientAccessToken = dboClientToken.access_token

    await modifyPostPaymentConsentsDomesticTaxBody()
    let createPaymentConsentsDomesticTaxResponse = await createPaymentConsentsDomesticTax(config,pispAccessToken)
    console.log(JSON.stringify(createPaymentConsentsDomesticTaxResponse))
    await paf.appendToDefinedFile("logs.txt","createPaymentConsentsDomesticTaxResponse",JSON.stringify(createPaymentConsentsDomesticTaxResponse))

}

main1()