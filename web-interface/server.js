const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');

const PISPauth = require('../PISPauthNew');
const defaultBodies = require('../defaultBodies');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({origin: true,credentials: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(session({
    secret: 'Softclub', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly:true,maxAge:24*60*60*1000,sameSite:'lax',path:'/'},name:'custom_sid' 
}));
app.use((req, res, next) => {
    // console.log('Session ID:', req.sessionID);
    // console.log('Session:', req.session);
    next();
});
debugger;
const functionStates = {};
const functionContexts = {};

const functionGroups = {
    "tokens": [
        "GET PISPtoken",
        "GET QPISPtoken",
        "GET TPEtoken",
        "GET OBtoken"
    ],
    "common": [
        "GET /accountsList/login/{login}/paymentConsents/{paymentConsentId}",
        'PUT /paymentConsents/createSpecialPartExternalRepresentation',
        "GET /paymentConsents",
        "GET /paymentConsents/PSUorPAU/{userId}",
        "GET /payments",
    ],
    "domestic": [
        "POST /paymentConsents/domestic",
        "PUT /paymentConsents/createExternalRepresentation",
        "PATCH /paymentConsents/domestic",
        "GET /paymentConsents/domestic/{domesticConsentId}",
        "DELETE /paymentConsents/domestic/{domesticConsentId}",
        "GET /paymentConsents/domestic/{domesticConsentId}/PSUorPAU/{userId}",
        "DELETE /paymentConsents/domestic/{domesticConsentId}/PSUorPAU/{userId}",
        "POST /payments/domestic",
        "GET /payments/domestic/{domesticId}",
        "DELETE /payments/domestic/{domesticId}",
        "GET /payments/domestic/{domesticId}/PSUorPAU/{userId}",
        "DELETE /payments/domestic/{domesticId}/PSUorPAU/{userId}",
    ],
    "domesticTax": [
        "POST /paymentConsents/domesticTax",
        "PUT /paymentConsents/domesticTax/createExternalRepresentation",
        "PATCH /paymentConsents/domesticTax",
        "GET /paymentConsents/domesticTax/{domesticTaxConsentId}",
        "DELETE /paymentConsents/domesticTax/{domesticTaxConsentId}",
        "GET /paymentConsents/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}",
        "DELETE /paymentConsents/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}",
        "POST /payments/domesticTax",
        "GET /payments/domesticTax/{domesticTaxId}",
        "DELETE /payments/domesticTax/{domesticTaxId}",
        "GET /payments/domesticTax/{domesticTaxId}/PSUorPAU/{userId}",
        "DELETE /payments/domesticTax/{domesticTaxId}/PSUorPAU/{userId}",
    ],
    "listAccounts": [
        "POST /paymentConsents/listAccounts",
        "PUT /paymentConsents/listAccounts/createExternalRepresentation",
        "PATCH /paymentConsents/listAccounts",
        "GET /paymentConsents/listAccounts/{listAccountsConsentId}",
        "DELETE /paymentConsents/listAccounts/{listAccountsConsentId}",
        "GET /paymentConsents/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}",
        "DELETE /paymentConsents/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}",
        "POST /payments/listAccounts",
        "GET /payments/listAccounts/{listAccountsId}",
        "DELETE /payments/listAccounts/{listAccountsId}",
        "GET /payments/listAccounts/{listAccountsId}/PSUorPAU/{userId}",
        "DELETE /payments/listAccounts/{listAccountsId}/PSUorPAU/{userId}",
    ],
    "listPassports": [
        "POST /paymentConsents/listPassports",
        "PUT /paymentConsents/listPassports/createExternalRepresentation",
        "PATCH /paymentConsents/listPassports",
        "GET /paymentConsents/listPassports/{listPassportsConsentId}",
        "DELETE /paymentConsents/listPassports/{listPassportsConsentId}",
        "GET /paymentConsents/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}",
        "DELETE /paymentConsents/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}",
        "POST /payments/listPassports",
        "GET /payments/listPassports/{listPassportsId}",
        "DELETE /payments/listPassports/{listPassportsId}",
        "GET /payments/listPassports/{listPassportsId}/PSUorPAU/{userId}",
        "DELETE /payments/listPassports/{listPassportsId}/PSUorPAU/{userId}",
    ],
    "requirement": [
        "POST /paymentConsents/requirement",
        "PUT /paymentConsents/requirement/createExternalRepresentation",
        "PATCH /paymentConsents/requirement",
        "GET /paymentConsents/requirement/{requirementConsentId}",
        "DELETE /paymentConsents/requirement/{requirementConsentId}",
        "GET /paymentConsents/requirement/{requirementConsentId}/PSUorPAU/{userId}",
        "DELETE /paymentConsents/requirement/{requirementConsentId}/PSUorPAU/{userId}",
        "POST /payments/requirement",
        "GET /payments/requirement/{requirementId}",
        "DELETE /payments/requirement/{requirementId}",
        "GET /payments/requirement/{requirementId}/PSUorPAU/{userId}",
        "DELETE /payments/requirement/{requirementId}/PSUorPAU/{userId}",
    ],
    "taxRequirement": [
        "POST /paymentConsents/taxRequirement",
        "PUT /paymentConsents/taxRequirement/createExternalRepresentation",
        "PATCH /paymentConsents/taxRequirement",
        "GET /paymentConsents/taxRequirement/{taxRequirementConsentId}",
        "DELETE /paymentConsents/taxRequirement/{taxRequirementConsentId}",
        "GET /paymentConsents/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}",
        "DELETE /paymentConsents/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}",
        "POST /payments/taxRequirement",
        "GET /payments/taxRequirement/{taxRequirementId}",
        "DELETE /payments/taxRequirement/{taxRequirementId}",
        "GET /payments/taxRequirement/{taxRequirementId}/PSUorPAU/{userId}",
        "DELETE /payments/taxRequirement/{taxRequirementId}/PSUorPAU/{userId}",
    ],
    "VRP": [
        "POST /paymentConsents/VRP",
        "PUT /paymentConsents/VRP/createExternalRepresentation",
        "PATCH /paymentConsents/VRP",
        "GET /paymentConsents/VRP/{VRPConsentId}",
        "DELETE /paymentConsents/VRP/{VRPConsentId}",
        "GET /paymentConsents/VRP/{VRPConsentId}/PSUorPAU/{userId}",
        "DELETE /paymentConsents/VRP/{VRPConsentId}/PSUorPAU/{userId}",
        "POST /payments/VRP",
        "GET /payments/VRP/{VRPId}",
        "DELETE /payments/VRP/{VRPId}",
        "GET /payments/VRP/{VRPId}/PSUorPAU/{userId}",
        "DELETE /payments/VRP/{VRPId}/PSUorPAU/{userId}",
    ],
};

const functionMappings = {
    'GET PISPtoken': 'createTokenPISP',
    'GET QPISPtoken': 'createTokenQPISP',
    'GET TPEtoken': 'createTokenTPE',
    'GET OBtoken': 'createDboClientToken',

    'GET /accountsList/login/{login}/paymentConsents/{paymentConsentId}':'abstractGETrequest',
    'PUT /paymentConsents/createSpecialPartExternalRepresentation':'putConsentSpecialPartExternalRepresentation',

    'GET /paymentConsents': 'abstractGETrequest',
    'GET /paymentConsents/PSUorPAU/{userId}': 'abstractGETrequest',
    'GET /payments': 'abstractGETrequest',

    'POST /paymentConsents/domestic': 'postDomesticConsent',
    'PUT /paymentConsents/createExternalRepresentation' : 'putDomesticConsentExternalRepresentation',
    'PATCH /paymentConsents/domestic':'patchDomesticConsent',
    'GET /paymentConsents/domestic/{domesticConsentId}': 'abstractGETrequest',
    'DELETE /paymentConsents/domestic/{domesticConsentId}': 'abstractDELETErequest',
    'GET /paymentConsents/domestic/{domesticConsentId}/PSUorPAU/{userId}': 'abstractGETrequest',
    'DELETE /paymentConsents/domestic/{domesticConsentId}/PSUorPAU/{userId}': 'abstractDELETErequest',
    'POST /payments/domestic': 'postDomesticPayment',
    'GET /payments/domestic/{domesticId}': 'abstractGETrequest',
    'DELETE /payments/domestic/{domesticId}': 'abstractDELETErequest',
    'GET /payments/domestic/{domesticId}/PSUorPAU/{userId}': 'abstractGETrequest',
    'DELETE /payments/domestic/{domesticId}/PSUorPAU/{userId}': 'abstractDELETErequest',

    'POST /paymentConsents/domesticTax': 'postDomesticTaxConsent',
    'PUT /paymentConsents/domesticTax/createExternalRepresentation' : 'putDomesticTaxConsentExternalRepresentation',
    "PATCH /paymentConsents/domesticTax": 'patchDomesticTaxConsent',
    "GET /paymentConsents/domesticTax/{domesticTaxConsentId}" : 'abstractGETrequest',
    "DELETE /paymentConsents/domesticTax/{domesticTaxConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/domesticTax": 'postDomesticTaxPayment',
    "GET /payments/domesticTax/{domesticTaxId}": 'abstractGETrequest',
    "DELETE /payments/domesticTax/{domesticTaxId}": 'abstractDELETErequest',
    "GET /payments/domesticTax/{domesticTaxId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/domesticTax/{domesticTaxId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/listAccounts":'postListAccountsConsent',
    'PUT /paymentConsents/listAccounts/createExternalRepresentation' : 'putListAccountsConsentExternalRepresentation',
    "PATCH /paymentConsents/listAccounts":'patchListAccountsConsent',
    "GET /paymentConsents/listAccounts/{listAccountsConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listAccounts/{listAccountsConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/listAccounts":'postListAccountsPayment',
    "GET /payments/listAccounts/{listAccountsId}": 'abstractGETrequest',
    "DELETE /payments/listAccounts/{listAccountsId}": 'abstractDELETErequest',
    "GET /payments/listAccounts/{listAccountsId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/listAccounts/{listAccountsId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/listPassports":'postListPassportsConsent',
    'PUT /paymentConsents/listPassports/createExternalRepresentation' : 'putListPassportsConsentExternalRepresentation',
    "PATCH /paymentConsents/listPassports":'patchListPassportsConsent',
    "GET /paymentConsents/listPassports/{listPassportsConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listPassports/{listPassportsConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/listPassports":'postListPassportsPayment',
    "GET /payments/listPassports/{listPassportsId}": 'abstractGETrequest',
    "DELETE /payments/listPassports/{listPassportsId}": 'abstractDELETErequest',
    "GET /payments/listPassports/{listPassportsId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/listPassports/{listPassportsId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/requirement":'postRequirementConsent',
    'PUT /paymentConsents/requirement/createExternalRepresentation' : 'putRequirementConsentExternalRepresentation',
    "PATCH /paymentConsents/requirement":'patchRequirementConsent',
    "GET /paymentConsents/requirement/{requirementConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/requirement/{requirementConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/requirement/{requirementConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/requirement/{requirementConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/requirement":'postRequirementPayment',
    "GET /payments/requirement/{requirementId}": 'abstractGETrequest',
    "DELETE /payments/requirement/{requirementId}": 'abstractDELETErequest',
    "GET /payments/requirement/{requirementId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/requirement/{requirementId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/taxRequirement":'postTaxRequirementConsent',
    "PUT /paymentConsents/taxRequirement/createExternalRepresentation": 'putTaxRequirementConsentExternalRepresentation',
    "PATCH /paymentConsents/taxRequirement":'patchTaxRequirementConsent',
    "GET /paymentConsents/taxRequirement/{taxRequirementConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/taxRequirement/{taxRequirementConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/taxRequirement":'postTaxRequirementPayment',
    "GET /payments/taxRequirement/{taxRequirementId}": 'abstractGETrequest',
    "DELETE /payments/taxRequirement/{taxRequirementId}": 'abstractDELETErequest',
    "GET /payments/taxRequirement/{taxRequirementId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/taxRequirement/{taxRequirementId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/VRP":'postVRPConsent',
    "PUT /paymentConsents/VRP/createExternalRepresentation": 'putVRPConsentExternalRepresentation',
    "PATCH /paymentConsents/VRP":'patchVRPConsent',
    "GET /paymentConsents/VRP/{VRPConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/VRP/{VRPConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/VRP/{VRPConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/VRP/{VRPConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/VRP":'postVRPPayment',
    "GET /payments/VRP/{VRPId}": 'abstractGETrequest',
    "DELETE /payments/VRP/{VRPId}": 'abstractDELETErequest',
    "GET /payments/VRP/{VRPId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/VRP/{VRPId}/PSUorPAU/{userId}": 'abstractDELETErequest',
};


app.get('/api/functions', (req, res) => {
    const response = {};
    for (const [groupName, functionNames] of Object.entries(functionGroups)) {
        response[groupName] = functionNames.map(name => ({
            name: name,
        }));
    }
    res.json({ groups: response });
});

app.get('/api/defaultBody/:functionName', (req, res) => {
    const { functionName } = req.params;
    const defaultBody = defaultBodies[functionName];
    if (defaultBody !== undefined) {
        res.json({ 
            success: true, 
            body: defaultBody 
        });
    } else {
        res.json({ 
            success: false, 
            body: null 
        });
    }
});

app.get('/api/context/:functionName', (req, res) => {
    const { functionName } = req.params;
    res.json(functionContexts[functionName] || {
        body: '{}',
        enabledHeaders: [],
        lastResult: null
    });
});

app.post('/api/context/:functionName', (req, res) => {
    const { functionName } = req.params;
    const { body, enabledHeaders, apiKey, lastResult } = req.body;

    if (!functionContexts[functionName]) {
        functionContexts[functionName] = {
            body: '{}',
            enabledHeaders: [],
            apiKey: null,
            lastResult: null
        };
    }
    if (body !== undefined) {
        functionContexts[functionName].body = body;
    }

    if (enabledHeaders !== undefined) {
        functionContexts[functionName].enabledHeaders = enabledHeaders;
    }

    if (apiKey !== undefined) {
        functionContexts[functionName].apiKey = apiKey;
    }

    if (lastResult !== undefined) {
        functionContexts[functionName].lastResult = lastResult;
    }

    res.json({ success: true });
});

app.post('/api/context/:functionName/result', (req, res) => {
    const { functionName } = req.params;
    const { result } = req.body;

    if (!functionContexts[functionName]) {
        functionContexts[functionName] = {
            body: '{}',
            enabledHeaders: [],
            lastResult: null
        };
    }

    functionContexts[functionName].lastResult = result;
    res.json({ success: true });
});

app.get('/api/session', (req, res) => {
    debugger;
    res.json({
        success: true,
        sessionId: req.sessionID,
        config: req.session.config || 'No config in session',
    });
});

app.get('/api/config', (req, res) => {
    if(!req.session.config){
        req.session.config = { ...PISPauth.defaultConfig}
    }
    res.json({ success: true, config: req.session.config });
});

app.post('/api/config', (req, res) => {
    debugger;
    try {
        const { config } = req.body;
        console.log('Updating config for session:', req.sessionID);
        if (!req.session.config) {
            req.session.config = { ...PISPauth.defaultConfig };
        }
        if (config && typeof config === 'object') {
            req.session.config = { ...req.session.config, ...config };
            res.json({ success: true, config: req.session.config });
        } else {
            res.status(400).json({ success: false, error: 'Invalid config format' });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update config'
        });
    }
});

app.get('/api/functions', (req, res) => {
    const functions = Object.getOwnPropertyNames(PISPauth)
        .filter(name => typeof PISPauth[name] === 'function' && name !== 'main1')
        .sort();
    res.json({ functions });
});

app.post('/api/execute/:functionName', async (req, res) => {
    debugger;
    if (!req.session.config) {
        req.session.config = { ...PISPauth.defaultConfig };
    }
    const { functionName } = req.params;
    console.log(functionName)
    let { requestBody, enabledHeaders = [] } = req.body;

    try {
        const actualFunctionName = functionMappings[functionName];
        if (!actualFunctionName || !PISPauth[actualFunctionName]) {
            return res.status(404).json({
                success: false,
                error: 'Function not found'
            });
        }
        
        let parsedBody;
        if (typeof requestBody === 'string') {
            try {
                
                parsedBody = JSON.parse(requestBody);
            } catch (e) {
                
                parsedBody = requestBody;
            }
        } else if (typeof requestBody === 'object' && requestBody !== null) {
            
            parsedBody = requestBody;
        } else {
            
            parsedBody = {};
        }
        
        if (req.body.apiKey) {
            if (enabledHeaders.includes('x-api-key')) {
                req.session.config.apikey = req.body.apiKey;
            } else if (enabledHeaders.includes('authorization')) {
                req.session.config.access_token = req.body.apiKey;
            }
        }
        
        // Store response headers info
        const responseHeaders = {};
        
        // Wrap the original function to capture headers
        const originalFunction = PISPauth[actualFunctionName];
        const wrappedFunction = async function(config, body, headers) {
            // Clear breadcrumbId before call
            config.breadcrumbId = null;
            const result = await originalFunction(config, body, headers);
            // Capture breadcrumbId from config or result
            if (config.breadcrumbId) {
                responseHeaders['breadcrumbId'] = config.breadcrumbId;
            }
            return result;
        };
        
        // Temporarily replace function with wrapped version
        PISPauth[actualFunctionName] = wrappedFunction;
        
        const result = await PISPauth[actualFunctionName](req.session.config, parsedBody, enabledHeaders);
        
        // Restore original function
        PISPauth[actualFunctionName] = originalFunction;
        
        if (enabledHeaders.includes('x-api-key') && req.body.apiKey) {
            req.session.config.apikey = req.body.apiKey;
        } else if (enabledHeaders.includes('authorization') && req.body.apiKey) {
            req.session.config.access_token = req.body.apiKey;
        }
        const tokenFunctions = ['createTokenQPISP', 'createTokenTPE', 'createTokenPISP', 'createDboClientToken'];
        if (tokenFunctions.includes(actualFunctionName) && result && result.access_token) {
            req.session.config.access_token = result.access_token;
            console.log('Access token updated in config');
        }
        if (!functionContexts[functionName]) {
            functionContexts[functionName] = {};
        }
        functionContexts[functionName].lastResult = result;

        res.json({
            success: true,
            data: result,
            headers: responseHeaders
        });
    } catch (error) {
        console.error(`Error executing ${functionName}:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Unknown error occurred',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Sequence execution endpoint
app.post('/api/executeSequence', async (req, res) => {
    if (!req.session.config) {
        req.session.config = { ...PISPauth.defaultConfig };
    }
    
    const { paymentType, steps, requestBody, enabledHeaders = [], apiKey } = req.body;
    
    try {
        // Parse request body
        let parsedBody;
        if (typeof requestBody === 'string') {
            try {
                parsedBody = JSON.parse(requestBody);
            } catch (e) {
                parsedBody = requestBody;
            }
        } else if (typeof requestBody === 'object' && requestBody !== null) {
            parsedBody = requestBody;
        } else {
            parsedBody = {};
        }
        
        // Set API key in config from request or session
        if (apiKey) {
            req.session.config.apikey = apiKey;
        } else if (!req.session.config.apikey) {
            // Use default or keep existing
        }
        
        // Build sequence of functions based on paymentType and steps
        const sequence = buildSequence(paymentType, steps);
        const results = [];
        
        // Execute each function sequentially
        for (const funcInfo of sequence) {
            try {
                // Check if this is a special function (checkApikey, createDBOtokenClient, abstractGETrequest)
                if (funcInfo.isSpecial) {
                    const result = await executeSpecialFunction(
                        funcInfo.name,
                        req.session.config,
                        parsedBody,
                        results,
                        paymentType
                    );
                    
                    results.push({
                        name: funcInfo.displayName,
                        success: result.success,
                        data: result.data,
                        error: result.error,
                        headers: result.headers || {},
                        statusCode: result.statusCode || null
                    });
                } else {
                    const actualFunctionName = functionMappings[funcInfo.name];
                    if (actualFunctionName && PISPauth[actualFunctionName]) {
                        // For createConsent, use x-api-key header
                        let headersToUse = enabledHeaders;
                        if (funcInfo.useApiKeyHeader) {
                            headersToUse = [...enabledHeaders, 'x-api-key'];
                        }
                        
                        let bodyToUse = parsedBody;
                        if (funcInfo.modifyBody && typeof funcInfo.modifyBody === 'function') {
                            bodyToUse = funcInfo.modifyBody(parsedBody, results);
                        }
                        
                        // Clear breadcrumbId before call
                        req.session.config.breadcrumbId = null;
                        
                        const result = await PISPauth[actualFunctionName](
                            req.session.config, 
                            bodyToUse, 
                            headersToUse
                        );
                        
                        // Capture breadcrumbId from config
                        const responseHeaders = {};
                        if (req.session.config.breadcrumbId) {
                            responseHeaders.breadcrumbId = req.session.config.breadcrumbId;
                        }
                        
                        // Extract statusCode from result if it exists
                        let statusCode = null;
                        if (result && typeof result === 'object' && result.statusCode !== undefined) {
                            statusCode = result.statusCode;
                        } else if (req.session.config && req.session.config.lastStatusCode !== undefined) {
                            statusCode = req.session.config.lastStatusCode;
                        }
                        
                        results.push({
                            name: funcInfo.displayName,
                            success: true,
                            data: result,
                            headers: responseHeaders,
                            statusCode: statusCode
                        });
                    } else {
                        results.push({
                            name: funcInfo.displayName,
                            success: false,
                            error: `Function ${funcInfo.name} not found`
                        });
                    }
                }
            } catch (error) {
                results.push({
                    name: funcInfo.displayName,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error executing sequence:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Unknown error occurred'
        });
    }
});

// Helper function to execute special functions
async function executeSpecialFunction(funcName, config, requestBody, results, paymentType) {
    try {
        if (funcName === 'checkApikey') {
            // GET {url_kc}/auth/realms/SCRealm/check?apiKey={config.apikey}
            const url = `${config.url_kc}/auth/realms/SCRealm/check?apiKey=${config.apikey}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            const responseHeaders = {};
            const breadcrumbId = response.headers.get('x-breadcrumb-id') || response.headers.get('breadcrumbId');
            const statusCode = response.status;
            if (breadcrumbId) {
                responseHeaders.breadcrumbId = breadcrumbId;
                config.breadcrumbId = breadcrumbId;
            }
            return { success: true, data, headers: responseHeaders, statusCode };
        }
        
        if (funcName === 'createDBOtokenClient') {
            // Clear breadcrumbId before call
            config.breadcrumbId = null;
            // Clear lastStatusCode before call
            config.lastStatusCode = null;
            // Call createDboClientToken with empty body
            const result = await PISPauth.createDboClientToken(config, {}, ['authorization']);
            // Save access_token to session config
            if (result && result.access_token) {
                config.access_token = result.access_token;
            }
            // Capture breadcrumbId and statusCode from config
            const responseHeaders = {};
            const statusCode = config.lastStatusCode || null;
            if (config.breadcrumbId) {
                responseHeaders.breadcrumbId = config.breadcrumbId;
            }
            return { success: true, data: result, headers: responseHeaders, statusCode };
        }
        
        if (funcName === 'abstractGETrequest') {
            // Build the path from checkApikey result and first consent result
            const checkApikeyResult = results.find(r => r.name === 'checkApikey');
            const createConsentResult = results.find(r => r.name.includes('Consent') && !r.name.includes('patch') && !r.name.includes('put'));
            
            // Get clientName from checkApikey response (not login)
            let login = 'unknown';
            if (checkApikeyResult && checkApikeyResult.data) {
                login = checkApikeyResult.data.clientName || checkApikeyResult.data.login || 'unknown';
            }
            
            // Get consentId from createConsent response (data field contains the id)
            let consentId = 'unknown';
            if (createConsentResult && createConsentResult.data) {
                // The consent ID is in data.{consentIdField}
                const consentIdMap = {
                    'domestic': 'domesticConsentId',
                    'domesticTax': 'domesticTaxConsentId',
                    'listAccounts': 'listAccountsConsentId',
                    'listPassports': 'listPassportsConsentId',
                    'requirement': 'requirementConsentId',
                    'taxRequirement': 'taxRequirementConsentId',
                    'VRP': 'VRPConsentId'
                };
                const idField = consentIdMap[paymentType];
                const consentData = createConsentResult.data.data || createConsentResult.data;
                consentId = consentData[idField] || consentData.consentId || 'unknown';
            }
            
            const path = `/accountsList/login/${login}/paymentConsents/${consentId}`;
            config.breadcrumbId = null;
            config.lastStatusCode = null;
            const result = await PISPauth.abstractGETrequest(config, String(path), ['application/json']);
            const responseHeaders = {};
            const statusCode = config.lastStatusCode || null;
            if (config.breadcrumbId) {
                responseHeaders.breadcrumbId = config.breadcrumbId;
            }
            return { success: true, data: result, headers: responseHeaders, statusCode };
        }
        
        if (funcName === 'prepareExternalRepresentationBody') {
            const abstractGetResult = results.find(r => r.name === 'GET request');
            let preparedBody = {};
            if (abstractGetResult && abstractGetResult.data) {
                preparedBody = JSON.parse(JSON.stringify(abstractGetResult.data));
            }
            // Call user-defined function with abstractGetRequest data and paymentType
            const userResult = await PISPauth.prepareExternalRepresentationBody(preparedBody, paymentType);
            return { success: true, data: userResult, statusCode: null };
        }
        
        if (funcName.startsWith('put') && funcName.endsWith('ConsentExternalRepresentation')) {
            // Get the prepared body from previous step
            const prepResult = results.find(r => r.name === 'prepareExternalRepresentationBody');
            const bodyToUse = (prepResult && prepResult.data) ? prepResult.data : {};
            // Call the function with only 'application/json' header
            const actualFunctionName = funcName;
            if (PISPauth[actualFunctionName]) {
                // Clear breadcrumbId before call
                config.breadcrumbId = null;
                // Clear lastStatusCode before call
                config.lastStatusCode = null;
                const result = await PISPauth[actualFunctionName](config, bodyToUse, ['application/json']);
                // Capture breadcrumbId and statusCode from config
                const responseHeaders = {};
                const statusCode = config.lastStatusCode || null;
                if (config.breadcrumbId) {
                    responseHeaders.breadcrumbId = config.breadcrumbId;
                }
                return { success: true, data: result, headers: responseHeaders, statusCode };
            }
            return { success: false, error: `Function ${actualFunctionName} not found` };
        }

        if (funcName === 'prepareExternalRepresentationSpecialPartBody') {
            // Get the result from step 5 (prepareExternalRepresentationBody)
            const prepBodyResult = results.find(r => r.name === 'prepareExternalRepresentationBody');
            // Get the result from step 6 (put*ConsentExternalRepresentation)
            const putExtRepResult = results.find(r => r.name.endsWith('ConsentExternalRepresentation') && r.name.startsWith('put'));
            debugger;
            let baseBody = {};
            if (prepBodyResult && prepBodyResult.data) {
                baseBody = JSON.parse(JSON.stringify(prepBodyResult.data));
            }
            
            // Get externalRepresentation from step 6 response
            if (putExtRepResult && putExtRepResult.data) {
                const putData = putExtRepResult.data.data || putExtRepResult.data;
                if (putData && putData.externalRepresentation) {
                    baseBody.data = baseBody.data || {};
                    baseBody.data.externalRepresentation = putData.externalRepresentation;
                }
            }
            
            // Call user-defined function to prepare special part body
            const userResult = await PISPauth.prepareExternalRepresentationSpecialPartBody(config, baseBody);
            return { success: true, data: userResult, statusCode: null };
        }
        
        if (funcName === 'putConsentExternalRepresentationSpecialPart') {
            // Get the prepared body from previous step
            const prepResult = results.find(r => r.name === 'prepareExternalRepresentationSpecialPartBody');
            const bodyToUse = (prepResult && prepResult.data) ? prepResult.data : {};
            // Call the function with only 'application/json' header
            const actualFunctionName = 'putConsentSpecialPartExternalRepresentation';
            if (PISPauth[actualFunctionName]) {
                // Clear breadcrumbId before call
                config.breadcrumbId = null;
                // Clear lastStatusCode before call
                config.lastStatusCode = null;
                const result = await PISPauth[actualFunctionName](config, bodyToUse, ['application/json']);
                // Capture breadcrumbId and statusCode from config
                const responseHeaders = {};
                const statusCode = config.lastStatusCode || null;
                if (config.breadcrumbId) {
                    responseHeaders.breadcrumbId = config.breadcrumbId;
                }
                return { success: true, data: result, headers: responseHeaders, statusCode };
            }
            return { success: false, error: `Function ${actualFunctionName} not found` };
        }
        
        if (funcName === 'prepareAuthorisationBody') {
            // Get results from all previous steps
            const prepBodyResult = results.find(r => r.name === 'prepareExternalRepresentationBody');
            const putExtRepResult = results.find(r => r.name.endsWith('ConsentExternalRepresentation') && r.name.startsWith('put'));
            const prepSpecialPartResult = results.find(r => r.name === 'prepareExternalRepresentationSpecialPartBody');
            const putSpecialPartResult = results.find(r => r.name === 'putConsentExternalRepresentationSpecialPart');
            const createConsentResult = results.find(r => r.name.includes('Consent') && !r.name.includes('patch') && !r.name.includes('put'))
            
            const body1 = (prepBodyResult && prepBodyResult.data) ? prepBodyResult.data : {};
            const body2 = (putExtRepResult && putExtRepResult.data) ? putExtRepResult.data : {};
            const body3 = (prepSpecialPartResult && prepSpecialPartResult.data) ? prepSpecialPartResult.data : {};
            const body4 = (putSpecialPartResult && putSpecialPartResult.data) ? putSpecialPartResult.data : {};
            
            const userResult = await PISPauth.prepareAuthorisationBody(body1, body2, body3, body4, paymentType);
            return { success: true, data: userResult, statusCode: null };
        }
        
        if (funcName.startsWith('patch') && funcName.endsWith('Consent')) {
            const prepResult = results.find(r => r.name === 'prepareAuthorisationBody');
            const bodyToUse = (prepResult && prepResult.data) ? prepResult.data : {};
            const actualFunctionName = funcName;
            if (PISPauth[actualFunctionName]) {
                const result = await PISPauth[actualFunctionName](config, bodyToUse, ['application/json', 'x-idempotency-key']);
                const responseHeaders = {};
                const statusCode = config.lastStatusCode || null;
                if (config.breadcrumbId) {
                    responseHeaders.breadcrumbId = config.breadcrumbId;
                }
                return { success: true, data: result, headers: responseHeaders, statusCode };
            }
            return { success: false, error: `Function ${actualFunctionName} not found` };
        }

        if (funcName === 'preparePaymentsBody') {
            // Get the POST Consent result from Step 1 (request body)
            const postConsentResult = results.find(r => r.name.startsWith('post') && r.name.includes('Consent') && !r.name.includes('patch'));
            const postConsentBody = (postConsentResult && postConsentResult.data) ? postConsentResult.data : {};
            
            // Get the PATCH Consent result from Step 7 (response body)
            const patchConsentResult = results.find(r => r.name.startsWith('patch') && r.name.includes('Consent'));
            const patchConsentBody = (patchConsentResult && patchConsentResult.data) ? patchConsentResult.data : {};
            
            // Call user-defined function to prepare payments body
            // Parameters: type, reqConsent (POST body), resConsent (PATCH response body)
            const userResult = await PISPauth.preparePaymentsBody(paymentType, postConsentBody, patchConsentBody);
            return { success: true, data: userResult, statusCode: null };
        }
        
        if (funcName === 'createPayment') {
            // Get the prepared body from preparePaymentsBody
            debugger;
            const prepResult = results.find(r => r.name === 'preparePaymentsBody');
            const bodyToUse = (prepResult && prepResult.data) ? prepResult.data : {};
            const actualFunctionName = `post${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}Payment`;
            if (PISPauth[actualFunctionName]) {
                const result = await PISPauth[actualFunctionName](config, bodyToUse, ['application/json', 'x-api-key', 'x-idempotency-key']);
                const responseHeaders = {};
                const statusCode = config.lastStatusCode || null;
                if (config.breadcrumbId) {
                    responseHeaders.breadcrumbId = config.breadcrumbId;
                }
                return { success: true, data: result, headers: responseHeaders, statusCode };
            }
            return { success: false, error: `Function ${actualFunctionName} not found` };
        }
        
        return { success: false, error: `Unknown special function: ${funcName}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Helper function to build sequence based on payment type and steps
function buildSequence(paymentType, steps) {
    const sequence = [];
    
    // Map payment type to function prefixes
    const prefixMap = {
        'domestic': 'Domestic',
        'domesticTax': 'DomesticTax',
        'listAccounts': 'ListAccounts',
        'listPassports': 'ListPassports',
        'requirement': 'Requirement',
        'taxRequirement': 'TaxRequirement',
        'VRP': 'VRP'
    };
    
    const prefix = prefixMap[paymentType] || 'Domestic';
    
    // Step 1: Create Consent (always included if any step is selected)
    if (steps.includes('createConsent') || steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: `POST /paymentConsents/${paymentType}`,
            displayName: `post${prefix}Consent`,
            useApiKeyHeader: true
        });
    }
    
    // Step 2: checkApikey (if authoriseConsent or createPayment)
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: 'checkApikey',
            displayName: 'checkApikey',
            isSpecial: true
        });
    }
    
    // Step 3: createDBOtokenClient (if authoriseConsent or createPayment)
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: 'createDBOtokenClient',
            displayName: 'createDBOtokenClient',
            isSpecial: true
        });
    }
    
    // Step 4: Abstract GET Request (if authoriseConsent or createPayment)
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: 'abstractGETrequest',
            displayName: 'GET request',
            isSpecial: true
        });
    }
    
    // Step 5: Prepare External Representation Body (if authoriseConsent or createPayment)
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: 'prepareExternalRepresentationBody',
            displayName: 'prepareExternalRepresentationBody',
            isSpecial: true
        });
    }
    
    // Step 5.1: Put External Representation (if authoriseConsent or createPayment)
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: `put${prefix}ConsentExternalRepresentation`,
            displayName: `put${prefix}ConsentExternalRepresentation`,
            isSpecial: true,
        });
    }
    
    // Step 5.2: Prepare Special Part External Representation Body
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: 'prepareExternalRepresentationSpecialPartBody',
            displayName: 'prepareExternalRepresentationSpecialPartBody',
            isSpecial: true
        });
    }

    // Step 5.3: Put Special Part External Representation
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: 'putConsentExternalRepresentationSpecialPart',
            displayName: 'putConsentExternalRepresentationSpecialPart',
            isSpecial: true
        });
    }
    
    // Step 6: Prepare Authorisation Body
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: 'prepareAuthorisationBody',
            displayName: 'prepareAuthorisationBody',
            isSpecial: true
        });
    }
    
    // Step 7: Patch Consent
    if (steps.includes('authoriseConsent') || steps.includes('createPayment')) {
        sequence.push({
            name: `patch${prefix}Consent`,
            displayName: `patch${prefix}Consent`,
            isSpecial: true,
            useIdempotencyKey: true
        });
    }
    
    // Step 7.5: Prepare Payments Body (if createPayment)
    if (steps.includes('createPayment')) {
        sequence.push({
            name: 'preparePaymentsBody',
            displayName: 'preparePaymentsBody',
            isSpecial: true
        });
    }
    
    // Step 8: Create Payment
    if (steps.includes('createPayment')) {
        sequence.push({
            name: 'createPayment',
            displayName: `post${prefix}Payment`,
            isSpecial: true,
        });
    }
    
    return sequence;
}


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
