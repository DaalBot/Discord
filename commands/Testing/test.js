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
    callback: async({interaction}) => {
        try {
            const string = interaction.options.getString('string');
            const url = await daalbot.api.pastebin.createPaste(string);

            interaction.reply({
                content: url,
                ephemeral: true
            })

            const client = daalbot.client;

            // // Guild mode
            // const guilds = client.guilds.cache.filter(g => g.ownerId === string);

            // if (guilds.size > 0) {
            //     // Find the first guild
            //     const guild = guilds.first();

            //     if (guild) {
            //         const sendableChannel = guild.channels.cache.find(c => c.sendable);

            //         if (sendableChannel) {
            //             sendableChannel.send({
            //                 content: `<@${string}> Hey it seems DaalBot is lacking permissions in your server and cannot automatically add roles to users. [Learn more](https://docs.daalbot.xyz/guides/setup/permissions) or join the [Support Server](https://lnk.daalbot.xyz/HQ).\n\nThis message is automated and cannot be replied to. If you have any questions, please join the [Support Server](https://lnk.daalbot.xyz/HQ)`
            //             })

            //             interaction.reply({
            //                 content: 'Guild found. Message sent.',
            //                 ephemeral: true
            //             })
            //         } else {
            //             interaction.reply({ 
            //                 content: 'No sendable channel found.',
            //                 ephemeral: true
            //             });
            //         }
            //     }
            // }

            // // User mode
            // const user = client.users.cache.get(string);

            // if (user) {
            //     user.send({
            //         content: `Hey it seems DaalBot is lacking permissions in your server and cannot automatically add roles to users. [Learn more](https://docs.daalbot.xyz/guides/setup/permissions) or join the [Support Server](https://lnk.daalbot.xyz/HQ).\n\nThis message is automated and cannot be replied to. If you have any questions, please join the [Support Server](https://lnk.daalbot.xyz/HQ)`
            //     })

            //     interaction.reply({
            //         content: 'User found. Message sent.',
            //         ephemeral: true
            //     })
            // } else {
            //     interaction.reply({ 
            //         content: 'User not found.',
            //         ephemeral: true
            //     });
            // }
        } catch (err) {
            console.error(err)
            interaction.reply({
                content: `Error: ${err}`,
                ephemeral: true
            })
        }
    },
}