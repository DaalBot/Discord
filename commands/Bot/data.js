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
                                    name: 'User (Data that includes your user id)',
                                    value: 'user'
                                },
                                {
                                    name: 'Guild (Data that includes the current guild id)',
                                    value: 'guild'
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
                                    name: 'User (Data that includes your user id)',
                                    value: 'user'
                                },
                                {
                                    name: 'Guild (Data that includes the current guild id)',
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
                const embed = new EmbedBuilder()
                    .setDescription(fs.readFileSync(path.resolve(`./PRIVACY.md`), 'utf8').replace('<br/>', '\n'));

                interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (subCommandGroup === 'actions') {
            if (subCommand === 'delete') {
                return await interaction.reply({ content: 'This command is currently disabled. For data deletion please create a support ticket in our support server (go.daalbot.xyz/HQ)', ephemeral: true });
                const type = interaction.options.getString('type');

                if (type === 'guild') {
                    // if (fs.existsSync(path.resolve(`./temp/${interaction.guild.id}.del`))) {
                    //     return interaction.reply({ content: 'Deletion already scheduled.', ephemeral: true });
                    // }

                    // const embed = new EmbedBuilder()
                    //     .setTitle('Deletion scheduled (TEST)')
                    //     .setDescription(`Guild data for ${interaction.guild.name} will be deleted <t:${(Math.floor(Date.now() / 1000)) + 24 * 60 * 60}:R> unless you cancel it with \`/data actions cancel\``)
                    //     .setFooter({
                    //         text: 'All current data will be deleted, this will not affect any data that is added after the deletion is complete'
                    //     })
                    //     .setColor('Red');

                    // interaction.reply({ embeds: [embed] });

                    // fs.appendFileSync(path.resolve(`./temp/${interaction.guild.id}.del`), Math.floor(Date.now()) + 24 * 60 * 60 * 1000);

                    // daalbot.timestampEvents.once(`${Math.floor(Date.now()) + 24 * 60 * 60 * 1000}`, () => {
                    //     // Executes once the countdown is over
                    //     if (fs.readFileSync(path.resolve(`./temp/${interaction.guild.id}.del`), 'utf8') === 'ABORTED') return; // If the deletion was aborted, don't delete the data

                    //     // TODO
                    // })
                }
            }

            if (subCommand == 'download') {
                const type = interaction.options.getString('type');

                if (type === 'auto') {
                    if (!interaction.member.permissions.has(DJS.PermissionFlagsBits.ManageGuild)) return await interaction.reply({
                        content: 'You must have the `Manage Server` permission to download data automatically.',
                        ephemeral: true
                    })
                    // Check if the user has requested a download in the last 24 hours
                    if (requests[interaction.user.id] && requests[interaction.user.id] > Date.now() - 24 * 60 * 60 * 1000) {
                        return interaction.reply({ content: 'You have already requested a download in the last 24 hours.', ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Finding Data...')
                        .setDescription('This may take a while, please be patient.')
                        .setColor('Yellow');

                    interaction.reply({ embeds: [embed], ephemeral: true });

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
                        ephemeral: true
                    })
                }
            }
        }
    }
}