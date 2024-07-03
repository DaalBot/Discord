const { ApplicationCommandOptionType } = require('discord.js');
const Discord = require('discord.js');
const daalbot = require('../../daalbot');

module.exports = {
    name: 'cc',
    description: 'Everything to do with custom commands',

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
    callback: ({ interaction }) => {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'create') {
            const name = interaction.options.getString('name');
            const description = interaction.options.getString('description');

            if (!name.match(/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u)) {
                return interaction.reply({
                    content: 'The name of the command must be between 1 and 32 characters long and can only contain letters, numbers, dashes and underscores.',
                    ephemeral: true
                });
            }

            // Check if the command already exists
            if (interaction.guild.commands.cache.find(command => command.name === name)) {
                return interaction.reply({
                    content: 'This command already exists.',
                    ephemeral: true
                });
            }

            // Create the command
            interaction.guild.commands.create({
                name: name,
                description: description
            }).then(() => {
                interaction.reply({
                    content: `Successfully created the command \`${name}\`. You can configure it in a interactionCreate [event](https://daalbot.xyz/Dashboard/Guild/${interaction.guild.id}/feature/guild/events).`,
                    ephemeral: true
                });
            })
        } else if (subCommand === 'delete') {
            const name = interaction.options.getString('name');

            // Check if the command exists
            const command = interaction.guild.commands.cache.find(command => command.name === name);
            if (!command) {
                return interaction.reply({
                    content: 'This command does not exist.',
                    ephemeral: true
                });
            }

            // Delete the command
            command.delete().then(() => {
                interaction.reply({
                    content: `Successfully deleted the command \`${name}\`.`,
                    ephemeral: true
                });
            })
        }
    }
}