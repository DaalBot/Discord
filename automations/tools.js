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
    const eventsJSON = JSON.parse(await daalbot.fs.promises.read(path.resolve('./db/events/events.json')));
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
                    const variableFileName = variableName.replace(/[^a-zA-Z0-9]/g, ''); // Strip out all non-alphanumeric / problematic characters
                    if (variableFileName.includes('..')) throw new Error('Invalid variable name'); // Prevent directory traversal
                    const data = await daalbot.fs.promises.read(path.resolve(`./db/events/${folder}/${variableFileName}.var`));
                    return data;
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
                    const variableFileName = variableName.replace(/[^a-zA-Z0-9]/g, ''); // Strip out all non-alphanumeric / problematic characters
                    if (variableFileName.includes('..')) throw new Error('Invalid variable name'); // Prevent directory traversal
                    await daalbot.fs.promises.write(path.resolve(`./db/events/${folder}/${variableFileName}.var`), `${value}`, true); // < Wrap value in template literal to ensure it is a string (i have made this mistake a lot so might as well make it user friendy and have it auto convert)
                }
            },

            db: {
                get: async (key) => {
                    const eventId = this.getId();
                    const guildId = `${await internal_getEventGuild(eventId)}`;
                    if (key.includes('..')) throw new Error('Invalid key'); // Prevent directory traversal
                    return daalbot.db.managed.get(guildId, key);
                },
                set: async (key, value) => {
                    const eventId = this.getId();
                    const guildId = `${await internal_getEventGuild(eventId)}`;
                    if (key.includes('..')) throw new Error('Invalid key'); // Prevent directory traversal
                    return daalbot.db.managed.set(guildId, key, value);
                },
                delete: async (key) => {
                    const eventId = this.getId();
                    const guildId = `${await internal_getEventGuild(eventId)}`;
                    if (key.includes('..')) throw new Error('Invalid key'); // Prevent directory traversal
                    return daalbot.db.managed.delete(guildId, key);
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
            },

            features: {
                xp: {
                    /**
                     * @param {string} userId
                    */
                    get: async (userId) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;

                        if (userId.includes('..')) throw new Error('Invalid userId'); // Fun
                        
                        const xpData = await daalbot.fs.promises.read(path.resolve(`./db/xp/${guildId}/${userId}.xp`));
                        if (!xpData) return 0;
                        return parseInt(xpData);
                    },

                    /**
                     * @param {string} userId
                     * @param {number} amount
                    */
                    set: async (userId, amount) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;

                        if (userId.includes('..')) throw new Error('Invalid userId'); // Fun
                        
                        await daalbot.fs.promises.write(path.resolve(`./db/xp/${guildId}/${userId}.xp`), `${amount}`, false);
                    }
                },

                welcomer: {
                    get: async() => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;
                        return await daalbot.fs.promises.read(path.resolve(`./db/welcome/${guildId}.json`));
                    },

                    setChannel: async(channelId) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;
                        let welcomeData = await daalbot.fs.promises.read(path.resolve(`./db/welcome/${guildId}.json`));
                        welcomeData = welcomeData ? JSON.parse(welcomeData) : {};
                        welcomeData.channel = channelId;
                        await daalbot.fs.promises.write(path.resolve(`./db/welcome/${guildId}.json`), JSON.stringify(welcomeData, null, 4));
                    },

                    setMessage: async(message) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;
                        let welcomeData = await daalbot.fs.promises.read(path.resolve(`./db/welcome/${guildId}.json`));
                        welcomeData = welcomeData ? JSON.parse(welcomeData) : {};
                        welcomeData.message = message;
                        await daalbot.fs.promises.write(path.resolve(`./db/welcome/${guildId}.json`), JSON.stringify(welcomeData, null, 4));
                    },

                    setEmbed: async(embed) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;
                        let welcomeData = await daalbot.fs.promises.read(path.resolve(`./db/welcome/${guildId}.json`));
                        welcomeData = welcomeData ? JSON.parse(welcomeData) : {};
                        welcomeData.embed = embed;
                        await daalbot.fs.promises.write(path.resolve(`./db/welcome/${guildId}.json`), JSON.stringify(welcomeData, null, 4));
                    }
                },

                autorole: {
                    has: async(role) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;
                        
                        const data = await daalbot.fs.promises.read(path.resolve(`./db/autorole/${guildId}/${role}.id`));
                        return data !== null;
                    },

                    add: async(role) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;

                        await daalbot.fs.promises.write(path.resolve(`./db/autorole/${guildId}/${role}.id`), `${role}`);
                    },

                    remove: async(role) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;

                        const filePath = path.resolve(`./db/autorole/${guildId}/${role}.id`);
                        const data = await daalbot.fs.promises.read(filePath);
                        if (data !== null) {
                            fs.unlinkSync(filePath);
                        }
                    },

                    list: async() => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;

                        try {
                            const roleFiles = await fs.promises.readdir(path.resolve(`./db/autorole/${guildId}/`));
                            return roleFiles.map(file => file.replace('.id', ''));
                        } catch {
                            return [];
                        }
                    }
                },

                logging: {
                    get: async(gatewayEvent) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;
                        const logFilePath = path.resolve(`./db/logging/${guildId}/${gatewayEvent.toUpperCase()}.enabled`);
                        const logData = await daalbot.fs.promises.read(logFilePath);
                        if (!logData) return null;
                        return logData === 'true';
                    },

                    set: async(gatewayEvent, enabled) => {
                        const eventId = this.getId();
                        const guildId = `${await internal_getEventGuild(eventId)}`;
                        const logFilePath = path.resolve(`./db/logging/${guildId}/${gatewayEvent.toUpperCase()}.enabled`);
                        await daalbot.fs.promises.write(logFilePath, enabled ? 'true' : 'false');
                    }
                },

                tickets: {
                    legacy: {
                        getCategory: async() => {
                            const eventId = this.getId();
                            const guildId = `${await internal_getEventGuild(eventId)}`;
                            const categoryPath = path.resolve(`./db/tickets/${guildId}.category`);
                            return await daalbot.fs.promises.read(categoryPath);
                        },

                        setCategory: async(categoryId) => {
                            const eventId = this.getId();
                            const guildId = `${await internal_getEventGuild(eventId)}`;
                            const categoryPath = path.resolve(`./db/tickets/${guildId}.category`);
                            await daalbot.fs.promises.write(categoryPath, categoryId);
                        },

                        getPermissions: async() => {
                            const eventId = this.getId();
                            const guildId = `${await internal_getEventGuild(eventId)}`;
                            const permissionsPath = path.resolve(`./db/tickets/${guildId}.permissions`);
                            const permissionsData = await daalbot.fs.promises.read(permissionsPath);
                            if (!permissionsData) return null;
                            
                            return permissionsData.split('\n').map(statement => {
                                return {
                                    role: statement.split(':')[0],
                                    action: statement.split(':')[1] // allow or deny
                                }
                            });
                        },

                        setPermissions: async(roleId, allow) => {
                            const eventId = this.getId();
                            const guildId = `${await internal_getEventGuild(eventId)}`;
                            const permissionsPath = path.resolve(`./db/tickets/${guildId}.permissions`);
                            let permissionsData = [];
                            const existingData = await daalbot.fs.promises.read(permissionsPath);
                            if (existingData) {
                                permissionsData = existingData.split('\n').filter(line => line.trim() !== '');
                            }
                            // Remove existing entry for roleId if exists
                            permissionsData = permissionsData.filter(statement => statement.split(':')[0] !== roleId);
                            // Add new entry
                            permissionsData.push(`${roleId}:${allow ? 'allow' : 'deny'}`);
                            await daalbot.fs.promises.write(permissionsPath, permissionsData.join('\n'));
                        }
                    },

                    // TODO: V2 ticket system utils - All data for test server is encrypted so data types are unknown
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