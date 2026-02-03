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
            let memberCount = 0;
            let longestServer = null;
            let oldestServer = null; // Quite literally the server that has existed for the longest time
            daalbot.client.guilds.cache.forEach(guild => {
                if (guild == null) {
                    return;
                }
                memberCount += guild.memberCount;
                if (longestServer || guild.joinedTimestamp < longestServer?.joinedTimestamp) {
                    longestServer = guild;
                }

                if (oldestServer || guild.createdAt < oldestServer?.createdAt) {
                    oldestServer = guild;
                }
            });

            interaction.reply({
                content: `Total member count across all servers: ${memberCount}\nLongest server: ${longestServer.name} (Created on <t:${Math.floor(longestServer.createdAt / 1000)}:F>)\nOldest server: ${oldestServer.name} (Joined on <t:${Math.floor(oldestServer.joinedTimestamp / 1000)}:F>)`,
            })
        } catch (err) {
            console.error(err)
            interaction.reply({
                content: `Error: ${err}`,
                flags: DJS.MessageFlags.Ephemeral
            })
        }
    },
}