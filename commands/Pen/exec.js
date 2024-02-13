require('dotenv').config();
const daalbot = require('../../daalbot.js');
const DJS = require('discord.js');
module.exports = {
    name: 'exec',
    description: 'Executes code in the current context (only for developers)',
    category: 'Pen',
    slash: true,
    options: [
        {
            name: 'code',
            description: 'The code to execute',
            type: DJS.ApplicationCommandOptionType.String,
            required: true
        },
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
    ownerOnly: true,

    callback: ({ interaction }) => {
        const code = interaction.options.getString('code');

        if (interaction.user.id !== daalbot.config().users.piny) {
            return {
                custom: true,
                content: 'You are not allowed to use this command.',
                ephemeral: true
            }
        }

        try {
            const result = eval(code);
            console.log(result);
            return {
                custom: true,
                content: 'Executing code...',
                ephemeral: true
            }
        } catch (err) {
            return err;
        }
    }
}