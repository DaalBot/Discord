const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } = require('discord.js');
const daalbot = require('../../daalbot.js');
const config = require('../../config.json');
const events = [
    'channelCreate',
    'channelDelete',
    'channelUpdate',
    'guildBanAdd',
    'guildBanRemove',
    'guildMemberAdd',
    'guildMemberRemove',
    'guildMemberUpdate',
    'messageDelete',
    'messageDeleteBulk',
    'messageUpdate',
    'roleCreate',
    'roleDelete',
    'roleUpdate',
    'ticketClose',
    'ticketCreate',
    'guildUpdate',
    'lockdownStart',
    'lockdownEnd',
    'voiceJoin',
    'voiceLeave',
]

module.exports = {
    name: 'logs',
    description: 'Modifies the logging settings for the server.',
    category: 'Guild',

    slash: true,
    testOnly: false,
    guildOnly: true,

    permissions: [
        `${daalbot.DJS.PermissionFlagsBits.ViewAuditLog}`
    ],

    options: [
        {
            name: 'channel',
            description: 'The channel to send the logs to.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'The channel to send the logs to.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                }
            ]
        },
        {
            name: 'toggle',
            description: 'Toggles the logging of a specific event.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'event',
                    description: 'The event to toggle logging for.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: events.map((event) => ({
                        name: event,
                        value: event.toUpperCase(),
                    })),
                },
                {
                    name: 'enabled',
                    description: 'Enable or disable logging for this event.',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                }
            ]
        },
        {
            name: 'exclude',
            description: 'Excludes a channel from being logged.',
            type: ApplicationCommandOptionType.Subcommand,

            options: [
                {
                    name: 'channel',
                    description: 'The channel to exclude from logging.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                    channel_types: [
                        ChannelType.GuildText
                    ]
                },
                {
                    name: 'enabled',
                    description: 'Enable or disable logging for this event.',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                },
                {
                    name: 'event',
                    description: 'The event to toggle logging for.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    
                    choices: events.map((event) => ({
                        name: event,
                        value: event.toUpperCase(),
                    })),
                }
            ]
        }
    ],

    /**
     * @param {{ interaction: ChatInputCommandInteraction }} param0
     */
    callback: async ({ interaction }) => {
        const subCommand = interaction.options.getSubcommand();
        const guildID = interaction.guild.id;
        const dbFolder = `${config.botPath}/db/logging/${guildID}`;
        
        if (subCommand === 'channel') {
            const channel = interaction.options.getChannel('channel', true, [ ChannelType.GuildText ]);
            const channelID = channel.id;
            const guild = interaction.guild;

            if (!fs.existsSync(dbFolder)) {
                try {
                    fs.mkdirSync(dbFolder);
                } catch {
                    return 'There was an error creating the database folder.';
                }
            }

            daalbot.fs.write(`${dbFolder}/channel.id`, channelID);

            const webhook = await channel.createWebhook({
                name: 'DaalBot Logging',
                avatar: 'https://media.piny.dev/DaalBotSquare.png',
                reason: 'Triggered by logs command.'
            })

            const output = {
                id: webhook.id,
                token: webhook.token,
                url: webhook.url
            }

            daalbot.db.managed.set(guildID, 'logging/webhook', JSON.stringify(output));

            return `Successfully set the logging channel to <#${channelID}>.`;
        } else if (subCommand === 'toggle') {
            const event = interaction.options.getString('event');
            const enabled = `${interaction.options.getBoolean('enabled')}`;
            const guild = daalbot.fetchServer(interaction.guild.id);

            if (!fs.existsSync(dbFolder)) {
                try {
                    fs.mkdirSync(dbFolder);
                    fs.appendFileSync(`${dbFolder}/${event}.enabled`, enabled);
                } catch {
                    return 'There was an error creating the database folder.';
                }
            } else {
                if (fs.existsSync(`${dbFolder}/${event}.enabled`)) {
                    fs.writeFileSync(`${dbFolder}/${event}.enabled`, enabled);
                    return `Successfully ${enabled == 'true' ? 'enabled' : 'disabled'} logging for ${event}.`;
                } else {
                    fs.appendFileSync(`${dbFolder}/${event}.enabled`, enabled);
                    return `Successfully ${enabled == 'true' ? 'enabled' : 'disabled'} logging for ${event}.`;
                }
            }
        } else if (subCommand === 'exclude') {
            const channel = interaction.options.getChannel('channel');
            const event = interaction.options.getString('event');
            const enabled = `${interaction.options.getBoolean('enabled')}`;

            if (!fs.existsSync(dbFolder)) {
                try {
                    fs.mkdirSync(dbFolder);
                    fs.appendFileSync(`${dbFolder}/${event}.exclude`, `${channel.id}\n`);
                } catch {
                    return 'There was an error creating the database folder.';
                }
            } else {
                daalbot.fs.write(`${dbFolder}/${event}.exclude`, `${channel.id}\n`);
                return `Successfully ${enabled == 'true' ? 'enabled' : 'disabled'} logging for ${event} in <#${channel.id}>.`;
            }
        }
    }
}