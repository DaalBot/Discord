// General modules
const fs = require('fs');
const path = require('path');
const toolsClass = require('../tools.js');

const consoleOverrides = toolsClass.getConsoleOverrides();
const utils = toolsClass.getUtils();
const checkSecurityRules = toolsClass.getSecurityRules();
const overridenProcessEnv = toolsClass.getOverridenProcessEnv();

/**
 * @param {string} id The ID of the event to call
 * @param {object} data The data to send to the event
 */
async function callEvent(id, data) {
    async function executeEvent(inputFile) {
        // Unload input incase its already loaded
        delete require.cache[require.resolve(inputFile)];

        // Load event file
        const input = require(inputFile);
        const inputData = data; // The line that should be changed to the actual input data
        const inputFileContents = fs.readFileSync(inputFile, 'utf8');

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
        
        if (!(await checkSecurityRules(inputFileContents))) return; // Exit and do not execute the event
    
        // All checks pass
        input.execute(inputData, utils, input.id);

        // Reset everything to normal
        toolsClass.reset();

        // Unload input file again
        delete require.cache[require.resolve(inputFile)];
    }

    executeEvent(path.resolve(`./db/events/${id}/event.js`));
}

module.exports = {
    callEvent
}