// General modules
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Testing specific
require('dotenv').config();
const inputFilePath = `./input.event.js`;
const daalbot = require('../../daalbot.js');
const { Client, IntentsBitField, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.MessageContent
    ]
})

// Event handler
client.on('messageCreate', async message => {
    const originalConsoleLog = console.log;

    async function executeEvent(inputFile) {
        const input = require(inputFile);
        const inputData = message; // The line that should be changed to the actual input data
        const inputFileContents = daalbot.fs.read(inputFile, 'utf8');

        // Override console.log to do something (Wrote this comment before I wrote the code below, so I dont know what it does yet, but I think it should work fine)
        console.log = function() {
            return null; // Do nothing i guess (Might actually do something with it later, but for now it should be fine to just return null)
        }

        // All console logs except console.log are disabled
        console.info = null;
        console.warn = null;
        console.error = null;
        console.debug = null;
        console.trace = null;
        
        let allowed = true;
        
        // Input file checks
        if (inputFileContents.toLowerCase().includes('env.') || inputFileContents.toLowerCase().includes('process.')) allowed = false; // Dont allow accessing of process properties
        if (inputFileContents.toLowerCase().includes('require(') || inputFileContents.toLowerCase().includes('import')) allowed = false; // Dont allow requiring of modules
        if (inputFileContents.toLowerCase().includes('fs.')) allowed = false; // Dont allow file system access (Shouldnt work anyways but just in case)
        if (inputFileContents.toLowerCase().includes('function _0x')) allowed = false; // Dont allow obfuscated code (This is a very basic check, but it should work for now)
        if (inputFileContents.toLowerCase().includes('eval')) allowed = false; // Dont allow eval
        if (inputFileContents.toLowerCase().includes('while (true)')) allowed = false; if (inputFileContents.toLowerCase().includes('for (;;)')) allowed = false; if (inputFileContents.toLowerCase().includes('while (1)')) allowed = false; if (inputFileContents.toLowerCase().includes('for (;;;)')) allowed = false; // Dont allow infinite loops
        if (inputFileContents.toLowerCase().includes('client.')) allowed = false; // Dont allow accessing of client properties

        let layers = 0;
        for (let i = 0; i < inputFileContents.length; i++) {
            if (inputFileContents[i] === '{') layers++;
            if (inputFileContents[i] === '}') {
                layers--;
                if (layers < 0) allowed = false; // Dont allow escaping the function
            };
        }

        
        if (!allowed) return; // Exit and do not execute the event
    
        // All checks pass
        input.execute(inputData, {
            // Utils
            webhooks: {
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
                get: (variableName) => {
                    // Get variable from database
                    if (!fs.existsSync(path.resolve(`./db/events/${input.id}`))) fs.mkdirSync(path.resolve(`./db/events/${input.id}`), { recursive: true });
                    const variableFileName = variableName.replace(/[^a-zA-Z0-9]/g, ''); // Strip out all non-alphanumeric / problematic characters
                    if (!fs.existsSync(path.resolve(`./db/events/${input.id}/${variableFileName}.var`))) return null;
                    return daalbot.fs.read(path.resolve(`./db/events/${input.id}/${variableFileName}.var`), 'utf8');
                },

                set: (variableName, value) => {
                    // Set variable in database
                    if (!fs.existsSync(path.resolve(`./db/events/${input.id}`))) fs.mkdirSync(path.resolve(`./db/events/${input.id}`), { recursive: true });
                    const variableFileName = variableName.replace(/[^a-zA-Z0-9]/g, ''); // Strip out all non-alphanumeric / problematic characters
                    daalbot.fs.write(path.resolve(`./db/events/${input.id}/${variableFileName}.var`), value);
                }
            },

            // Libaries
            libaries: {
                axios,
                discord: {
                    permissions: PermissionFlagsBits
                }
            }
        })

        // Reset console.log
        console.log = originalConsoleLog;
    }

    executeEvent(inputFilePath);
})

// Testing specific
client.login(process.env.TOKEN);