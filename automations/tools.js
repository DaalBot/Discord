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
    const eventsJSON = JSON.parse(daalbot.fs.read(path.resolve('./db/events/events.json')));
    const event = eventsJSON.find(event => event.id === eventId);
    return event.guild;
}

const processEnvOverrides = {
    env: {
        TOKEN: 'Insert token here or smth idk', // Hide token but in a funny way
    }
}

const consoleOverrides = {
    log: daalbot.guilds.log.info,
    error: daalbot.guilds.log.error,
    warn: daalbot.guilds.log.warn,
    info: daalbot.guilds.log.info,
    debug: daalbot.guilds.log.info, // No debug log level so just use info
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
                    if (variableFileName.includes('..')) throw new Error('Invalid variable name'); // Prevent directory traversal
                    if (!fs.existsSync(path.resolve(`./db/events/${folder}/${variableFileName}.var`))) return null;
                    return daalbot.fs.read(path.resolve(`./db/events/${folder}/${variableFileName}.var`), 'utf8');
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
                    if (variableFileName.includes('..')) throw new Error('Invalid variable name'); // Prevent directory traversal
                    daalbot.fs.write(path.resolve(`./db/events/${folder}/${variableFileName}.var`), `${value}`, true); // < Wrap value in template literal to ensure it is a string (i have made this mistake a lot so might as well make it user friendy and have it auto convert)
                }
            },

            db: {
                get: async (key) => {
                    const eventId = this.getId();
                    const guildId = `${await internal_getEventGuild(eventId)}`;
                    if (key.includes('..')) throw new Error('Invalid key'); // Prevent directory traversal
                    return daalbot.db.managed.get(guildId, key);
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
                        StringSelectMenuBuilder: DJS.StringSelectMenuBuilder,
                        TextDisplayBuilder: DJS.TextDisplayBuilder,
                        SeparatorBuilder: DJS.SeparatorBuilder,
                        SectionBuilder: DJS.SectionBuilder,
                        ThumbnailBuilder: DJS.ThumbnailBuilder,
                        MediaGalleryBuilder: DJS.MediaGalleryBuilder,
                        MediaGalleryItemBuilder: DJS.MediaGalleryItemBuilder,
                        ChannelSelectMenuBuilder: DJS.ChannelSelectMenuBuilder,
                        AttachmentBuilder: DJS.AttachmentBuilder,
                        ContainerBuilder: DJS.ContainerBuilder,
                        LabelBuilder: DJS.LabelBuilder
                    },
                    enum: {
                        TextInputStyle: DJS.TextInputStyle,
                        ChannelType: DJS.ChannelType,
                        ButtonStyle: DJS.ButtonStyle,
                        MessageFlags: DJS.MessageFlags,
                        SeparatorSpacingSize: DJS.SeparatorSpacingSize,
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
                    let allowed = false;
                    const eventId = this.getId();
                    const hashedId = crypto.createHash('sha256').update(eventId).digest('hex');
                    if (requireAllowedEvents.find(event => event?.id === hashedId)?.modules?.includes(module)) allowed = true;
                    if (allowed) {
                        console.debug(`[SECURITY] Allowed require('${module}') in event ${eventId} (${hashedId}) due to event id whitelisting.`);
                        return originalRequire(module);
                    };

                    //? This code seems good but its a bit bugged and i dont have time to test and fix so just to be safe im disabling it for now
                    // // Get the actual code of the event
                    // const eventFile = daalbot.fs.read(path.resolve(`./automations/events/${eventId}/event.js`), 'utf8');
                    
                    // // Stolen straight from DaalBot/API (src/routes/dashboard/get/events/code.ts)
                    // let code = eventFile;
                    // const fileLines = eventFile.split('\n');
                    // const startLine = fileLines.findIndex(line => line.match(/execute:\s*\(async\(.*, util\) => {/));
                    // const endLine = fileLines.length - 2; // Exclude the last line (closing bracket of the module.exports object)
                    
                    // // Extract the code between the start and end lines
                    // code = fileLines.slice(startLine + 1, endLine).join('\n');
                    // // Remove the first line of the code (the async function declaration)
                    // code = code.replace(/^\s*async\s*\(message, util\) => {\s*/, '');
                    // // Remove the last line of the code (the closing bracket of the async function)
                    // code = code.replace(/\s*}\s*$/, '');
                    // const codeHash = crypto.createHash('sha256').update(code).digest('hex');
                    // const matchesExcludedCode = requireAllowedEvents.find(event => event?.code === codeHash && event?.allowed?.includes(module));
                    // if (matchesExcludedCode) allowed = true;
                    if (allowed) return originalRequire(module);

                    throw new Error(`The module '${module}' is not allowed to be used in this event. (Event ID: ${eventId}, Hash: ${hashedId})`);
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