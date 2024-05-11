const axios = require('axios')
const crypto = require('crypto');
const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');
const daalbot = require('../daalbot.js');
const client = require('../client.js');

let checkSecurityRules = require('./sec.pub.js'); // Self hosted bot checks

if (fs.existsSync(path.resolve('./automations/sec.js'))) { // Main bot checks
    checkSecurityRules = require('./sec.js');
}

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;
const originalConsoleTrace = console.trace;
const originalProcessEnv = process.env;

async function internal_getEventGuild(eventId) {
    const eventsJSON = JSON.parse(fs.readFileSync(path.resolve('./db/events/events.json'), 'utf8'));
    const event = eventsJSON.find(event => event.id === eventId);
    return event.guild;
}

const processEnvOverrides = {
    env: {
        TOKEN: 'Insert token here or smth idk', // Hide token but in a funny way
    }
}

const consoleOverrides = {
    log: function() {
        return null;
    },
    error: function() {
        return null;
    },
    warn: function() {
        return null;
    },
    info: function() {
        return null;
    },
    debug: function() {
        return null;
    },
    trace: function() {
        return null;
    }
}

const exportClass = new class {
    constructor() {
        this.id = 'UNKNOWN_EVENT_ID';
        this.checkSecurityRules = checkSecurityRules;
        this.consoleOverrides = consoleOverrides;
        this.processEnvOverrides = processEnvOverrides;
    }

    getSecurityRules() {
        return this.checkSecurityRules;
    }

    getUtils() {
        return {
            // Utils
            webhooks: {
                /**
                 * @param {{ url: string, data: string }} param0
                */
                send: ({ url, data }) => {
                    // Send webhook
                    axios.post(url, data)
                        .then(response => {
                            return {response}
                        })
                        .catch(error => {
                            return {error}
                        })
                }
            },
        
            // Variables
            variables: {
                /**
                 * @param {string} variableName
                 * @param {boolean} global
                */
                get: async(variableName, global) => {
                    // Get event id
                    const eventId = this.getId();
                    const folder = global ? `${await internal_getEventGuild(eventId)}` : eventId;
                    // Get variable from database
                    if (!fs.existsSync(path.resolve(`./db/events/${folder}`))) fs.mkdirSync(path.resolve(`./db/events/${folder}`), { recursive: true });
                    const variableFileName = variableName.replace(/[^a-zA-Z0-9]/g, ''); // Strip out all non-alphanumeric / problematic characters
                    if (!fs.existsSync(path.resolve(`./db/events/${folder}/${variableFileName}.var`))) return null;
                    return fs.readFileSync(path.resolve(`./db/events/${folder}/${variableFileName}.var`), 'utf8');
                },
        
                /**
                 * @param {string} variableName
                 * @param {any} value
                 * @param {boolean} global
                */
                set: async(variableName, value, global = false) => {
                    // Set variable in database
                    const eventId = this.getId();
                    const folder = global ? `${await internal_getEventGuild(eventId)}` : eventId;
                    if (!fs.existsSync(path.resolve(`./db/events/${folder}/`))) fs.mkdirSync(path.resolve(`./db/events/${folder}`), { recursive: true });
                    const variableFileName = variableName.replace(/[^a-zA-Z0-9]/g, ''); // Strip out all non-alphanumeric / problematic characters
                    daalbot.fs.write(path.resolve(`./db/events/${folder}/${variableFileName}.var`), `${value}`); // < Wrap value in template literal to ensure it is a string (i have made this mistake a lot so might as well make it user friendy and have it auto convert)
                }
            },
        
            // Libaries
            libaries: {
                axios,
                discord: DJS,
                crypto,
            }
        };
    }

    getConsoleOverrides() {
        return this.consoleOverrides;
    }

    getOverridenProcessEnv() {
        return this.processEnvOverrides;
    }

    getId() {
        return this.id;
    }

    setId(id) {
        this.id = id;
    }

    setup() {
        // NI
    }

    reset() {
        // Reset console functions
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
        console.debug = originalConsoleDebug;
        console.trace = originalConsoleTrace;

        // Reset process.env
        process.env = originalProcessEnv;
    }
}


module.exports = exportClass