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
client.on(`${filenameWithoutExtension}`, async(eventObjectOld, eventObjectNew) => {

    async function executeEvent(inputFile) {
        // Unload input incase its already loaded
        delete require.cache[require.resolve(inputFile)];

        // Load event file
        const input = require(inputFile);
        const inputData = { old: eventObjectOld, new: eventObjectNew }; // The line that should be changed to the actual input data
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

        // Hide client data
        eventObjectOld.client = {};
        eventObjectNew.client = {};
    
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

    const eventsJSON = JSON.parse(daalbot.fs.read(path.resolve('./db/events/events.json'), 'utf8'));

    const validEvents = eventsJSON.filter(event => event.on === `${filenameWithoutExtension}` && event.enabled === true && event.guild === eventObjectNew.guild.id);

    for (let i = 0; i < validEvents.length; i++) {
        const event = validEvents[i];

        executeEvent(path.resolve(`./db/events/${event.id}/event.js`));
    }
})