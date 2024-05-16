const { readdir, readFile, writeFile } = require('fs/promises')
const { createHash } = require('crypto');
const daalbot = require('./daalbot');
const config = require('./config.json');
const client = require('./client.js');
const testGuild = config.handler.testServer;

/**
 * @typedef {Object} CommandOption
 * @property {string} name - The name of the option (required)
 * @property {string} description - The description of the option (required)
 * @property {number} type - The type of the option (required)
 * @property {boolean} required - Whether the option is required (default: false)
 * @property {CommandOption[]} options - The options of the option (default: [])
 * @property {string[]} choices - The choices of the option (default: [])
*/

/**
 * @typedef {Object} Command
 * @property {string} name - The name of the command (required)
 * @property {string} description - The description of the command (required)
 * @property {string} type - The type of the command (default: 'Slash')
 * @property {boolean} testOnly - Whether the command should only be created in test guilds (default: false)
 * @property {boolean} ownerOnly - Whether the command should only be used by the bot owner (default: false)
 * @property {boolean} guildOnly - Whether the command should only be used in a guild (default: false)
 * @property {boolean} beta - Whether the command is in beta similar to testOnly but can be added to any guild using a special command (default: false)
 * @property {string} category - The category of the command (default: 'Misc')
 * @property {CommandOption[]} options - The options of the command (default: [])
 * @property {Function} callback - The function to execute when the command is called (required)
*/

/**
 * @type {Command[]}
*/
let commands = [];

// Statup (called when the bot starts)
(async () => {
    // Retrive command hashes
    const hashFile = await readFile('./cmd.hash', 'utf-8') || 'empty|dummy';
    const commandCategories = await readdir('./commands')

    for (let i = 0; i < commandCategories.length; i++) {
        const commandFiles = (await readdir(`./commands/${commandCategories[i]}`)).filter(file => file.endsWith('.js'));

        for (let j = 0; j < commandFiles.length; j++) {
            const command = require(`./commands/${commandCategories[i]}/${commandFiles[j]}`);

            if (config.handler.verbose) console.log(`Loading ${command.name ?? 'unknown'} command...`)
            if (config.handler.verbose) console.log(command)

            let pushCommand = command;

            if (!command.name) {
                pushCommand.name = commandFiles[j].split('.')[0]; // Set the name of the command to the file name if it doesn't exist to prevent errors
            }

            pushCommand.name = pushCommand.name.toLowerCase(); // Force the command name to be lowercase

            commands.push(pushCommand);
        }
    }

    hashFileLines = hashFile.split('\n');

    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];

        // Find the old hash of the command
        const oldHash = (hashFileLines.find(line => line.startsWith(command.name)) ?? `${command.name}|dummy`).split('|')[1];

        if (config.handler.verbose) console.log(`Hashing ${command.name ?? 'unknown'} command...`);

        // Create a new hash of the command
        const newHash = createHash('sha256').update(JSON.stringify(command)).digest('hex');

        // If the old hash is different from the new hash, update the command
        if (oldHash !== newHash) {
            console.log(`Updating ${command.name ?? 'unknown'} command...`);

            // Check if the command is already registered
            let existingCommand = client.application.commands.cache.find(c => c.name === command.name);

            let exists = true;

            // If the command is already registered, update it
            if (existingCommand) {
                // Do nothing is already in all guilds
            } else if (!(client?.guilds?.cache?.get(testGuild)?.commands?.cache?.get(c => c?.name === command?.name)) && command.testOnly) {
                // Update the command to the test guild one if it exists
                existingCommand = client?.guilds?.cache?.get(testGuild)?.commands?.cache?.get(c => c?.name === command?.name);
            } else {
                exists = false;
            }

            if (existingCommand && exists) {
                await existingCommand.edit({
                    name: command.name,
                    description: command.description,
                    options: command.options
                });
            } else {
                try {
                    if (command.testOnly) {
                        await client.guilds.cache.get(testGuild).commands.create({
                            name: command.name,
                            description: command.description,
                            options: command.options
                        });
                    } else {
                        await client.application.commands.create({
                            name: command.name,
                            description: command.description,
                            options: command.options
                        });
                    }
                } catch (error) {
                    console.error(error)
                }
            }
        }

        // Update the hash file
        hashFileLines = hashFileLines.filter(line => !line.startsWith(command.name));
        hashFileLines.push(`${command.name}|${newHash}`);

        await writeFile('./cmd.hash', hashFileLines.join('\n'));
    }
})();

client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.isCommand()) return;
        const command = commands.find(c => c.name === interaction.commandName);
    
        if (command) {
            if (command.guildOnly && (!(interaction?.guild ?? false))) return await interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true
            })
    
            if (command.ownerOnly) {
                for (let i = 0; i < config.WOKCommands.ownerIds.length; i++) {
                    if (interaction.user.id === config.WOKCommands.ownerIds[i]) {
                        command.callback({ interaction });
                        return;
                    }
                }
    
                return interaction.reply({
                    content: 'This command is owner only.',
                    ephemeral: true
                })
            }
    
            if (command.testOnly && interaction.guild.id !== testGuild && !command.beta) {
                interaction.reply({
                    content: `This command has been disabled due to it being in testing. We apologize for the inconvenience.`,
                    ephemeral: true
                })
            } else {
                if (!command.permissions) { // The command does not require any permissions
                    const response = await command.callback({ interaction });
                    if (response) interaction.reply(response); // This is a very old way of replying to an interaction but need to keep it for backwards compatibility
                } else {
                    // Now this is where it gets interesting
                    const memberPermissions = interaction.memberPermissions;
    
                    if (!memberPermissions) {
                        interaction.reply({
                            content: 'This command requires special permissions to use however you do not have any permissions.',
                            ephemeral: true
                        })
                    }
    
                    let hasPermissions = true;
    
                    for (let i = 0; i < command.permissions.length; i++) {
                        if (!memberPermissions.has(command.permissions[i])) {
                            hasPermissions = false;
                            break;
                        }
                    }
    
                    if (hasPermissions) {
                        const response = await command.callback({ interaction });
                        if (response) interaction.reply(response); // Same as above
                    } else {
                        interaction.reply({
                            content: 'You do not have the required permissions to use this command.',
                            ephemeral: true
                        })
                    }
                }
            }
        } else {
            interaction.reply({
                content: `Hey, I dont know how to tell you this ${interaction.user.displayName} but that command doesnt exactly exist anymore...`,
                ephemeral: true
            })
        }
    } catch (error) {
        const errorId = await daalbot.items.generateId(5);

        try {
            console.error(error)
            console.error(`[ID: ${errorId}]`)

            interaction.reply({
                content: `Something went wrong, We have no clue what you somehow messed up so bad you discovered a new bug. Though do report it in the [support server](https://lnk.daalbot.xyz/HQ) (Error ID: ${errorId})`,
                ephemeral: true
            })
        } catch (e) {
            // Give up
        }
    }
})