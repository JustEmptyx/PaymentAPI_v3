const axios = require('axios');
const readline = require('readline-sync');
const { format, addMinutes } = require('date-fns');
const base64url = require('base64url')
const util = require('util');
const fs = require('fs');
const uuid = require('uuid')
const readFile = util.promisify(fs.readFile);
const currentDate = new Date();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
// let config = {
//   BASE_URL : "https://sc-kubernetes-cl.scx:8008//",
//   CLIENT_NAME : "a_hlebov",
//   CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
//   CLIENT_OTP : "paritet123",
//   CLIENT_PASSWORD : "12345678",
//   intent_api_key:"",
//   consent_id:"",
//   mobile_number: "+375-445556677",
//   MAC_KEY:"OkI3Q/334rFyWC/HVzWR5qM1uMXMP5I7LEpNB/L080s=",
//   BEARER_DATA: "client_id=1MBanking&client_secret=mUFhKAjhMgdbifd4zCct425Rver9eK9L&grant_type=client_credentials&scope=SC-APPS online-banking openid"
// }

let config = {
  BASE_URL : "https://t-sanbox-oapi-1.paritetbank.local:8008//",
  CLIENT_NAME : "apitest1",
  CLIENT_SUBJECT_KEY : "0932CC8EE6FA70191F2952287669CA366DA76584",
  // CLIENT_SUBJECT_KEY: "C0423A86B1AE18498761C9E6C25D513148F55C01",
  // CLIENT_SUBJECT_KEY: "64F8824B986C34EB53232E1FACB6B7DCB6A8E5C0",
  CLIENT_OTP : "555555",
  CLIENT_PASSWORD : "12345678",
  intent_api_key:"",
  consent_id:"",
  mobile_number: "+375-255427989",
  MAC_KEY:"OkI3Q/334rFyWC/HVzWR5qM1uMXMP5I7LEpNB/L080s=",
  BEARER_DATA: "client_id=LWO&client_secret=4gKqwOgwYIAwThoOtSluhvgF6z4AT3oA&grant_type=client_credentials&scope=SC-APPS online-banking openid"
  // BEARER_DATA: "client_id=1MBanking&client_secret=ewUJpYkISZb25xzsrvtCEuiEhu1STI2h&grant_type=client_credentials&scope=SC-APPS online-banking openid"
}

// let config = {
//   BASE_URL : "https://public.softclub.by:8028//",
//   CLIENT_NAME : "V07X_API1",
//   CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
//   CLIENT_OTP : "asb12345",
//   CLIENT_PASSWORD : "12345678",
//   intent_api_key:"",
//   consent_id:"",
//   mobile_number: "+375-255427989",
//   MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
//   BEARER_DATA: "client_id=digitalChannelsNew&client_secret=mnoSdqcDruzrrBqev06ZLkHOGE3xRayy&grant_type=client_credentials&scope=SC-APPS online-banking openid"
// }

// let config = {
//   BASE_URL : "https://sc-map-testversion-vip.softclub.by:8008//",
//   CLIENT_NAME : "V087_TEST1",
//   CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
//   CLIENT_OTP : "asb123",
//   CLIENT_PASSWORD : "12345678",
//   intent_api_key:"",
//   consent_id:"",
//   mobile_number: "+375-255427989",
//   MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
//   BEARER_DATA: "client_id=iBankASB&client_secret=zoVP6g4yTFsW64a6hAbSMe43mQrWxmJl&grant_type=client_credentials&scope=SC-APPS online-banking openid"
// }

// let config = {
//   BASE_URL : "https://sc-map-rrb-vip.softclub.by:8008//",
//   CLIENT_NAME : "mtb300",
//   CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
//   CLIENT_OTP : "asb123",
//   CLIENT_PASSWORD : "12345678",
//   intent_api_key:"",
//   consent_id:"",
//   mobile_number: "+375-255427989",
//   MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
//   BEARER_DATA: "client_id=digitalChannels&client_secret=yGHOxRbXPw11wGBIQYwOmtaGw6P4TyRg&grant_type=client_credentials&scope=SC-APPS online-banking openid"
// }

// let config = {
//   BASE_URL : "https://map-mtb.softclub.by:8008//",
//   CLIENT_NAME : "mtb300",
//   CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
//   CLIENT_OTP : "mtb12345",
//   CLIENT_PASSWORD : "12345678",
//   intent_api_key:"",
//   consent_id:"",
//   mobile_number: "+375-259080686",
//   MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
//   BEARER_DATA: "client_id=digitalChannels&client_secret=sifyT6FENuCiCVF7WGwHQV5Hh7SqB20e&grant_type=client_credentials&scope=SC-APPS online-banking openid"
// }

let jwsProtectedHeader = {
    "alg":"BIGNS128",
    "crit":["http://openbanking.paritetbank.by/asn1","http://openbanking.paritetbank.by/crptPrvdr"],
    "http://openbanking.paritetbank.by/asn1":true,
    "http://openbanking.paritetbank.by/crptPrvdr":1,
    "typ":"JOSE"
  }

// let jwsProtectedHeader = {
//     "alg":"RS256",
//     "crit":["http://openbanking.paritetbank.by/asn1","http://openbanking.paritetbank.by/crptPrvdr"],
//     "http://openbanking.paritetbank.by/asn1":true,
//     "http://openbanking.paritetbank.by/crptPrvdr":3,
//     "typ":"JOSE"
//   }

// let jwsProtectedHeader = {
//     "alg":"BIGNS128",
//     "crit":["http://openbanking.asb.by/asn1","http://openbanking.asb.by/crptPrvdr"],
//     "http://openbanking.asb.by/asn1":true,
//     "http://openbanking.asb.by/crptPrvdr":1,
//     "typ":"JOSE"
// }

// let jwsProtectedHeader = {
//     "alg":"BIGNS128",
//     "crit":["http://openbanking.mtbank.by/asn1","http://openbanking.mtbank.by/crptPrvdr"],
//     "http://openbanking.mtbank.by/asn1":true,
//     "http://openbanking.mtbank.by/crptPrvdr":1,
//     "typ":"JOSE"
//   }

// Переменная testingMode отвечает за создание нового согласия в случае если id согласия не передавалось.
//Для передачи id согласия используется переменная initialConsentId
// isEcp - флаг, отвечающий за создание согласия с ЭЦП
let testingMode = 1
let isECP = 0
let isAllAccounts = 0
let initialConsentId = "5254fc71-6fc6-43afa54e-5bb8ed535f49"
let isBel = 0


async function getBearerToken(url ="", data={}){
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
// 7eff5787-96ac-40dd822b-54348eeaf4c2

async function intentExist(url ="",bearer ="", data={}){
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

async function createIntent(url = "",bearer="",data = {}){
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

async function createConsentECP(url = "",bearer="",data = {}){
  console.log(url + "\n" + bearer + "\n" + JSON.stringify(data))
  let xik = uuid.v4()
  const reqData = {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': "Bearer "+bearer,
      'x-idempotency-key': xik
    },
    body: JSON.stringify(data)
  };
  console.log(reqData)
  const response = await fetch(url, reqData);
  return await response.json()
}

async function parseInfoAboutUser(url="",bearer="",data={}){
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

async function createExternalRepresentation(url = "",bearer="",data = {}){
  const response = await fetch(url, {
    method: "PUT",
    mode: "cors",
    headers: {
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ bearer,
      "Content-Type": "application/json;charset=utf-8"
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function createUserInfoExtReprComPart(ui,er){
  ui.data.externalRepresentation = er
  let temp = ui.data
  let res = Object.keys(temp).sort().reduce((acc,key)=>{
    acc[key] = temp[key];
    return acc
  },{});
  ui.data = res
  return ui
}

async function createMACkey(){
  let hashedOTP
  await convertToBase64(config.CLIENT_OTP).then((data) => hashedOTP = data)
  let data= {
    "Auth": {
      "CryptoType": 1
    },
    "DataB64": hashedOTP
  }
  // https://sc-map-rrb-vip.softclub.by:8008//SCCrypto/ra/hash
  console.log(JSON.stringify(data))
  const response = await fetch(config.BASE_URL + "SCCrypto/ra/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data)
  });
  return response.json()
}

async function createImitationInsert(ui,er){
  ui.data.externalRepresentation = er
  let temp = ui.data
  let res = Object.keys(temp).sort().reduce((acc,key)=>{
    acc[key] = temp[key];
    return acc
  },{});
  ui.data = res

  console.log(ui)
  let buff = new Buffer(JSON.stringify(ui));
  let extendedBodyHash = buff.toString('base64');

  console.log(config.MAC_KEY)
  console.log(extendedBodyHash)
  await createMACkey().then((data)=>{config.MAC_KEY = data.ResultB64})

  console.log("generated MAC_KEY" + config.MAC_KEY)
  let data= {
    "Auth": {
      "CryptoType": 3,
      "ConnectStr": "hash=1.2.112.0.2.0.34.101.31.53"
    },
    "DataB64": extendedBodyHash,
    "MACKeyB64": config.MAC_KEY
  }
  console.log(JSON.stringify(data))
  await appendToFile("imitInsertRequestBody", JSON.stringify(data)).then(console.log("imitInsertRequestBody showed"))
  const response = await fetch(config.BASE_URL+"SCCrypto/ra/hash", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function createSpecialPartObject(imitIns){
  const currentDate = new Date();
  const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  currentDate.setMinutes(currentDate.getMinutes()+2)
  const updatedFormattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return {
    "specialPart":
        {
          "HMAC": imitIns,
          "OTP": config.CLIENT_OTP,
          "OTPdateTime": formattedDate,
          "mobileNumber": config.mobile_number,
          "signatureDateTime": updatedFormattedDate,
          "status": "Authorised",
          "statusUpdateDateTime": formattedDate,
          "subjectKeyIdentifier": config.CLIENT_SUBJECT_KEY
        }
  }
}

async function createSpecialPartObjectECP(){
  const currentDate = new Date();
  const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  currentDate.setMinutes(currentDate.getMinutes()+2)
  const updatedFormattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return {
    "specialPart":
        {
          "clientSignatures": [{
            "EDSattributes" : [],
            "cryptoType" : 1,
            "includePreviousSignatures": false,
            "signature":"",
            "signatureDateTime" : updatedFormattedDate,
            "signatureNumber" : 1,
            "subjectKeyIdentifier": config.CLIENT_SUBJECT_KEY
          }]
        }
  }
}

async function createSpecialPartObjectECPFull(spo,ersp){
  const currentDate = new Date();
  const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  currentDate.setMinutes(currentDate.getMinutes()+2)
  const updatedFormattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return {
    "specialPart":
        {
          "clientSignatures":spo.specialPart.clientSignatures,
          "externalRepresentationSpecialPart":ersp.data.externalRepresentationSpecialPart,
          "signatureDateTime": updatedFormattedDate,
          "status": "Authorised",
          "statusUpdateDateTime": formattedDate,
          "subjectKeyIdentifier": config.CLIENT_SUBJECT_KEY
        }
  }
}

async function createOuterRepresentationSpecialPart(url = "",bearer ="",data = {}){
  const response = await fetch(url, {
    method: "PUT",
    mode: "cors",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': 'Bearer '+ bearer,
      'Accept-Language': 'ru',
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function createSpecialPartObjectNoRepr(spo){
  const currentDate = new Date();
  const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  currentDate.setMinutes(currentDate.getMinutes()+2)
  const updatedFormattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return {
    "specialPart":
        {
          "clientSignatures":spo.specialPart.clientSignatures,
          "signatureDateTime": updatedFormattedDate,
          "status": "Authorised",
          "statusUpdateDateTime": formattedDate,
          "subjectKeyIdentifier": config.CLIENT_SUBJECT_KEY,
          "verifiedSignatures":[],
        }
  }
}

async function createUserInfoWithSpecialPart(userInfoOuterReprComPart,specPartInfo,specPartHash){
  let userInfoWithSpecialPart =structuredClone(userInfoOuterReprComPart)
  let specPartInfoCopy = structuredClone(specPartInfo)
  specPartInfoCopy.specialPart.externalRepresentationSpecialPart = specPartHash.data.externalRepresentationSpecialPart
  console.log(specPartInfoCopy)
  let res = Object.keys(specPartInfoCopy.specialPart).sort().reduce((acc,key)=>{
    acc[key] = specPartInfoCopy.specialPart[key];
    return acc
  },{});
  userInfoWithSpecialPart.specialPart = res
  console.log(userInfoWithSpecialPart)
  return userInfoWithSpecialPart

}

async function createUserInfoWithSpecialPartECP(userInfoOuterReprComPart,specPartInfo){
  let userInfoWithSpecialPart =structuredClone(userInfoOuterReprComPart)
  let specPartInfoCopy = structuredClone(specPartInfo)
  console.log(specPartInfoCopy)
  let res = Object.keys(specPartInfoCopy.specialPart).sort().reduce((acc,key)=>{
    acc[key] = specPartInfoCopy.specialPart[key];
    return acc
  },{});
  userInfoWithSpecialPart.specialPart = res
  console.log(userInfoWithSpecialPart)
  return userInfoWithSpecialPart
}
function getCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // добавляем ведущий ноль, если месяц < 10
    const day = ('0' + currentDate.getDate()).slice(-2); // добавляем ведущий ноль, если день < 10
    return `${year}-${month}-${day}`;
}

async function signdSCCrypto(dataB64){
  let data = {"Auth":{
    "CryptoType":1,
    "KeyID":config.CLIENT_SUBJECT_KEY,
    "Password":config.CLIENT_PASSWORD
    },
    "DataB64":dataB64,
    "OptAddAllCert":false,
    "OptAddCert":true,
    "OptCheckPrivateKey":true,
    "OptReturnSignCert":true
  }
  await appendToFile("signSCCryptoReq", JSON.stringify(data)).then(console.log("signSCCryptoReq created"))

  const response = await fetch(config.BASE_URL+ "SCCrypto/ra/signd", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      'accept': 'application/json',
      'Accept-Language': 'ru',
    },
    body: JSON.stringify(data)
  });
  return response.json();
}


async function createXJWSSignature(JWSSignature) {

  let buffer = Buffer.from(JSON.stringify(jwsProtectedHeader),'utf-8')
  let base64url = buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  let res = base64url +".."+ JWSSignature
  return res
}

async function getStatus(){
  // const response = await fetch(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountConsents/"+config.consent_id, {
  //   method: "GET",
  //   headers: {
  //     "Content-Type": "application/json;charset=utf-8",
  //     'accept': 'application/json;charset=utf-8',
  //     "x-api-key": "643c6299-c96d-4dd5-a016-5c248ca40869"
  //   }
  // });
  // // await appendToFile("Headers", JSON.stringify(response.headers)).then(console.log("headers were written"))
  // return response.json();

  return "a"
}
async function convertToBase64URL(inputStr){
  let buff = new Buffer(inputStr);
  let base64url = buff.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return base64url
}
async function convertToBase64(inputStr){
  let buff = new Buffer(inputStr);
  let base64data = buff.toString('base64');
  return base64data
}

async function writeToFile(tagName,data){
  fs.writeFileSync('Result.txt',
      "\n" + "========================================="+tagName+"=========================================\n"+
      data, function(error){
   if(error) throw error;
   console.log('Данные успешно записаны записать файл');
  });
}

async function createFile(fileName,data){
  fs.writeFileSync(fileName,data,function(error){if(error) throw error
  console.log('accountList file created')
  })
}
async function appendToFile(tagName,data){
  fs.appendFileSync('Result.txt',
      "\n\n" + "!========================================="+tagName+"=========================================!\n\n"+
      data, function(error){
   if(error) throw error;
   console.log('Данные успешно записаны записать файл');
  });
}

async function appendToDefinedFile(fileName,tagName,data){
  fs.appendFileSync(fileName,
      "\n\n" + "!========================================="+tagName+"=========================================!\n\n"+
      data, function(error){
   if(error) throw error;
   console.log('Данные успешно записаны записать файл');
  });
}

async function checkSign(dataB64, signB64){
  let o = {"Auth":{"CryptoType":1},"DataB64":"","Attributes":[{"OID":"1.2.112.1.2.1.1.1.1.2","Text":"192837465"}],"OptIgnoreCertValidity":false,"OptIgnoreCrl":false,"OptVerifyOnSignDate":true,"SignB64": signB64}
}

function addDaysToDate(date, days) {
    const resultDate = new Date(date);
    resultDate.setDate(resultDate.getDate() + days);
    return formatDate(resultDate);
}

function addMonthsToDate(date, months) {
    const resultDate = new Date(date);
    resultDate.setMonth(resultDate.getMonth() + months);
    return formatDate(resultDate);
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

async function authorizeConsent(userInfoWithSpecialPart,signature,bearer){

  const response = await fetch(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountConsents", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': "Bearer "+bearer,
      'x-jws-signature': signature,
      "x-idempotency-key": uuid.v4()
    },
    body: JSON.stringify(userInfoWithSpecialPart)
  });
  // await appendToFile("Headers", JSON.stringify(response.headers)).then(console.log("headers were written"))
  return [await response.json(),response.headers];

}

async function functionsForAuthorized(apikey,userInfo){
  let lurl = "" //local url for some methods
  await createFile("postAuthorizationMethods.txt","")
  let accounts = ""
  await getAccounts(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts",apikey).then((d)=>{accounts = d})
  await appendToDefinedFile("postAuthorizationMethods.txt","accounts",JSON.stringify(accounts)).then(()=>console.log("accounts showed"))
  let accountsWithConsentId = ""
  await getAccountsWithConsentId(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts",apikey,config.consent_id).then((d)=>{accountsWithConsentId = d})
  await appendToDefinedFile("postAuthorizationMethods.txt","accountsWithConsentId",JSON.stringify(accountsWithConsentId)).then(()=>console.log("accountsWithConsentId showed"))
  let accountsById = ""
  if (userInfo.data.account[0].accountId){
    await getAccountById(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId,apikey).then((d)=>{accountsById = d})
    await appendToDefinedFile("postAuthorizationMethods.txt","accountsById",JSON.stringify(accountsById)).then(()=>console.log("accountsById showed"))
  }

  let balances = ""
  await getBalances(config.BASE_URL + "oapi-channel/open-banking/v1.0/balances",apikey).then((d)=>{balances = d})
  await appendToDefinedFile("postAuthorizationMethods.txt","balances",JSON.stringify(balances)).then(()=>console.log("balances showed"))
  let balancesById = ""
  if (userInfo.data.account[0].accountId){
    lurl = config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId + "/balances"
    await getAccountBalance(lurl,apikey).then((d)=>{balancesById = d})
    await appendToDefinedFile("postAuthorizationMethods.txt","balancesById",JSON.stringify(balancesById)).then(()=>console.log("balancesById showed"))
  }

  let statement = ""
  if (userInfo.data.account[0].accountId) {
    await createStatements(config.BASE_URL + "oapi-channel/open-banking/v1.0/statements/" + userInfo.data.account[0].accountId,apikey).then((d)=>{statement=d})
    await appendToDefinedFile("postAuthorizationMethods.txt","statements",JSON.stringify(statement)).then(()=>console.log("statement showed"))
    let accountStatement = ""
    lurl = config.BASE_URL + "oapi-channel/open-banking/v1.0/statements/" + userInfo.data.account[0].accountId + "/statements/" + statement.data.statement.statementId
    console.log(statement.data.statement.statementId)
    await getStatements(lurl, apikey).then((d)=>{accountStatement = d; console.log(d)})
    await appendToDefinedFile("postAuthorizationMethods.txt","accountStatement",JSON.stringify(accountStatement)).then(()=>console.log("accountStatement showed"))
  }

  let transactions = ""
  if (userInfo.data.account[0].accountId){
    await createTransactions(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId + "/transactions",apikey).then((d) => {transactions=d})
    await appendToDefinedFile("postAuthorizationMethods.txt","transactions",JSON.stringify(transactions)).then(() => {console.log("transactions showed")})
    let transactions_get = ""
    console.log(transactions.data.transaction.transactionListId)
    await getTransactions(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId + "/transactions/"  + transactions.data.transaction.transactionListId, apikey).then((d)=>{transactions_get = d; console.log(d)})
    await appendToDefinedFile("postAuthorizationMethods.txt","get_transactions",JSON.stringify(transactions_get)).then(()=>console.log("get_transactions showed"))

  }
}

async function getAccounts(url,apikey){
  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-api-key': apikey,
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function getAccountsWithConsentId(url,apikey,consentId){
  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-accountConsentId':consentId,
        'x-api-key': apikey,
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function getAccountById(url,apikey){
  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-api-key': apikey,
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function getBalances(url,apikey){
  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-api-key': apikey,
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function getAccountBalance(url,apikey){
  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-api-key': apikey,
      },
    });
    return response.data;

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}
async function createStatements(url,apikey){
  try {
    let reqBody = {"data":{"statement":{"fromBookingDate":"2024-03-20","toBookingDate":"2024-06-20"}},"risk":{}}
    const response = await fetch(url, {
      rejectUnauthorized: false,
      method: "POST",
      mode: "cors",
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-api-key': apikey,
        'Content-Type':'application/json;charset=utf-8',
        'x-idempotency-key':uuid.v4()
      },
      body: JSON.stringify(reqBody)
    });
    return response.json(); // parses JSON response into native JavaScript objects

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function getStatements(url,apikey){
  try {
    const response = await fetch(url, {
    method: "GET",
    headers: {
      'accept': 'application/json;charset=utf-8',
      'x-api-key': apikey,
    },
  });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function createTransactions(url,apikey){
  try {
    let reqBody = "{\"data\":{\"transaction\":{\"fromBookingDateTime\":\"2022-09-07T23:59:59.999Z\",\"toBookingDateTime\":\"2026-09-02T23:59:59.999Z\"}},\"risk\":{}}"
    const response = await fetch(url, {
      rejectUnauthorized: false,
      method: "POST",
      mode: "cors",
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-api-key': apikey,
        'Content-Type':'application/json;charset=utf-8',
        'x-idempotency-key':uuid.v4()
      },
      body: reqBody
    });
    return response.json(); // parses JSON response into native JavaScript objects

  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function getTransactions(url,apikey){
  try {
    const response = await fetch(url, {
    method: "GET",
    headers: {
      'accept': 'application/json;charset=utf-8',
      'x-api-key': apikey,
    },
  });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

async function getSecretByClientName(clientName,swaggerBotSecret){
    let bearer
    await getBearerToken(config.BASE_URL + "auth/realms/SCRealm/protocol/openid-connect/token","client_id=swaggerBot&client_secret="+swaggerBotSecret+"&grant_type=client_credentials&scope=SC-APPS online-banking openid").then((data)=> {
      bearer = data.access_token
    })
    const response = await fetch(config.BASE_URL + "auth/admin/realms/SCRealm/clients/"+clientName+"/client-secret", {
    method: "GET",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      'accept': 'application/json;charset=utf-8',
      'Authorization': "Bearer "+bearer,
    },
  });
  return response.json();
}
async function main(){

  //BearerToken

  let bearerToken = ""
  await getBearerToken(config.BASE_URL + "auth/realms/SCRealm/protocol/openid-connect/token",config.BEARER_DATA).then((data)=>{
    console.log('getBearerTokenInfo:')
    console.log(data)
    bearerToken = data.access_token
  })

  await writeToFile("bearerToken",bearerToken).then(console.log("bearerToken created"))

  //Intents

  let isIntentExist = false
  await intentExist(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountIntents/"+ config.CLIENT_NAME,bearerToken).then((data)=> {
    console.log('intentExistInfo:')
    console.log(data)
    if(data.data.status == "Authorised"){
      isIntentExist = true
      config.intent_api_key = data.data.apikey
    }
   }).catch(e => {console.log("================ERROR IN OBTAINING INTENT STATUS================")})
  if(isIntentExist) {
    console.log("Долгосрочное согласие существует, в создании нового нет необходимости")
  } else {
    let data = {
        "data":{
          "personalAccessUser":config.CLIENT_NAME
        }
    }
    await createIntent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountIntents', bearerToken,data).then((data) => {

      console.log('createdIntent:')
      console.log(data)
      config.intent_api_key = data.data.apikey
    })
  }

  console.log(JSON.stringify(config))
  await appendToFile("config",JSON.stringify(config)).then(console.log("config: " + JSON.stringify(config)))

  let intentResultText =isIntentExist ? "Долгосрочное согласие с id " + config.intent_api_key +" существует" :
      "Создано долгосрочное согласие с id " + config.intent_api_key
  await appendToFile("intent",intentResultText).then(console.log("intent " + isIntentExist))

// 97424e79-e923-40f2-8ab9-e8b3d598738a
  //Consent
  // 68891338-31b4-4e31-8ce1-17bc7cc0e3ce - client
  // 2070d91e-baa2-4fb2-a6d3-0ff73d3ba2b9 - user - 40ac37a1-d4f1-453d-97f3-c342729bfc89 из Kc
  // 97424e79-e923-40f2-8ab9-e8b3d598738a - сервисный
  let data = {"data":{"expirationDate":addYearsToDate(currentDate,3),"permissions":["ReadAccountsBasic","ReadAccountsDetail","ReadBalances","ReadStatementsBasic","ReadStatementsDetail","ReadTransactionsBasic","ReadTransactionsDetail","ReadTransactionsCredits","ReadTransactionsDebits"],"transactionFromDate":subtractYearsFromDate(currentDate,2),"transactionToDate":addYearsToDate(currentDate,2)},"risk":{}}
  if (!isECP) {
    if (!testingMode) {

      await createConsent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents', config.intent_api_key, data).then((data) => {
        console.log('createdConsent:')
        console.log(data)
        config.consent_id = data.data.accountConsentId
      })
    }

    //   let clientSecret
    //   let mtb300bearerToken
    //   await getSecretByClientName("dc2e30ad-9123-4292-99dc-d13ad55bcdeb").then((data) => {clientSecret = data.value})
    //   let mtbCredentials = "client_id="+config.CLIENT_NAME+"&client_secret="+clientSecret+"&grant_type=client_credentials&scope=SC-APPS accounts openid"
    //   await getBearerToken(config.BASE_URL + "auth/realms/SCRealm/protocol/openid-connect/token",mtbCredentials).then((data)=>{
    //     console.log('getBearerTokenInfo:')
    //     console.log(data)
    //     mtb300bearerToken = data.access_token
    //   })
    //   console.log("mtb300 token: " + mtb300bearerToken)
    //   await createConsentECP(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents', mtb300bearerToken, data).then((data) => {
    //     console.log('createdConsent:')
    //     console.log(data)
    //     config.consent_id = data.data.accountConsentId
    //   })
    //   console.log("consent Id: " + config.consent_id)
    // } else {
    //   config.consent_id = initialConsentId
    // }

  } else{


    // await createConsent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents', config.intent_api_key, data).then((data) => {
    //     console.log('createdConsent:')
    //     console.log(data)
    //     config.consent_id = data.data.accountConsentId
    //   })
    config.consent_id = initialConsentId
    config.CLIENT_NAME = "AISPtestClient"

    // let clientSecret
    // let mtb300bearerToken
    // await getSecretByClientName("c1182849-8f22-4deb-a8ae-ab0ee6aeaf6e","ITXg6vsnN80ZqLGQdEQkFKa5FG7p8eZ9").then((data) => {clientSecret = data.value})
    // let mtbCredentials = "client_id="+config.CLIENT_NAME+"&client_secret="+clientSecret+"&grant_type=client_credentials&scope=SC-APPS accounts openid"
    // await getBearerToken(config.BASE_URL + "auth/realms/SCRealm/protocol/openid-connect/token",mtbCredentials).then((data)=>{
    //   console.log('getBearerTokenInfo:')
    //   console.log(data)
    //   mtb300bearerToken = data.access_token
    // })
    // console.log("client token: " + mtb300bearerToken)
    // await createConsentECP(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents', mtb300bearerToken, data).then((data) => {
    //   console.log('createdConsent:')
    //   console.log(data)
    //   config.consent_id = data.data.accountConsentId
    // })
    // console.log("consent Id: " + config.consent_id)
  }

  await appendToFile("consent",config.consent_id).then(console.log("consent created"))


  let userInfo
  console.log(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountsList/login/'+config.CLIENT_NAME+'/accountConsents/' + config.consent_id)

  await parseInfoAboutUser(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountsList/login/' + config.CLIENT_NAME + '/accountConsents/' + config.consent_id, bearerToken).then((data) => {
    console.log("accountsList/login")
    console.log(data)
    userInfo = data
  })
  await createFile("accountsList.txt",JSON.stringify(userInfo)).then(console.log("accountsListFilled"))

  isAllAccounts = await readline.question('Modify account list and input any symbol');
  try {
    const data = await readFile("accountsList.txt", 'utf8');
    userInfo = JSON.parse(data);
  } catch (err) {
    throw err;
  }

  await appendToFile("userInfo",JSON.stringify(userInfo)).then(console.log("userInfo created"))
  //ExternalRepresentation

  let externalRepresentation
  console.log(JSON.stringify(userInfo))
  await createExternalRepresentation(config.BASE_URL+'oapi-channel/open-banking/v1.0/accountConsents/createExternalRepresentation',bearerToken,userInfo).then((data) => {
    console.log(data)
    externalRepresentation = data.data.externalRepresentation
  })

  let userInfoExtReprComPart
  await createUserInfoExtReprComPart(userInfo,externalRepresentation).then((data) =>{
    console.log("===============userInfoExtReprComPart=================")
    console.log(data)
    userInfoExtReprComPart = data
  })

  await appendToFile("userInfoExtReprComPart",JSON.stringify(userInfoExtReprComPart)).then(console.log("userInfoExtReprComPart created"))
  // imitation Insert

  if (!isECP) {
    let imitInsert

    await createImitationInsert(userInfo, externalRepresentation).then((data) => {
      console.log("================================IMIT===================================================")
      console.log(data)
      imitInsert = data.ResultB64
    })

    await appendToFile("IMIT", imitInsert).then(console.log("imit created"))
    //special part
    let specialPartObject
    await createSpecialPartObject(imitInsert).then((data) => {
      console.log(data)
      specialPartObject = data
    })

    await appendToFile("specialPartObject", JSON.stringify(specialPartObject)).then(console.log("specialPartObject created"))
    let specialPartHash
    await createOuterRepresentationSpecialPart(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountConsents/createSpecialPartExternalRepresentation", bearerToken, specialPartObject).then((data) => {
      console.log(data)
      specialPartHash = data
    })

    await appendToFile("specialPartHash", JSON.stringify(specialPartHash)).then(console.log("specialPartHash created"))

    let userInfoWithSpecialPart
    await createUserInfoWithSpecialPart(userInfoExtReprComPart, specialPartObject, specialPartHash).then((data) => {
      userInfoWithSpecialPart = data
      console.log(data)
    })

    fs.writeFile('userInfo.txt', JSON.stringify(userInfoWithSpecialPart), function (error) {
      if (error) throw error;
      console.log('Данные успешно записаны записать файл');
    });

    await appendToFile("userInfoWithSpecialPart", JSON.stringify(userInfoWithSpecialPart)).then(console.log("userInfoWithSpecialPart created"))

    await createFile("fullBody.txt",JSON.stringify(userInfoWithSpecialPart)).then(console.log("temp filled"))

    let fullBody = await readline.question('Modify fullBody and input any symbol');
    if(1) {
      try {
        const data = await readFile("fullBody.txt", 'utf8');
        console.log("33" + fullBody);
        userInfoWithSpecialPart = JSON.parse(data);
      } catch (err) {
        throw err;
      }
    }

    let userInfoWithSpecialPartBase64
    await convertToBase64URL(JSON.stringify(userInfoWithSpecialPart)).then((d) => {
      userInfoWithSpecialPartBase64 = d
    })

    await appendToFile("userInfoWithSpecialPartBase64", JSON.stringify(userInfoWithSpecialPartBase64)).then(console.log("userInfoWithSpecialPartBase64 created"))

    let jwsPayloadBase64
    await convertToBase64URL(JSON.stringify(jwsProtectedHeader)).then((d) => {
      jwsPayloadBase64 = d
    })
    let headerWithUserInfoWithSpecialPartBase64
    headerWithUserInfoWithSpecialPartBase64 = jwsPayloadBase64 + "." + userInfoWithSpecialPartBase64

    await appendToFile("headerWithUserInfoWithSpecialPartBase64", headerWithUserInfoWithSpecialPartBase64).then(console.log("headerWithUserInfoWithSpecialPartBase64 created"))

    let doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64
    await convertToBase64(headerWithUserInfoWithSpecialPartBase64).then((data) => {
      console.log(doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64)
      doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64 = data
    })

    await appendToFile("doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64", doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64).then(console.log("doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64 created"))

    let signedData
    await signdSCCrypto(doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64).then((data) => {
      console.log(data)
      signedData = data
    })

    await appendToFile("signedData", JSON.stringify(signedData)).then(console.log("signedData created"))
    let JWSSignature = signedData.ResultB64

    const decodedBuffer = Buffer.from(JWSSignature, 'base64');
    // Преобразуем в Base64 URL
    const base64Url = decodedBuffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await appendToFile("signedDataFromBASE64toBASE64URL", JSON.stringify(base64Url)).then(console.log("signedDataFromBASE64toBASE64URL created"))

    let xJwsSignature
    await createXJWSSignature(base64Url).then((data) => {
      console.log("======================================x-jws-signature=============================")
      console.log(data)
      xJwsSignature = data
    })

    await appendToFile("JWSSignature", xJwsSignature).then(console.log("JWSSignature created"))

    fs.writeFile('signature.txt', xJwsSignature, function (error) {
      if (error) throw error;
      console.log('Данные успешно записаны');
    });

    let headers ="empty"
    let authorizedConsent
    await authorizeConsent(userInfoWithSpecialPart, xJwsSignature, bearerToken).then(([d,h]) => {
      console.log(d)
      authorizedConsent = d
      headers = h
    })

    await appendToFile("Authorized consent", JSON.stringify(authorizedConsent)).then(console.log("tried to authorize consent"))
    await appendToFile("Consent headers", JSON.stringify(headers)).then(console.log("tried to write headers"))

    if (authorizedConsent.data) {
      console.log("CONSENT SUCCESSFULLY AUTHORIZED")
      console.log(headers)
    } else {
      console.log("ERROR AUTHORIZING CONSENT")
    }
    ///
    ///

  } else {
    // subscribe with ECP
    //special part
    let specialPartObject
    await createSpecialPartObjectECP().then((data) => {
      console.log(data)
      specialPartObject = data
    })

    await appendToFile("specialPartObject", JSON.stringify(specialPartObject)).then(console.log("specialPartObject created"))

    let userInfoWithSpecialPart
    await createUserInfoWithSpecialPartECP(userInfoExtReprComPart, specialPartObject).then((data) => {
      userInfoWithSpecialPart = data
      console.log(data)
    })

    fs.writeFile('userInfo.txt', JSON.stringify(userInfoWithSpecialPart), function (error) {
      if (error) throw error;
      console.log('Данные успешно записаны записать файл');
    });

    let userInfoWithSpecialPartBase64
    await convertToBase64(JSON.stringify(userInfoWithSpecialPart)).then((data) => {
      console.log(data)
      userInfoWithSpecialPartBase64 = data
    })

    await appendToFile("userInfoWithSpecialPart", JSON.stringify(userInfoWithSpecialPart)).then(console.log("userInfoWithSpecialPart created"))

    let signedData
    await signdSCCrypto(userInfoWithSpecialPartBase64).then((data) => {
      console.log(data)
      signedData = data
    })

    await appendToFile("signedData", JSON.stringify(signedData)).then(console.log("signedData created"))

    let JWSSignature = signedData.ResultB64
    await appendToFile("ResultB64 certificates from signed data", JSON.stringify(JWSSignature)).then(console.log("ResultB64 certificates from signed data received"))

    //add signature to full object (userInfoWithSpecialPart)
    let userInfoWithSpecialPartWithSignature = structuredClone(userInfoWithSpecialPart)
    userInfoWithSpecialPartWithSignature.specialPart.clientSignatures[0].signature = JWSSignature
    await appendToFile("signature added to object", JSON.stringify(userInfoWithSpecialPartWithSignature)).then(console.log("signature added to object"))

    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    //-------------------------------------------------------------------
    let specialPartHash
    specialPartObject.specialPart.clientSignatures[0].signature = JWSSignature

    await appendToFile("specialPartObject", JSON.stringify(specialPartObject)).then(console.log("special part object with signature"))

    let spoECPfullNoRepr
    await createSpecialPartObjectNoRepr(specialPartObject).then((data) => {
      console.log(data)
      spoECPfullNoRepr = data
    })

    await appendToFile("spoECPfullNoRepr", JSON.stringify(spoECPfullNoRepr)).then(console.log("spoECPfullNoRepr created"))

    await createOuterRepresentationSpecialPart(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountConsents/createSpecialPartExternalRepresentation", bearerToken, spoECPfullNoRepr).then((data) => {
      console.log(data)
      specialPartHash = data
    })

    await appendToFile("specialPartHash", JSON.stringify(specialPartHash)).then(console.log("special part hash created"))

    let spoECPfull
    await createSpecialPartObjectECPFull(specialPartObject,specialPartHash).then((data) => {
      console.log(data)
      spoECPfull = data
    })
    await appendToFile("spoECPfull", JSON.stringify(spoECPfull)).then(console.log("spoECPfull created"))


    let fullComSpec
    await createUserInfoWithSpecialPartECP(userInfoExtReprComPart, spoECPfull).then((data) => {
      fullComSpec = data
      console.log(data)
    })

    await appendToFile("fullComSpec", JSON.stringify(fullComSpec)).then(console.log("fullComSpec created"))

    let userInfoWithSpecialPartWithSignatureBase64
    await convertToBase64URL(JSON.stringify(fullComSpec)).then((d) => {
      userInfoWithSpecialPartWithSignatureBase64 = d
    })

    await appendToFile("userInfoWithSpecialPartWithSignatureBase64", JSON.stringify(userInfoWithSpecialPartWithSignatureBase64)).then(console.log("userInfoWithSpecialPartWithSignatureBase64"))

    let jwsPayloadBase64
    await convertToBase64URL(JSON.stringify(jwsProtectedHeader)).then((d) => {
      jwsPayloadBase64 = d
    })
    let headerWithUserInfoWithSpecialPartBase64
    headerWithUserInfoWithSpecialPartBase64 = jwsPayloadBase64 + "." + userInfoWithSpecialPartWithSignatureBase64

    await appendToFile("headerWithUserInfoWithSpecialPartBase64", headerWithUserInfoWithSpecialPartBase64).then(console.log("headerWithUserInfoWithSpecialPartBase64 created"))

    let doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64
    await convertToBase64(headerWithUserInfoWithSpecialPartBase64).then((data) => {
      console.log(doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64)
      doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64 = data
    })

    await appendToFile("doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64", doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64).then(console.log("doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64 created"))

    await signdSCCrypto(doubleEncryptedHeaderWithUserInfoWithSpecialPartBase64).then((data) => {
      console.log(data)
      signedData = data
    })

    await appendToFile("signedData", JSON.stringify(signedData)).then(console.log("signedData created"))
    JWSSignature = signedData.ResultB64
    const decodedBuffer = Buffer.from(JWSSignature, 'base64');
    // Преобразуем в Base64 URL
    const base64Url = decodedBuffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');


    let xJwsSignature
    await createXJWSSignature(base64Url).then((data) => {
      console.log("======================================x-jws-signature=============================")
      console.log(data)
      xJwsSignature = data
    })

    await appendToFile("JWSSignature", xJwsSignature).then(console.log("JWSSignature created"))

    fs.writeFile('signature.txt', xJwsSignature, function (error) {
      if (error) throw error;
      console.log('Данные успешно записаны');
    });
    let headersConsent
    let authorizedConsent
    await authorizeConsent(fullComSpec, xJwsSignature, bearerToken).then(([d,h]) => {
      console.log(d)
      console.log(h)
      authorizedConsent = d
      headersConsent = h
    })

    await appendToFile("Authorized consent", JSON.stringify(authorizedConsent)).then(console.log("tried to authorize consent"))

    // await appendToFile("Authorized consent headers", headersConsent._).then(console.log("consent headers"))

    if (authorizedConsent.data) {
      console.log("CONSENT SUCCESSFULLY AUTHORIZED")
    } else {
      console.log("ERROR AUTHORIZING CONSENT")
    }
  }

  await functionsForAuthorized(config.intent_api_key,userInfo).then("Additional functions executed")

}

main()
