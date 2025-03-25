const daalbot = require('../../daalbot.js');
const Discord = require('discord.js');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ticket',
    description: 'Manages tickets for the server.',
    category: 'Guild',

    type: 'SLASH',
    testOnly: false,
    guildOnly: true,

    permissions: [
        `${Discord.PermissionFlagsBits.ManageGuild}`
    ],

    options: [
        {
            name: 'panel',
            description: 'Settings related to the ticket panel.',
            type: Discord.ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'create',
                    description: 'Create a ticket panel.',
                    type: Discord.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The channel to create the ticket panel in.',
                            type: Discord.ApplicationCommandOptionType.Channel,
                            channel_types: [Discord.ChannelType.GuildText],
                            required: true
                        },
                        {
                            name: 'channel-name',
                            description: 'Ticket channel name. Use `%%{ticketCount}%%` to add the ticket number.',
                            type: Discord.ApplicationCommandOptionType.String,
                            required: false // Can be null and will default to `ticket-%%{ticketCount}%%`
                        },
                        {
                            name: 'category',
                            description: 'The category for the ticket channels to be created in.',
                            type: Discord.ApplicationCommandOptionType.Channel,
                            channel_types: [Discord.ChannelType.GuildCategory],
                            required: false // Can be null and will default to none
                        }
                    ]
                }
            ]
        }
    ],

    /**
     * @param {{ interaction: Discord.ChatInputCommandInteraction }} param0
     */
    callback: async({ interaction }) => {
        const subCommand = interaction.options.getSubcommand();
        const subCommandGroup = interaction.options.getSubcommandGroup();

        if (subCommandGroup === 'panel') {
            if (subCommand === 'create') {
                const channel = interaction.options.getChannel('channel');
                const channelName = interaction.options.getString('channel-name') || null;
                const category = interaction.options.getChannel('category') || null;

                const panelId = (await daalbot.items.generateId(6)).replace('-', '#');

                let panelSettings = {
                    message: null,
                    channelName,
                    category: category ? category.id : null
                }

                const panelRow = new Discord.ActionRowBuilder()
                const createBtn = new Discord.ButtonBuilder()
                    .setCustomId(`ticket_v2-create-${panelId}`)
                    .setLabel('Create Ticket')
                    .setStyle(Discord.ButtonStyle.Primary) // Primary

                panelRow.addComponents(createBtn)

                const row = new Discord.ActionRowBuilder()
                const basic = new Discord.ButtonBuilder()
                    .setCustomId(`ticket_panel_creation_basic`)
                    .setLabel('Basic')
                    .setStyle(Discord.ButtonStyle.Success) // Success is green
                const advanced = new Discord.ButtonBuilder()
                    .setCustomId(`ticket_panel_creation_advanced`)
                    .setLabel('Advanced')
                    .setStyle(Discord.ButtonStyle.Danger) // Danger is red

                await interaction.reply({
                    content: `Let's create a ticket panel in ${channel}.`,
                    components: [
                        row.addComponents(basic, advanced)
                    ],
                    flags: Discord.MessageFlags.Ephemeral
                })
                const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('ticket_panel_creation_');
                
                try {
                    const btnInt = await interaction.channel.awaitMessageComponent({
                        filter,
                        time: 60 * 1000,
                        errors: ['time']
                    });

                    const mode = btnInt.customId.split('_')[3];

                    if (mode === 'basic') {
                        // Basic mode
                        const row2 = new Discord.ActionRowBuilder()
                        const defaultBtn = new Discord.ButtonBuilder()
                            .setCustomId(`ticket_defaults`)
                            .setLabel('Defaults')
                            .setStyle(Discord.ButtonStyle.Primary) // Primary is grey

                        const custom = new Discord.ButtonBuilder()
                            .setCustomId(`ticket_custom`)
                            .setLabel('Custom')
                            .setStyle(Discord.ButtonStyle.Secondary) // Secondary is grey
                            
                        await interaction.editReply({
                            content: `Do you want to customize the embed or go with the defaults?`,
                            components: [
                                row2.addComponents(defaultBtn, custom)
                            ]
                        })

                        const filter2 = i => i.user.id === interaction.user.id && i.customId.startsWith('ticket_');
                        const embedModeInt = await interaction.channel.awaitMessageComponent({
                            filter2,
                            time: 60 * 1000,
                            errors: ['time']
                        });

                        const embedMode = embedModeInt.customId.split('_')[1];

                        if (embedMode == 'defaults') {
                            // Defaults
                            const embed = new Discord.EmbedBuilder()
                                .setTitle('Create a ticket')
                                .setDescription('Click the button below to create a ticket.')
                                .setFooter({
                                    text: `Panel ID: ${panelId}`
                                })

                            const panelMessage = await channel.send({
                                embeds: [embed],
                                components: [panelRow]
                            })

                            panelSettings.message = panelMessage.id;

                            await interaction.editReply({
                                content: `Panel created with ID \`${panelId}\``,
                                components: []
                            })
                        }

                        if (embedMode == 'custom') {
                            // Custom
                            await interaction.editReply({
                                content: `Please enter the title of the embed.`,
                                components: []
                            })
                            const filterUser = m => m.author.id === interaction.user.id;

                            const titleMsg = await interaction.channel.awaitMessages({
                                filterUser,
                                time: 60 * 1000,
                                errors: ['time'],
                                max: 1
                            });

                            const title = titleMsg.first().content;

                            await interaction.editReply({
                                content: `Please enter the description of the embed.`,
                                components: []
                            })

                            const descriptionMsg = await interaction.channel.awaitMessages({
                                filterUser,
                                time: 60 * 1000,
                                errors: ['time'],
                                max: 1
                            });

                            const description = descriptionMsg.first().content;

                            const embed = new Discord.EmbedBuilder()
                                .setTitle(title)
                                .setDescription(description)
                                .setFooter({
                                    text: `Panel ID: ${panelId}`
                                })

                            const panelMessage = await channel.send({
                                embeds: [embed],
                                components: [panelRow]
                            })

                            panelSettings.message = panelMessage.id;

                            await interaction.editReply({
                                content: `Panel created with ID \`${panelId}\``,
                                components: []
                            })
                        }
                    }

                    if (mode === 'advanced') {
                        // Advanced mode
                        await interaction.editReply({
                            content: `Please enter the message payload for the panel message. (You can use our [embed builder](<https://daalbot.xyz/html/embedbuilder/index.html>) and copy the JSON)`,
                            components: []
                        })

                        const filterUser = m => m.author.id === interaction.user.id;

                        const messagePayloadMsg = await interaction.channel.awaitMessages({
                            filterUser,
                            time: 60 * 1000,
                            errors: ['time'],
                            max: 1
                        });

                        const messagePayload = messagePayloadMsg.first().content;

                        const panelMessage = await channel.send({
                            ...JSON.parse(messagePayload), // Add their message payload
                            components: [panelRow] // Override components
                        })

                        panelSettings.message = panelMessage.id;

                        await interaction.editReply({
                            content: `Panel created with ID \`${panelId}\``,
                            components: []
                        })
                    }

                    await daalbot.db.managed.set(interaction.guild.id, `tickets/panel/${panelId}.json`, JSON.stringify(panelSettings));
                } catch {
                    await interaction.editReply({
                        content: `Something went wrong. Did you take more than 60 seconds to respond?`,
                        components: []
                    })
                }
            }
        }
    }
}