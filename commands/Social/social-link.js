const fs = require('fs')
const path = require('path')
const { EmbedBuilder, PermissionFlagsBits, ApplicationCommandOptionType, ChannelType } = require('discord.js')
const daalbot = require('../../daalbot.js')
require('dotenv').config()
const axios = require('axios')

module.exports = {
    name: 'social-link',
    description: 'Modifies social feeds in the server.',
    category: 'Social',

    testOnly: false,
    guildOnly: true,

    permissions: [
        `${PermissionFlagsBits.ManageWebhooks}`
    ],

    type: 'SLASH',

    options: [
        {
            name: 'twitch',
            description: 'Modifies the Twitch feeds for the server.',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'add',
                    description: 'Adds a Twitch feed to a channel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The name of the twitch channel to add.',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: 'feed_channel',
                            description: 'The channel to send the feed to.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true
                        },
                        {
                            name: 'role',
                            description: 'The role to ping when the stream goes live.',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        }
                    ]
                }
            ]
        },
        {
            name: 'youtube',
            description: 'Modifies the YouTube feeds for the server.',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'add',
                    description: 'Adds a YouTube feed to a channel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The id of the channel to add. (lnk.daalbot.xyz/1)',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: 'feed_channel',
                            description: 'The channel to send the feed to.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true
                        },
                        {
                            name: 'role',
                            description: 'The role to ping when a new video is uploaded.',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        }
                    ]
                }
            ]
        }
    ],

    callback: async ({ interaction }) => {
        const subCommandGroup = interaction.options.getSubcommandGroup()
        const subCommand = interaction.options.getSubcommand()

        if (subCommandGroup == 'twitch') {
            if (subCommand == 'add') {
                const startingChannel = interaction.options.getString('channel')
                let channel = interaction.options.getString('channel')
                const feedChannel = interaction.options.getChannel('feed_channel')
                const role = interaction.options.getRole('role')

                if (!/^\d+$/.test(channel)) {
                    // Channel is a username not a id so we need to get the id
                    const channelData = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, {
                        headers: {
                            'Client-ID': process.env.TWITCH_CLIENTID,
                            'Authorization': `Bearer ${process.env.TWITCH_BEARER}`
                        }
                    })

                    if (channelData.data.data.length == 0) return await interaction.reply({ content: 'That Twitch channel does not exist.', ephemeral: true })

                    channel = channelData.data.data[0].id
                }

                const startingRolesFile = JSON.parse(fs.readFileSync(path.resolve('./db/socialalert/twitch_roles.json'), 'utf8'))

                const startingRoles = startingRolesFile.filter(i => i.id == channel)

                let rolesFile = startingRolesFile;

                if (startingRoles.length == 0) {
                    const newData = {
                        id: feedChannel.id,
                        role: role == null ? 'none' : role.id
                    }

                    rolesFile.push({
                        id: channel,
                        channels: [newData]
                    })

                    fs.writeFileSync(path.resolve('./db/socialalert/twitch_roles.json'), JSON.stringify(rolesFile, null, 4))
                } else if (startingRoles.filter(i => i.id == feedChannel.id).length == 0) {
                    rolesFile.filter(i => i.id == channel)[0].channels.push({
                        id: feedChannel.id,
                        role: role == null ? 'none' : role.id
                    })

                    fs.writeFileSync(path.resolve('./db/socialalert/twitch_roles.json'), JSON.stringify(rolesFile, null, 4))
                }

                const twitchData = fs.readFileSync(path.resolve('./db/socialalert/twitch.txt'), 'utf8').split('\n');

                const channelData = twitchData.filter((line) => line.split(',')[0] === channel);

                const channels = channelData[0] ? channelData[0].split(',')[1].split('|') : [];

                if (channels.includes(feedChannel.id)) {
                    return await interaction.reply({ content: 'This channel is already linked to that Twitch channel.', ephemeral: true });
                }

                channels.push(feedChannel.id);

                const newChannelData = `${channel},${channels.join('|')}`;

                const newTwitchData = twitchData.filter((line) => line.split(',')[0] !== channel).join('\n') + '\n' + newChannelData;

                fs.writeFileSync(path.resolve('./db/socialalert/twitch.txt'), newTwitchData);

                await interaction.reply({ content: `Successfully added ${feedChannel} to the Twitch feed for ${startingChannel}.`, ephemeral: true })
            }
        }

        if (subCommandGroup == 'twitter') {
            if (subCommand == 'add') {
                /**
                 * @type {string}
                 */
                const account = interaction.options.getString('account').toLowerCase();
                const feedChannel = interaction.options.getChannel('channel')
                const role = interaction.options.getRole('role')

                /**
                 * @type {{username: string, channel: {id: string, role: string}}[]}
                 */
                let twitterJson = JSON.parse(fs.readFileSync(path.resolve('./db/socialalert/twitter.json'), 'utf8'))

                // Check if the user is already linked to the channel
                if (twitterJson.find(i => i.username == account && i.channel.id == feedChannel.id)) {
                    return await interaction.reply({ content: 'That Twitter account is already linked to the channel.', ephemeral: true })
                }

                // Add the user to the json
                twitterJson.push({
                    username: account,
                    channel: {
                        id: feedChannel.id,
                        role: role == null ? null : role.id // If the role is null then set it to null otherwise set it to the role id :D
                    }
                })

                // Write the json to the file
                fs.writeFileSync(path.resolve('./db/socialalert/twitter.json'), JSON.stringify(twitterJson, null, 4))

                await interaction.reply({ content: `Successfully added ${feedChannel} to the Twitter feed for ${account}.\nThis may take up to 30 minutes to apply`, ephemeral: true })
            }
        }

        if (subCommandGroup == 'youtube') {
            if (subCommand == 'add') {
                const channel = interaction.options.getString('channel')
                const feedChannel = interaction.options.getChannel('feed_channel')
                const role = interaction.options.getRole('role')

                // Create a regex to check if the feedchannel is already linked to the channel
                const regex = new RegExp(`^${channel}.*?,.*?,${feedChannel.id}$`);

                // Read the file
                const youtubeData = fs.readFileSync(path.resolve('./db/socialalert/youtube.csv'), 'utf8');

                if (youtubeData.split('\n').filter(i => regex.test(i)).length > 0) {
                    return await interaction.reply({ content: 'That channel is already linked to that channel.', ephemeral: true })
                }

                // Get the channel name / Check if the channel exists
                const channelData = await daalbot.youtube.channelIdToName(channel)
                if (channelData == null) return await interaction.reply({ content: 'That channel does not exist.', ephemeral: true })

                // Add the channel to the file
                fs.writeFileSync(path.resolve('./db/socialalert/youtube.csv'), `${youtubeData}\n${channel},${role.id || 'None'},${feedChannel.id}`)

                await interaction.reply({ content: `Successfully added ${channel} to the YouTube feed for <#${feedChannel.id}>.`, ephemeral: true })

                // Update youtube lock file to prevent bot from throwing up all the current videos in the channel
                const currentDetectedChannels = fs.readFileSync(path.resolve('./db/socialalert/youtube.detected'), 'utf8').split('\n').map(i => i.split('|')[0]);

                if (currentDetectedChannels.includes(channel)) return; // If the channel already has its uploads detected then return because it will already know about the videos

                let youtubeLock = fs.readFileSync(path.resolve('./db/socialalert/youtube.lock'), 'utf8').split(',');
                youtubeLock.push(channel);

                fs.writeFileSync(path.resolve('./db/socialalert/youtube.lock'), youtubeLock.join(','))
            }

            // return interaction.reply({
            //     content: `This feature still needs more testing before it can be used. Sorry for the inconvenience.`,
            //     ephemeral: true
            // })
        }
    }
}