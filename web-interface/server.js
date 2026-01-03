const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');

// Import PISPauth functions
const PISPauth = require('../PISPauthNew');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    next();
});
debugger;
// Store function states and contexts
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
        "GET /payments/domestic/{domesticConsentId}",
        "DELETE /payments/domestic/{domesticConsentId}",
        "GET /payments/domestic/{domesticConsentId}/PSUorPAU/{userId}",
        "DELETE /payments/domestic/{domesticConsentId}/PSUorPAU/{userId}",
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
        "GET /payments/domesticTax/{domesticTaxConsentId}",
        "DELETE /payments/domesticTax/{domesticTaxConsentId}",
        "GET /payments/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}",
        "DELETE /payments/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}",
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
        "GET /payments/listAccounts/{listAccountsConsentId}",
        "DELETE /payments/listAccounts/{listAccountsConsentId}",
        "GET /payments/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}",
        "DELETE /payments/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}",
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
        "GET /payments/listPassports/{listPassportsConsentId}",
        "DELETE /payments/listPassports/{listPassportsConsentId}",
        "GET /payments/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}",
        "DELETE /payments/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}",
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
        "GET /payments/requirement/{requirementConsentId}",
        "DELETE /payments/requirement/{requirementConsentId}",
        "GET /payments/requirement/{requirementConsentId}/PSUorPAU/{userId}",
        "DELETE /payments/requirement/{requirementConsentId}/PSUorPAU/{userId}",
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
        "GET /payments/taxRequirement/{taxRequirementConsentId}",
        "DELETE /payments/taxRequirement/{taxRequirementConsentId}",
        "GET /payments/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}",
        "DELETE /payments/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}",
    ],
};

const functionMappings = {
    'GET PISPtoken': 'createTokenPISP',
    'GET QPISPtoken': 'createTokenQPISP',
    'GET TPEtoken': 'createTokenTPE',
    'GET OBtoken': 'createDboClientToken',

    'GET /accountsList/login/{login}/paymentConsents/{paymentConsentId}':'abstractGETrequest',
    'PUT /paymentConsents/createSpecialPartExternalRepresentation':'putConsentExternalRepresentationSpecialPart',

    'POST /paymentConsents/domestic': 'postDomesticConsent',
    'PUT /paymentConsents/createExternalRepresentation' : 'putDomesticConsentExternalRepresentation',
    'PATCH /paymentConsents/domestic':'patchDomesticConsent',
    'GET /paymentConsents/domestic/{domesticConsentId}': 'abstractGETrequest',
    'DELETE /paymentConsents/domestic/{domesticConsentId}': 'abstractDELETErequest',
    'GET /paymentConsents/domestic/{domesticConsentId}/PSUorPAU/{userId}': 'abstractGETrequest',
    'DELETE /paymentConsents/domestic/{domesticConsentId}/PSUorPAU/{userId}': 'abstractDELETErequest',
    'POST /payments/domestic': 'postDomesticPayment',
    'GET /payments/domestic/{domesticConsentId}': 'abstractGETrequest',
    'DELETE /payments/domestic/{domesticConsentId}': 'abstractDELETErequest',
    'GET /payments/domestic/{domesticConsentId}/PSUorPAU/{userId}': 'abstractGETrequest',
    'DELETE /payments/domestic/{domesticConsentId}/PSUorPAU/{userId}': 'abstractDELETErequest',

    'POST /paymentConsents/domesticTax': 'postDomesticTaxConsent',
    'PUT /paymentConsents/domesticTax/createExternalRepresentation' : 'putDomesticTaxConsentExternalRepresentation',
    "PATCH /paymentConsents/domesticTax": 'patchDomesticTaxConsent',
    "GET /paymentConsents/domesticTax/{domesticTaxConsentId}" : 'abstractGETrequest',
    "DELETE /paymentConsents/domesticTax/{domesticTaxConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/domesticTax": 'postDomesticTaxPayment',
    "GET /payments/domesticTax/{domesticTaxConsentId}": 'abstractGETrequest',
    "DELETE /payments/domesticTax/{domesticTaxConsentId}": 'abstractDELETErequest',
    "GET /payments/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/domesticTax/{domesticTaxConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/listAccounts":'postListAccountsConsent',
    'PUT /paymentConsents/listAccounts/createExternalRepresentation' : 'putListAccountsConsentExternalRepresentation',
    "PATCH /paymentConsents/listAccounts":'patchListAccountsConsent',
    "GET /paymentConsents/listAccounts/{listAccountsConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listAccounts/{listAccountsConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/listAccounts":'postListAccountsPayment',
    "GET /payments/listAccounts/{listAccountsConsentId}": 'abstractGETrequest',
    "DELETE /payments/listAccounts/{listAccountsConsentId}": 'abstractDELETErequest',
    "GET /payments/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/listAccounts/{listAccountsConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/listPassports":'postListPassportsConsent',
    'PUT /paymentConsents/listPassports/createExternalRepresentation' : 'putListPassportsConsentExternalRepresentation',
    "PATCH /paymentConsents/listPassports":'patchListPassportsConsent',
    "GET /paymentConsents/listPassports/{listPassportsConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listPassports/{listPassportsConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/listPassports":'postListPassportsPayment',
    "GET /payments/listPassports/{listPassportsConsentId}": 'abstractGETrequest',
    "DELETE /payments/listPassports/{listPassportsConsentId}": 'abstractDELETErequest',
    "GET /payments/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/listPassports/{listPassportsConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/requirement":'postRequirementConsent',
    'PUT /paymentConsents/requirement/createExternalRepresentation' : 'putRequirementConsentExternalRepresentation',
    "PATCH /paymentConsents/requirement":'patchRequirementConsent',
    "GET /paymentConsents/requirement/{requirementConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/requirement/{requirementConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/requirement/{requirementConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/requirement/{requirementConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/requirement":'postRequirementPayment',
    "GET /payments/requirement/{requirementConsentId}": 'abstractGETrequest',
    "DELETE /payments/requirement/{requirementConsentId}": 'abstractDELETErequest',
    "GET /payments/requirement/{requirementConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/requirement/{requirementConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',

    "POST /paymentConsents/taxRequirement":'postTaxRequirementConsent',
    "PUT /paymentConsents/taxRequirement/createExternalRepresentation": 'putTaxRequirementConsentExternalRepresentation',
    "PATCH /paymentConsents/taxRequirement":'patchTaxRequirementConsent',
    "GET /paymentConsents/taxRequirement/{taxRequirementConsentId}": 'abstractGETrequest',
    "DELETE /paymentConsents/taxRequirement/{taxRequirementConsentId}": 'abstractDELETErequest',
    "GET /paymentConsents/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /paymentConsents/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
    "POST /payments/taxRequirement":'postTaxRequirementPayment',
    "GET /payments/taxRequirement/{taxRequirementConsentId}": 'abstractGETrequest',
    "DELETE /payments/taxRequirement/{taxRequirementConsentId}": 'abstractDELETErequest',
    "GET /payments/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}": 'abstractGETrequest',
    "DELETE /payments/taxRequirement/{taxRequirementConsentId}/PSUorPAU/{userId}": 'abstractDELETErequest',
};

// Get list of available functions
// app.get('/api/functions', (req, res) => {
//     const functions = Object.keys(functionMappings);
//     res.json({ functions });
// });

app.get('/api/functions', (req, res) => {
    // Create a copy of functionGroups with function details
    const response = {};
    for (const [groupName, functionNames] of Object.entries(functionGroups)) {
        response[groupName] = functionNames.map(name => ({
            name: name,
            // Include any additional function metadata here
        }));
    }
    res.json({ groups: response });
});

// Get function context
app.get('/api/context/:functionName', (req, res) => {
    const { functionName } = req.params;
    res.json(functionContexts[functionName] || {
        body: '{}',
        enabledHeaders: [],
        lastResult: null
    });
});

// Update function context
app.post('/api/context/:functionName', (req, res) => {
    const { functionName } = req.params;
    const { body, enabledHeaders } = req.body;

    if (!functionContexts[functionName]) {
        functionContexts[functionName] = {
            body: '{}',
            enabledHeaders: [],
            lastResult: null
        };
    }
    if (body !== undefined) {
        functionContexts[functionName].body = body;
    }

    if (enabledHeaders !== undefined) {
        functionContexts[functionName].enabledHeaders = enabledHeaders;
    }

    res.json({ success: true });
});

// Update function result
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

// Update config
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

// Get available functions
app.get('/api/functions', (req, res) => {
    const functions = Object.getOwnPropertyNames(PISPauth)
        .filter(name => typeof PISPauth[name] === 'function' && name !== 'main1')
        .sort();
    res.json({ functions });
});

// Execute function
app.post('/api/execute/:functionName', async (req, res) => {
    debugger;
    if (!req.session.config) {
        req.session.config = { ...PISPauth.defaultConfig };
    }
    const { functionName } = req.params;
    let { requestBody, enabledHeaders = [] } = req.body;

    try {
        const actualFunctionName = functionMappings[functionName];
        if (!actualFunctionName || !PISPauth[actualFunctionName]) {
            return res.status(404).json({
                success: false,
                error: 'Function not found'
            });
        }
        // Handle the request body properly
        let parsedBody;
        if (typeof requestBody === 'string') {
            try {
                // First try to parse it as JSON
                parsedBody = JSON.parse(requestBody);
            } catch (e) {
                // If it's not valid JSON, keep it as is
                parsedBody = requestBody;
            }
        } else if (typeof requestBody === 'object' && requestBody !== null) {
            // If it's already an object, use it directly
            parsedBody = requestBody;
        } else {
            // Fallback to empty object
            parsedBody = {};
        }
        // Execute the function with the parsed body
        if (req.body.apiKey) {
            if (enabledHeaders.includes('x-api-key')) {
                req.session.config.apikey = req.body.apiKey;
            } else if (enabledHeaders.includes('authorization')) {
                req.session.config.access_token = req.body.apiKey;
            }
        }
        const result = await PISPauth[actualFunctionName](req.session.config, parsedBody, enabledHeaders);
        if (enabledHeaders.includes('x-api-key') && req.body.apiKey) {
            req.session.config.apikey = req.body.apiKey;
        } else if (enabledHeaders.includes('authorization') && req.body.apiKey) {
            req.session.config.access_token = req.body.apiKey;
        }
        // Token handling remains the same
        const tokenFunctions = ['createTokenQPISP', 'createTokenTPE', 'createTokenPISP', 'createDboClientToken'];
        if (tokenFunctions.includes(actualFunctionName) && result && result.access_token) {
            req.session.config.access_token = result.access_token;
            console.log('Access token updated in config');
        }
        // Update the function context with the last result
        if (!functionContexts[functionName]) {
            functionContexts[functionName] = {};
        }
        functionContexts[functionName].lastResult = result;

        // Return the result
        res.json({
            success: true,
            data: result
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

// Serve the main HTML file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
