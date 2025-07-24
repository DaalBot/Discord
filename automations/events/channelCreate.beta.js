// General modules
const fs = require('fs');
const path = require('path');
const ivm = require('isolated-vm');
const client = require('../../client.js');
const toolsClass = require('../tools.js');
const daalbot = require('../../daalbot.js');
const filenameWithoutExtension = path.basename(__filename, '.js');
const consoleOverrides = toolsClass.getConsoleOverrides();
const utils = toolsClass.getUtils();
const checkSecurityRules = toolsClass.getSecurityRules();

class EventSandbox {
    constructor(options = {}) {
        this.memoryLimit = options.memoryLimit || 64; // 64MB limit
        this.timeout = options.timeout || 30000; // 30 second timeout
    }

    
    /**
     * @param {ivm.Context} context - The isolated-vm context to set up.
     * @param {Object} eventObject - The event data object.
     * @param {Object} utils - Utility functions to be passed into the sandbox.
     * @param {string} eventId - Unique identifier for the event, used for toolsClass.
     * @description Sets up the sandbox environment with restricted globals, console overrides, and utility functions.
     * This method configures the isolated-vm context to ensure a secure and controlled execution environment for event scripts.
     * It blocks access to dangerous Node.js globals, sets up a controlled console, and passes the event data and utilities.
     * @returns {Promise<void>}
     * @throws {Error} If any setup operation fails.
     * @example
     * await eventSandbox.setupSandboxEnvironment(context, eventObject, utils, eventId);=
     */
    async setupSandboxEnvironment(context, eventObject, utils, eventId) {
        const jail = context.global;
        
        // Set up global reference
        await jail.set('global', jail.derefInto());
        
        // Set up console overrides (controlled logging)
        await jail.set('console', new ivm.ExternalCopy({
            log: new ivm.Callback(consoleOverrides.log),
            error: new ivm.Callback(consoleOverrides.error),
            warn: new ivm.Callback(consoleOverrides.warn),
            info: new ivm.Callback(consoleOverrides.info),
            debug: new ivm.Callback(consoleOverrides.debug),
            trace: new ivm.Callback(consoleOverrides.trace)
        }).copyInto());

        // Set up module system for your event format
        const moduleObj = new ivm.ExternalCopy({
            exports: {}
        }).copyInto();
        await jail.set('module', moduleObj);
        await jail.set('exports', moduleObj.exports);

        // Block process access entirely - set to empty object
        await jail.set('process', new ivm.ExternalCopy({}).copyInto());
        
        // Block common Node.js globals that shouldn't be accessible
        await jail.set('require', undefined);
        await jail.set('__dirname', undefined);
        await jail.set('__filename', undefined);
        await jail.set('Buffer', undefined);
        
        // Allow timers since isolated-vm handles timeouts at the isolate level
        await jail.set('setTimeout', new ivm.Callback((fn, delay) => setTimeout(fn, delay)));
        await jail.set('setInterval', new ivm.Callback((fn, delay) => setInterval(fn, delay)));
        await jail.set('setImmediate', new ivm.Callback((fn) => setImmediate(fn)));
        await jail.set('clearTimeout', new ivm.Callback((id) => clearTimeout(id)));
        await jail.set('clearInterval', new ivm.Callback((id) => clearInterval(id)));
        await jail.set('clearImmediate', new ivm.Callback((id) => clearImmediate(id)));
        
        // Block file system and other dangerous modules
        await jail.set('fs', undefined);
        await jail.set('path', undefined);
        await jail.set('os', undefined);
        await jail.set('crypto', undefined);
        await jail.set('child_process', undefined);
        await jail.set('cluster', undefined);
        await jail.set('http', undefined);
        await jail.set('https', undefined);
        await jail.set('net', undefined);
        await jail.set('tls', undefined);
        await jail.set('url', undefined);
        await jail.set('querystring', undefined);
        
        // Block eval and Function constructor
        await jail.set('eval', undefined);
        await jail.set('Function', undefined);
        
        // Pass event data (with client data completely removed for security)
        const sanitizedEventObject = { ...eventObject };
        delete sanitizedEventObject.client;
        await jail.set('eventData', new ivm.ExternalCopy(sanitizedEventObject).copyInto());

        // Pass utils - handle functions properly
        await this.setupUtils(jail, utils);

        // Set event ID
        await jail.set('eventId', eventId);
        
        // Set up a restricted environment
        await this.setupRestrictedGlobals(jail, context);
    }

    /**
     * Sets up restricted globals in the isolated-vm context.
     * This method blocks access to dangerous global objects and provides safe alternatives.
     * It ensures that the sandboxed environment is secure and does not allow operations that could compromise the host system.
     * @param {ivm.Jail} jail - The isolated-vm jail to set up restricted globals in.
     * @param {ivm.Context} context - The isolated-vm context where the jail is applied.
     * @returns {Promise<void>}
     * @throws {Error} If any setup operation fails.
     * @description This method configures the jail to block access to potentially dangerous global objects and constructors,
     * such as XMLHttpRequest, fetch, and WebSocket. It also provides safe alternatives for Math, Date, JSON, Array, Object, String,
     * and other global objects. The Date constructor is implemented as a proxy to prevent direct access to the native Date object.
     * It ensures that the sandboxed environment is secure and does not allow operations that could compromise the host system.
     * @example
     * await eventSandbox.setupRestrictedGlobals(jail, context);
     * @memberof EventSandbox
     */
    async setupRestrictedGlobals(jail, context) {
        // Provide safe alternatives or throw errors for dangerous operations
        const restrictedError = new ivm.Callback(() => {
            throw new Error('Operation not permitted in sandbox');
        });

        // Block dangerous constructors
        await jail.set('XMLHttpRequest', restrictedError);
        await jail.set('fetch', restrictedError);
        await jail.set('WebSocket', restrictedError);
        
        // Block access to global objects that might leak information
        await jail.set('window', undefined);
        await jail.set('document', undefined);
        await jail.set('location', undefined);
        await jail.set('navigator', undefined);
        
        // Provide safe Math, Date, JSON, etc.
        await jail.set('Math', new ivm.ExternalCopy(Math).copyInto());
        
        // Create a Date proxy instead of copying the native Date constructor
        await context.eval(`
            Date = function(...args) {
                if (!new.target) return new Date(...args).toString();
                if (args.length === 0) return new DateImpl();
                return new DateImpl(...args);
            };
            
            // Implement Date constructor functionality
            function DateImpl(...args) {
                const date = new Date(...args);
                this.getTime = () => date.getTime();
                this.getDate = () => date.getDate();
                this.getDay = () => date.getDay();
                this.getFullYear = () => date.getFullYear();
                this.getHours = () => date.getHours();
                this.getMilliseconds = () => date.getMilliseconds();
                this.getMinutes = () => date.getMinutes();
                this.getMonth = () => date.getMonth();
                this.getSeconds = () => date.getSeconds();
                this.getTimezoneOffset = () => date.getTimezoneOffset();
                this.getUTCDate = () => date.getUTCDate();
                this.getUTCDay = () => date.getUTCDay();
                this.getUTCFullYear = () => date.getUTCFullYear();
                this.getUTCHours = () => date.getUTCHours();
                this.getUTCMilliseconds = () => date.getUTCMilliseconds();
                this.getUTCMinutes = () => date.getUTCMinutes();
                this.getUTCMonth = () => date.getUTCMonth();
                this.getUTCSeconds = () => date.getUTCSeconds();
                this.toString = () => date.toString();
                this.toISOString = () => date.toISOString();
                this.toJSON = () => date.toJSON();
                this.toLocaleDateString = () => date.toLocaleDateString();
                this.toLocaleString = () => date.toLocaleString();
                this.toLocaleTimeString = () => date.toLocaleTimeString();
                this.toUTCString = () => date.toUTCString();
                this.valueOf = () => date.valueOf();
            }
            
            Date.now = () => Date.now();
            Date.parse = (str) => Date.parse(str);
            Date.UTC = (...args) => Date.UTC(...args);
        `);
        
        await jail.set('JSON', new ivm.ExternalCopy({
            parse: new ivm.Callback(JSON.parse),
            stringify: new ivm.Callback(JSON.stringify)
        }).copyInto());
    }

    async setupUtils(jail, utils) {
        if (!utils || typeof utils !== 'object') {
            await jail.set('utils', new ivm.ExternalCopy({}).copyInto());
            return;
        }

        const utilsProxy = {};
        for (const [key, value] of Object.entries(utils)) {
            if (typeof value === 'function') {
                // Wrap functions as callbacks
                utilsProxy[key] = new ivm.Callback((...args) => {
                    try {
                        return value.apply(utils, args);
                    } catch (error) {
                        throw new Error(`Utils function '${key}' error: ${error.message}`);
                    }
                });
            } else if (value && typeof value === 'object') {
                // Handle nested objects/arrays
                utilsProxy[key] = JSON.parse(JSON.stringify(value)); // Deep copy
            } else {
                // Primitive values
                utilsProxy[key] = value;
            }
        }

        await jail.set('utils', new ivm.ExternalCopy(utilsProxy).copyInto());
    }

    async executeEventFile(inputFile, eventObject, utils, eventId) {
        const isolate = new ivm.Isolate({ memoryLimit: this.memoryLimit });
        
        try {
            // Read the event file
            const inputFileContents = daalbot.fs.read(inputFile, 'utf8');
            
            // Security check
            if (!(await checkSecurityRules(inputFileContents))) {
                console.warn(`Security check failed for event file: ${inputFile}`);
                return;
            }

            // Set up tools class
            toolsClass.setId(eventId);
            toolsClass.setup();

            const context = await isolate.createContext();
            
            // Set up sandbox environment
            await this.setupSandboxEnvironment(context, eventObject, utils, eventId);

            // Create execution wrapper code that handles your specific event format
            const executionCode = `
                    // Load the event file content
                    try {
                        ${inputFileContents}
                    } catch (e) {
                        throw new Error('Event file loading failed: ' + e.message);
                    }
                    
                    // Extract the event object from module.exports
                    let eventModule = null;
                    if (module && module.exports) {
                        eventModule = module.exports;
                    }
                    
                    if (!eventModule) {
                        throw new Error('No module.exports found in event file');
                    }
                    
                    if (!eventModule.execute || typeof eventModule.execute !== 'function') {
                        throw new Error('No execute function found in event module');
                    }
                    
                    // Map gateway event names to their primary parameter names
                    const eventTypeMap = {
                        'guildMemberUpdate': 'member',
                        'messageReactionAdd': 'reaction', 
                        'guildRoleDelete': 'role',
                        'guildBanAdd': 'ban',
                        'messageUpdate': 'message',
                        'channelCreate': 'channel',
                        'guildRoleUpdate': 'role',
                        'channelDelete': 'channel',
                        'guildMemberAdd': 'member',
                        'guildRoleCreate': 'role',
                        'guildUpdate': 'guild',
                        'messageDelete': 'message',
                        'messageCreate': 'message',
                        'guildBanRemove': 'ban',
                        'guildMemberRemove': 'member',
                        'channelUpdate': 'channel',
                        'messageReactionRemove': 'reaction',
                        'interactionCreate': 'interaction'
                    };
                    
                    // Get the event type from the current filename (passed as eventId's parent context)
                    const primaryParam = eventData;
                    
                    try {
    // Execute the function with your expected parameters (primaryParam, utils)
    await eventModule.execute(primaryParam, utils);
} catch (error) {
    // Enhance error message with more context
    if (error.message.includes("Cannot read properties of undefined")) {
        const match = error.message.match(/reading '([^']+)'/);
        const property = match ? match[1] : 'unknown';
        throw new Error(\`Property access error: Attempting to access '\${property}' on an undefined object. Check your property chain or add null checks in your event handler.\`);
    }
    throw error;
}
                })();
            `;

            // Execute in sandbox
            const result = await context.eval(executionCode, { 
                timeout: this.timeout,
                promise: true // Allow async operations
            });

            return result;

        } catch (error) {
            console.error(`[Event] Sandbox execution error: ${error.message}`);
            if (error.stack) {
                console.error(`[Event] Stack trace: ${error.stack}`);
            }
        } finally {
            // Clean up
            toolsClass.reset();
            isolate.dispose();
        }
    }
}

// Create sandbox instance
const eventSandbox = new EventSandbox({
    memoryLimit: 64, // 64MB per event
    timeout: 30000   // 30 second timeout per event
});

// Event handler
client.on(`${filenameWithoutExtension}`, async eventObject => {
    if (!eventObject.guild) return; // Ignore DMs

    async function executeEvent(inputFile) {
        try {
            // Extract event ID from file path for toolsClass
            const eventId = path.basename(path.dirname(inputFile));
            
            await eventSandbox.executeEventFile(inputFile, eventObject, utils, eventId);
            
        } catch (error) {
            console.error(`Failed to execute event ${inputFile}: ${error.message}`);
        }
    }

    // Load and filter events
    try {
        const eventsJSON = JSON.parse(daalbot.fs.read(path.resolve('./db/events/events.json'), 'utf8'));
        const validEvents = eventsJSON.filter(event => 
            event.on === `${filenameWithoutExtension}` && 
            event.enabled === true && 
            event.guild === eventObject.guild.id
        );

        // Execute all valid events
        const eventPromises = validEvents.map(event => 
            executeEvent(path.resolve(`./db/events/${event.id}/event.js`))
        );

        // Wait for all events to complete
        await Promise.allSettled(eventPromises);

    } catch (error) {
        console.error(`Failed to load or process events: ${error.message}`);
    }
});