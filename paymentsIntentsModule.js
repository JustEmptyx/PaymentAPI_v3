const readline = require("readline-sync");
const axios = require("axios");
const uuid = require("uuid");
const {addYearsToDate, subtractYearsFromDate} = require("./dateModule");
const base64url = require("base64url");
const ip = require('ip')
//b8e5e47f-eaae-418aa27d-fe857eca86e1
async function getDefinedParams(){

    let bankName = await readline.question('Input bank and dbo name: TVdigitalChannels, TViBankASB \n');

    /**
    * Enum for DANK_DBO_definitions.
    * @readonly
    * @enum {{BASE_URL: string, CRYPTO_URL: string, CLIENT_NAME: string, CLIENT_SUBJECT_KEY: string, CLIENT_OTP: string, CLIENT_PASSWORD: string, intent_api_key: string, consent_id: string, mobile_number: string, MAC_KEY: string, BEARER_DATA: string}}
    */
    const bankParams = Object.freeze({
        TVdigitalChannels:   {
            BASE_URL : "https://sc-map-testversion-vip.softclub.by:8008//",
            CRYPTO_URL : "https://sc-map-testversion-vip.softclub.by:8008//",
            CLIENT_NAME : "V087_TEST1",
            CLIENT_SUBJECT_KEY : "64F8824B986C34EB53232E1FACB6B7DCB6A8E5C0",
            CLIENT_OTP : "asb123",
            CLIENT_PASSWORD : "12345678",
            intent_api_key:"",
            consent_id:"",
            mobile_number: "+375-255427989",
            MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
            BEARER_DATA: "client_id=digitalChannels&client_secret=rvDMLEf5Njz6L5BGpst4dLP1hMrBWxEV&grant_type=client_credentials&scope=SC-APPS online-banking payments",
            ERIP_BEARER_DATA: "client_id=ERIP&client_secret=meGShQhM3hX28JJ7qr8sJ0aIGxVdxdGR&grant_type=client_credentials&scope=SC-APPS instant-payments payments",
            REALM_NAME: "SCRealm",
        },
        TViBankASB: {
            BASE_URL : "https://sc-map-testversion-vip.softclub.by:8008/",
            CRYPTO_URL : "https://sc-map-testversion-vip.softclub.by:8008/",
            CLIENT_NAME : "test.client-12",
            CLIENT_SUBJECT_KEY : "64F8824B986C34EB53232E1FACB6B7DCB6A8E5C0",
            CLIENT_OTP : "asb123",
            CLIENT_PASSWORD : "12345678",
            intent_api_key:"",
            consent_id:"",
            mobile_number: "+375-255427989",
            MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
            BEARER_DATA: "client_id=iBankASB&client_secret=zoVP6g4yTFsW64a6hAbSMe43mQrWxmJl&grant_type=client_credentials&scope=SC-APPS online-banking payments",
            ERIP_BEARER_DATA: "client_id=ERIP&client_secret=meGShQhM3hX28JJ7qr8sJ0aIGxVdxdGR&grant_type=client_credentials&scope=SC-APPS instant-payments payments",
            REALM_NAME: "SCRealm",
        }
    });
    return bankParams[bankName]
}

async function getBearerToken(url,data){
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const response = await fetch(url, {
        rejectUnauthorized: false,
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data
    });
    return response.json(); // parses JSON response into native JavaScript objects
}
async function createIntent(url,bearer,data){
    const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ bearer,
      'Accept-Language': 'ru',
      'x-idempotency-key':uuid.v4()
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function intentExist(url ="",bearer =""){
  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json;charset=utf-8',
        'Authorization': 'Bearer '+ bearer,
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function checkIsIntentExist(bearerToken,config){
    let apikey = await intentExist(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountIntents/" + config.CLIENT_NAME, bearerToken).then((data) => {
      if (data.data.status === "Authorised") {
        return data.data.apikey
      }
    }).catch(e => {
      console.log("================ERROR IN OBTAINING INTENT STATUS================")
    })
    return apikey ? apikey : (await createIntent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountIntents', bearerToken, {"data": {"personalAccessUser": config.CLIENT_NAME}})).data.apikey
}

async function getIntentId(bearer,config){
    return await checkIsIntentExist(bearer,config)
}

async function createConsent(url = "",apikey="",data = {}){
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'x-api-key': apikey,
      'x-idempotency-key': uuid.v4()
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function getAccountsListByLogin(url,bearer){
    try {
        const response = await axios.get(url, {
            headers: {
                'accept': 'application/json;charset=utf-8',
                'Authorization': 'Bearer '+ bearer
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

function generatePOSTconsentInstantBody(accountsByLoginBody){
    let consentInstantBody = {data: {},risk:{}}
    consentInstantBody.risk = {"authType":"BY.QPISP.AUTH.BASIC"}
    consentInstantBody.data = {"initiation":{"debtor":{"countryOfResidence":accountsByLoginBody.data.AISP.AISPidentification[0].countryOfResidence,"name":accountsByLoginBody.data.AISP.AISPidentification[0].AISPname,"privateIdentification":[{"code":accountsByLoginBody.data.OB.privateIdentification.code,"identification":accountsByLoginBody.data.OB.privateIdentification.identification},{"code":"CUST","identification":Math.random().toString().slice(2, 11)}]},"debtorAgent":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"localInstrument":"BY.NBRB.ERIP"}}
    return consentInstantBody
}
function getCurrentDate(){return new Date();}

function jsonToBase64(data){
    let objJsonStr = JSON.stringify(data);
    return Buffer.from(objJsonStr).toString("base64")
}
function jsonToBase64url(data){
    let objJsonStr = JSON.stringify(data)
    return Buffer.from(objJsonStr).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function stringToBase64(data){
    return Buffer.from(data).toString("base64")
}

function stringToBase64Url(data){
    return Buffer.from(data).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64ToBase64url(base64String) {
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeCryptoProxyRequestHash(requestBody,config){
  const response = await fetch(config.CRYPTO_URL + "SCCrypto/ra/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(requestBody)
  });
  return response.json();
}
async function makeCryptoProxyRequestSignd(requestBody,config){
  const response = await fetch(config.CRYPTO_URL+ "SCCrypto/ra/signd", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "accept": "application/json",
      "Accept-Language": "ru",
    },
    body: JSON.stringify(requestBody)
  });
  return response.json();
}

function getRFC7231Date() {
    const date = getCurrentDate()
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const dayName = days[date.getUTCDay()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const monthName = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} GMT`;
}

async function postConsentInstant(postConsentInstantBody,config,eripBearerToken,jwsSignature){
    const response = await fetch(config.BASE_URL + "/oapi-channel/open-banking/v1.0/paymentConsents/instant", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': "Bearer "+eripBearerToken,
      'x-idempotency-key': uuid.v4(),
      "x-fapi-customer-ip-address": ip.address(),
      "x-customer-user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "x-fapi-interaction-id": uuid.v4(),
      "x-fapi-auth-date":getRFC7231Date(),
      "x-jws-signature": jwsSignature,
    },
    body: JSON.stringify(postConsentInstantBody)
  });
  console.log(response.text())
  return response.json();
}

function createCryptoProxySigndBody(dataB64, config){
    return {
	"Auth": {
		"ConnectStr": "hash=1.2.840.113549.1.1.11",
		"CryptoType": 3,
		"KeyID": config.CLIENT_SUBJECT_KEY,
		"Password": config.CLIENT_PASSWORD
	},
	"DataB64": stringToBase64(jsonToBase64url(getHeader('RS256'))+"."+dataB64),
	"OptAddAllCert": false,
	"OptAddCert": true,
	"OptCheckPrivateKey": true,
	"OptReturnSignCert": true
}
}

function getHeader(signAlg){
    return signAlg === "RS256" ? { "alg": "RS256", "crit": [ "http://openbanking.asb.by/asn1", "http://openbanking.asb.by/crptPrvdr" ], "http://openbanking.asb.by/asn1": true, "http://openbanking.asb.by/crptPrvdr": 3, "typ": "JOSE" } : { "alg": "RS256", "crit": [ "http://openbanking.asb.by/asn1", "http://openbanking.asb.by/crptPrvdr" ], "http://openbanking.asb.by/asn1": true, "http://openbanking.asb.by/crptPrvdr": 3, "typ": "JOSE" }
}
async function getJWSsignature(dataB64Object,config){
    let cryptoProxySigndBody = createCryptoProxySigndBody(jsonToBase64url(dataB64Object), config)
    let cryptoProxySigndResponse = await makeCryptoProxyRequestSignd(cryptoProxySigndBody,config);
    let jwsHeaderB64  = jsonToBase64url(getHeader("RS256"))
    return jwsHeaderB64+".."+base64ToBase64url(cryptoProxySigndResponse.ResultB64)
}

function generateRandomNumberString(stringLength = 5) {
    return Array.from({ length: stringLength }, () => Math.floor(Math.random() * 10)).join('');
}

async function getQPISPSCCryptoHashBody(aspsSession,config){
    return {"Auth":
            {
                "CryptoType":3,
                "ConnectStr":"hash=2.16.840.1.101.3.4.2.1"
            },
        "DataB64":aspsSession+"!"+config.BASE_URL+"instantPSUredirect?session="+uuid.v4()+"&magic-otp="+generateRandomNumberString(5),
        "MACKeyB64": stringToBase64(config.ERIP_BEARER_DATA.split('=')[2]),
    }
}

async function createPatchConsentInstantBody(hmacWithOTPstring,signature){
    return {
        "data":{
            "ASPSPsession":hmacWithOTPstring.split("!")[0],
            "QPISPsession":hmacWithOTPstring.split("!")[1],
            "QPISPsignature":signature,
        }
    }
}

async function patchConsentInstant(patchConsentInstantBody,config,eripBearerToken){
    const response = await fetch(config.BASE_URL + "/oapi-channel/open-banking/v1.0/paymentConsents/instant", {
    method: "PATCH",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
    },
    body: JSON.stringify(patchConsentInstantBody)
  });
  return response.json();
}

async function calcAll(config){

    const obClientCredentialsBearerToken = (await getBearerToken(config.BASE_URL + "auth/realms/" + config.REALM_NAME + "/protocol/openid-connect/token", config.BEARER_DATA)).access_token
    config.intent_api_key = await getIntentId(obClientCredentialsBearerToken,config)

    const currentDate = getCurrentDate()
    config.consent_id = (await createConsent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents', config.intent_api_key, {
      "data": {
        "expirationDate": addYearsToDate(currentDate, 3),
        "permissions": ["ReadAccountsBasic", "ReadAccountsDetail", "ReadBalances", "ReadStatementsBasic", "ReadStatementsDetail", "ReadTransactionsBasic", "ReadTransactionsDetail", "ReadTransactionsCredits", "ReadTransactionsDebits"],
        "transactionFromDate": subtractYearsFromDate(currentDate, 2),
        "transactionToDate": addYearsToDate(currentDate, 2)
      }, "risk": {}
    })).data.accountConsentId


}

async function calcPrevParams(){

}
async function main(){
    console.log(ip.address())
    const config = await getDefinedParams()
    await calcAll(config)

}

main()