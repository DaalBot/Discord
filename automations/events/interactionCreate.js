// General modules
const fs = require('fs');
const path = require('path');
const client = require('../../client.js');
const toolsClass = require('../tools.js');
const filenameWithoutExtension = path.basename(__filename, '.js');
const daalbot = require('../../daalbot.js');
const consoleOverrides = toolsClass.getConsoleOverrides();
const utils = toolsClass.getUtils();
const checkSecurityRules = toolsClass.getSecurityRules();
const overridenProcessEnv = toolsClass.getOverridenProcessEnv();

// Event handler
client.on(`${filenameWithoutExtension}`, async(eventObject) => {
    console.log(`Event ${filenameWithoutExtension} triggered`);
    console.log('Event object:', eventObject);
    
    async function executeEvent(eventDir) {
        console.log(`Checking event directory: ${eventDir}`);
        const jsFile = path.join(eventDir, 'event.js');
        const jsonFile = path.join(eventDir, 'event.json');
        
        console.log(`Looking for JS file: ${jsFile}`);
        console.log(`Looking for JSON file: ${jsonFile}`);
        
        // Check if event.js exists, if not, try event.json
        if (fs.existsSync(jsFile)) {
            console.log('Found event.js, executing JavaScript event');
            // Execute JavaScript event (existing logic)
            await executeJavaScriptEvent(jsFile);
        } else if (fs.existsSync(jsonFile)) {
            console.log('Found event.json, executing JSON event');
            // Execute JSON event (new logic)
            await executeJsonEvent(jsonFile);
        } else {
            console.error(`Neither event.js nor event.json found in ${eventDir}`);
            return;
        }
    }
    
    async function executeJavaScriptEvent(inputFile) {
        // Unload input incase its already loaded
        delete require.cache[require.resolve(inputFile)];
        // Load event file
        const input = require(inputFile);
        const inputData = eventObject; // The line that should be changed to the actual input data
        const inputFileContents = daalbot.fs.read(inputFile, 'utf8');
        if (!(await checkSecurityRules(inputFileContents))) return; // Exit and do not execute the event
        toolsClass.setId(input.id);
        // Override console functions
        console.log = consoleOverrides.log;
        console.error = consoleOverrides.error;
        console.warn = consoleOverrides.warn;
        console.info = consoleOverrides.info;
        console.debug = consoleOverrides.debug;
        console.trace = consoleOverrides.trace;
        // Override process.env
        process.env = overridenProcessEnv;
        eventObject.client = {};
        // All checks pass
        toolsClass.setup();
        try {
            input.execute(inputData, utils, input.id);
        } catch (e) {
            console.error(`${e}`);
        }
        // Reset everything to normal
        toolsClass.reset();
        // Unload input file again
        delete require.cache[require.resolve(inputFile)];
    }
    
    async function executeJsonEvent(inputFile) {
        console.log(`Executing JSON event from: ${inputFile}`);
        try {
            let jsonContent = daalbot.fs.read(inputFile, 'utf8');
            console.log('Raw JSON content length:', jsonContent.length);
            
            // The JSON format doesn't have the features that would require security checks like in JS files, but if you want it it's here
            // if (!(await checkSecurityRules(jsonContent))) {
            //     console.log('Security rules check failed, exiting');
            //     return;
            // }
            
            // Replace all placeholders in the JSON content before parsing
            jsonContent = await daalbot.convertMetaText(jsonContent, eventObject.guild, { obj: eventObject });
            console.log('JSON content after placeholder replacement:', JSON.stringify(jsonContent));
            
            const eventConfig = JSON.parse(jsonContent);
            console.log('Parsed event config:', JSON.stringify(eventConfig, null, 2));
            
            // Create function registry for this event execution
            const functionRegistry = {};
            
            // Process each block in the JSON event
            if (eventConfig.blocks && Array.isArray(eventConfig.blocks)) {
                console.log(`Processing ${eventConfig.blocks.length} blocks`);
                
                // First pass: register all functions
                for (const block of eventConfig.blocks) {
                    if (block.type === 'function') {
                        registerFunction(block, functionRegistry);
                    }
                }
                
                // Second pass: execute non-function blocks
                for (const block of eventConfig.blocks) {
                    if (block.type !== 'function') {
                        console.log('Processing block:', JSON.stringify(block, null, 2));
                        await processBlock(block, eventObject, functionRegistry);
                    }
                }
            } else {
                console.log('No blocks found in event config');
            }
        } catch (e) {
            console.error(`Error processing JSON event: ${e}`);
            console.error(`Error stack: ${e.stack}`);
        }
    }
    
    function registerFunction(functionBlock, functionRegistry) {
        if (functionBlock.name && functionBlock.children) {
            console.log(`Registering function: ${functionBlock.name}`);
            functionRegistry[functionBlock.name] = {
                params: functionBlock.params || [],
                children: functionBlock.children
            };
        }
    }
    
    async function executeFunction(functionName, args, eventObject, functionRegistry) {
        console.log(`Executing function: ${functionName} with args:`, args);
        
        if (!functionRegistry[functionName]) {
            console.error(`Function ${functionName} not found in registry`);
            return undefined;
        }
        
        const func = functionRegistry[functionName];
        const paramMap = {};
        
        // Map arguments to parameters
        for (let i = 0; i < func.params.length; i++) {
            paramMap[func.params[i]] = args[i] || null;
        }
        
        console.log('Parameter mapping:', paramMap);
        
        // Create a new context with the parameters
        const originalEventObject = { ...eventObject };
        eventObject.functionParams = paramMap;
        
        // Execute function children
        let returnValue = undefined;
        
        try {
            for (const child of func.children) {
                const result = await processBlock(child, eventObject, functionRegistry);
                // If we hit a return statement, stop execution and return the value
                if (result && result.type === 'return') {
                    returnValue = result.value;
                    break;
                }
            }
        } catch (e) {
            console.error(`Error executing function ${functionName}: ${e}`);
        }
        
        // Restore original context
        eventObject.functionParams = originalEventObject.functionParams;
        
        console.log(`Function ${functionName} returned:`, returnValue);
        return returnValue;
    }
    
    async function processBlock(block, eventObject, functionRegistry = {}) {
        if (block.type === 'action' && block.action) {
            return await processAction(block.action, eventObject, functionRegistry);
        } else if (block.type === 'branch' && block.condition) {
            return await processBranch(block, eventObject, functionRegistry);
        } else if (block.type === 'function_call' && block.function_name) {
            return await executeFunction(block.function_name, block.args || [], eventObject, functionRegistry);
        } else if (block.type === 'return') {
            return { type: 'return', value: block.value };
        }
        return undefined;
    }
    
    async function processBranch(branch, eventObject, functionRegistry = {}) {
        try {
            const condition = branch.condition;
            let result = false;
            
            // Process condition values through parameter replacement
            const leftValue = replaceParameters(condition.left, eventObject);
            const rightValue = replaceParameters(condition.right, eventObject);
            
            // Evaluate the condition
            if (condition.type === 'equals') {
                result = leftValue === rightValue;
            } else if (condition.type === 'not_equals') {
                result = leftValue !== rightValue;
            } else if (condition.type === 'greater_than') {
                result = parseFloat(leftValue) > parseFloat(rightValue);
            } else if (condition.type === 'less_than') {
                result = parseFloat(leftValue) < parseFloat(rightValue);
            } else if (condition.type === 'greater_than_or_equal') {
                result = parseFloat(leftValue) >= parseFloat(rightValue);
            } else if (condition.type === 'less_than_or_equal') {
                result = parseFloat(leftValue) <= parseFloat(rightValue);
            } else if (condition.type === 'contains') {
                result = String(leftValue).includes(String(rightValue));
            } else if (condition.type === 'starts_with') {
                result = String(leftValue).startsWith(String(rightValue));
            } else if (condition.type === 'ends_with') {
                result = String(leftValue).endsWith(String(rightValue));
            } else if (condition.type === 'exists') {
                const value = replaceParameters(condition.value, eventObject);
                result = value !== undefined && value !== null && value !== '';
            } else if (condition.type === 'not_exists') {
                const value = replaceParameters(condition.value, eventObject);
                result = value === undefined || value === null || value === '';
            }
            
            console.log(`Condition result: ${result} (${leftValue} ${condition.type} ${rightValue})`);
            
            // Execute the appropriate branch
            if (result && branch.if_true && Array.isArray(branch.if_true)) {
                for (const block of branch.if_true) {
                    const blockResult = await processBlock(block, eventObject, functionRegistry);
                    if (blockResult && blockResult.type === 'return') {
                        return blockResult;
                    }
                }
            } else if (!result && branch.if_false && Array.isArray(branch.if_false)) {
                for (const block of branch.if_false) {
                    const blockResult = await processBlock(block, eventObject, functionRegistry);
                    if (blockResult && blockResult.type === 'return') {
                        return blockResult;
                    }
                }
            }
        } catch (e) {
            console.error(`Error processing branch: ${e}`);
        }
        return undefined;
    }
    
    function replaceParameters(value, eventObject) {
        if (typeof value !== 'string') return value;
        
        // Replace function parameters if they exist
        if (eventObject.functionParams) {
            for (const [paramName, paramValue] of Object.entries(eventObject.functionParams)) {
                const placeholder = `%%{${paramName}}%%`;
                if (value === placeholder) {
                    return paramValue;
                }
                value = value.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), paramValue);
            }
        }
        
        return value;
    }
    
    async function processAction(action, eventObject, functionRegistry = {}) {
        switch (action.type) {
            case 'send_message':
                return await processSendMessage(action.message, eventObject);
            case 'use_util':
                if (action.util && typeof utils[action.util] === 'function') {
                    return await utils[action.util](action.params, eventObject);
                } else {
                    console.warn(`Util ${action.util} not found`);
                }
                break;
            case 'execute_function':
                if (action.function_name && functionRegistry[action.function_name]) {
                    return await executeFunction(action.function_name, action.args || [], eventObject, functionRegistry);
                } else {
                    console.warn(`Function ${action.function_name} not found`);
                }
                break;
            default:
                console.warn(`Unknown action type: ${action.type}`);
        }
        return undefined;
    }
    
    async function processSendMessage(message, eventObject) {
        try {
            if (message.payload && message.location) {
                // Content is already processed from the JSON replacement
                const content = message.payload.content;
                
                // Get the channel
                const channel = await client.channels.fetch(message.location);
                
                // Send the message
                await channel.send(content);
                return true;
            }
        } catch (e) {
            console.error(`Error sending message: ${e}`);
            return false;
        }
    }
    
    const eventsJSON = JSON.parse(daalbot.fs.read(path.resolve('./db/events/events.json'), 'utf8'));
    console.log('All events from events.json:', eventsJSON);
    
    const validEvents = eventsJSON.filter(event => event.on === `${filenameWithoutExtension}` && event.enabled === true && event.guild === eventObject.guild.id);
    console.log(`Found ${validEvents.length} valid events for ${filenameWithoutExtension} in guild ${eventObject.guild.id}`);
    console.log('Valid events:', validEvents);
    
    for (let i = 0; i < validEvents.length; i++) {
        const event = validEvents[i];
        console.log(`Processing event ${i + 1}/${validEvents.length}: ${event.id}`);
        // Pass the event directory path
        await executeEvent(path.resolve(`./db/events/${event.id}/`));
    }
})