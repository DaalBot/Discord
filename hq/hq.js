const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags, ApplicationCommandOptionType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const client = require('../client');
const crypto = require('crypto');
const daalbot = require('../daalbot.js');
const fs = require('fs');
const path = require('path');

client.on('ready', () => {
    const server = client.guilds.cache.get('1001929445478781030');
    const commands = server?.commands

    commands?.create({
        name: 'api',
        description: 'API related actions',
        options: [
            {
                name: 'keys',
                description: 'Manage API keys',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'generate',
                        description: 'Generate a api key.',
                        type: ApplicationCommandOptionType.Subcommand
                    }
                ]
            }
        ]
    })
})


client.on('guildMemberAdd', member => {
    if (member.guild.id === '1001929445478781030') {
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`Welcome to the official DaalBot HQ!`)
            .setDescription(`You are member #${member.guild.memberCount}`)
            .setThumbnail(member.avatarURL)
            .setImage('https://media.piny.dev/Daalbot.png')
            .setColor(0x9b24a9)
        client.channels.cache.find(channel => channel.id === '1010452045163143209').send({ content: `Everyone welcome <@${member.id}> to the server!`, embeds: [welcomeEmbed]});
    } else {
        return;
    }
});

client.on('guildMemberRemove', member => {
    if (member.guild.id === '1001929445478781030') {
        client.channels.cache.find(channel => channel.id === '1010452094844665906').send(`<@${member.id}> has left the server`);
    } else {
        return;
    }
});

client.on('messageCreate', msg => {
    if (msg.channel.type == ChannelType.DM) return; // Ignore DMs
    if (msg.guild.id === '1001929445478781030') {
        if (msg.author.bot && msg.author.id == '1052298562458898462') {
            // Triggers when a commit alert is sent by the webhook
            const data = msg.content.split(';;[COMMITBOUND];;')
            const commitEmbed = new EmbedBuilder()
                .setAuthor({
                    name: `${data[0]}`,
                    iconURL: `https://github.com/${data[0]}.png` // Github pfp redirect (e.g. /NotPiny.png -> avatars.githubusercontent.com/u/...)
                })
                .setTitle(`New commit on ${data[2]}`)
                .setDescription(data[1])
                .setURL(data[3].replace(/commit/g, ' TRUE ').includes('TRUE') ? `${data[3]}` : `https://github.com/${data[2]}`)

            msg.delete();
            daalbot.getChannel(msg.guild.id, '1052304271221198898').send({ embeds: [commitEmbed] });
        } else if (msg.author.bot && msg.author.id == '1055877624230068315') {
            msg.channel.send('<@&1016344487867457597>')
        } else if (msg.channel.id == '1003822202413662248' || msg.channel.id == '1118225367572951131') {
            msg.crosspost(); // Publish the message when it is sent in announcements
        }
    } else {
        return;
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.guildId === '1001929445478781030') return;
    if (!interaction.channel) return await interaction.reply({
        content: 'Not sure how you even did this but you need to use this command in a channel',
        flags: MessageFlags.Ephemeral
    })

    if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;

        if (commandName === 'api') {
            if (options.getSubcommandGroup() === 'keys') {
                if (options.getSubcommand() === 'generate') {
                    try {
                        const rand = crypto.randomBytes(24).toString('base64url');

                        if (interaction.channel.type != ChannelType.GuildText) return await interaction.reply({
                            content: 'You can only run this command within text channels',
                            flags: MessageFlags.Ephemeral
                        })
                        
                        const startEmbed = new EmbedBuilder()
                            .setTitle('API Key Generation')
                            .setDescription('Please pick a server to generate the key for.')
                            .setFooter({
                                text: 'You have 60 seconds to select a server | Step 1',

                            })
                            .setColor('Yellow')

                        const row = new ActionRowBuilder()
                        const menu = new StringSelectMenuBuilder()
                            .setCustomId('hq_api_keygen_selector')
                            .setPlaceholder('Select a server')
                            .setMaxValues(1)

                        client.guilds.cache.forEach(guild => {
                            if (guild.ownerId == interaction.user.id) menu.addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel(guild.name)
                                    .setValue(guild.id)
                                    .setDescription(guild.id)
                            )
                        })

                        row.addComponents(menu)

                        interaction.reply({
                            embeds: [startEmbed],
                            components: [row],
                            flags: MessageFlags.Ephemeral // Message is gonna contain api keys so it should be hidden
                        })

                        const filter = i => i.customId === 'hq_api_keygen_selector' && i.user.id === interaction.user.id
                        const collector = await interaction.channel.awaitMessageComponent({ filter, time: 60000 });

                        if (!collector.isStringSelectMenu()) return await interaction.editReply({
                            content: 'Selected component is not a string select menu',
                        });

                        const guild = client.guilds.cache.get(collector.values[0]);

                        if (!guild) return await interaction.editReply({
                            content: 'Invalid server selected',
                        });

                        const confirmEmbed = new EmbedBuilder()
                            .setTitle('API Key Generation')
                            .setDescription(`Are you sure you want to generate a key for ${guild.name}? Doing so will invalidate any previous keys.`)
                            .setFooter({
                                text: 'You have 60 seconds to confirm | Step 2',
                            })
                            .setColor('Yellow')

                        const confirmRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('hq_api_keygen_confirm')
                                    .setLabel('Confirm')
                                    .setStyle(ButtonStyle.Success),

                                new ButtonBuilder()
                                    .setCustomId('hq_api_keygen_cancel')
                                    .setLabel('Cancel')
                                    .setStyle(ButtonStyle.Danger)
                            )

                        await interaction.editReply({
                            embeds: [confirmEmbed],
                            components: [confirmRow]
                        })

                        const confirmFilter = i => i.customId === 'hq_api_keygen_confirm' || i.customId === 'hq_api_keygen_cancel'
                        const confirmCollector = await interaction.channel.awaitMessageComponent({ filter: confirmFilter, time: 60000 });

                        if (confirmCollector.customId === 'hq_api_keygen_cancel') {
                            const cancelEmbed = new EmbedBuilder()
                                .setTitle('API Key Generation')
                                .setDescription('Key generation cancelled - No key was added')
                                .setColor('Red')

                            return await interaction.editReply({
                                embeds: [cancelEmbed],
                                components: []
                            })
                        }

                        if (confirmCollector.customId === 'hq_api_keygen_confirm') {
                            const resultEmbed = new EmbedBuilder()
                                .setTitle('API Key Generation')
                                .setDescription(`Key generated successfully for ${guild.name}. The key is \`${Buffer.from(guild.id).toString('base64').replace(/=/g, '')}.${rand}\` making your \`Authorization\` header \`Guild ${Buffer.from(guild.id).toString('base64').replace(/=/g, '')}.${rand}\``)
                                .setColor('Green')

                            await interaction.editReply({
                                embeds: [resultEmbed],
                                components: []
                            })
                        }
                    } catch (err) {
                        console.error(err)
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('API Key Generation')
                            .setDescription('An error occured while generating the key, This could be due to having too many servers owned or not answering in time. If you believe this is a mistake, please create a ticket')
                            .setColor('Red')
                        interaction.replied ? await interaction.editReply({ embeds: [errorEmbed], components: [] }) : await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral })
                    }
                }
            }
        }
    }
})

