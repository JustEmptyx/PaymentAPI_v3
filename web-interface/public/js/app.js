document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
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
    const apiKeyInput = document.getElementById('api-key');
    const headersList = document.getElementById('headers-list');

    // Current state
    let currentFunction = null;
    let editors = {};
    let appConfig = {};

    // Initialize CodeMirror editors
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

        // Request body editor
        editors.request = CodeMirror.fromTextArea(requestBodyEditor, {
            ...editorOptions,
            placeholder: 'Enter request body (JSON)'
        });

        // Response body editor
        editors.response = CodeMirror.fromTextArea(responseBodyEditor, {
            ...editorOptions,
            readOnly: true
        });

        // Config editor
        editors.config = CodeMirror.fromTextArea(configInput, {
            ...editorOptions,
            mode: { name: 'javascript', json: true },
            placeholder: 'Enter configuration (JSON)'
        });
    }

    // Load functions from the server
    async function loadFunctions() {
        try {
            const response = await fetch('/api/functions');
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
                'requirements': 'Requirements',
                'requirementsTax': 'Requirements Tax'
            };
            // Create groups in the order you want them to appear
            const groupOrder = ['tokens', 'common', 'domestic', 'domesticTax', 'listAccounts', 'listPassports', 'requirements', 'requirementsTax'];

            groupOrder.forEach(groupName => {
                if (data.groups[groupName] && data.groups[groupName].length > 0) {
                    // Create group container
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'function-group';

                    // Create group header
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'function-group-header';
                    groupHeader.textContent = groupTitles[groupName] || groupName;

                    // Add click event to toggle the group
                    groupHeader.addEventListener('click', function() {
                        groupDiv.classList.toggle('active');
                    });

                    // Create list for function items
                    const groupList = document.createElement('ul');
                    groupList.className = 'function-group-list';

                    // Add functions to the group
                    data.groups[groupName].forEach(func => {
                        const li = document.createElement('li');
                        li.textContent = func.name;
                        li.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent triggering the group header's click
                            selectFunction(func.name);
                        });
                        groupList.appendChild(li);
                    });

                    // Assemble the group
                    groupDiv.appendChild(groupHeader);
                    groupDiv.appendChild(groupList);
                    functionList.appendChild(groupDiv);

                    // Expand the 'tokens' group by default
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

    // Render function list
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

    // Select a function
    async function selectFunction(funcName) {
        // Update UI
        document.querySelectorAll('.function-item').forEach(el => {
            el.classList.toggle('active', el.dataset.function === funcName);
        });

        document.getElementById('selected-function').textContent = funcName;
        executeBtn.disabled = false;

        // Save current function context if exists
        if (currentFunction) {
            await saveFunctionContext(currentFunction);
        }

        // Set new current function
        currentFunction = funcName;

        // Load function context
        await loadFunctionContext(funcName);
    }

    // Load function context (body and headers)
    async function loadFunctionContext(funcName) {
        try {
            const response = await fetch(`/api/context/${encodeURIComponent(funcName)}`);
            const context = await response.json();

            // Set request body
            if (context.body) {
                try {
                    const formattedBody = JSON.stringify(JSON.parse(context.body), null, 2);
                    editors.request.setValue(formattedBody);
                } catch (e) {
                    editors.request.setValue(context.body);
                }
            } else {
                editors.request.setValue('{}');
            }

            // Set enabled headers
            if (context.enabledHeaders && Array.isArray(context.enabledHeaders)) {
                document.querySelectorAll('#headers-list input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = context.enabledHeaders.includes(checkbox.name);
                });
            }

            // Set API key if exists
            if (context.enabledHeaders && context.enabledHeaders.includes('x-api-key') && context.apiKey) {
                apiKeyInput.value = context.apiKey;
            }

            // Set last result if exists
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

    // Save function context
    async function saveFunctionContext(funcName) {
        if (!funcName) return;

        try {
            const body = editors.request.getValue();
            const enabledHeaders = Array.from(document.querySelectorAll('#headers-list input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.name);

            // Include API key if checked
            const apiKeyCheckbox = document.querySelector('input[name="x-api-key"]');
            if (apiKeyCheckbox.checked && apiKeyInput.value) {
                enabledHeaders.push('x-api-key');
            } else {
                enabledHeaders.push('authorization');
            }

            await fetch(`/api/context/${encodeURIComponent(funcName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    body,
                    enabledHeaders,
                    apiKey: apiKeyInput.value
                })
            });
        } catch (error) {
            console.error('Error saving function context:', error);
        }
    }

    // Execute current function
    async function executeFunction() {
    if (!currentFunction) return;
    try {
        // Update UI
        responseStatus.textContent = 'Executing...';
        responseStatus.className = 'status-value loading';
        executeBtn.disabled = true;
        // Get request body as is
        const requestBody = editors.request.getValue();
        // Get enabled headers
        const enabledHeaders = Array.from(document.querySelectorAll('#headers-list input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.name);
        // Add API key to headers if enabled
        const headers = {};

        if (enabledHeaders.includes('x-api-key') && apiKeyInput.value) {
            headers['x-api-key'] = apiKeyInput.value;
            const currentConfig = JSON.parse(editors.config.getValue() || '{}');
            currentConfig.apikey = apiKeyInput.value;
            editors.config.setValue(JSON.stringify(currentConfig, null, 2));
        } else if (apiKeyInput.value) {
            headers['authorization'] = apiKeyInput.value;
            const currentConfig = JSON.parse(editors.config.getValue() || '{}');
            currentConfig.access_token = apiKeyInput.value;
            editors.config.setValue(JSON.stringify(currentConfig, null, 2));
        }
        // Send the request
        const response = await fetch(`/api/execute/${encodeURIComponent(currentFunction)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify({
                requestBody: requestBody, // Send as is, let the server handle parsing
                enabledHeaders,
                apiKey: apiKeyInput.value
            })
        });
        // Get the response as text first
        const responseText = await response.text();
        let result;
        // Try to parse as JSON, if that fails, keep as text
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
        if (currentFunction.toLowerCase().includes('token') && result.data && typeof result.data === 'object' && result.data.access_token) {
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) {
                apiKeyInput.value = result.data.access_token;
            }
            // Also update the config in the UI if config editor is visible
            try {
                const configEditor = document.getElementById('config-editor'); // Make sure this ID matches your config editor
                if (configEditor) {
                    const currentConfig = JSON.parse(editors.config.getValue() || '{}');
                    currentConfig.access_token = result.data.access_token;
                    editors.config.setValue(JSON.stringify(currentConfig, null, 2));
                }
            } catch (e) {
                console.error('Error updating config editor:', e);
            }
        }
        if (currentFunction && currentFunction.toLowerCase().includes('token') && result && result.data && typeof result.data === 'object' && result.data.access_token) {
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) {
                    apiKeyInput.value = result.data.access_token;
            }
        // Update the config editor with the new token
        updateConfigDisplay({ access_token: result.data.access_token });
    }

    if (result && result.data) {
    // If API key checkbox is checked, update the API key
    if (enabledHeaders.includes('x-api-key') && apiKeyInput.value) {
        const currentConfig = JSON.parse(editors.config.getValue() || '{}');
        currentConfig.apikey = apiKeyInput.value;
        editors.config.setValue(JSON.stringify(currentConfig, null, 2));
    }
    // If authorization header is used, update access_token
    else if (enabledHeaders.includes('authorization') && apiKeyInput.value) {
        const currentConfig = JSON.parse(editors.config.getValue() || '{}');
        currentConfig.access_token = apiKeyInput.value;
        editors.config.setValue(JSON.stringify(currentConfig, null, 2));
    }
    }
        // Update UI with response
        responseStatus.textContent = 'Success';
        responseStatus.className = 'status-value success';
        // Handle different response types
        if (typeof result.data === 'string') {
            // Check if it's XML
            if (result.data.trim().startsWith('<?xml') || result.data.trim().startsWith('<')) {
                // Format XML with proper indentation
                const formattedXml = formatXml(result.data);
                editors.response.setValue(formattedXml);
            } else {
                // Try to parse as JSON for pretty printing
                try {
                    const json = JSON.parse(result.data);
                    editors.response.setValue(JSON.stringify(json, null, 2));
                } catch (e) {
                    // If not JSON, display as is
                    editors.response.setValue(result.data);
                }
            }
        } else if (typeof result.data === 'object') {
            // If it's already an object, stringify with pretty print
            editors.response.setValue(JSON.stringify(result.data, null, 2));
        } else {
            // For any other type, convert to string
            editors.response.setValue(String(result.data));
        }
    } catch (error) {
        console.error('Error executing function:', error);
        responseStatus.textContent = `Error: ${error.message}`;
        responseStatus.className = 'status-value error';
        editors.response.setValue(`Error: ${error.message}\n\n${error.stack || ''}`);
    } finally {
        executeBtn.disabled = false;
    }
    }

    // In app.js, add this after the executeFunction and before any event listeners
    // Update config display helper function
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
                // Closing tag
                indent = indent.substring(tab.length);
                formatted += '\n' + indent;
            } else if (i > 0 && xml[i - 1] === '>') {
                // Nested tag
                formatted += '\n' + indent;
            }

            formatted += char;

            if (nextChar !== '/' && nextChar !== '?' && nextChar !== '!') {
                // Opening tag
                indent += tab;
            }
        } else if (char === '>') {
            formatted += char;

            if (xml[i - 1] === '/') {
                // Self-closing tag
                indent = indent.substring(tab.length);
            }
        } else {
            formatted += char;
        }
    }

    return formatted;
    }

    // Load app config
    async function loadConfig() {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();

            if (data.success && data.config) {
                appConfig = data.config;
                editors.config.setValue(JSON.stringify(appConfig, null, 2));
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    // Save app config
    async function saveConfig() {
        try {
            const configText = editors.config.getValue();
            const newConfig = JSON.parse(configText || '{}');

            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    config: newConfig
                })
            });

            const result = await response.json();

            if (result.success) {
                appConfig = result.config;
                showNotification('Configuration saved successfully');
            } else {
                throw new Error(result.error || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Reset config to default
    function resetConfig() {
        if (confirm('Are you sure you want to reset the configuration to default?')) {
            editors.config.setValue('{}');
        }
    }

    // Format JSON in request body
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

    // Switch tabs
    function switchTab(tabName) {
        // Update tab buttons
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Save current context before switching
        if (currentFunction && tabName !== 'functions') {
            saveFunctionContext(currentFunction);
        }
    }

    // Show notification
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

    // Initialize the application
    function init() {
        initEditors();
        loadFunctions();
        loadConfig();

        // Event listeners
        executeBtn.addEventListener('click', executeFunction);
        saveConfigBtn.addEventListener('click', saveConfig);
        resetConfigBtn.addEventListener('click', resetConfig);
        formatJsonBtn.addEventListener('click', formatJson);

        // Tab switching
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
            });
        });

        // Save context when leaving the page
        window.addEventListener('beforeunload', () => {
            if (currentFunction) {
                // Use synchronous request to ensure it completes
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
    }

    // Start the application
    init();

    // Expose functions to global scope for debugging
    window.app = {
        executeFunction,
        loadFunctions,
        saveConfig,
        resetConfig,
        formatJson,
        switchTab
    };
});