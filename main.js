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
  BASE_URL : "https://open-banking-akbb.softclub.by/",
  CRYPTO_URL : "https://open-banking-akbb.softclub.by/",
  CLIENT_NAME : "V08B_UNO",
  CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
  CLIENT_OTP : "asb12345",
  CLIENT_PASSWORD : "12345678",
  intent_api_key:"",
  consent_id:"",
  mobile_number: "+375-255427989",
  MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
  BEARER_DATA: "client_id=iBankASB&client_secret=SKnFVnuCGLfVrdl7Q9eT9q1gNdBmIOBc&grant_type=client_credentials&scope=SC-APPS online-banking openid"
}

// let config = {
//   BASE_URL : "https://sc-map-testversion-vip.softclub.by:8008//",
//   CRYPTO_URL : "https://sc-map-testversion-vip.softclub.by:8008//",
//   CLIENT_NAME : "test.client-12",
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
//   BASE_URL : "https://sc-map-testversion-vip.softclub.by:8008/",
//   CRYPTO_URL : "https://sc-map-testversion-vip.softclub.by:8008/",
//   CLIENT_NAME : "V087_TEST1",
//   CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
//   CLIENT_OTP : "asb12345",
//   CLIENT_PASSWORD : "12345678",
//   intent_api_key:"",
//   consent_id:"",
//   mobile_number: "+375-255427989",
//   MAC_KEY:"5uazIPJWWXtnVIbOHA+BMEOv0CcbYFoNCIcXPYtUxzg=",
//   BEARER_DATA: "client_id=digitalChannels&client_secret=rvDMLEf5Njz6L5BGpst4dLP1hMrBWxEV&grant_type=client_credentials&scope=SC-APPS online-banking openid"
// }

// let config = {
//   BASE_URL : "https://sc-map-rrb-vip.softclub.by:8008//",
//   CRYPTO_URL : "http://192.168.181.161:9998/",
//   CLIENT_NAME : "mtb304",
//   CLIENT_SUBJECT_KEY : "B6D7498EE0E67A368E921810E53849B0C7A69646",
//   CLIENT_OTP : "asb123",
//   CLIENT_PASSWORD : "12345678",
//   intent_api_key:"",
//   consent_id:"",
//   mobile_number: "+375-255427989",
//   MAC_KEY:"DC7lWdJvYgVvY77tm2q4DL2hk22U4+u+97MOmVA5ino=",
//   BEARER_DATA: "client_id=digitalChannels&client_secret=yGHOxRbXPw11wGBIQYwOmtaGw6P4TyRg&grant_type=client_credentials&scope=SC-APPS online-banking openid"
// }

// let config = {
//   BASE_URL : "https://map-mtb.softclub.by:8008//",
//   CRYPTO_URL : "http://192.168.181.161:9998/",
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

// let jwsProtectedHeader = {
//     "alg":"BIGNS128",
//     "crit":["http://openbanking.paritetbank.by/asn1","http://openbanking.paritetbank.by/crptPrvdr"],
//     "http://openbanking.paritetbank.by/asn1":true,
//     "http://openbanking.paritetbank.by/crptPrvdr":1,
//     "typ":"JOSE"
//   }

// let jwsProtectedHeader = {
//     "alg":"BIGNS128",
//     "crit":["http://openbanking.asb.by/asn1","http://openbanking.asb.by/crptPrvdr"],
//     "cty": "application/json;charset=UTF-8",
//     "http://openbanking.asb.by/asn1":true,
//     "http://openbanking.asb.by/crptPrvdr":1,
//     "typ":"JOSE"
// }

let jwsProtectedHeader = {
    "alg":"BIGNS128",
    "crit":["http://openbanking.asb.by/asn1","http://openbanking.asb.by/crptPrvdr"],
    "http://openbanking.asb.by/asn1":true,
    "http://openbanking.asb.by/crptPrvdr":1,
    "typ":"JOSE"
}

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
let testingMode = 0
let isECP = 0
let isAllAccounts = 0
let initialConsentId = "4c252054-9077-45e896ca-e92c6acf20ac"
let isBel = 0
let realmName = "SCRealm"
// let realmName = "SCRealm"
let isRS256 = false


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
  let data = ''
  if(!isRS256) {
    data = {
      "Auth": {
        "CryptoType": "1"
      },
      "DataB64": hashedOTP
    }
  } else {
    data = {
      "Auth": {
        "CryptoType": "3",
        "ConnectStr":"hash=2.16.840.1.101.3.4.2.1"
      },
      "DataB64": hashedOTP
    }
  }
  // https://sc-map-rrb-vip.softclub.by:8008//SCCrypto/ra/hash
  console.log(JSON.stringify(data))
  const response = await fetch(config.CRYPTO_URL + "SCCrypto/ra/hash", {
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
  await appendToFile("uiPERMYAKOV", JSON.stringify(ui)).then(console.log("uiPERMYAKOV created"))
  let buff = new Buffer(JSON.stringify(ui));
  let extendedBodyHash = buff.toString('base64');

  console.log(config.MAC_KEY)
  console.log(extendedBodyHash)
  // await createMACkey().then((data)=>{console.log(data)})
  await createMACkey().then((data)=>{config.MAC_KEY = data.ResultB64})

  console.log("generated MAC_KEY" + config.MAC_KEY)
  let data = ''
  if(!isRS256) {
    data = {
      "Auth": {
        "CryptoType": 3,
        "ConnectStr": "hash=1.2.112.0.2.0.34.101.31.53"
      },
      "DataB64": extendedBodyHash,
      "MACKeyB64": config.MAC_KEY
    }
  } else {
    data = {
      "Auth": {
        "CryptoType": 3,
        "ConnectStr": "hash=2.16.840.1.101.3.4.2.1"
      },
      "DataB64": extendedBodyHash,
      "MACKeyB64": config.MAC_KEY
    }
  }
  console.log(JSON.stringify(data))
  //
  const response = await fetch(config.CRYPTO_URL+"SCCrypto/ra/hash", {
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
//yrUhCEcPDl0=
async function signdSCCrypto(dataB64){
  let data
  if(!isRS256) {
    data = {
      "Auth": {
        "CryptoType": 1,
        "KeyID": config.CLIENT_SUBJECT_KEY,
        "Password": config.CLIENT_PASSWORD
      },
      "DataB64": dataB64,
      "OptAddAllCert": false,
      "OptAddCert": true,
      "OptCheckPrivateKey": true,
      "OptReturnSignCert": true
    }
  } else {
    data = {
      "Auth": {
        "ConnectStr":"hash=1.2.840.113549.1.1.11",
        "CryptoType": 3,
        "KeyID": config.CLIENT_SUBJECT_KEY,
        "Password": config.CLIENT_PASSWORD
      },
      "DataB64": dataB64,
      "OptAddAllCert": false,
      "OptAddCert": true,
      "OptCheckPrivateKey": true,
      "OptReturnSignCert": true
    }
  }
  const response = await fetch(config.CRYPTO_URL+ "SCCrypto/ra/signd", {
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
  // let accountsWithConsentId = ""
  // await getAccountsWithConsentId(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts",apikey,config.consent_id).then((d)=>{accountsWithConsentId = d})
  // await appendToDefinedFile("postAuthorizationMethods.txt","accountsWithConsentId",JSON.stringify(accountsWithConsentId)).then(()=>console.log("accountsWithConsentId showed"))
  // let accountsById = ""
  // if (userInfo.data.account[0].accountId){
  //   await getAccountById(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId,apikey).then((d)=>{accountsById = d})
  //   await appendToDefinedFile("postAuthorizationMethods.txt","accountsById",JSON.stringify(accountsById)).then(()=>console.log("accountsById showed"))
  // }

  // let balances = ""
  // await getBalances(config.BASE_URL + "oapi-channel/open-banking/v1.0/balances",apikey).then((d)=>{balances = d})
  // await appendToDefinedFile("postAuthorizationMethods.txt","balances",JSON.stringify(balances)).then(()=>console.log("balances showed"))
  // let balancesById = ""
  // if (userInfo.data.account[0].accountId){
  //   lurl = config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId + "/balances"
  //   await getAccountBalance(lurl,apikey).then((d)=>{balancesById = d})
  //   await appendToDefinedFile("postAuthorizationMethods.txt","balancesById",JSON.stringify(balancesById)).then(()=>console.log("balancesById showed"))
  // }
  userInfo = {"data":{"account":[{"accountId":"BA2147957"}]}}
  let statement = ""
  if (userInfo.data.account[0].accountId) {
    await createStatements(config.BASE_URL + "oapi-channel/open-banking/v1.0/statements/" + userInfo.data.account[0].accountId,apikey).then((d)=>{statement=d})
    await appendToDefinedFile("postAuthorizationMethods.txt","statements",JSON.stringify(statement)).then(()=>console.log("statement showed"))
    // let accountStatement = ""
    // lurl = config.BASE_URL + "oapi-channel/open-banking/v1.0/statements/" + userInfo.data.account[0].accountId + "/statements/" + statement.data.statement.statementId
    // console.log(statement.data.statement.statementId)
    // await getStatements(lurl, apikey).then((d)=>{accountStatement = d; console.log(d)})
    // await appendToDefinedFile("postAuthorizationMethods.txt","accountStatement",JSON.stringify(accountStatement)).then(()=>console.log("accountStatement showed"))
  }

  // let transactions = ""
  // if (userInfo.data.account[0].accountId){
  //   await createTransactions(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId + "/transactions",apikey).then((d) => {transactions=d})
  //   await appendToDefinedFile("postAuthorizationMethods.txt","transactions",JSON.stringify(transactions)).then(() => {console.log("transactions showed")})
  //   let transactions_get = ""
  //   console.log(transactions.data.transaction.transactionListId)
  //   await getTransactions(config.BASE_URL + "oapi-channel/open-banking/v1.0/accounts/" +userInfo.data.account[0].accountId + "/transactions/"  + transactions.data.transaction.transactionListId, apikey).then((d)=>{transactions_get = d; console.log(d)})
  //   await appendToDefinedFile("postAuthorizationMethods.txt","get_transactions",JSON.stringify(transactions_get)).then(()=>console.log("get_transactions showed"))
  //
  // }
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
    let reqBody = {"data":{"statement":{"fromBookingDate":"2025-11-25","toBookingDate":"2025-11-25"}},"risk":{}}
    const response = await fetch(url, {
      rejectUnauthorized: false,
      method: "POST",
      mode: "cors",
      headers: {
        'accept': 'application/json;charset=utf-8',
        'x-api-key': apikey,
        'Content-Type':'application/json;charset=utf-8',
        'x-idempotency-key':uuid.v4(),
        'x-accountConsentId':"5f1d90a4-ad07-41fa9b88-7d91f4c347de"
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
    await getBearerToken(config.BASE_URL + "auth/realms/"+realmName+"/protocol/openid-connect/token","client_id=swaggerBot&client_secret="+swaggerBotSecret+"&grant_type=client_credentials&scope=SC-APPS online-banking openid").then((data)=> {
      bearer = data.access_token
    })
    const response = await fetch(config.BASE_URL + "auth/admin/realms/"+realmName+"clients/"+clientName+"/client-secret", {
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
    await getBearerToken(config.BASE_URL + "auth/realms/" + realmName + "/protocol/openid-connect/token", config.BEARER_DATA).then((data) => {
      console.log('getBearerTokenInfo:')
      console.log(data)
      bearerToken = data.access_token
    })

    await writeToFile("bearerToken", bearerToken).then(console.log("bearerToken created"))

    //Intents

    let isIntentExist = false
    await intentExist(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountIntents/" + config.CLIENT_NAME, bearerToken).then((data) => {
      console.log('intentExistInfo:')
      console.log(data)
      if (data.data.status == "Authorised") {
        isIntentExist = true
        config.intent_api_key = data.data.apikey
      }
    }).catch(e => {
      console.log("================ERROR IN OBTAINING INTENT STATUS================")
    })
    if (isIntentExist) {
      console.log("Долгосрочное согласие существует, в создании нового нет необходимости")
    } else {
      let data = {
        "data": {
          "personalAccessUser": config.CLIENT_NAME
        }
      }
      await createIntent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountIntents', bearerToken, data).then((data) => {

        console.log('createdIntent:')
        console.log(data)
        config.intent_api_key = data.data.apikey
      })
    }

    let intentResultText = isIntentExist ? "Долгосрочное согласие с id " + config.intent_api_key + " существует" :
        "Создано долгосрочное согласие с id " + config.intent_api_key
    await appendToFile("intent", intentResultText).then(console.log("intent " + isIntentExist))

    //Consent

    // let data = {
    //   "data": {
    //     "expirationDate": addDaysToDate(currentDate, 2),
    //     "permissions": ["ReadAccountsBasic", "ReadAccountsDetail", "ReadBalances", "ReadStatementsBasic", "ReadStatementsDetail", "ReadTransactionsBasic", "ReadTransactionsDetail", "ReadTransactionsCredits", "ReadTransactionsDebits"],
    //     // "permissions": ["ReadAccountsBasic"],
    //     "transactionFromDate": subtractYearsFromDate(currentDate, 2),
    //     "transactionToDate": addYearsToDate(currentDate, 2)
    //   }, "risk": {}
    // }

      let data = {
      "data": {
        "permissions": ["ReadAccountsBasic", "ReadAccountsDetail", "ReadBalances", "ReadStatementsBasic", "ReadStatementsDetail", "ReadTransactionsBasic", "ReadTransactionsDetail", "ReadTransactionsCredits", "ReadTransactionsDebits"],
      }, "risk": {}
    }

    if (!isECP) {
      if (!testingMode) {

        await createConsent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents', config.intent_api_key, data).then((data) => {
          console.log('createdConsent:')
          console.log(data)
          config.consent_id = data.data.accountConsentId
        })
      } else {
        config.consent_id = initialConsentId
      }

      //   let clientSecret
      //   let mtb300bearerToken
      //   await getSecretByClientName("dc2e30ad-9123-4292-99dc-d13ad55bcdeb").then((data) => {clientSecret = data.value})
      //   let mtbCredentials = "client_id="+config.CLIENT_NAME+"&client_secret="+clientSecret+"&grant_type=client_credentials&scope=SC-APPS accounts openid"
      //   await getBearerToken(config.BASE_URL + "auth/realms/"+realmName+"/protocol/openid-connect/token",mtbCredentials).then((data)=>{
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

    } else {


      await createConsent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents', config.intent_api_key, data).then((data) => {
        console.log('createdConsent:')
        console.log(data)
        config.consent_id = data.data.accountConsentId
      })


      // let clientSecret
      // let mtb300bearerToken
      // await getSecretByClientName("c1182849-8f22-4deb-a8ae-ab0ee6aeaf6e","ITXg6vsnN80ZqLGQdEQkFKa5FG7p8eZ9").then((data) => {clientSecret = data.value})
      // let mtbCredentials = "client_id="+config.CLIENT_NAME+"&client_secret="+clientSecret+"&grant_type=client_credentials&scope=SC-APPS accounts openid"
      // await getBearerToken(config.BASE_URL + "auth/realms/"+realmName+"/protocol/openid-connect/token",mtbCredentials).then((data)=>{
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

    await appendToFile("consent", config.consent_id).then(console.log("consent created"))


    let userInfo
    console.log(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountsList/login/' + config.CLIENT_NAME + '/accountConsents/' + config.consent_id)

    await parseInfoAboutUser(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountsList/login/' + config.CLIENT_NAME + '/accountConsents/' + config.consent_id, bearerToken).then((data) => {
      console.log("accountsList/login")
      console.log(data)
      userInfo = data
    })
    await createFile("accountsList.txt", JSON.stringify(userInfo)).then(console.log("accountsListFilled"))

    isAllAccounts = await readline.question('Modify account list and input any symbol');
    try {
      const data = await readFile("accountsList.txt", 'utf8');
      console.log("336" + isAllAccounts);
      userInfo = JSON.parse(data);
    } catch (err) {
      throw err;
    }

    await appendToFile("userInfo", JSON.stringify(userInfo)).then(console.log("userInfo created"))
    //ExternalRepresentation

    let externalRepresentation
    console.log(JSON.stringify(userInfo))
    await createExternalRepresentation(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountConsents/createExternalRepresentation', bearerToken, userInfo).then((data) => {
      console.log(data)
      externalRepresentation = data.data.externalRepresentation
    })

    let userInfoExtReprComPart
    await createUserInfoExtReprComPart(userInfo, externalRepresentation).then((data) => {
      console.log("===============userInfoExtReprComPart=================")
      console.log(data)
      userInfoExtReprComPart = data
    })

    await appendToFile("userInfoExtReprComPart", JSON.stringify(userInfoExtReprComPart)).then(console.log("userInfoExtReprComPart created"))
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

      // userInfoWithSpecialPart = {"data":{"AISP":{"AISP":"V087_TEST1","AISPid":"4d90b355-32db-45fb-a625-0d3a9ecfb2df","AISPidentification":[{"AISPname":"ОАО \"Клиент для Open API 2 ИД 217 УНП 100218304\"","countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","organisationIdentification":{"code":"TXID","codeName":"Номер, присвоенный налоговым органом для идентификации организации (для РБ - УНП)","identification":"INN100218304","identificationStatusName":"Юридическое лицо"}}]},"ASPSP":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"OB":{"OBid":"fa2f2975-2504-4ba9-9e7c-850b154cf9ab","OBname":"digitalChannels","OBuserId":"6166","OBuserName":"Тест Тестовая","countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","privateIdentification":{"code":"NIDN","codeName":"Идентификационный номер","identification":"3250582K030PB2"}},"PSUorPAU":{"PSUorPAU":"V087_TEST1","PSUorPAUid":"7b04208f-cf87-4fa4-96a9-0a1a16373ae6","PSUorPAUname":"Тест Тестовая"},"account":[{"accountDescription":"ОАО \"КЛИЕНТ ДЛЯ OPEN API 2 ИД 217 УНП 100218304\"","accountDetails":{"identification":"BY62AKBB36049000027860000000","schemeName":"BY.NBRB.IBAN"},"accountId":"BA1448","accountOwner":{"countryNameOfResidence":"Республика Беларусь","countryOfResidence":"BY","organisationIdentification":{"code":"TXID","codeName":"Номер, присвоенный налоговым органом для идентификации организации (для РБ - УНП)","identification":"INN100218304","identificationStatusName":"Юридическое лицо"},"partyId":"BC217","partyName":"ОАО \"Клиент для Open API 2 ИД 217 УНП 100218304\"","partyOBid":"BE217"},"currency":"USD","currencyName":"Доллар США","status":"Enabled"}],"accountConsentId":"a68735d4-df50-492eb70c-499ccc8ff8b4","creationDateTime":"2025-08-05T11:23:48+03:00","expirationDate":"2028-04-16","externalRepresentation":"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b2JqCjw8L0xhbmcocnUtcnUpL01hcmtJbmZvPDwvTWFya2VkIHRydWU+Pi9NZXRhZGF0YSAxMSAwIFIvT3V0cHV0SW50ZW50c1s8PC9EZXN0T3V0cHV0UHJvZmlsZSAxNCAwIFIvSW5mbyhzUkdCIElFQzYxOTY2LTIuMSkvT3V0cHV0Q29uZGl0aW9uKCkvT3V0cHV0Q29uZGl0aW9uSWRlbnRpZmllcihDdXN0b20pL1MvR1RTX1BERkExL1R5cGUvT3V0cHV0SW50ZW50Pj5dL1BhZ2VzIDIgMCBSL1N0cnVjdFRyZWVSb290IDQgMCBSL1R5cGUvQ2F0YWxvZz4+CmVuZG9iagozIDAgb2JqCjw8L0NyZWF0aW9uRGF0ZShEOjIwMjUwODA1MTEzMzQwKzAzJzAwJykvTW9kRGF0ZShEOjIwMjUwODA1MTEzMzQwKzAzJzAwJykvUHJvZHVjZXIoaVRleHSuIENvcmUgOC4wLjEgXChBR1BMIHZlcnNpb25cKSCpMjAwMC0yMDIzIEFwcnlzZSBHcm91cCBOVikvVGl0bGUo/v9cMDA0IVwwMDQ+XDAwNDNcMDA0O1wwMDQwXDAwNEFcMDA0OFwwMDQ1XDAwMCBcMDA0PVwwMDQwXDAwMCBcMDA0P1wwMDQ+XDAwNDtcMDA0Q1wwMDRHXDAwNDVcMDA0PVwwMDQ4XDAwNDVcMDAwIFwwMDQ4XDAwND1cMDA0RFwwMDQ+XDAwNEBcMDA0PFwwMDQwXDAwNEZcMDA0OFwwMDQ4XDAwMCBcMDA0PlwwMDAgXDAwNEFcMDA0R1wwMDQ1XDAwNEJcMDA0MFwwMDRFXDAwMCBcMDA0OlwwMDQ7XDAwNDhcMDA0NVwwMDQ9XDAwNEJcMDA0MCk+PgplbmRvYmoKMTUgMCBvYmoKPDwvQXNjZW50IDY5My9DSURTZXQgMTcgMCBSL0NhcEhlaWdodCA2OTMvRGVzY2VudCAtMTY1L0ZsYWdzIDMzL0ZvbnRCQm94Wy0zMTYgLTE3MCA2NjUgODMwXS9Gb250RmlsZTIgMTYgMCBSL0ZvbnROYW1lL1dGRkxUVytVYnVudHVNb25vLVJlZ3VsYXIvSXRhbGljQW5nbGUgMC9TdGVtViA4MC9TdHlsZTw8L1Bhbm9zZTwwMDAwMDIwYjA1MDkwMzA2MDIwMzAyMDQ+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dD0iIgogICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgeG1sbnM6cGRmPSJodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvIgogICAgICAgIHhtbG5zOnBkZmFpZD0iaHR0cDovL3d3dy5haWltLm9yZy9wZGZhL25zL2lkLyIKICAgICAgZGM6Zm9ybWF0PSJhcHBsaWNhdGlvbi9wZGYiCiAgICAgIHhtcDpDcmVhdGVEYXRlPSIyMDI1LTA4LTA1VDExOjMzOjQwKzAzOjAwIgogICAgICB4bXA6TW9kaWZ5RGF0ZT0iMjAyNS0wOC0wNVQxMTozMzo0MCswMzowMCIKICAgICAgcGRmOlByb2R1Y2VyPSJpVGV4dMKuIENvcmUgOC4wLjEgKEFHUEwgdmVyc2lvbikgwqkyMDAwLTIwMjMgQXByeXNlIEdyb3VwIE5WIgogICAgICBwZGZhaWQ6cGFydD0iMSIKICAgICAgcGRmYWlkOmNvbmZvcm1hbmNlPSJBIj4KICAgICAgPGRjOnRpdGxlPgogICAgICAgIDxyZGY6QWx0PgogICAgICAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij7QodC+0LPQu9Cw0YHQuNC1INC90LAg0L/QvtC70YPRh9C10L3QuNC1INC40L3RhNC+0YDQvNCw0YbQuNC4INC+INGB0YfQtdGC0LDRhSDQutC70LjQtdC90YLQsDwvcmRmOmxpPgogICAgICAgIDwvcmRmOkFsdD4KICAgICAgPC9kYzp0aXRsZT4KICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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MDAwMDAgbiAKMDAwMDAxNzUyNSAwMDAwMCBuIAowMDAwMDE3NzE3IDAwMDAwIG4gCjAwMDAwMDEyNzAgMDAwMDAgbiAKMDAwMDAyMDc3NiAwMDAwMCBuIAowMDAwMDIwODEyIDAwMDAwIG4gCjAwMDAwMDI0ODQgMDAwMDAgbiAKMDAwMDAwMjczMiAwMDAwMCBuIAowMDAwMDIzNTAxIDAwMDAwIG4gCjAwMDAwMjM1ODEgMDAwMDAgbiAKMDAwMDAyNDIxMyAwMDAwMCBuIAp0cmFpbGVyCjw8L0lEIFs8ZmQyNDkwNWVmMTAwMGNjMDBjNzI1NTVjZmU3NzI5OWNmZjA1Yzc0NWZkNWRkNGJlMjhmODE2MTcwYTM3YzdlODJmNDgwZTYxN2U5M2U2MzRiMjNjNzJjZGM5YWVmMWEwZTkzMjk0MWRmMjczZmZjNjU2NWIwMWQzZThjZTFmMzU+PGZkMjQ5MDVlZjEwMDBjYzAwYzcyNTU1Y2ZlNzcyOTljZmYwNWM3NDVmZDVkZDRiZTI4ZjgxNjE3MGEzN2M3ZTgyZjQ4MGU2MTdlOTNlNjM0YjIzYzcyY2RjOWFlZjFhMGU5MzI5NDFkZjI3M2ZmYzY1NjViMDFkM2U4Y2UxZjM1Pl0vSW5mbyAzIDAgUi9Sb290IDEgMCBSL1NpemUgMjA+PgolaVRleHQtQ29yZS04LjAuMQpzdGFydHhyZWYKMjQ5OTkKJSVFT0YK","permissions":[{"permission":"ReadAccountsBasic","permissionName":"Просмотр основной информации о счете (счетах) клиента"},{"permission":"ReadAccountsDetail","permissionName":"Просмотр детальной информации о счете (счетах) клиента"}],"status":"AwaitingAuthorisation"},"specialPart":{"HMAC":"bixR/JSsjuM=","OTP":"asb12345","OTPdateTime":"2025-08-05T11:34:19+03:00","externalRepresentationSpecialPart":"JVBERi0xLjcKJeLjz9MKNyAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDY2OD4+c3RyZWFtCniczVY7jtwwDO19Cp8go68/wGCKnd0AKbYI4guMLatIEST3b0JST7Zms9E6WSBIIVCWKEp8fCR9+vL99q09n0/P10+Prbpc2ofHa/OjeZia00fdatVOsTHDB+vbQWkWU2jOygSjTNTKrD1Jmq8zSSdSKavMEmi+pvV1oD1Fw9PcKqXDZfpKRkiRJ09T87l5er42p7u36Npb+nF/S92MqZoZSpcUXIp4sk2u8LesO7hDbsUIl3i9Eym64uIA19lGn3RYl11XEXr5m+0H6HhI3ufzC/Ydvleczbom6a48fHGn2vUkPGq3K7o37PkX94TtDIVI1pSiO3VH40ZjoEFL2tOgM3rEnoPkMbM8El5bjUtfxGUp3qXgQ+x2rDdqzQlviVGA3ohv0JIpKlggnnHZbZAOafwaH9F3RbzTvWlvEJRMnAWbFO8O58P9/RlTR/g5ws/TmmUs6U4mnyX8PA1Hcz8k+I06gqWrYtmVWPbAxRf8AzbCBwv+xgKLDv4bYDW/zn3Bxe+8y/Z/VwqQa8e5+jLXDHzJ59f05oyz8DTLzF0LjuY549yDwy6dFR4jB2RtQR5Y7AXM7ZHY+Gps/NEy1lXNuD+pzA6wqS1NDlbkvvoGe9SVoWrGlK64PerCILu5smVgrn5l9ZT9gjnZXWbO/8WOsYqFPhDWGN9uuDmL19yNXJGBuYraohLa1zO6zNh/ntX60E9D9Q+mL/9glhll6q0WshNra5PyKF67FQA7gMwyoIyG+yAwobkEcw4GXcvHRFLjU5s1PVpwj9ZLJDVDGkw2kWPSMbkdj7uenPEg7AyZzw1F64Z9g+QwXWFzLNo+642HAlL9jevGd/am/A+zMSv3dw8w83lusaNk0V8F4l3VYjxaLTYMfwJxCK5ICmVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PC9Db250ZW50cyA3IDAgUi9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSAxMCAwIFI+Pj4+L1N0cnVjdFBhcmVudHMgMC9UYWJzL1MvVHJpbUJveFswIDAgNTk1IDg0Ml0vVHlwZS9QYWdlPj4KZW5kb2JqCjEyIDAgb2JqCls5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUiA5IDAgUl0KZW5kb2JqCjkgMCBvYmoKPDwvS1swIDEgMiAzIDQgNSA2IDcgOCA5IDEwIDExXS9QIDggMCBSL1BnIDYgMCBSL1MvU3Bhbi9UeXBlL1N0cnVjdEVsZW0+PgplbmRvYmoKOCAwIG9iago8PC9BPDwvQkJveFsyOC4zNSA2ODUuNjUgNTY2LjY1IDgxMy42NV0vTy9MYXlvdXQvU3BhY2VBZnRlciA0L1NwYWNlQmVmb3JlIDQ+Pi9LIDkgMCBSL1AgNSAwIFIvUy9QL1R5cGUvU3RydWN0RWxlbT4+CmVuZG9iago1IDAgb2JqCjw8L0sgOCAwIFIvUCA0IDAgUi9TL0RvY3VtZW50L1R5cGUvU3RydWN0RWxlbT4+CmVuZG9iago0IDAgb2JqCjw8L0tbNSAwIFJdL1BhcmVudFRyZWUgMTMgMCBSL1BhcmVudFRyZWVOZXh0S2V5IDEvUm9sZU1hcDw8Pj4vVHlwZS9TdHJ1Y3RUcmVlUm9vdD4+CmVuZG9iagoxIDAgb2JqCjw8L0xhbmcocnUtcnUpL01hcmtJbmZvPDwvTWFya2VkIHRydWU+Pi9NZXRhZGF0YSAxMSAwIFIvT3V0cHV0SW50ZW50c1s8PC9EZXN0T3V0cHV0UHJvZmlsZSAxNCAwIFIvSW5mbyhzUkdCIElFQzYxOTY2LTIuMSkvT3V0cHV0Q29uZGl0aW9uKCkvT3V0cHV0Q29uZGl0aW9uSWRlbnRpZmllcihDdXN0b20pL1MvR1RTX1BERkExL1R5cGUvT3V0cHV0SW50ZW50Pj5dL1BhZ2VzIDIgMCBSL1N0cnVjdFRyZWVSb290IDQgMCBSL1R5cGUvQ2F0YWxvZz4+CmVuZG9iagozIDAgb2JqCjw8L0NyZWF0aW9uRGF0ZShEOjIwMjUwODA1MTEzNDIyKzAzJzAwJykvTW9kRGF0ZShEOjIwMjUwODA1MTEzNDIyKzAzJzAwJykvUHJvZHVjZXIoaVRleHSuIENvcmUgOC4wLjEgXChBR1BMIHZlcnNpb25cKSCpMjAwMC0yMDIzIEFwcnlzZSBHcm91cCBO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YWJvdXQ9IiIKICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyIKICAgICAgICB4bWxuczpwZGZhaWQ9Imh0dHA6Ly93d3cuYWlpbS5vcmcvcGRmYS9ucy9pZC8iCiAgICAgIGRjOmZvcm1hdD0iYXBwbGljYXRpb24vcGRmIgogICAgICB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wOC0wNVQxMTozNDoyMiswMzowMCIKICAgICAgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDgtMDVUMTE6MzQ6MjIrMDM6MDAiCiAgICAgIHBkZjpQcm9kdWNlcj0iaVRleHTCriBDb3JlIDguMC4xIChBR1BMIHZlcnNpb24pIMKpMjAwMC0yMDIzIEFwcnlzZSBHcm91cCBOViIKICAgICAgcGRmYWlkOnBhcnQ9IjEiCiAgICAgIHBkZmFpZDpjb25mb3JtYW5jZT0iQSI+CiAgICAgIDxkYzp0aXRsZT4KICAgICAgICA8cmRmOkFsdD4KICAgICAgICAgIDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+0KHQvtCz0LvQsNGB0LjQtSDQvdCwINC/0L7Qu9GD0YfQtdC90LjQtSDQuNC90YTQvtGA0LzQsNGG0LjQuCDQviDRgdGH0LXRgtCw0YUg0LrQu9C40LXQvdGC0LA8L3JkZjpsaT4KICAgICAgICA8L3JkZjpBbHQ+CiAgICAgIDwvZGM6dGl0bGU+CiAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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NiAwMDAwMCBuIAowMDAwMDAyMDY3IDAwMDAwIG4gCjAwMDAwMDIzMTUgMDAwMDAgbiAKMDAwMDAyMjYwNSAwMDAwMCBuIAowMDAwMDIyNjg1IDAwMDAwIG4gCjAwMDAwMjMyNjkgMDAwMDAgbiAKdHJhaWxlcgo8PC9JRCBbPDlmNmNkM2I0NzM2NTBlMjZkOTgzNzI3YTA4M2Y1MzhlOThmMmRiMjlmMjA2OTA3MzNmZTM2M2QwZWVmZjg4OThiYzFjZDI2ZGQ4ZmJlY2EzMDc5YjY1OTczOWYxN2IzNTc5ZDFjYmY3OWNlZjM2OTE5ZmIwNWFlOThhNjMxZmQ3Pjw5ZjZjZDNiNDczNjUwZTI2ZDk4MzcyN2EwODNmNTM4ZTk4ZjJkYjI5ZjIwNjkwNzMzZmUzNjNkMGVlZmY4ODk4YmMxY2QyNmRkOGZiZWNhMzA3OWI2NTk3MzlmMTdiMzU3OWQxY2JmNzljZWYzNjkxOWZiMDVhZTk4YTYzMWZkNz5dL0luZm8gMyAwIFIvUm9vdCAxIDAgUi9TaXplIDIwPj4KJWlUZXh0LUNvcmUtOC4wLjEKc3RhcnR4cmVmCjI0MDAxCiUlRU9GCg==","mobileNumber":"+375-296313383","signatureDateTime":"2025-08-05T11:36:19+03:00","status":"Authorised","statusUpdateDateTime":"2025-08-05T11:34:19+03:00","subjectKeyIdentifier":"B6D7498EE0E67A368E921810E53849B0C7A69646"}}

      await appendToFile("userInfoWithSpecialPart_kseniya", JSON.stringify(userInfoWithSpecialPart)).then(console.log("userInfoWithSpecialPart updated"))

      let userInfoWithSpecialPartBase64
      await convertToBase64URL(JSON.stringify(userInfoWithSpecialPart)).then((d) => {
        userInfoWithSpecialPartBase64 = d
      })


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

      let headers = "empty"
      let authorizedConsent
      await authorizeConsent(userInfoWithSpecialPart, xJwsSignature, bearerToken).then(([d, h]) => {
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
      await createSpecialPartObjectECPFull(specialPartObject, specialPartHash).then((data) => {
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
      await authorizeConsent(fullComSpec, xJwsSignature, bearerToken).then(([d, h]) => {
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

async function main1(){
  let bearerToken = ""
    await getBearerToken(config.BASE_URL + "auth/realms/" + realmName + "/protocol/openid-connect/token", config.BEARER_DATA).then((data) => {
      console.log('getBearerTokenInfo:')
      console.log(data)
      bearerToken = data.access_token
    })

    await writeToFile("bearerToken", bearerToken).then(console.log("bearerToken created"))

    //Intents

    let isIntentExist = false
    await intentExist(config.BASE_URL + "oapi-channel/open-banking/v1.0/accountIntents/" + config.CLIENT_NAME, bearerToken).then((data) => {
      console.log('intentExistInfo:')
      console.log(data)
      if (data.data.status == "Authorised") {
        isIntentExist = true
        config.intent_api_key = data.data.apikey
      }
    }).catch(e => {
      console.log("================ERROR IN OBTAINING INTENT STATUS================")
    })
    if (isIntentExist) {
      console.log("Долгосрочное согласие существует, в создании нового нет необходимости")
    } else {
      let data = {
        "data": {
          "personalAccessUser": config.CLIENT_NAME
        }
      }
      await createIntent(config.BASE_URL + 'oapi-channel/open-banking/v1.0/accountIntents', bearerToken, data).then((data) => {

        console.log('createdIntent:')
        console.log(data)
        config.intent_api_key = data.data.apikey
      })
    }

    let intentResultText = isIntentExist ? "Долгосрочное согласие с id " + config.intent_api_key + " существует" :
        "Создано долгосрочное согласие с id " + config.intent_api_key
    await appendToFile("intent", intentResultText).then(console.log("intent " + isIntentExist))

  await functionsForAuthorized(config.intent_api_key,"emptyString").then("Additional functions executed")

}
main1()

