const { ApplicationCommandOptionType } = require('discord.js');
const Discord = require('discord.js');
const daalbot = require('../../daalbot');

module.exports = {
    name: 'cc',
    description: 'Everything to do with custom commands',
    category: 'Guild',

    slash: true,
    testOnly: false,
    guildOnly: true,

    permissions: [
        `${Discord.PermissionFlagsBits.ManageGuild}`
    ],

    options: [
        {
            name: 'create',
            description: 'Creates a custom command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'name',
                    description: 'The name of the custom command',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'description',
                    description: 'The description of the custom command',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'options',
                    description: 'JSON representation of a discord.js options array',
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        }, {
            name: 'delete',
            description: 'Deletes a custom command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'name',
                    description: 'The name of the custom command',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ],

    /**
     * @param {{ interaction: Discord.ChatInputCommandInteraction }} param0
     */
    callback: async ({ interaction }) => {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'create') {
            const name = interaction.options.getString('name');
            const description = interaction.options.getString('description');
            const oOptions = interaction.options.getString('options');
            const options = await daalbot.convertMetaText(oOptions ?? '', interaction.guild, { // Allow them to do things like type: %%{ACOT.String}%% instead of hardcoding it
                ApplicationCommandOptionType,
                ACOT: ApplicationCommandOptionType // Shorthand for the above
            });

            if (!name.match(/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u)) {
                return interaction.reply({
                    content: 'The name of the command must be between 1 and 32 characters long and can only contain letters, numbers, dashes and underscores.',
                    flags: Discord.MessageFlags.Ephemeral
                });
            }

            if (options.length > 1) { // If string is empty, it will be parsed as an empty array
                // Check if the provided options are valid
                try {
                    JSON.parse(options);
                } catch (error) {
                    return interaction.reply({
                        content: 'The options you provided threw an error when parsed. Are you sure you provided a valid JSON representation of a discord.js options array? If you\'re using templating, make sure the formatting is correct (`%%{...}%%`).',
                        flags: Discord.MessageFlags.Ephemeral
                    })
                }
            }

            // Check if the command already exists
            if (interaction.guild.commands.cache.find(command => command.name === name)) {
                return interaction.reply({
                    content: 'This command already exists.',
                    flags: Discord.MessageFlags.Ephemeral
                });
            }

            // Create the command
            interaction.guild.commands.create({
                name: name,
                description: description,
                options: options ? JSON.parse(options) : []
            }).then(() => {
                interaction.reply({
                    content: `Successfully created the command \`${name}\`. You can configure it in a interactionCreate [event](https://daalbot.xyz/Dashboard/Guild/${interaction.guild.id}/feature/guild/events).`,
                    flags: Discord.MessageFlags.Ephemeral
                });
            })
        } else if (subCommand === 'delete') {
            const name = interaction.options.getString('name');

            // Check if the command exists
            const command = interaction.guild.commands.cache.find(command => command.name === name);
            if (!command) {
                return interaction.reply({
                    content: 'This command does not exist.',
                    flags: Discord.MessageFlags.Ephemeral
                });
            }

            // Delete the command
            command.delete().then(() => {
                interaction.reply({
                    content: `Successfully deleted the command \`${name}\`.`,
                    flags: Discord.MessageFlags.Ephemeral
                });
            })
        }
    }
}