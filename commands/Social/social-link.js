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
        // {
        //     name: 'youtube',
        //     description: 'Modifies the YouTube feeds for the server.',
        //     type: ApplicationCommandOptionType.SubcommandGroup,
        //     options: [
        //         {
        //             name: 'add',
        //             description: 'Adds a YouTube feed to a channel.',
        //             type: ApplicationCommandOptionType.Subcommand,
        //             options: [
        //                 {
        //                     name: 'channel',
        //                     description: 'The id of the channel to add. (lnk.daalbot.xyz/1)',
        //                     type: ApplicationCommandOptionType.String,
        //                     required: true
        //                 },
        //                 {
        //                     name: 'feed_channel',
        //                     description: 'The channel to send the feed to.',
        //                     type: ApplicationCommandOptionType.Channel,
        //                     required: true
        //                 },
        //                 {
        //                     name: 'role',
        //                     description: 'The role to ping when a new video is uploaded.',
        //                     type: ApplicationCommandOptionType.Role,
        //                     required: false
        //                 }
        //             ]
        //         }
        //     ]
        // },
        {
            name: 'bluesky',
            description: 'Modifies the Bluesky feeds for the server.',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'add',
                    description: 'Adds a Bluesky feed to a channel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The channel to add the feed to.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true
                        },
                        {
                            name: 'account',
                            description: 'The account to add the feed from.',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: 'message',
                            description: 'The message to send when a new post is detected. (must include %%{LINK}%%)',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: 'remove',
                    description: 'Removes a Bluesky feed from a channel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The channel to remove the feed from.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true
                        },
                        {
                            name: 'account',
                            description: 'The account to remove the feed from. (Default: All)',
                            type: ApplicationCommandOptionType.String,
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

                await daalbot.createIdReference(interaction.guild.id, 'channel', feedChannel.id); // Create a reference for the channel
                await interaction.reply({ content: `Successfully added ${feedChannel} to the Twitch feed for ${startingChannel}.`, ephemeral: true })
            }
        }

        // if (subCommandGroup == 'youtube') {
        //     if (subCommand == 'add') {
        //         const channel = interaction.options.getString('channel')
        //         const feedChannel = interaction.options.getChannel('feed_channel')
        //         const role = interaction.options.getRole('role')

        //         // Create a regex to check if the feedchannel is already linked to the channel
        //         const regex = new RegExp(`^${channel}.*?,.*?,${feedChannel.id}$`);

        //         // Read the file
        //         const youtubeData = fs.readFileSync(path.resolve('./db/socialalert/youtube.csv'), 'utf8');

        //         if (youtubeData.split('\n').filter(i => regex.test(i)).length > 0) {
        //             return await interaction.reply({ content: 'That channel is already linked to that channel.', ephemeral: true })
        //         }

        //         // Get the channel name / Check if the channel exists
        //         const channelData = await daalbot.youtube.channelIdToName(channel)
        //         if (channelData == null) return await interaction.reply({ content: 'That channel does not exist.', ephemeral: true })

        //         // Add the channel to the file
        //         fs.writeFileSync(path.resolve('./db/socialalert/youtube.csv'), `${youtubeData}\n${channel},${role.id || 'None'},${feedChannel.id}`)

        //         await interaction.reply({ content: `Successfully added ${channel} to the YouTube feed for <#${feedChannel.id}>.`, ephemeral: true })

        //         // Update youtube lock file to prevent bot from throwing up all the current videos in the channel
        //         const currentDetectedChannels = fs.readFileSync(path.resolve('./db/socialalert/youtube.detected'), 'utf8').split('\n').map(i => i.split('|')[0]);

        //         if (currentDetectedChannels.includes(channel)) return; // If the channel already has its uploads detected then return because it will already know about the videos

        //         let youtubeLock = fs.readFileSync(path.resolve('./db/socialalert/youtube.lock'), 'utf8').split(',');
        //         youtubeLock.push(channel);

        //         fs.writeFileSync(path.resolve('./db/socialalert/youtube.lock'), youtubeLock.join(','))
        //     }

        //     // return interaction.reply({
        //     //     content: `This feature still needs more testing before it can be used. Sorry for the inconvenience.`,
        //     //     ephemeral: true
        //     // })
        // }

        if (subCommandGroup == 'bluesky') {
            const feedChannel = interaction.options.getChannel('channel');
            const accountInput = interaction.options.getString('account');
            
            if (subCommand == 'add') {
                const message = interaction.options.getString('message');if (!message.includes('%%{LINK}%%')) return await interaction.reply({ content: 'The message must include %%{LINK}%%.', ephemeral: true })

                let account = accountInput;

                if (!account.includes('did:')) {
                    // Account is a username not a id so we need to get the id
                    const accountData = await axios.get(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${accountInput.replace('@', '')}`);

                    if (accountData.data.error) return await interaction.reply({
                        content: `Sorry, but we were unable to find that account (${accountData.data.message}). Please make sure you entered the correct account.`,
                        ephemeral: true
                    })

                    account = accountData.data.did;
                }

                // Read the file
                const blueskyData = fs.readFileSync(path.resolve('./db/socialalert/bsky.txt'), 'utf8');

                // Check if the channel is already linked to the account
                if (blueskyData.split('\n').filter(i => i.split(';;[DCS];;')[0] == account).length > 0) {
                    // Account is already linked to a channel so we need to check if the channel is the same
                    if (blueskyData.split('\n').filter(i => i.split(';;[DCS];;')[0] == account)[0].split(';;[DCS];;')[1].includes(feedChannel.id)) { // {"id":"123","message":"%%{LINK}%%"};;[NC];;{"id":"456","message":"%%{LINK}%%"}
                        return await interaction.reply({ content: `<#${feedChannel.id}> is already linked to that account.`, ephemeral: true })
                    }

                    // Account is linked to a different channel so we need to add the channel to the account
                    const accountData = blueskyData.split('\n').filter(i => i.split(';;[DCS];;')[0] == account)[0];

                    let accountChannels = accountData.split(';;[DCS];;')[1].split(';;[NC];;');

                    accountChannels.push(JSON.stringify({
                        id: feedChannel.id,
                        message: message
                    }));

                    const newAccountData = `${account};;[DCS];;${accountChannels.join(';;[NC];;')}`;

                    const newBlueskyData = blueskyData.split('\n').filter(i => !i.startsWith(account)).join('\n') + '\n' + newAccountData;

                    await daalbot.createIdReference(interaction.guild.id, 'channel', feedChannel.id); // Create a reference for the channel
                    fs.writeFileSync(path.resolve('./db/socialalert/bsky.txt'), newBlueskyData);
                    return await interaction.reply({ content: `Successfully added <#${feedChannel.id}> to the Bluesky feed for ${accountInput}.`, ephemeral: true });
                }

                // Account is not linked to any channel so we need to add the account and channel to the file
                const newBlueskyData = `${account};;[DCS];;${JSON.stringify({ id: feedChannel.id, message: message })}`;

                const blueskyPosts = fs.readFileSync(path.resolve('./db/socialalert/bsky.detected'), 'utf8').split('\n');
                const usersPostsReq = await axios.get(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${account}`);
                const usersPosts = usersPostsReq.data.feed;

                let postCids = blueskyPosts;
                for (let i = 0; i < usersPosts.length; i++) {
                    postCids.push(usersPosts[i].post.cid);
                }

                await daalbot.createIdReference(interaction.guild.id, 'channel', feedChannel.id); // Create a reference for the channel
                fs.writeFileSync(path.resolve('./db/socialalert/bsky.detected'), postCids.join('\n')); // Add the new posts to prevent the bot from sending posts that have already been made
                fs.writeFileSync(path.resolve('./db/socialalert/bsky.txt'), `${blueskyData}\n${newBlueskyData}`);

                await interaction.reply({ content: `Successfully added <#${feedChannel.id}> to the Bluesky feed for ${accountInput}.`, ephemeral: true });
            }

            if (subCommand == 'remove') {
                if (!accountInput) {
                    // Remove all accounts from the channel
                    const file = fs.readFileSync(path.resolve('./db/socialalert/bsky.txt'), 'utf8');
                    const accounts = file.split('\n').filter(i => i.split(';;[DCS];;')[1].includes(feedChannel.id));
                    if (accounts.length == 0) return await interaction.reply({ content: 'There are no accounts linked to that channel.', ephemeral: true })
                    
                    for (let i = 0; i < accounts.length; i++) {
                        const account = accounts[i];
                        const channels = account.split(';;[DCS];;')[1];

                        if (!channels.includes(';;[NC];;')) {
                            // Account is only linked to one channel so we can remove the account instead
                            const newBlueskyData = file.split('\n').filter(i => i != account).join('\n');
                            fs.writeFileSync(path.resolve('./db/socialalert/bsky.txt'), newBlueskyData);
                            continue;
                        } else {
                            // Account is linked to multiple channels so we need to remove the channel from the account
                            const channelObjects = channels.split(';;[NC];;').map(i => JSON.parse(i));
                            const newChannels = channelObjects.filter(i => i.id != feedChannel.id);
                            const newAccountData = `${account.split(';;[DCS];;')[0]};;[DCS];;${newChannels.map(i => JSON.stringify(i)).join(';;[NC];;')}`;

                            const newBlueskyData = file.split('\n').filter(i => i != account).join('\n') + '\n' + newAccountData;
                            fs.writeFileSync(path.resolve('./db/socialalert/bsky.txt'), newBlueskyData);
                        }
                    }
                } else {
                    let account = accountInput;

                    if (!account.includes('did:')) {
                        // Account is a username not a id so we need to get the id
                        const accountData = await axios.get(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${accountInput.replace('@', '')}`);

                        if (accountData.data.error) return await interaction.reply({
                            content: `Sorry, but we were unable to find that account (${accountData.data.message}). Please make sure you entered the correct account.`,
                            ephemeral: true
                        })

                        account = accountData.data.did;
                    }

                    // Remove the account from the channel
                    const file = fs.readFileSync(path.resolve('./db/socialalert/bsky.txt'), 'utf8');
                    const accountData = file.split('\n').filter(i => i.split(';;[DCS];;')[0] == account)[0];
                    if (!accountData) return await interaction.reply({ content: 'That account is not linked to that channel.', ephemeral: true })
                    
                    const channels = accountData.split(';;[DCS];;')[1];

                    if (!channels.includes(';;[NC];;')) {
                        // Account is only linked to one channel so we can remove the account instead
                        const newBlueskyData = file.split('\n').filter(i => i != accountData).join('\n');
                        fs.writeFileSync(path.resolve('./db/socialalert/bsky.txt'), newBlueskyData);
                    } else {
                        // Account is linked to multiple channels so we need to remove the channel from the account
                        const channelObjects = channels.split(';;[NC];;').map(i => JSON.parse(i));
                        const newChannels = channelObjects.filter(i => i.id != feedChannel.id);
                        const newAccountData = `${account.split(';;[DCS];;')[0]};;[DCS];;${newChannels.map(i => JSON.stringify(i)).join(';;[NC];;')}`;

                        const newBlueskyData = file.split('\n').filter(i => i != accountData).join('\n') + '\n' + newAccountData;
                        fs.writeFileSync(path.resolve('./db/socialalert/bsky.txt'), newBlueskyData);
                    }
                }
            }
        }
    }
}