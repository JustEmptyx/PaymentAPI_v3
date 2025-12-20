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

function getHeader(signAlg){
    return signAlg === "RS256" ? { "alg": "RS256", "crit": [ "http://openbanking.asb.by/asn1", "http://openbanking.asb.by/crptPrvdr" ], "http://openbanking.asb.by/asn1": true, "http://openbanking.asb.by/crptPrvdr": 3, "typ": "JOSE" } : { "alg": "RS256", "crit": [ "http://openbanking.asb.by/asn1", "http://openbanking.asb.by/crptPrvdr" ], "http://openbanking.asb.by/asn1": true, "http://openbanking.asb.by/crptPrvdr": 3, "typ": "JOSE" }
}
function main () {
    let body = {"data":{"initiation":{"debtor":{"countryOfResidence":"BY","name":"Митрофан Доромидонтович Белуга","privateIdentification":[{"code":"NIDN","identification":"3010190K002PB2"},{"code":"CUST","identification":"841919344"}]},"debtorAgent":{"identification":"AKBBBY2X","name":"ОАО 'АСБ Беларусбанк'"},"localInstrument":"BY.NBRB.ERIP"}},"risk":{"authType":"BY.QPISP.AUTH.BASIC"}}
    let dataB64= jsonToBase64(body)
    let jwsBodyObject = {
	"Auth": {
		"ConnectStr": "hash=1.2.840.113549.1.1.11",
		"CryptoType": 3,
		"KeyID": "64F8824B986C34EB53232E1FACB6B7DCB6A8E5C0",
		"Password": "12345678"
	},
	"DataB64": stringToBase64Url(jsonToBase64url(getHeader('RS256'))+"."+dataB64),
	"OptAddAllCert": false,
	"OptAddCert": true,
	"OptCheckPrivateKey": true,
	"OptReturnSignCert": true
    }

    console.log(JSON.stringify(jwsBodyObject))
}

main()