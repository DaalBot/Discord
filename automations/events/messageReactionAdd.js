// General modules
const fs = require('fs');
const path = require('path');
const client = require('../../client.js');
const toolsClass = require('../tools.js');
const filenameWithoutExtension = path.basename(__filename, '.js');

const consoleOverrides = toolsClass.getConsoleOverrides();
const utils = toolsClass.getUtils();
const checkSecurityRules = toolsClass.getSecurityRules();
const overridenProcessEnv = toolsClass.getOverridenProcessEnv();

// Event handler
client.on(`${filenameWithoutExtension}`, async eventObject => {
    if (!eventObject.guild) return; // Ignore DMs
    async function executeEvent(inputFile) {
        // Unload input incase its already loaded
        delete require.cache[require.resolve(inputFile)];

        // Load event file
        const input = require(inputFile);
        const inputData = eventObject; // The line that should be changed to the actual input data
        const inputFileContents = fs.readFileSync(inputFile, 'utf8');

        toolsClass.setId(input.id);

        // Override data
        console.log = consoleOverrides.log;
        console.error = consoleOverrides.error;
        console.warn = consoleOverrides.warn;
        console.info = consoleOverrides.info;
        console.debug = consoleOverrides.debug;
        console.trace = consoleOverrides.trace;

        process.env = overridenProcessEnv;

        // Hide client data
        eventObject.client = {};
        
        if (!(await checkSecurityRules(inputFileContents))) return; // Exit and do not execute the event
    
        // All checks pass
        input.execute(inputData, utils, input.id);

        // Reset everything to normal
        toolsClass.reset();

        // Unload input file again
        delete require.cache[require.resolve(inputFile)];
    }

    const eventsJSON = JSON.parse(fs.readFileSync(path.resolve('./db/events/events.json'), 'utf8'));

    const validEvents = eventsJSON.filter(event => event.on === `${filenameWithoutExtension}` && event.enabled === true && event.guild === eventObject.guild.id);

    for (let i = 0; i < validEvents.length; i++) {
        const event = validEvents[i];

        executeEvent(path.resolve(`./db/events/${event.id}/event.js`));
    }
})