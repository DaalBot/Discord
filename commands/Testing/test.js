const daalbot = require('../../daalbot');
const DJS = require('discord.js');
const execSync = require('child_process').execSync;
const config = require('../../config.json')
const path = require('path');

module.exports = {
    category: 'Testing',
    description: 'This command does stuff sometimes.',
  
    slash: true,
    testOnly: true,
    guildOnly: false,

    options: [
        {
            name: 'attachment',
            description: 'attachment',
            type: DJS.ApplicationCommandOptionType.Attachment,
            required: false
        },
        {
            name: 'string',
            description: 'string',
            type: DJS.ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: 'number',
            description: 'number',
            type: DJS.ApplicationCommandOptionType.Number,
            required: false
        },
        {
            name: 'boolean',
            description: 'boolean',
            type: DJS.ApplicationCommandOptionType.Boolean,
            required: false
        },
        {
            name: 'user',
            description: 'user',
            type: DJS.ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: 'channel',
            description: 'channel',
            type: DJS.ApplicationCommandOptionType.Channel,
            required: false
        },
        {
            name: 'role',
            description: 'role',
            type: DJS.ApplicationCommandOptionType.Role,
            required: false
        }
    ],

    /**
     * @param {{ interaction: DJS.ChatInputCommandInteraction }} param0
     */
    callback: ({interaction}) => {
        try {
        } catch (err) {
            console.error(err)
            interaction.reply({
                content: `Error: ${err}`,
                flags: DJS.MessageFlags.Ephemeral
            })
        }
    },
}