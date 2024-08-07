const client = require('../../../client.js');
const daalbot = require('../../../daalbot.js');
const Discord = require('discord.js');

client.on('messageCreate', msg => {
    if (msg.author.id == '900126154881646634') {
        if (msg.content == '$ticket-drop') {
            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId('vortex-ticket-dropdown')
                        .setPlaceholder('Select a reason for your ticket')
                        .addOptions([
                            {
                                label: 'Infraction issue',
                                description: 'Open a ticket for an infraction issue',
                                value: 'Infraction issue'
                            },
                            {
                                label: 'Role issue',
                                description: 'Open a ticket for a role issue',
                                value: 'Role issue'
                            },
                            {
                                label: 'Member issue',
                                description: 'Open a ticket for a member issue',
                                value: 'Member issue'
                            },
                            {
                                label: 'Server issue',
                                description: 'Open a ticket for a server issue',
                                value: 'Server issue'
                            },
                            {
                                label: 'Map service request',
                                description: 'Open a ticket for a map service request',
                                value: 'Map service request'
                            },
                            {
                                label: 'Other',
                                description: 'Open a ticket for something else',
                                value: 'Other'
                            }
                        ])
                        .setMinValues(1)
                        .setMaxValues(1)
                )

                const embed = new Discord.EmbedBuilder()
                    .setTitle('Service Request')
                    .setDescription(`
                    > Click The Button Below To Be Added To The Queue For A Service Member!
                    > Here Are Some Possible Problems We Will Look For In Your Ticket.
                    > Select a item from the dropdown menu below to open a ticket.
                    `)
                    .setColor('#00aae3')
                    .setFooter({
                        text: 'Vortex | Service Request',
                        iconURL: 'https://media.piny.dev/VortexIcon.png'
                    })

                msg.channel.send({
                    embeds: [embed],
                    components: [row]
                })
        }
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'vortex-ticket-dropdown') {
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${Math.random().toString(36).substring(7)}`,
                type: Discord.ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [
                            Discord.PermissionFlagsBits.ViewChannel
                        ]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            Discord.PermissionFlagsBits.ViewChannel,
                            Discord.PermissionFlagsBits.SendMessages
                        ]
                    }
                ],
                parent: daalbot.getChannel(interaction.guild.id, '1085829640431607819')
            })
    
            interaction.reply({
                content: 'Your ticket has been created!',
                ephemeral: true
            })
    
            const supportRole = daalbot.getRole(interaction.guild.id, '974534922125594626')
            
            if (supportRole == 'Role not found.' || supportRole == 'Server not found.' || supportRole == undefined) {
                return interaction.editReply({
                    content: 'Error: \`\`\`\nDaalbot was unable to find the support role.\n\`\`\`',
                    ephemeral: true
                })
            }
    
            await ticketChannel.permissionOverwrites.edit(supportRole, {
                ViewChannel: true,
                SendMessages: true
            })
    
            const embed = new Discord.EmbedBuilder()
                .setTitle(`Ticket - ${interaction.values[0]}`)
                .setDescription(`
                Welcome To Your Ticket, <@${interaction.user.id}>!
                Someone will be with you shortly.
                `)
                .setColor('#00aae3')
                .setFooter({
                    text: 'Vortex | Ticket',
                    iconURL: 'https://media.piny.dev/VortexIcon.png'
                })
                .setTimestamp()
    
            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('vortex_close_ticket')
                        .setLabel('Close Ticket')
                        .setStyle(Discord.ButtonStyle.Danger)
                )
    
            ticketChannel.send({
                embeds: [embed],
                components: [row]
            })
    
            const attentionMessage = await ticketChannel.send(`<@${interaction.user.id}>`);
    
            attentionMessage.delete();
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'vortex_close_ticket') {
            interaction.channel.delete();
        }
    }
})