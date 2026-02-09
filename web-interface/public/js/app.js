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
                'domestic': 'Domestic',
                'domesticTax': 'Domestic Tax',
                'listAccounts': 'List Accounts',
                'listPassports': 'List Passports',
                'requirement': 'Requirements',
                'taxRequirement': 'Requirements Tax',
                'VRP': 'VRP'
            };
            
            const groupOrder = ['tokens', 'common', 'domestic', 'domesticTax', 'listAccounts', 'listPassports', 'requirement', 'taxRequirement', 'VRP'];

            groupOrder.forEach(groupName => {
                if (data.groups[groupName] && data.groups[groupName].length > 0) {
                    
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

                    
                    data.groups[groupName].forEach(func => {
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

    // Execute sequence
    async function executeSequence() {
        const paymentType = getSelectedPaymentType();
        const steps = getSelectedSteps();
        const requestBody = sequenceEditor ? sequenceEditor.getValue() : '{}';
        const enabledHeaders = getSequenceHeaders();
        const apiKey = getSequenceApiKey();

        // Validation
        if (!paymentType) {
            alert('Please select a payment type');
            return;
        }

        if (steps.length === 0) {
            alert('Please select at least one step');
            return;
        }

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

            if (result.success && result.data && Array.isArray(result.data)) {
                // Display each result
                result.data.forEach(item => {
                    addSequenceResult(item.name, item.success, item.data, item.error, item.headers, item.statusCode);
                });
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
                const response = await fetch('/api/config', {
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
