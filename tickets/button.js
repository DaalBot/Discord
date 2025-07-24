const client = require('../client.js');
const daalbot = require('../daalbot.js');
const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) {
            try {
                if (!interaction.customId.startsWith('ticket_v2-')) return;

                const action = interaction.customId.split('-')[1];
                const meta = interaction.customId.split('-')[2];
                const member = interaction.member;

                if (action === 'create') {
                    async function getTicketID() {
                        async function generateID() {
                            return await daalbot.items.generateId(6);
                        }

                        let ticketID = await generateID();
                        let ticketExists = await daalbot.db.managed.exists(interaction.guild.id, `tickets/${ticketID}`);
                        
                        if (ticketExists) {
                            return await getTicketID(); // Loop until we get a unique ID
                        } else {
                            return ticketID;
                        }
                    }
                    const ticketID = await getTicketID();

                    let lastTicketCount = await daalbot.db.managed.get(interaction.guild.id, 'tickets/count');
                    if (lastTicketCount == 'File not found.') lastTicketCount = 0;

                    const panelSettingsTxt = await daalbot.db.managed.get(interaction.guild.id, `tickets/panel/${meta}.json`);
                    if (panelSettingsTxt == 'File not found.') return interaction.reply({ content: 'This panel does not exist.', ephemeral: true }); // HOW TF DO YOU EVEN??
                    const panelSettings = JSON.parse(panelSettingsTxt);

                    const ticketCount = parseInt(lastTicketCount) + 1;
                    let ticketChannelName = panelSettings.channelName ?? `ticket-%%{ticketCount}%%`;
                    if (ticketChannelName.includes('%%{ticketCount}%%')) {
                        ticketChannelName = ticketChannelName.replace('%%{ticketCount}%%', ticketCount);
                    } else {
                        ticketChannelName = `${ticketChannelName}-${ticketCount}`; // Must have a dynamic attribute
                    }
                    const ticketCategory = panelSettings.category;

                    /**
                     * @type {DJS.TextChannel}
                    */
                    const ticketChannel = await interaction.guild.channels.create({
                        name: ticketChannelName,
                        type: DJS.ChannelType.GuildText,
                        parent: ticketCategory,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone,
                                deny: [
                                    DJS.PermissionsBitField.Flags.ViewChannel
                                ]
                            },
                            {
                                id: member.id,
                                allow: [
                                    DJS.PermissionsBitField.Flags.ViewChannel,
                                    DJS.PermissionsBitField.Flags.SendMessages,
                                    DJS.PermissionsBitField.Flags.AddReactions,
                                    DJS.PermissionsBitField.Flags.AttachFiles,
                                    DJS.PermissionsBitField.Flags.EmbedLinks,
                                    DJS.PermissionsBitField.Flags.ReadMessageHistory
                                ]
                            }
                        ]
                    });

                    const ticketEmbed = new DJS.EmbedBuilder()
                        .setAuthor({
                            name: `${member.user.username} (${member.user.id})`,
                            iconURL: member.user.displayAvatarURL({ dynamic: true })
                        })
                        .setTitle(`Ticket #${ticketCount}`)
                        .setDescription(`Please describe your issue below. Someone will be with you shortly.`)
                        .setColor('Green')
                        .setFooter({
                            text: 'Ticket ID: ' + ticketID // Used to identify the ticket in the database
                        })
                        .setTimestamp()

                    const ticketRow = new DJS.ActionRowBuilder()
                    const closeButton = new DJS.ButtonBuilder()
                        .setCustomId(`ticket_v2-close-${ticketID.replace(/-/g, '#')}`) // Replace hyphens so they can be reversed
                        .setLabel('Close')
                        .setStyle(DJS.ButtonStyle.Danger)

                    await ticketChannel.send({ embeds: [ticketEmbed], components: [ticketRow.addComponents(closeButton)] });
                    await daalbot.db.managed.set(interaction.guild.id, 'tickets/count', ticketCount);
                    await daalbot.db.managed.set(interaction.guild.id, `tickets/${ticketID}/channel`, ticketChannel.id);

                    const transcriptObj = {
                        "entities": {
                            "users": {
                                "747928399326216334": {
                                    "avatar": "https://media.piny.dev/DaalBotSquare.png",
                                    "username": "DaalBot",
                                    "discriminator": "0001",
                                    "badge": "bot"
                                },
                                "1": {
                                    "avatar": "https://media.piny.dev/daalbot/embed/thumbnail/logs/Ticket.png",
                                    "username": "Ticket Event",
                                    "discriminator": "System",
                                    "badge": "bot",
                                    "meta": {
                                        "role": "system"
                                    }
                                },
                            },
                            "channels": {},
                            "roles": {}
                        },
                        "messages": [
                            {
                                "id": "1",
                                "author": "1",
                                "time": Date.now(),
                                "content": `Ticket #${ticketCount} created by ${member.user.tag}.`
                            }
                        ],
                        "channel_name": ticketChannel.name
                    }

                    // Add member to the transcript
                    transcriptObj.entities.users[interaction.user.id] = {
                        avatar: interaction.user.displayAvatarURL({ dynamic: true }),
                        username: interaction.user.username,
                        discriminator: interaction?.user?.discriminator ?? '0001',
                        badge: null,
                        meta: {
                            role: 'opener'
                        }
                    }

                    await daalbot.db.managed.set(interaction.guild.id, `tickets/${ticketID}/transcript.json`, JSON.stringify(transcriptObj));
                    await daalbot.db.managed.set(interaction.guild.id, `tickets/channels`, `\n${ticketChannel.id}:${ticketID}`, 'a'); // Append to the list of ticket channels

                    interaction.reply({ content: 'Your ticket has been created.', ephemeral: true });

                    try {
                        if (fs.existsSync(path.resolve(`./db/logging/${interaction.guild.id}/TICKETCREATE.enabled`))) {
                            const enabled = daalbot.fs.read(path.resolve(`./db/logging/${interaction.guild.id}/TICKETCREATE.enabled`), 'utf8');
                            if (enabled == 'true') {
                                if (!fs.existsSync(`./db/logging/${interaction.guild.id}/channel.id`)) return;
            
                                const channelID = daalbot.fs.read(path.resolve(`./db/logging/${interaction.guild.id}/channel.id`), 'utf8');
                                /**
                                 * @type {DJS.TextChannel | null}
                                 */
                                const logChannel = client.channels.cache.get(channelID);
                                if (!logChannel) return;
            
                                const embed = new DJS.EmbedBuilder()
                                    .setTitle('Ticket Created')
                                    .setDescription(`Ticket \`${ticketID}\` was created by ${member.user.username} (${interaction.user.id}).`)
                                    .setThumbnail('https://media.piny.dev/daalbot/embed/thumbnail/logs/Ticket.png')
                                    .setColor('Green')
                                    .setTimestamp()
            
                                logChannel.send({
                                    content: `Ticket Created`,
                                    embeds: [embed]
                                })
                            }
                        }
                    } catch(e) {
                        console.error(e);
                    }
                }

                if (action == 'close') {
                    await interaction.reply({
                        content: 'Are you sure you want to close this ticket?',
                        ephemeral: true,
                        components: [
                            new DJS.ActionRowBuilder()
                                .addComponents(
                                    new DJS.ButtonBuilder()
                                        .setCustomId(`ticketsv2_loop-close-confirm`)
                                        .setLabel('Yes')
                                        .setStyle(DJS.ButtonStyle.Success),
                                    new DJS.ButtonBuilder()
                                        .setCustomId(`ticketsv2_loop-close-cancel`)
                                        .setLabel('No')
                                        .setStyle(DJS.ButtonStyle.Danger)
                                )
                        ]
                    })

                    const confirmation = await interaction.channel.awaitMessageComponent({
                        filter: i => i.user.id === interaction.user.id && i.customId === 'ticketsv2_loop-close-confirm' || i.customId === 'ticketsv2_loop-close-cancel',
                        time: 30 * 1000 // 30 seconds
                    });

                    if (!confirmation) return interaction.editReply({ content: 'Ticket close timed out.', components: [] }); // ??? is this how it works?
                    if (confirmation.customId === 'ticketsv2_loop-close-cancel') return interaction.editReply({ content: 'Ticket close cancelled.', components: [] });

                    const ticketID = meta.replace(/#/g, '-'); // Replace hashtags with hyphens
                    const ticketChannelID = await daalbot.db.managed.get(interaction.guild.id, `tickets/${ticketID}/channel`);
                    if (ticketChannelID == 'File not found.') return interaction.reply({ content: 'This ticket does not exist.', ephemeral: true });

                    /**
                     * @type {DJS.TextChannel | null}
                     */
                    const ticketChannel = interaction.guild.channels.cache.get(ticketChannelID);
                    if (!ticketChannel) return interaction.editReply({ content: 'This ticket does not exist.', ephemeral: true });

                    const transcriptTxt = await daalbot.db.managed.get(interaction.guild.id, `tickets/${ticketID}/transcript.json`);
                    if (transcriptTxt == 'File not found.') return interaction.editReply({ content: 'This ticket does not exist.', ephemeral: true });

                    const transcript = JSON.parse(transcriptTxt);

                    transcript.messages.push({
                        content: `Ticket closed by ${member.user.username} (${member.user.id}).`,
                        author: '1',
                        time: Date.now(),
                        id: '2'
                    })

                    await daalbot.db.managed.set(interaction.guild.id, `tickets/${ticketID}/transcript.json`, JSON.stringify(transcript));

                    await daalbot.db.managed.delete(interaction.guild.id, `tickets/${ticketID}/channel`);

                    const ticketChannels = await daalbot.db.managed.get(interaction.guild.id, 'tickets/channels');
                    if (ticketChannels == 'File not found.') return;
                    const ticketChannelPairs = ticketChannels.split('\n');
                    const output = ticketChannelPairs.filter(c => c.split(':')[1] != ticketID);
                    await daalbot.db.managed.set(interaction.guild.id, 'tickets/channels', output.join('\n'));

                    try {
                        // Channel got deleted, so we cannot send a message / reply to the interaction however we can still potentially message the user
                        const opener = Object.keys(transcript.entities.users).find(u => transcript.entities.users[u].meta?.role == 'opener');
                        if (!opener) throw new Error('No opener found.'); // No opener found, so we cannot message them
                        const openerUser = interaction.guild.members.cache.get(opener);
                        if (!openerUser) throw new Error('Opener not found.');
                        await openerUser.send({
                            content: `Your ticket has been closed by ${member.user.username} (${member.user.id}).\n\nHere is the transcript of your ticket: ([View in browser](https://daalbot.xyz/Dashboard/Other/tickets/upload))`,
                            files: [
                                {
                                    attachment: Buffer.from(JSON.stringify(transcript, null, 4)),
                                    name: 'transcript.json'
                                }
                            ]
                        });
                    } catch(e) {
                        // console.error(`Tickets [V2] > Error encountered while sending a DM to the opener of ticket ${ticketID}.`);
                        // console.error(e);
                        // Nothing to worry about here - the user probably has DMs disabled
                    }

                    try {
                        if (fs.existsSync(path.resolve(`./db/logging/${interaction.guild.id}/TICKETCLOSE.enabled`))) {
                            const enabled = daalbot.fs.read(path.resolve(`./db/logging/${interaction.guild.id}/TICKETCLOSE.enabled`), 'utf8');
                            if (enabled == 'true') {
                                if (!fs.existsSync(`./db/logging/${interaction.guild.id}/channel.id`)) return;
            
                                const channelID = daalbot.fs.read(path.resolve(`./db/logging/${interaction.guild.id}/channel.id`), 'utf8');
                                /**
                                 * @type {DJS.TextChannel | null}
                                 */
                                const logChannel = client.channels.cache.get(channelID);
                                if (!logChannel) return;
            
                                const embed = new DJS.EmbedBuilder()
                                    .setTitle('Ticket Closed')
                                    .setDescription(`Ticket \`${ticketID}\` was closed by ${member.user.username} (${interaction.user.id}).\n\nA transcript of the ticket has been attached and sent to the opener. It can be viewed [here](https://daalbot.xyz/Dashboard/Other/tickets/upload).`)
                                    .setThumbnail('https://media.piny.dev/daalbot/embed/thumbnail/logs/Ticket.png')
                                    .setColor('Red')
                                    .setTimestamp()
            
                                logChannel.send({
                                    content: `Ticket Closed`,
                                    embeds: [embed],
                                    files: [
                                        {
                                            attachment: Buffer.from(JSON.stringify(transcript, null, 4)),
                                            name: 'transcript.json'
                                        }
                                    ]
                                })

                                await ticketChannel.delete(`Ticket closed by ${member.user.username} (${member.user.id})`);
                            } else {
                                await ticketChannel.send({
                                    embeds: [
                                        new DJS.EmbedBuilder()
                                            .setTitle('Ticket Closed')
                                            .setDescription(`Ticket closed by ${member.user.username} (${member.user.id}).\n\nWe were unable to send a transcript of the ticket as logging is disabled so this channel will not be automatically deleted. However, new messages will not be accounted for.\n\nIf you would like to visualize the transcript, you can do so [here](https://daalbot.xyz/Dashboard/Other/tickets/upload).`)
                                            .setColor('Red')
                                            .setTimestamp()
                                    ],
                                    files: [
                                        {
                                            name: 'transcript.json',
                                            content: Buffer.from(JSON.stringify(transcript, null, 4))
                                        }
                                    ]
                                })

                                await ticketChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                                    SendMessages: false
                                })

                                await interaction.editReply({ content: 'Ticket closed.', components: [] }); // We can still reply to the interaction
                            }
                        }
                    } catch(e) {
                        console.error(e);
                    }

                    await daalbot.db.managed.delete(interaction.guild.id, `tickets/${ticketID}/transcript.json`);
                    await fs.promises.rm(path.resolve(`./db/managed/${interaction.guild.id}/tickets/${ticketID}`), { recursive: true });
                }
            } catch(e) {
                if (!`${e}`.includes('reason: time')) console.error(e); // Ignore the error if it's just a timeout
                interaction.editReply({ content: 'Something went wrong and we were unable to process your request. (Maybe you didnt confirm in time)', components: [], ephemeral: true });
            }
        }
    } catch(e) {
        console.error('Tickets [V2] > Error encountered while dealing with a request.');
        console.error(e);
        return interaction.editReply({ content: 'An error occurred.', ephemeral: true });
    }
})