document.addEventListener('DOMContentLoaded', function() {
    
    const functionList = document.getElementById('function-list');
    const requestBodyEditor = document.getElementById('request-body');
    const responseBodyEditor = document.getElementById('response-body');
    const executeBtn = document.getElementById('execute-btn');
    const responseStatus = document.getElementById('response-status');
    const configInput = document.getElementById('config-input');
    const saveConfigBtn = document.getElementById('save-config');
    const resetConfigBtn = document.getElementById('reset-config');
    const formatJsonBtn = document.getElementById('format-json');
    const validateSchemaBtn = document.getElementById('validate-schema');
    const tabButtons = document.querySelectorAll('.menu-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    const headersList = document.getElementById('headers-list');

    
    let currentFunction = null;
    let editors = {};
    let sequenceEditor = null;

    
    function initEditors() {
        const editorOptions = {
            lineNumbers: true,
            mode: 'application/json',
            theme: 'monokai',
            autoCloseBrackets: true,
            matchBrackets: true,
            lineWrapping: true,
            indentUnit: 4,
            tabSize: 4
        };

        
        editors.request = CodeMirror.fromTextArea(requestBodyEditor, {
            ...editorOptions,
            placeholder: 'Enter request body (JSON)'
        });

        
        editors.response = CodeMirror.fromTextArea(responseBodyEditor, {
            ...editorOptions,
            readOnly: true
        });

        
        editors.config = CodeMirror.fromTextArea(configInput, {
            ...editorOptions,
            mode: { name: 'javascript', json: true },
            placeholder: 'Enter configuration (JSON)'
        });

        
        const sequenceRequestBody = document.getElementById('sequence-request-body');
        if (sequenceRequestBody) {
            sequenceEditor = CodeMirror.fromTextArea(sequenceRequestBody, {
                ...editorOptions,
                placeholder: 'Enter request body (JSON)'
            });
        }
    }

    
    async function loadFunctions() {
        try {
            const response = await fetch('/api/functions',{
                    method: 'GET',
                    credentials: 'include'  
            });
            const data = await response.json();
            const functionList = document.getElementById('function-list');
            functionList.innerHTML = '';

            const groupTitles = {
                'tokens': 'Токены',
                'common': 'Общие функции',
                'intents': 'Intents',
                'consents': 'Consents',
                'payments': 'Payments',
                'accounts': 'Accounts',
                // Sub-group titles
                'paymentIntents': 'Payment Intents',
                'accountIntents': 'Account Intents',
                'accounts': 'Accounts',
                'balances': 'Balances',
                'statements': 'Statements',
                'transactions': 'Transactions',
                'domestic': 'Domestic',
                'domesticTax': 'Domestic Tax',
                'listAccounts': 'List Accounts',
                'listPassports': 'List Passports',
                'requirement': 'Requirements',
                'taxRequirement': 'Requirements Tax',
                'VRP': 'VRP'
            };
            
            const groupOrder = ['tokens', 'common', 'intents', 'consents', 'payments', 'accounts'];

            groupOrder.forEach(groupName => {
                const groupData = data.groups[groupName];
                if (!groupData) return;
                
                // Check if group is nested (object) or flat array
                if (Array.isArray(groupData)) {
                    // Flat array format (old style)
                    if (groupData.length > 0) {
                        const groupDiv = document.createElement('div');
                        groupDiv.className = 'function-group';

                        const groupHeader = document.createElement('div');
                        groupHeader.className = 'function-group-header';
                        groupHeader.textContent = groupTitles[groupName] || groupName;

                        groupHeader.addEventListener('click', function() {
                            groupDiv.classList.toggle('active');
                        });

                        const groupList = document.createElement('ul');
                        groupList.className = 'function-group-list';

                        groupData.forEach(func => {
                            const li = document.createElement('li');
                            li.textContent = func.name;
                            li.addEventListener('click', (e) => {
                                e.stopPropagation(); 
                                selectFunction(func.name);
                            });
                            groupList.appendChild(li);
                        });

                        groupDiv.appendChild(groupHeader);
                        groupDiv.appendChild(groupList);
                        functionList.appendChild(groupDiv);

                        if (groupName === 'tokens') {
                            groupDiv.classList.add('active');
                        }
                    }
                } else {
                    // Nested object format (new style with sub-groups)
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'function-group';

                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'function-group-header';
                    groupHeader.textContent = groupTitles[groupName] || groupName;

                    groupHeader.addEventListener('click', function() {
                        groupDiv.classList.toggle('active');
                    });

                    const groupContent = document.createElement('div');
                    groupContent.className = 'function-group-content';

                    // Iterate over sub-groups
                    for (const [subGroupName, subGroupFunctions] of Object.entries(groupData)) {
                        if (!subGroupFunctions || subGroupFunctions.length === 0) continue;

                        const subGroupDiv = document.createElement('div');
                        subGroupDiv.className = 'function-sub-group';

                        const subGroupHeader = document.createElement('div');
                        subGroupHeader.className = 'function-sub-group-header';
                        subGroupHeader.textContent = groupTitles[subGroupName] || subGroupName;

                        subGroupHeader.addEventListener('click', function(e) {
                            e.stopPropagation();
                            subGroupDiv.classList.toggle('active');
                        });

                        const subGroupList = document.createElement('ul');
                        subGroupList.className = 'function-sub-group-list';

                        subGroupFunctions.forEach(func => {
                            const li = document.createElement('li');
                            li.textContent = func.name;
                            li.addEventListener('click', (e) => {
                                e.stopPropagation(); 
                                selectFunction(func.name);
                            });
                            subGroupList.appendChild(li);
                        });

                        subGroupDiv.appendChild(subGroupHeader);
                        subGroupDiv.appendChild(subGroupList);
                        groupContent.appendChild(subGroupDiv);
                    }

                    groupDiv.appendChild(groupHeader);
                    groupDiv.appendChild(groupContent);
                    functionList.appendChild(groupDiv);

                    if (groupName === 'intents') {
                        groupDiv.classList.add('active');
                    }
                }
            });
        } catch (error) {
            console.error('Error loading functions:', error);
            functionList.innerHTML = '<div class="error">Failed to load functions</div>';
        }
    }

    
    function renderFunctionList(functions) {
        functionList.innerHTML = '';

        functions.forEach(funcName => {
            const funcElement = document.createElement('div');
            funcElement.className = 'function-item';
            funcElement.textContent = funcName;
            funcElement.dataset.function = funcName;

            funcElement.addEventListener('click', () => {
                selectFunction(funcName);
            });

            functionList.appendChild(funcElement);
        });
    }

    
    async function selectFunction(funcName) {
        
        document.querySelectorAll('.function-item').forEach(el => {
            el.classList.toggle('active', el.dataset.function === funcName);
        });

        document.getElementById('selected-function').textContent = funcName;
        executeBtn.disabled = false;

        
        if (currentFunction) {
            await saveFunctionContext(currentFunction);
        }

        
        currentFunction = funcName;

        
        await loadFunctionContext(funcName);

        
        switchTab('functions');
    }

    
    async function loadDefaultBody(funcName) {
        try {
            const response = await fetch(`/api/defaultBody/${encodeURIComponent(funcName)}`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success && data.body !== null) {
                return JSON.stringify(data.body, null, 2);
            }
            return null;
        } catch (error) {
            console.error('Error loading default body:', error);
            return null;
        }
    }

    
    async function loadFunctionContext(funcName) {
        try {
            
            const response = await fetch(`/api/context/${encodeURIComponent(funcName)}`,{
                method: 'GET',
                credentials: 'include'  
            });
            const context = await response.json();

            
            if (context.body && context.body !== '{}') {
                try {
                    const formattedBody = JSON.stringify(JSON.parse(context.body), null, 2);
                    editors.request.setValue(formattedBody);
                } catch (e) {
                    editors.request.setValue(context.body);
                }
            } else {
                
                const defaultBody = await loadDefaultBody(funcName);
                if (defaultBody) {
                    editors.request.setValue(defaultBody);
                } else {
                    editors.request.setValue('{}');
                }
            }

            
            if (context.enabledHeaders && Array.isArray(context.enabledHeaders)) {
                document.querySelectorAll('#headers-list input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = context.enabledHeaders.includes(checkbox.name);
                });
            }

            
            if (context.lastResult) {
                try {
                    const formattedResult = typeof context.lastResult === 'string'
                        ? context.lastResult
                        : JSON.stringify(context.lastResult, null, 2);
                    editors.response.setValue(formattedResult);
                } catch (e) {
                    editors.response.setValue('Error formatting response');
                }
            } else {
                editors.response.setValue('');
            }

        } catch (error) {
            console.error('Error loading function context:', error);
        }
    }

    
    async function resetToDefaultBody() {
        if (currentFunction) {
            const defaultBody = await loadDefaultBody(currentFunction);
            if (defaultBody) {
                editors.request.setValue(defaultBody);
            }
        }
    }

    
    async function saveFunctionContext(funcName) {
        if (!funcName) return;

        try {
            const body = editors.request.getValue();
            const enabledHeaders = Array.from(document.querySelectorAll('#headers-list input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.name);
            
            // Add debtorIdentification if selected
            const debtorId = getDebtorIdentificationValue('#headers-list');
            if (debtorId) {
                enabledHeaders.push(debtorId);
            }
            
            const responseText = editors.response.getValue();

            await fetch(`/api/context/${encodeURIComponent(funcName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    body,
                    enabledHeaders,
                    lastResult: responseText
                }),
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error saving function context:', error);
        }
    }

    
    // Get apikey or access_token from config based on checkbox
    function getAuthValue() {
        const enabledHeaders = Array.from(document.querySelectorAll('#headers-list input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.name);
        
        const config = JSON.parse(editors.config.getValue() || '{}');
        
        if (enabledHeaders.includes('x-api-key')) {
            return { type: 'x-api-key', value: config.apikey || '' };
        } else {
            return { type: 'authorization', value: config.access_token || '' };
        }
    }
    
    async function executeFunction() {
    if (!currentFunction) return;
    try {
        
        responseStatus.textContent = 'Executing...';
        responseStatus.className = 'status-value loading';
        
        // Show loading gif
        const loadingGif = document.getElementById('loading-gif');
        if (loadingGif) {
            loadingGif.style.display = 'inline';
        }
        
        executeBtn.disabled = true;
        
        const requestBody = editors.request.getValue();
        
        const auth = getAuthValue();
        const headers = {};
        
        if (auth.value) {
            headers[auth.type] = auth.value;
        }
        
        // Get enabled headers including debtorIdentification
        const enabledHeaders = Array.from(document.querySelectorAll('#headers-list input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.name);
        
        // Add debtorIdentification if selected
        const debtorId = getDebtorIdentificationValue('#headers-list');
        if (debtorId) {
            enabledHeaders.push(debtorId);
        }
        
        const response = await fetch(`/api/execute/${encodeURIComponent(currentFunction)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify({
                requestBody: requestBody, 
                enabledHeaders: enabledHeaders
            }),
            credentials: 'include'
        });
        
        const responseText = await response.text();
        let result;
        
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = {
                success: response.ok,
                data: responseText
            };
        }
        if (!response.ok) {
            throw new Error(result.error || 'Unknown error occurred');
        }
        
        // Update access_token in config if token function
        if (currentFunction.toLowerCase().includes('token') && result.data && typeof result.data === 'object' && result.data.access_token) {
            try {
                const configEditor = document.getElementById('config-editor'); 
                if (configEditor) {
                    const currentConfig = JSON.parse(editors.config.getValue() || '{}');
                    currentConfig.access_token = result.data.access_token;
                    editors.config.setValue(JSON.stringify(currentConfig, null, 2));
                }
            } catch (e) {
                console.error('Error updating config editor:', e);
            }
            
            updateConfigDisplay({ access_token: result.data.access_token });
        }
        
        responseStatus.textContent = 'Success';
        responseStatus.className = 'status-value success';
        
        let responseDisplay = '';
        
        // Add breadcrumbId if present
        if (result.headers && result.headers.breadcrumbId) {
            responseDisplay += `breadcrumbId: ${result.headers.breadcrumbId}\n\n`;
        }
        
        if (typeof result.data === 'string') {
            
            if (result.data.trim().startsWith('<?xml') || result.data.trim().startsWith('<')) {
                
                const formattedXml = formatXml(result.data);
                responseDisplay += formattedXml;
            } else {
                
                try {
                    const json = JSON.parse(result.data);
                    responseDisplay += JSON.stringify(json, null, 2);
                } catch (e) {
                    
                    responseDisplay += result.data;
                }
            }
        } else if (typeof result.data === 'object') {
            
            responseDisplay += JSON.stringify(result.data, null, 2);
        } else {
            
            responseDisplay += String(result.data);
        }
        
        editors.response.setValue(responseDisplay);
    } catch (error) {
        console.error('Error executing function:', error);
        responseStatus.textContent = `Error: ${error.message}`;
        responseStatus.className = 'status-value error';
        editors.response.setValue(`Error: ${error.message}\n\n${error.stack || ''}`);
    } finally {
        // Hide loading gif
        const loadingGif = document.getElementById('loading-gif');
        if (loadingGif) {
            loadingGif.style.display = 'none';
        }
        executeBtn.disabled = false;
    }
    }

    
    // ==================== LOADER FUNCTIONS ====================
    
    function showLoader() {
        const loader = document.getElementById('sequence-loading');
        if (loader) {
            loader.style.display = 'flex';
        }
    }
    
    function hideLoader() {
        const loader = document.getElementById('sequence-loading');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    // ==================== SEQUENCE FUNCTIONS ====================
    
    // Setup cascade selection for checkboxes
    function setupCascadeCheckboxes() {
        const createConsentCheckbox = document.getElementById('createConsent');
        const authoriseConsentCheckbox = document.getElementById('authoriseConsent');
        const createPaymentCheckbox = document.getElementById('createPayment');

        if (authoriseConsentCheckbox && createConsentCheckbox) {
            authoriseConsentCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    createConsentCheckbox.checked = true;
                }
            });
        }

        if (createPaymentCheckbox && authoriseConsentCheckbox && createConsentCheckbox) {
            createPaymentCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    authoriseConsentCheckbox.checked = true;
                    createConsentCheckbox.checked = true;
                }
            });
        }

        // Setup debtorIdentification radio behavior (Functions tab)
        setupDebtorIdentificationRadios('#headers-list');
        
        // Setup debtorIdentification radio behavior (Sequence tab)
        setupDebtorIdentificationRadios('#sequence-headers-list');
    }

    // Setup debtorIdentification checkboxes to behave like radio buttons
    function setupDebtorIdentificationRadios(containerId) {
        const container = document.querySelector(containerId);
        if (!container) return;
        
        const privateCheckbox = container.querySelector('input[value="privateIdentification"]');
        const organisationCheckbox = container.querySelector('input[value="organisationIdentification"]');
        
        if (privateCheckbox && organisationCheckbox) {
            privateCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    organisationCheckbox.checked = false;
                }
            });
            
            organisationCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    privateCheckbox.checked = false;
                }
            });
        }
    }

    // Get debtorIdentification value from checkboxes
    function getDebtorIdentificationValue(containerId) {
        const container = document.querySelector(containerId);
        if (!container) return null;
        
        const privateCheckbox = container.querySelector('input[value="privateIdentification"]');
        const organisationCheckbox = container.querySelector('input[value="organisationIdentification"]');
        
        if (privateCheckbox && privateCheckbox.checked) {
            return 'privateIdentification';
        }
        if (organisationCheckbox && organisationCheckbox.checked) {
            return 'organisationIdentification';
        }
        return null;
    }

    // Get selected payment type
    function getSelectedPaymentType() {
        const selected = document.querySelector('input[name="paymentType"]:checked');
        return selected ? selected.value : null;
    }

    // Get selected steps
    function getSelectedSteps() {
        const steps = [];
        const createConsent = document.getElementById('createConsent');
        const authoriseConsent = document.getElementById('authoriseConsent');
        const createPayment = document.getElementById('createPayment');

        if (createConsent && createConsent.checked) {
            steps.push('createConsent');
        }
        if (authoriseConsent && authoriseConsent.checked) {
            steps.push('authoriseConsent');
        }
        if (createPayment && createPayment.checked) {
            steps.push('createPayment');
        }

        return steps;
    }

    // Get enabled headers from sequence tab
    function getSequenceHeaders() {
        const headers = [];
        const headerCheckboxes = document.querySelectorAll('#sequence-headers-list input[type="checkbox"]:checked');
        
        headerCheckboxes.forEach(checkbox => {
            let headerName = checkbox.name;
            // Remove 'seq-' prefix from header names
            if (headerName.startsWith('seq-')) {
                headerName = headerName.substring(4);
            }
            headers.push(headerName);
        });

        // Add debtorIdentification if selected
        const debtorId = getDebtorIdentificationValue('#sequence-headers-list');
        if (debtorId) {
            headers.push(debtorId);
        }

        return headers;
    }

    // Get API key from sequence tab
    function getSequenceApiKey() {
        const apiKeyInput = document.getElementById('sequence-api-key');
        if (apiKeyInput && apiKeyInput.value) {
            return apiKeyInput.value;
        }
        // If not entered manually, try to get from config editor
        try {
            const configText = editors.config ? editors.config.getValue() : '{}';
            const config = JSON.parse(configText || '{}');
            return config.apikey || '';
        } catch (e) {
            return '';
        }
    }

    // Format result data for display
    function formatResultData(data) {
        if (typeof data === 'string') {
            if (data.trim().startsWith('<?xml') || data.trim().startsWith('<')) {
                return formatXml(data);
            }
            try {
                const json = JSON.parse(data);
                return JSON.stringify(json, null, 2);
            } catch (e) {
                return data;
            }
        } else if (typeof data === 'object' && data !== null) {
            return JSON.stringify(data, null, 2);
        }
        return String(data);
    }

    // Add result to the results container
    function addSequenceResult(name, success, data, error, headers, statusCode) {
        const resultsContainer = document.getElementById('sequence-results');
        if (!resultsContainer) return;

        // Remove "no results" message if exists
        const noResults = resultsContainer.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const statusClass = success ? 'success' : 'error';
        const statusText = success ? 'Success' : 'Error';

        let formattedData = '';
        if (error) {
            formattedData = `Error: ${error}`;
        } else {
            formattedData = formatResultData(data);
        }

        // Build status code badge with color coding
        let statusCodeHtml = '';
        if (statusCode !== null && statusCode !== undefined) {
            let statusCodeClass = 'status-code-info';
            if (statusCode >= 200 && statusCode < 300) {
                statusCodeClass = 'status-code-success';
            } else if (statusCode >= 300 && statusCode < 400) {
                statusCodeClass = 'status-code-redirect';
            } else if (statusCode >= 400 && statusCode < 500) {
                statusCodeClass = 'status-code-client-error';
            } else if (statusCode >= 500) {
                statusCodeClass = 'status-code-server-error';
            }
            statusCodeHtml = `
                <span class="status-code ${statusCodeClass}">${statusCode}</span>
            `;
        }

        // Build headers section if breadcrumbId exists
        let headersHtml = '';
        if (headers && headers.breadcrumbId) {
            headersHtml = `
                <div class="result-headers">
                    <span class="header-label">breadcrumbId:</span>
                    <span class="header-value">${headers.breadcrumbId}</span>
                </div>
            `;
        }

        resultItem.innerHTML = `
            <div class="result-header">
                <span class="result-name">${name}</span>
                <div class="result-meta">
                    ${statusCodeHtml}
                    <span class="result-status ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="result-body">
                <pre>${formattedData}</pre>
            </div>
            ${headersHtml}
        `;

        resultsContainer.appendChild(resultItem);
        
        // Scroll to the new result
        resultItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Store current sequence state
    let currentSequenceState = {
        paymentType: null,
        steps: [],
        requestBody: '',
        enabledHeaders: [],
        apiKey: '',
        pauseAtStep: 0,
        accountsData: null
    };

    // Execute sequence
    async function executeSequence() {
        const paymentType = getSelectedPaymentType();
        const steps = getSelectedSteps();
        const requestBody = sequenceEditor ? sequenceEditor.getValue() : '{}';
        const enabledHeaders = getSequenceHeaders();
        const apiKey = getSequenceApiKey();

        // Validation
        if (!paymentType) {
            alert('Please select a consent type');
            return;
        }

        if (steps.length === 0) {
            alert('Please select at least one step');
            return;
        }

        // Store current sequence state
        currentSequenceState = {
            paymentType,
            steps,
            requestBody,
            enabledHeaders,
            apiKey,
            pauseAtStep: 0,
            accountsData: null
        };

        // Clear previous results
        const resultsContainer = document.getElementById('sequence-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }

        // Show loader
        showLoader();

        try {
            const response = await fetch('/api/executeSequence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentType,
                    steps,
                    requestBody,
                    enabledHeaders,
                    apiKey
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                // Check if sequence is paused (waiting for account selection)
                if (result.paused) {
                    currentSequenceState.pauseAtStep = result.pauseAtStep;
                    currentSequenceState.accountsData = result.accountsData;
                    
                    // Display results up to pause point
                    if (result.data && Array.isArray(result.data)) {
                        for (const item of result.data) {
                            addSequenceResult(item.name, item.success, item.data, item.error, item.headers, item.statusCode);
                        }
                    }
                    
                    // Show account selection modal
                    if (paymentType === 'account' && result.accountsData) {
                        hideLoader();
                        const selectedAccounts = await showAccountSelectionModal(result.accountsData);
                        if (selectedAccounts) {
                            await continueSequenceWithAccounts(selectedAccounts);
                        }
                    }
                } else {
                    // Normal execution - display all results
                    if (result.data && Array.isArray(result.data)) {
                        for (const item of result.data) {
                            addSequenceResult(item.name, item.success, item.data, item.error, item.headers, item.statusCode);
                        }
                    }
                }
            } else {
                addSequenceResult('Error', false, null, result.error || 'Unknown error occurred', null, null);
            }
        } catch (error) {
            console.error('Error executing sequence:', error);
            addSequenceResult('Error', false, null, error.message, null, null);
        } finally {
            hideLoader();
        }
    }

    // Continue sequence after account selection
    async function continueSequenceWithAccounts(selectedAccounts) {
        if (!selectedAccounts || selectedAccounts.length === 0) {
            return;
        }

        // Show loader
        showLoader();

        try {
            // Send selected accounts to server to update stored data
            // Server will use session from cookie automatically
            const confirmResponse = await fetch('/api/sequence/accounts/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedAccounts: selectedAccounts.map(acc => acc.accountDetails.identification)
                }),
                credentials: 'include'
            });

            const confirmResult = await confirmResponse.json();

            if (!confirmResult.success) {
                addSequenceResult('Account Confirmation', false, null, confirmResult.error || 'Failed to confirm accounts', null, null);
                hideLoader();
                return;
            }

            // Add result with selected accounts
            addSequenceResult('Selected Accounts', true, { 
                selectedAccounts: selectedAccounts.map(acc => ({
                    identification: acc.accountDetails?.identification,
                    currency: acc.currency,
                    status: acc.status
                }))
            }, null, null, null);

            // Continue sequence from paused step
            const response = await fetch('/api/executeSequence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentType: currentSequenceState.paymentType,
                    steps: currentSequenceState.steps,
                    requestBody: currentSequenceState.requestBody,
                    enabledHeaders: currentSequenceState.enabledHeaders,
                    apiKey: currentSequenceState.apiKey,
                    continueFromStep: currentSequenceState.pauseAtStep,
                    selectedAccounts: selectedAccounts.map(acc => acc.accountDetails.identification)
                }),
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data && Array.isArray(result.data)) {
                // Server now returns only NEW results (after continuation)
                // Just add them all to the UI
                for (const item of result.data) {
                    addSequenceResult(item.name, item.success, item.data, item.error, item.headers, item.statusCode);
                }
            } else {
                addSequenceResult('Error', false, null, result.error || 'Unknown error occurred', null, null);
            }
        } catch (error) {
            console.error('Error continuing sequence:', error);
            addSequenceResult('Error', false, null, error.message, null, null);
        } finally {
            hideLoader();
        }
    }

    // Get session ID from cookie
    function getSessionId() {
        const name = 'custom_sid' + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    }

    // Show account selection modal
    async function showAccountSelectionModal(data) {
        return new Promise((resolve) => {
            const modal = document.getElementById('account-selection-modal');
            const accountList = document.getElementById('account-list');
            const errorDiv = document.getElementById('account-error');
            const confirmBtn = document.getElementById('confirm-accounts-btn');
            
            // Parse accounts from data
            let accounts = [];
            try {
                const responseData = data.data || data;
                if (responseData && responseData.account && Array.isArray(responseData.account)) {
                    accounts = responseData.account;
                }
            } catch (e) {
                console.error('Error parsing accounts:', e);
            }
            
            if (accounts.length === 0) {
                addSequenceResult('Account Selection', false, null, 'No accounts found in response', null, null);
                resolve(null);
                return;
            }
            
            // Build account list HTML
            accountList.innerHTML = accounts.map((account, index) => {
                const accountDescription = account.accountDescription || 'Unknown';
                const identification = account.accountDetails?.identification || 'N/A';
                const currency = account.currency || 'N/A';
                const status = account.status || 'unknown';
                const statusClass = status.toLowerCase() === 'enabled' ? 'enabled' : 'disabled';
                
                return `
                    <div class="account-item" data-index="${index}">
                        <input type="checkbox" id="account-${index}" value="${index}">
                        <div class="account-details">
                            <div class="account-name">${escapeHtml(accountDescription)}</div>
                            <div class="account-info">
                                ${escapeHtml(identification)}
                                <span class="account-currency">${escapeHtml(currency)}</span>
                                <span class="account-status ${statusClass}">${escapeHtml(status)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click handlers to account items
            document.querySelectorAll('.account-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox') {
                        const checkbox = item.querySelector('input[type="checkbox"]');
                        checkbox.checked = !checkbox.checked;
                    }
                });
            });
            
            // Hide error message
            errorDiv.style.display = 'none';
            
            // Show modal
            modal.style.display = 'flex';
            
            // Handle confirm button click (use onclick to overwrite any previous handlers)
            confirmBtn.onclick = () => {
                const selectedAccounts = [];
                document.querySelectorAll("#account-list input[type='checkbox']:checked").forEach(checkbox => {
                    const index = parseInt(checkbox.value);
                    selectedAccounts.push(accounts[index]);
                });
                
                if (selectedAccounts.length === 0) {
                    errorDiv.style.display = 'block';
                    return;
                }
                
                // Hide modal
                modal.style.display = 'none';
                
                resolve(selectedAccounts);
            };
            
            // Make closeAccountModal function globally available
            window.closeAccountModal = function() {
                modal.style.display = 'none';
                resolve(null);
            };
        });
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    
    function formatXml(xml) {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    let i = 0;
    xml = xml.trim().replace(/>\s+</g, '><');

    for (i = 0; i < xml.length; i++) {
        const char = xml[i];

        if (char === '<') {
            const nextChar = xml[i + 1];

            if (nextChar === '/') {
                
                indent = indent.substring(tab.length);
                formatted += '\n' + indent;
            } else if (i > 0 && xml[i - 1] === '>') {
                
                formatted += '\n' + indent;
            }

            formatted += char;

            if (nextChar !== '/' && nextChar !== '?' && nextChar !== '!') {
                
                indent += tab;
            }
        } else if (char === '>') {
            formatted += char;

            if (xml[i - 1] === '/') {
                
                indent = indent.substring(tab.length);
            }
        } else {
            formatted += char;
        }
    }

        return formatted;
    }

    
    function updateConfigDisplay(updatedConfig) {
    try {
        const configEditor = document.getElementById('config-editor');
        if (configEditor) {
            const currentConfig = JSON.parse(editors.config.getValue() || '{}');
            const newConfig = { ...currentConfig, ...updatedConfig };
            editors.config.setValue(JSON.stringify(newConfig, null, 2));
        }
    } catch (e) {
        console.error('Error updating config display:', e);
    }
    }

    
    async function loadConfig() {
        debugger;
        try {
            const response = await fetch('/api/config',{
                    method: 'GET',
                    credentials: 'include'  
            });
            const data = await response.json();

            if (data.success && data.config) {
                editors.config.setValue(JSON.stringify(data.config, null, 2));
                showNotification('Configuration loaded successfully');
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    
    async function saveConfig() {
        debugger;
        try {
            const configText = editors.config.getValue();
            const newConfig = JSON.parse(configText || '{}');

            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    config: newConfig
                })
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Configuration saved successfully');
            } else {
                throw new Error(result.error || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }

    
    async function resetConfig() {
        if (confirm('Are you sure you want to reset the configuration to default?')) {
            try {
                const response = await fetch('/api/config/default', {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success && data.config) {
                    editors.config.setValue(JSON.stringify(data.config, null, 2));
                    showNotification('Configuration reset to default');
                }
            } catch (error) {
                console.error('Error resetting config:', error);
                editors.config.setValue('{}');
            }
        }
    }

    
    function formatJson() {
        try {
            const content = editors.request.getValue();
            if (!content.trim()) return;

            try {
                const json = JSON.parse(content);
                editors.request.setValue(JSON.stringify(json, null, 2));
                showNotification('JSON formatted successfully');
            } catch (error) {
                showNotification('Invalid JSON format', 'error');
            }
        } catch (error) {
            showNotification(`Error formatting JSON: ${error.message}`, 'error');
        }
    }

    // Validate JSON by Schema
    async function validateBySchema() {
        if (!currentFunction) {
            showNotification('Please select a function first', 'error');
            return;
        }

        const jsonBody = editors.request.getValue();
        if (!jsonBody.trim()) {
            showNotification('Request body is empty', 'error');
            return;
        }

        // Validate JSON syntax first
        try {
            JSON.parse(jsonBody);
        } catch (error) {
            showNotification('Invalid JSON syntax in request body', 'error');
            return;
        }

        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    functionName: currentFunction,
                    jsonBody: jsonBody
                }),
                credentials: 'include'
            });

            const result = await response.json();
            
            const validationResultDiv = document.getElementById('validation-result');
            if (validationResultDiv) {
                validationResultDiv.style.display = 'block';
                
                if (result.valid) {
                    validationResultDiv.className = 'validation-result valid';
                    validationResultDiv.innerHTML = `<div class="validation-title">✓ ${result.message}</div>`;
                } else {
                    validationResultDiv.className = 'validation-result invalid';
                    let errorsHtml = '';
                    if (result.errors && result.errors.length > 0) {
                        errorsHtml = '<div class="validation-errors"><strong>Errors:</strong>';
                        result.errors.forEach(err => {
                            errorsHtml += `<div class="validation-error-item">${err.instancePath}: ${err.message}</div>`;
                        });
                        errorsHtml += '</div>';
                    }
                    validationResultDiv.innerHTML = `<div class="validation-title">✗ ${result.message}</div>${errorsHtml}`;
                }
            }
        } catch (error) {
            console.error('Error validating schema:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }

    
    function formatSequenceJson() {
        try {
            const content = sequenceEditor ? sequenceEditor.getValue() : '';
            if (!content.trim()) return;

            try {
                const json = JSON.parse(content);
                if (sequenceEditor) {
                    sequenceEditor.setValue(JSON.stringify(json, null, 2));
                }
                showNotification('JSON formatted successfully');
            } catch (error) {
                showNotification('Invalid JSON format', 'error');
            }
        } catch (error) {
            showNotification(`Error formatting JSON: ${error.message}`, 'error');
        }
    }

    
    function switchTab(tabName) {
        
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        
        if (currentFunction && tabName !== 'functions') {
            saveFunctionContext(currentFunction);
        }
    }

    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    
    function init() {
        initEditors();
        loadFunctions();
        loadConfig();
        setupCascadeCheckboxes();

        
        executeBtn.addEventListener('click', executeFunction);
        saveConfigBtn.addEventListener('click', saveConfig);
        resetConfigBtn.addEventListener('click', resetConfig);
        formatJsonBtn.addEventListener('click', formatJson);
        
        if (validateSchemaBtn) {
            validateSchemaBtn.addEventListener('click', validateBySchema);
        }

        
        const sequenceFormatJsonBtn = document.getElementById('sequence-format-json');
        const sequenceExecuteBtn = document.getElementById('sequence-execute');
        
        if (sequenceFormatJsonBtn) {
            sequenceFormatJsonBtn.addEventListener('click', formatSequenceJson);
        }
        
        if (sequenceExecuteBtn) {
            sequenceExecuteBtn.addEventListener('click', executeSequence);
        }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // ReadME sub-tabs functionality
    const readmeSubtabBtns = document.querySelectorAll('.readme-subtab-btn');
    const readmeSubtabContents = document.querySelectorAll('.readme-subtab-content');

    if (readmeSubtabBtns.length > 0) {
        readmeSubtabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const subtab = btn.dataset.subtab;

                // Update button states
                readmeSubtabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update content visibility
                readmeSubtabContents.forEach(content => {
                    content.classList.toggle('active', content.id === subtab);
                });
            });
        });
    }

        window.addEventListener('beforeunload', () => {
            if (currentFunction) {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `/api/context/${encodeURIComponent(currentFunction)}`, false);
                xhr.setRequestHeader('Content-Type', 'application/json');

                const body = editors.request.getValue();
                const enabledHeaders = Array.from(
                    document.querySelectorAll('#headers-list input[type="checkbox"]:checked')
                ).map(checkbox => checkbox.name);

                xhr.send(JSON.stringify({ body, enabledHeaders }));
            }
        });

        document.getElementById('showSessionBtn').addEventListener('click', showSessionInfo);
        async function showSessionInfo() {
            debugger;
        try {
        const response = await fetch('/api/session', {
            credentials: 'include'  
        });
        const data = await response.json();
        
        const sessionInfo = document.getElementById('sessionInfo');
        sessionInfo.style.display = 'block';
        sessionInfo.innerHTML = `
            <h4>Информация о сессии:</h4>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
    } catch (error) {
        console.error('Ошибка при получении данных сессии:', error);
        alert('Не удалось получить данные сессии');
    }
    }
    }

    init();

    window.app = {
        executeFunction,
        loadFunctions,
        saveConfig,
        resetConfig,
        formatJson,
        switchTab,
        executeSequence
    };
});
