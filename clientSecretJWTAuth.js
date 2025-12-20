
const uuid = require('uuid')
const {create} = require("axios");

const { execSync } = require('child_process');
const readline = require("readline-sync");
const axios = require("axios");

function sleep(seconds) {
    execSync(`sleep ${seconds}`);
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
}

let unixDate = new UnixDate()
const currentDate = new Date();

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

async function scCryptoHash1(config,dataB64){
    const instance = axios.create({ httpAgent: new (require('http').Agent)({ keepAlive: false }), httpsAgent: new (require('https').Agent)({ keepAlive: false }) });

  let data = {
      "Auth": {
        "CryptoType": 3,
        "ConnectStr": "hash=1.2.112.0.2.0.34.101.31.53"
      },
      "DataB64": dataB64,
      "MACKeyB64": convertToBase64(config.client_secret)
  }

  console.log(JSON.stringify(data))

    const response = await instance.post(config.url_swagger + "SCCrypto/ra/hash", data, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      timeout: 20000,
    });
    return response.data;

  // const response = await fetch(config.url_swagger+"SCCrypto/ra/hash", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Accept": "application/json",
  //   },
  //   body: JSON.stringify(data)
  // });
  // return response.json()
}

async function scCryptoHash2(config,dataB64){
  let data = {
      "Auth": {
        "CryptoType": 1
      },
      "DataB64": dataB64
  }

  console.log(JSON.stringify(data))
  const response = await fetch(config.url_swagger+"SCCrypto/ra/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data)
  });
  return response.json()
}

async function getClientAssertion(config,isRedirect){
    const header = {"alg":config.alg,"typ":config.typ}
    let body = isRedirect ? {
        "aud": config.url_kc+"auth/realms/SCRealm/protocol/openid-connect/token",
        "exp": unixDate.getNextDayDate(),
        "iat": unixDate.getCurrentDate(),
        "iss":config.client_id,
        "jti": uuid.v4(),
        "sub": config.client_id,
        "redirect_uri": "https://localhost:8008"
    } : {
        "aud": config.url_kc+"auth/realms/SCRealm/protocol/openid-connect/token",
        "exp": unixDate.getNextDayDate(),
        "iat": unixDate.getCurrentDate(),
        "iss":config.client_id,
        "jti": uuid.v4(),
        "sub": config.client_id
    }
    let signatureForSign = await scCryptoHash1(config, await convertToBase64(await convertToBase64URL(JSON.stringify(header)) + "." + await convertToBase64URL(JSON.stringify(body))))
    signatureForSign = signatureForSign.ResultB64
    let client_assertion = convertToBase64URL(JSON.stringify(header)) + "." + convertToBase64URL(JSON.stringify(body)) + "." + convertBase64ToBase64Url(signatureForSign)
    return client_assertion

}

async function createTokenWithClientAssertion(config,client_assertion){
    let body = ""
    if (config.scope) {
        body = new URLSearchParams({
            client_assertion: client_assertion,
            client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type: "client_credentials",
            scope: config.scope
        })
    } else {
        body = new URLSearchParams({
            client_assertion: client_assertion,
            client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type: "client_credentials",
            scope: "SC-APPS accounts openid"
        })
    }

  const response = await fetch(config.url_swagger+"auth/realms/SCRealm/protocol/openid-connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body
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

async function createPaymentConsent(config,access_token){

    let data = {"data":{"initiation":{"amount":"7.00","creditor":{"countryOfResidence":"BY","name":"Имечно бенефициара","organisationIdentification":[{"code":"TXID","identification":"INI200676206"}],"postalAddress":{"addressLine":[],"country":"BY"},"privateIdentification":[]},"creditorAccount":{"identification":"BY44MMBN30124040900109330000","schemeName":"BY.NBRB.IBAN"},"creditorAgent":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"currency":"BYN","debtorAgent":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"enclosedFile":[],"endToEndIdentification":"01.20240701.b61ba7886c1754f3","instructionIdentification":"795SDBO20240831C2876BC9BC1A41FEA5C4","listAccounts":[],"listPassportData":[],"localInstrument":"BY.NBRB.BISS.NORMAL","regulatoryReporting":[],"remittanceInformation":{"categoryPurposeCode":"OTHR","proprietaryPurpose":"190401.21","referredDocument":[],"unstructured":"1Назначение платежа в неструктурированной виде длиной 140 символов 12Назначение платежа в неструктурированной виде длиной 140 символов 23Назначение платежа в неструктурированной виде длиной 140 символов 3"},"requestedExecutionDate":"2024-08-31"}},"risk":{"paymentContextCode":"90401"}}

    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accountConsents", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': "Bearer " + access_token,
      'x-idempotency-key': uuid.v4()
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function createConsent(config,access_token){

    let data = {
      "data": {
        "expirationDate": addYearsToDate(currentDate, 3),
        "permissions": ["ReadAccountsBasic", "ReadAccountsDetail", "ReadBalances", "ReadStatementsBasic", "ReadStatementsDetail", "ReadTransactionsBasic", "ReadTransactionsDetail", "ReadTransactionsCredits", "ReadTransactionsDebits"],
        // "permissions": ["ReadAccountsBasic"],
        "transactionFromDate": subtractYearsFromDate(currentDate, 2),
        "transactionToDate": addYearsToDate(currentDate, 2)
      }, "risk": {}
    }

    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accountConsents", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': "Bearer " + access_token,
      'x-idempotency-key': uuid.v4()
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function getConsent(config,access_token,consent_id){

    const response = await fetch(config.url_swagger + "oapi-channel/open-banking/v1.0/accountConsents/" + consent_id, {
    method: "GET",
    mode: "cors",
    headers: {
      'accept': 'application/json;charset=utf-8',
      'Authorization': "Bearer "+ access_token,
    }
  });
    return response.json();
}
async function generateAuthCode(config,consent_id,code_verifier_start){
    const header = {"alg":config.alg,"typ":config.typ}
    let code_challenge = await scCryptoHash2(config, convertToBase64URL(convertToBase64(code_verifier_start)))
    code_challenge = code_challenge.ResultB64
    let body = {
        "alg":"BELTM256",
        "client_id":config.client_id,
        "code_challenge":convertBase64ToBase64Url(code_challenge),
        "code_challenge_method":"SB256",
        "consent_id":consent_id,
        "exp":unixDate.getNextDayDate(),
        "iat":unixDate.getCurrentDate(),
        "max_age":0,
        "nonce":uuid.v4(),
        "prompt":"login",
        "redirect_uri":"https://localhost:8008",
        "response_mode":"jwt",
        "response_type":"code",
        "scope":"SC-APPS accounts openid",
        "state":uuid.v4()
    }

    let token = convertToBase64(convertToBase64URL(JSON.stringify(header)) + "." + convertToBase64URL(JSON.stringify(body)))
    let signature = await scCryptoHash1(config,token)
    let auth_code = convertToBase64URL(JSON.stringify(header)) + "." +convertToBase64URL(JSON.stringify(body)) + "." + convertBase64ToBase64Url(signature.ResultB64)
    return auth_code
}
async function generateAuthUrl(config,consent_id,code_verifier_start){
    let auth_code = await generateAuthCode(config,consent_id,code_verifier_start)
    let url = config.url_swagger + "auth/realms/SCRealm/protocol/openid-connect/auth?client_id=" + config.client_id + "&request=" + auth_code
    return url
}

async function generateAccessTokenGrants(config,code_verifier_start,code){
    let client_assertion = await getClientAssertion(config,true)
    let body = {
        client_asserion: client_assertion,
        client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        redirect_uri:"https://localhost:8008",
        scope:"SC-APPS accounts openid",
        code:code,
        code_verifier:convertToBase64(code_verifier_start),
        grant_type:"authorization_code"
    }

    console.log(body)
    const response = await fetch(config.url_swagger + "auth/realms/SCRealm/protocol/openid-connect/token", {
    method: "POST",
    mode: "cors",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body:JSON.stringify(body)
    });

    return response.json()

}

async function getAccounts(config,access_token){
  try {
    const response = await axios.get(config.url_swagger + "oapi-channel/open-banking/v1.0/accounts", {
      headers: {
        'accept': 'application/json;charset=utf-8',
        'Authorization': "Bearer "+access_token,
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function main1(){
    const config = {
        alg: "BELTM256",
        typ: "JOSE",
        url_kc: "https://sc-map-testversion-vip.softclub.by:7891/",
        url_swagger: "https://sc-map-testversion-vip.softclub.by:8008/",
        client_id: "MDOM_BY",
        client_secret: "k1Odnx5Bf29XuulfXMKwi2s9Q2kYX9Ca"
        // client_id: "PISP2TEST",
        // client_secret: "Cgxb4O9UWS4HZwrpbf3bfefdrZTStubt"
    }
    let client_assertion = await getClientAssertion(config,false)
    let access_token
    let token = await createTokenWithClientAssertion(config,client_assertion)
    access_token = token.access_token
    console.log("client_assertion : " + client_assertion)
    console.log(token)
    console.log("access_token : "+access_token)
    let consentCreateResponse = await createConsent(config,access_token)
    // let consentCreateResponse = {data:{accountConsentId:"ae90c491-9225-496ba071-658f00e9f616"}}
    console.log("created consent : " + JSON.stringify(consentCreateResponse))
    let consentId = consentCreateResponse.data.accountConsentId
    let consentGetResponse = await getConsent(config,access_token,consentId)
    console.log(consentGetResponse)

    let code_verifier_start = uuid.v4()
    console.log("code verifier:" + convertToBase64URL(code_verifier_start))
    let authUrl = await generateAuthUrl(config,consentId,code_verifier_start)
    console.log(authUrl)


    let access_token_grants
    let response = await readline.question('Get and input response');
    let code = JSON.parse(decodeBase64(response.split('.')[1])).code
    access_token_grants = await generateAccessTokenGrants(config,code_verifier_start,code)
    let accounts = await getAccounts(config,access_token_grants)
    console.log(accounts)

}

async function main(){
    const config = {
        alg: "BELTM256",
        typ: "JOSE",
        url_kc: "https://sc-map-testversion-vip.softclub.by:7891/",
        url_swagger: "https://sc-map-testversion-vip.softclub.by:8008/",
        client_id: "MDOM_BY",
        client_secret: "k1Odnx5Bf29XuulfXMKwi2s9Q2kYX9Ca"
        // client_id: "PISP2TEST",
        // client_secret: "Cgxb4O9UWS4HZwrpbf3bfefdrZTStubt"
    }
    let client_assertion = await getClientAssertion(config,false)
    let access_token
    let token = await createTokenWithClientAssertion(config,client_assertion)
    access_token = token.access_token
    console.log("client_assertion : " + client_assertion)
    console.log(token)
    console.log("access_token : "+access_token)
    // let consentCreateResponse = await createConsent(config,access_token)
    let consentCreateResponse = {data:{accountConsentId:"3848c9b8-302e-49b6b769-58372387be19"}}
    console.log("created consent : " + JSON.stringify(consentCreateResponse))
    let consentId = consentCreateResponse.data.accountConsentId
    // let consentGetResponse = await getConsent(config,access_token,consentId)
    // console.log(consentGetResponse)

    let code_verifier_start = uuid.v4()
    console.log("code verifier:" + convertToBase64URL(code_verifier_start))
    let authUrl = await generateAuthUrl(config,consentId,code_verifier_start)
    console.log(authUrl)


    let access_token_grants
    let response = await readline.question('Get and input response');
    let code = JSON.parse(decodeBase64(response.split('.')[1])).code
    access_token_grants = await generateAccessTokenGrants(config,code_verifier_start,code)
    let accounts = await getAccounts(config,access_token_grants)
    console.log(accounts)
}

// main1()

module.exports = {getClientAssertion,createTokenWithClientAssertion}