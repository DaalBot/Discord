const DJS = require('discord.js');
const daalbot = require('../../daalbot.js');
const fs = require('fs');
const path = require('path');
const client = daalbot.client;

module.exports = {
    name: 'selfrole',
    description: 'Add a role to the selfrole menu',
    category: 'Message',

    type: 'SLASH',
    // testOnly: true,

    guildOnly: true,
    permissions: [
        `${DJS.PermissionFlagsBits.ManageRoles}`,
    ],

    options: [
        {
            name: 'dropdown',
            description: 'Create / append a role dropdown menu',
            type: DJS.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'role',
                    description: 'The role to add to the dropdown',
                    type: DJS.ApplicationCommandOptionType.Role,
                    required: true,
                },
                {
                    name: 'channel',
                    description: 'The channel to send the dropdown to',
                    type: DJS.ApplicationCommandOptionType.Channel,
                    required: true,
                    channel_types: [
                        DJS.ChannelType.GuildText,
                        DJS.ChannelType.GuildAnnouncement
                    ]
                },
                {
                    name: 'message_link',
                    description: 'The message link to add the menu to',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'placeholder',
                    description: 'The placeholder text for the dropdown',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: false,
                }
            ],
        },
        {
            name: 'button',
            description: 'Create / append a role button row',
            type: DJS.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'role',
                    description: 'The role to link to the button',
                    type: DJS.ApplicationCommandOptionType.Role,
                    required: true,
                },
                {
                    name: 'channel',
                    description: 'The channel the message is in',
                    type: DJS.ApplicationCommandOptionType.Channel,
                    required: true,
                    channel_types: [
                        DJS.ChannelType.GuildText,
                        DJS.ChannelType.GuildAnnouncement
                    ]
                },
                {
                    name: 'message_link',
                    description: 'The message link to add the button to',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'label',
                    description: 'The label text for the button',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'emoji',
                    description: 'The emoji to add to the button',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'style',
                    description: 'The style of the button',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: false,
                    choices: [
                        {
                            name: 'Primary (Blue)',
                            value: `${DJS.ButtonStyle.Primary}`,
                        },
                        {
                            name: 'Secondary (Grey)',
                            value: `${DJS.ButtonStyle.Secondary}`,
                        },
                        {
                            name: 'Success (Green)',
                            value: `${DJS.ButtonStyle.Success}`,
                        },
                        {
                            name: 'Danger (Red)',
                            value: `${DJS.ButtonStyle.Danger}`
                        }
                    ]
                }
            ],
        }
    ],

    /**
     * @param {{ interaction: DJS.ChatInputCommandInteraction }} param0
     */
    callback: async ({ interaction }) => {
        const role = interaction.options.getRole('role');

        if (role.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: 'Role is higher than my highest role', flags: DJS.MessageFlags.Ephemeral });
        if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId != interaction.user.id) return interaction.reply({ content: 'Role is higher than your highest role', flags: DJS.MessageFlags.Ephemeral });

        if (interaction.options.getSubcommand() === 'button') {
            // Yay some new code
            /**
             * @type {DJS.TextChannel}
            */
            const channel = daalbot.getChannel(interaction.guild.id, interaction.options.getChannel('channel').id)
            const message_input = interaction.options.getString('message_link');
            const label = interaction.options.getString('label') ?? role.name;
            const emoji = interaction.options.getString('emoji');
            const style = interaction.options.getString('style') ?? DJS.ButtonStyle.Secondary;

            if (channel == undefined) return interaction.reply({ content: 'Channel not found', flags: DJS.MessageFlags.Ephemeral });
            if (channel == 'Channel not found.') return interaction.reply({ content: 'Channel not found', flags: DJS.MessageFlags.Ephemeral });
            if (channel == 'Server not found.') return interaction.reply({ content: 'Server not found', flags: DJS.MessageFlags.Ephemeral });

            const message = await daalbot.getMessageFromString(message_input, channel);
            const button = new DJS.ButtonBuilder()
                .setCustomId(`selfrole-${role.id}`)
                .setLabel(label)
                .setStyle(style);

            if (emoji) button.setEmoji(emoji.trim().replace(/[<>:A-Za-z_ ]/g, ''));

            if (message.id == undefined) return interaction.reply({ content: 'Message not found', flags: DJS.MessageFlags.Ephemeral });

            if (message.components.length > 0) {
                const row = message.components[0];

                if (row.components[0].type == DJS.ComponentType.Button) {
                    row.components.push(button);

                    if (row.components.length > 5) return interaction.reply({ content: `Cannot have more than 5 buttons in a row`, flags: DJS.MessageFlags.Ephemeral });

                    if (message.author.id === client.user.id) {
                        await message.edit({ components: [row] });
                    } else {
                        const webhook = await message.fetchWebhook();
        
                        if (webhook?.owner?.id === client.user.id) {
                            await webhook.editMessage(message.id, {
                                components: [row]
                            });
                        } else {
                            return interaction.reply({ content: 'Unsupported message', flags: DJS.MessageFlags.Ephemeral });
                        }
                    }

                    return interaction.reply({ content: 'Button added to message.', flags: DJS.MessageFlags.Ephemeral });
                } else {
                    return interaction.reply({ content: 'Unsupported message', flags: DJS.MessageFlags.Ephemeral });
                }
            } else {
                const row = new DJS.ActionRowBuilder()
                row.addComponents(button);

                if (message.author.id === client.user.id) {
                    await message.edit({ components: [row] });
                } else {
                    const webhook = await message.fetchWebhook();

                    if (webhook?.owner?.id === client.user.id) {
                        await webhook.editMessage(message.id, {
                            components: [row]
                        });
                    } else {
                        return interaction.reply({ content: 'Unsupported message', flags: DJS.MessageFlags.Ephemeral });
                    }
                }

                return interaction.reply({ content: 'Button added to message.', flags: DJS.MessageFlags.Ephemeral });
            }
        }

        if (interaction.options.getSubcommand() === 'dropdown') {
            // Legacy stuff only really used for dropdowns
            /**
             * @type {DJS.TextChannel}
            */
            const channel = daalbot.getChannel(interaction.guild.id, interaction.options.getChannel('channel').id)
            const message_input = interaction.options.getString('message_link');
            const placeholder = interaction.options.getString('placeholder') || 'Select a role';
    
            if (channel == undefined) return interaction.reply({ content: 'Channel not found', flags: DJS.MessageFlags.Ephemeral });
            if (channel == 'Channel not found.') return interaction.reply({ content: 'Channel not found', flags: DJS.MessageFlags.Ephemeral });
            if (channel == 'Server not found.') return interaction.reply({ content: 'Server not found', flags: DJS.MessageFlags.Ephemeral });
    
            const message = await daalbot.getMessageFromString(message_input, channel);
    
            if (message.id == undefined) return interaction.reply({ content: 'Message not found', flags: DJS.MessageFlags.Ephemeral });
    
            if (message.components.length > 0) {
                const row = message.components[0];
    
                if (row.components[0].type == DJS.ComponentType.StringSelect) {
                    row.components[0].options.push({
                        label: role.name,
                        value: role.id,
                    });
    
                    if (row.components[0].options.length > 25) return interaction.reply({ content: 'Cannot have more than 25 options in a dropdown', flags: DJS.MessageFlags.Ephemeral });
    
                    if (message.author.id === client.user.id) {
                        await message.edit({ components: [row] });
                    } else {
                        const webhook = await message.fetchWebhook();
        
                        if (webhook?.owner?.id === client.user.id) {
                            await webhook.editMessage(message.id, {
                                components: [row]
                            });
                        } else {
                            return interaction.reply({ content: 'Unsupported message', flags: DJS.MessageFlags.Ephemeral });
                        }
                    }
    
                    return interaction.reply({ content: 'Role added to dropdown', flags: DJS.MessageFlags.Ephemeral });
                } else {
                    return interaction.reply({ content: 'Unsupported message', flags: DJS.MessageFlags.Ephemeral });
                }
            } else {
                const row = new DJS.ActionRowBuilder()
    
                const dropdown = new DJS.StringSelectMenuBuilder()
                    .setCustomId('auto_roles')
                    .setPlaceholder(placeholder)
                    .addOptions([
                        {
                            label: role.name,
                            value: role.id,
                        }
                    ])
    
                row.addComponents(dropdown);
    
                if (message.author.id === client.user.id) {
                    await message.edit({ components: [row] });
                } else {
                    const webhook = await message.fetchWebhook();
    
                    if (webhook?.owner?.id === client.user.id) {
                        await webhook.editMessage(message.id, {
                            components: [row]
                        });
                    } else {
                        return interaction.reply({ content: 'Unsupported message', flags: DJS.MessageFlags.Ephemeral });
                    }
                }
    
                return interaction.reply({ content: 'Role added to dropdown', flags: DJS.MessageFlags.Ephemeral });
            }
        }
    }
}