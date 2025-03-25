const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const crypto = require('crypto');
const daalbot = require('../../daalbot.js');
const DJS = require('discord.js');

/**
 * @type {Object.<string, number>}
*/
let requests = {};

module.exports = {
    name: 'data',
    description: 'Modfies / Gets / Deletes data from the bot',
    category: 'Bot',

    type: 'SLASH',
    testOnly: false,

    options: [
        {
            name: 'info',
            description: 'Gets info about data from the bot',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'policy',
                    description: 'Gets info about the privacy policy',
                    type: ApplicationCommandOptionType.Subcommand,
                }
            ]
        },
        {
            name: 'actions',
            description: 'Modifies data from the bot',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'download',
                    description: 'Downloads data for the guild.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'type',
                            description: 'How the data should be retrieved',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'Automatic',
                                    value: 'auto',
                                },
                                {
                                    name: 'Manual (Support Ticket)',
                                    value: 'manual',
                                }
                            ]
                        }
                    ]
                },
                {
                    name: 'delete',
                    description: 'Deletes data from the bot',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'type',
                            description: 'The type of data to delete',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'User (Data that includes your user)',
                                    value: 'user'
                                },
                                {
                                    name: 'Server (Data that includes the current server)',
                                    value: 'guild'
                                }
                            ]
                        },
                        {
                            name: 'delay',
                            description: 'The delay before the data is deleted',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: '1 Day',
                                    value: `${(24 * 60 * 60 * 1000).toString()}`
                                },
                                {
                                    name: '3 Days',
                                    value: `${(3 * 24 * 60 * 60 * 1000).toString()}`
                                },
                                {
                                    name: '1 Week',
                                    value: `${(7 * 24 * 60 * 60 * 1000).toString()}`
                                },
                                {
                                    name: '1 Month',
                                    value: `${(30 * 24 * 60 * 60 * 1000).toString()}`
                                }
                            ]
                        }
                    ]
                },
                {
                    name: 'cancel',
                    description: 'Cancels a deletion of data from the bot',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'type',
                            description: 'The type of data to cancel',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'User (Data that includes your user)',
                                    value: 'user'
                                },
                                {
                                    name: 'Server (Data that includes the current server)',
                                    value: 'guild'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],

    /**
     * 
     * @param {{ interaction: DJS.ChatInputCommandInteraction }} param0 
     * @returns 
     */
    callback: async({interaction}) => {
        const subCommandGroup = interaction.options.getSubcommandGroup();
        const subCommand = interaction.options.getSubcommand();

        if (subCommandGroup === 'info') {
            if (subCommand === 'policy') {
                interaction.reply({ content: `https://daalbot.xyz/Legal/Privacy`, flags: DJS.MessageFlags.Ephemeral });
            }
        }

        // Actions require the user to have the `Manage Server` permission
        if (!interaction.member.permissions.has(DJS.PermissionFlagsBits.ManageGuild)) return await interaction.reply({
            content: 'You must have the `Manage Server` permission to perform actions on data.',
            flags: DJS.MessageFlags.Ephemeral
        })

        if (subCommandGroup === 'actions') {
            if (subCommand === 'delete') {
                // return await interaction.reply({ content: 'This command is currently disabled. For data deletion please create a support ticket in our support server (go.daalbot.xyz/HQ)', flags: DJS.MessageFlags.Ephemeral });
                const type = interaction.options.getString('type');

                if (type === 'guild') {
                    if (fs.existsSync(path.resolve(`./temp/del/${interaction.guild.id}.json`))) {
                        return interaction.reply({ content: 'Deletion already scheduled.', flags: DJS.MessageFlags.Ephemeral });
                    }

                    const delay = interaction.options.getString('delay');
                    const delayNum = parseInt(delay);

                    const deletionObj = {
                        time: Date.now() + delayNum,
                        reason: `Data Deletion Requested by ${interaction.user.tag} (${interaction.user.id})`,
                        type: 'guild'
                    };

                    await fsp.writeFile(path.resolve(`./temp/del/${interaction.guild.id}.json`), JSON.stringify(deletionObj, null, 4));

                    await interaction.reply({ content: `Deletion scheduled for <t:${await daalbot.timestamps.getFutureDiscordTimestamp(delayNum)}:R>`, flags: DJS.MessageFlags.Ephemeral });

                    const guildOwner = await interaction.guild.fetchOwner();

                    if (guildOwner.id !== interaction.user.id) {
                        try {
                            const embed = new EmbedBuilder()
                                .setTitle('Data Deletion Scheduled')
                                .setDescription(`A data deletion for the server ${interaction.guild.name} (${interaction.guild.id}) has been scheduled by ${interaction.user.username} (${interaction.user.id}). To cancel this deletion, use the \`/data actions cancel\` command.`)
                                .addFields(
                                    { name: 'Deletion time', value: `<t:${await daalbot.timestamps.getFutureDiscordTimestamp(delayNum)}:R>` },
                                    { name: 'Reason', value: 'Data Deletion Requested' }
                                )
                                .setColor('Red');

                            await guildOwner.send({ embeds: [embed] });
                        } catch (err) {
                            if (err?.code === 50007) {
                                // User has DMs disabled
                                await interaction.followUp({ content: 'The server owner has DMs disabled and thus could not be notified of the data deletion.', flags: DJS.MessageFlags.Ephemeral });
                            } else console.error(err);
                        }
                    }
                } else if (type === 'user') {
                    return interaction.reply({
                        content: `To request a data deletion, please create a support ticket in at [go.daalbot.xyz/HQ](https://discord.com/invite/mGacnqE7qk)`,
                        flags: DJS.MessageFlags.Ephemeral
                    })
                }
            }

            if (subCommand === 'cancel') {
                const type = interaction.options.getString('type');

                if (type === 'user') return await interaction.reply({
                    content: `This currently cannot be done automatically and thus there is no pending data removal for users.`,
                });

                if (type === 'guild') {
                    if (!fs.existsSync(path.resolve(`./temp/del/${interaction.guild.id}.json`))) {
                        return interaction.reply({ content: 'No deletion scheduled.', flags: DJS.MessageFlags.Ephemeral });
                    }

                    await fsp.rm(path.resolve(`./temp/del/${interaction.guild.id}.json`));
                    return interaction.reply({ content: 'Deletion cancelled.', flags: DJS.MessageFlags.Ephemeral });
                }
            }

            if (subCommand == 'download') {
                const type = interaction.options.getString('type');

                if (type === 'auto') {
                    // Check if the user has requested a download in the last 24 hours
                    if (requests[interaction.user.id] && requests[interaction.user.id] > Date.now() - 24 * 60 * 60 * 1000) {
                        return interaction.reply({ content: 'You have already requested a download in the last 24 hours.', flags: DJS.MessageFlags.Ephemeral });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Finding Data...')
                        .setDescription('This may take a while, please be patient.')
                        .setColor('Yellow');

                    interaction.reply({ embeds: [embed], flags: DJS.MessageFlags.Ephemeral });

                    const downloadKey = crypto.randomBytes(16).toString('hex');

                    await fsp.mkdir(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}`), { recursive: true });

                    async function copyCategoryFolder(category) {
                        if (!fs.existsSync(path.resolve(`./db/${category}/${interaction.guild.id}/`))) return;
                        await fsp.mkdir(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/${category}/`), { recursive: true });
                        await fsp.cp(path.resolve(`./db/${category}/${interaction.guild.id}/`), path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/${category}/`), {
                            recursive: true
                        });
                    }

                    const categories = [
                        'autorole',
                        'config',
                        'logging',
                        'managed',
                        'tickets',
                        'xp',
                        'events', // Grab any global variables (stored in events/[GUILD]/)
                    ];

                    for (let i = 0; i < categories.length; i++) {
                        await copyCategoryFolder(categories[i]);
                    }

                    // Special cases

                    await fsp.mkdir(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/socialalert/`), { recursive: true });

                    // Twitch social link
                    const twitchData = await fsp.readFile(path.resolve(`./db/socialalert/twitch.txt`), 'utf8');
                    const twitchAccounts = twitchData.split('\n');

                    /**
                     * Not objects only IDs
                     * @type {string[]}
                    */
                    const guildChannels = await daalbot.resolveId(interaction.guild.id, 'guild', 'channel');

                    let twitchOutputFile = '';

                    for (let i = 0; i < guildChannels.length; i++) {
                        const matchingAccounts = twitchAccounts.filter(account => account.includes(guildChannels[i])).map(account => account.split(',')[0]);

                        for (let j = 0; j < matchingAccounts.length; j++) {
                            if (twitchOutputFile.includes(matchingAccounts[j])) {
                                // Add `|${channelID}` to the end of the line
                                twitchOutputFile = twitchOutputFile.replace(new RegExp(`(${matchingAccounts[j]}),(.*)`), `$1,${guildChannels[i]}`);
                            } else {
                                twitchOutputFile += `${matchingAccounts[j]},${guildChannels[i]}\n`;
                            }
                        }
                    }

                    if (twitchOutputFile) await fsp.writeFile(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/socialalert/twitch.txt`), twitchOutputFile, {
                        flag: 'w'
                    });

                    // Tickets
                    await fsp.copyFile(path.resolve(`./db/tickets/${interaction.guild.id}.category`), path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/tickets/category`));
                    await fsp.copyFile(path.resolve(`./db/tickets/${interaction.guild.id}.permissions`), path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/tickets/permissions`));

                    // Events
                    const eventJson = JSON.parse(await fsp.readFile(path.resolve(`./db/events/events.json`)));
                    const events = eventJson.filter(event => event.guild === interaction.guild.id);
                    await fsp.mkdir(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/events/`), { recursive: true });

                    // Give them a stripped down version of the events file
                    await fsp.writeFile(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/events/events.json`), JSON.stringify(events, null, 4));

                    // Loop through the events and copy the folders
                    for (let i = 0; i < events.length; i++) {
                        await fsp.cp(path.resolve(`./db/events/${events[i].id}/`), path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/events/${events[i].id}/`), {
                            recursive: true
                        });
                    }

                    // Zip the folder
                    const archiver = require('archiver');
                    const output = fs.createWriteStream(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}.zip`));
                    const archive = archiver('zip', {
                        zlib: { level: 9 }
                    });

                    output.on('close', async() => {
                        await interaction.editReply({
                            embeds: [
                                new DJS.EmbedBuilder()
                                    .setTitle('Download Ready')
                                    .setDescription('Your download is ready, it has been attached to this message.')
                                    .setColor('Green')
                            ],
                            files: [path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}.zip`)]
                        });

                        requests[interaction.user.id] = Date.now();
                        await fsp.rm(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/`), { recursive: true });
                        await fsp.rm(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}.zip`));
                    });

                    archive.pipe(output);
                    archive.directory(path.resolve(`./temp/down/${interaction.guild.id}-${downloadKey}/`), false);
                    archive.finalize();
                } else {
                    await interaction.reply({
                        content: 'To request a detailed download, please create a support ticket in at [go.daalbot.xyz/HQ](https://discord.com/invite/mGacnqE7qk)',
                        flags: DJS.MessageFlags.Ephemeral
                    })
                }
            }
        }
    }
}