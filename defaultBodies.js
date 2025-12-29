// defaultBodies.js
const defaultBodies = {
    // Token endpoints
    'createTokenPISP': 'client_id=TEST&client_secret=1111&grant_type=client_credentials',
    'createTokenQPISP': 'client_id=TEST&client_secret=1111&grant_type=client_credentials',
    'createTokenTPE': 'client_id=TEST&client_secret=1111&grant_type=client_credentials',
    'createDboClientToken': 'client_id=TEST&client_secret=1111&grant_type=client_credentials',

    // Other endpoints with empty default bodies
    'postDomesticConsent': '{}',
    'abstractGETrequest': '{}',
    'postDomesticTaxConsent': '{}'
    // Add more endpoints as needed
};
module.exports = defaultBodies;