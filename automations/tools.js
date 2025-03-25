const crypto = require('crypto');
const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');
const daalbot = require('../daalbot.js');
const csvman = require('@npiny/csvman');
const client = require('../client.js');
const originalRequire = require;

let { checkSecurityRules, requireAllowedEvents } = require('./sec.pub.js'); // Self hosted bot checks

if (fs.existsSync(path.resolve('./automations/sec.js'))) { // Main bot checks
    checkSecurityRules = require('./sec.js').checkSecurityRules;
    requireAllowedEvents = require('./sec.js').requireAllowedEvents;
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
            // webhooks: {
            //     /**
            //      * @param {{ url: string, data: string }} param0
            //     */
            //     send: ({ url, data }) => {
            //         // Send webhook
            //         axios.post(url, data)
            //             .then(response => {
            //                 return {response}
            //             })
            //             .catch(error => {
            //                 return {error}
            //             })
            //     }
            // },
        
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
        
            // Libraries
            libraries: {
                crypto,
                csvman,
                discord: {
                    builder: {
                        ModalBuilder: DJS.ModalBuilder,
                        TextInputBuilder: DJS.TextInputBuilder,
                        EmbedBuilder: DJS.EmbedBuilder,
                        ActionRowBuilder: DJS.ActionRowBuilder,
                        ButtonBuilder: DJS.ButtonBuilder,
                        StringSelectMenuOptionBuilder: DJS.StringSelectMenuOptionBuilder,
                        StringSelectMenuBuilder: DJS.StringSelectMenuBuilder
                    },
                    enum: {
                        TextInputStyle: DJS.TextInputStyle,
                        ChannelType: DJS.ChannelType,
                        ButtonStyle: DJS.ButtonStyle,
                        MessageFlags: DJS.MessageFlags
                    },
                    embed: DJS.EmbedBuilder,
                    components: {
                        row: DJS.ActionRowBuilder,
                        button: DJS.ButtonBuilder,
                        selectMenu: {
                            string: {
                                option: DJS.StringSelectMenuOptionBuilder,
                                builder: DJS.StringSelectMenuBuilder
                            }
                        }
                    }
                },
                daalbot: {
                    tb: daalbot.api.pasteapi
                },
                /**
                 * @param {string} module
                */
                load: (module) => {
                    const eventId = this.getId();
                    const hashedId = crypto.createHash('sha256').update(eventId).digest('hex');
                    if (!requireAllowedEvents.find(event => event.id === hashedId)) throw new Error('[SECURITY] This event is not allowed to use require statements');
                    if (!requireAllowedEvents.find(event => event.id === hashedId).modules.includes(module)) throw new Error(`[SECURITY] You are not allowed to import the ${module} module`);

                    return originalRequire(module);
                }
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
        // Set require to null
        require = null;
    }

    reset() {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
        console.debug = originalConsoleDebug;
        console.trace = originalConsoleTrace;

        process.env = originalProcessEnv;
        require = originalRequire;
    }
}


module.exports = exportClass