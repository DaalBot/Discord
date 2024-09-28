const { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const fs = require('fs/promises');
const path = require('path');
const daalbot = require('../../daalbot.js');

module.exports = {
    name: 'admin',
    description: 'All of the commands for the admins of daalbot',
    category: 'Pen',
    type: 'SLASH',
    options: [
        {
            name: 'db',
            description: 'Just some database tools',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'remove',
                    description: 'Remove a query from the database',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'The user to remove',
                            type: ApplicationCommandOptionType.User,
                            required: false
                        },
                        {
                            name: 'guild',
                            description: 'The guild to remove',
                            type: ApplicationCommandOptionType.String,
                            required: false
                        }
                    ]
                }
            ]
        },
        {
            name: 'runtime',
            description: 'Do stuff at runtime',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'eval',
                    description: 'Evaluate some code',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'code',
                            description: 'The code to evaluate',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: 'attachment',
                            description: 'attachment',
                            type: ApplicationCommandOptionType.Attachment,
                            required: false
                        },
                        {
                            name: 'string',
                            description: 'string',
                            type: ApplicationCommandOptionType.String,
                            required: false
                        },
                        {
                            name: 'number',
                            description: 'number',
                            type: ApplicationCommandOptionType.Number,
                            required: false
                        },
                        {
                            name: 'boolean',
                            description: 'boolean',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false
                        },
                        {
                            name: 'user',
                            description: 'user',
                            type: ApplicationCommandOptionType.User,
                            required: false
                        },
                        {
                            name: 'channel',
                            description: 'channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: false
                        },
                        {
                            name: 'role',
                            description: 'role',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        }
                    ]
                }
            ]
        },
        {
            name: 'lookup',
            description: 'Looks up stuff',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'id',
                    description: 'Looks up an id',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            description: 'The id to look up',
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: 'type',
                            description: 'The type of id to look up',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'User',
                                    value: 'user'
                                },
                                {
                                    name: 'Channel',
                                    value: 'channel'
                                },
                                {
                                    name: 'Role',
                                    value: 'role'
                                },
                                {
                                    name: 'Guild',
                                    value: 'guild'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    ownerOnly: true,

    /**
     * @param {{interaction: ChatInputCommandInteraction}} param0
    */
    callback:async({interaction})=>{
        const {options} = interaction;
        const SubcommandGroup = options.getSubcommandGroup();
        const Subcommand = options.getSubcommand();

        if (SubcommandGroup === 'db') {
            async function exists(path) {
                try {
                    await fs.stat(path);
                    return true;
                } catch {
                    return false;
                }
            }
            if (Subcommand === 'remove') {
                const user = options.getUser('user');
                const guild = options.getString('guild');

                if (user && guild) return interaction.reply({
                    content: 'Pick a side bro :sob:',
                    ephemeral: true
                })

                if (guild) {
                    const guildManagedPath = path.resolve(`./db/managed/${guild}/`);
                    const guildConfigPath = path.resolve(`./db/config/${guild}/`);

                    let deletionPaths = [];

                    if (await exists(guildManagedPath)) deletionPaths.push(guildManagedPath);
                    if (await exists(guildConfigPath)) deletionPaths.push(guildConfigPath);

                    if (deletionPaths.length === 0) return interaction.reply({
                        content: 'No data found for the specified guild',
                        ephemeral: true
                    })
                    const diff = deletionPaths.map(p => path.relative('./db/', p)).join('\n- ');

                    const guildObj = await interaction.client.guilds.fetch(guild);

                    const embed = new EmbedBuilder()
                        .setTitle('Are you sure?')
                        .setDescription(`This will delete all data for guild \`${guildObj.name} (${guildObj.id})\`\nThis will delete the following database folders:\n\`\`\`diff\n- ${diff}\n\`\`\``)
                        .setColor('Red')

                    if (interaction.user.id === '747928399326216334') {
                        embed.setFooter({
                            text: 'No olilz, this isn\'t a test this will delete data',
                        })
                    }

                    const row = new ActionRowBuilder();

                    const confirmButton = new ButtonBuilder()
                        .setCustomId('admin_db_confirm')
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Danger);

                    const cancelButton = new ButtonBuilder()
                        .setCustomId('admin_db_cancel')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Success);

                    row.addComponents(confirmButton, cancelButton);

                    await interaction.reply({
                        embeds: [embed],
                        components: [row]
                    })

                    const filter = i => i.user.id === interaction.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({filter, time: 15000});

                    let actioned = false;

                    collector.on('collect', async i => {
                        if (i.customId === 'admin_db_confirm') {
                            actioned = true;
                            await i.update({
                                content: 'Deleting data...',
                                embeds: [],
                                components: []
                            })

                            try {
                                await Promise.all(deletionPaths.map(p => fs.rm(p, {recursive: true})));
                                await i.editReply({
                                    content: 'Data deleted',
                                    embeds: [],
                                    components: []
                                })

                                await fs.appendFile('./db/deleted.txt', `${guildObj.name} (${guildObj.id} / triggered by ${interaction.user.id})\n`);
                            } catch (err) {
                                await i.editReply({
                                    content: `An error occurred: \`${err}\``,
                                    embeds: [],
                                    components: []
                                })

                                console.error(err);
                            }
                        } else if (i.customId === 'admin_db_cancel') {
                            actioned = true;
                            await i.update({
                                content: 'Cancelled',
                                embeds: [],
                                components: []
                            })
                        }
                    })

                    collector.on('end', async () => {
                        if (!actioned) {
                            await interaction.editReply({
                                content: 'Cancelled due to inactivity',
                                embeds: [],
                                components: []
                            })
                        }
                    })
                }
            }
        } else if (SubcommandGroup === 'runtime') {
            if (Subcommand === 'eval') {
                if (!(interaction.user.id === '900126154881646634')) return interaction.reply({
                    content: 'No, Just no. Never gonna happen.',
                    ephemeral: true
                })
                const code = options.getString('code');

                try {
                    const output = await eval(code);

                    if (output instanceof Object) {
                        if (output instanceof Buffer) {
                            await interaction.reply({
                                content: 'Output is a buffer, sending as file...',
                                files: [{
                                    attachment: output,
                                    name: 'output.txt'
                                }],
                                ephemeral: true
                            })
                        } else {
                            await interaction.reply({
                                content: 'Output is an object, sending as JSON...',
                                files: [{
                                    attachment: Buffer.from(JSON.stringify(output, null, 2)),
                                    name: 'output.json'
                                }],
                                ephemeral: true
                            })
                        }
                    } else {
                        await interaction.reply({
                            content: `\`\`\`js\n${output}\n\`\`\``,
                            ephemeral: true
                        })
                    }
                } catch (e) {
                    await interaction.reply({
                        content: `\`\`\`js\n${e}\n\`\`\``,
                        ephemeral: true
                    })
                }
            }
        } else if (SubcommandGroup === 'lookup') {
            if (Subcommand === 'id') {
                const id = options.getString('id');
                const type = options.getString('type');

                let obj = null;

                obj = await interaction.client[`${type}s`].fetch(id);

                if (obj === null) return interaction.reply({
                    content: 'No object found',
                    ephemeral: true
                })

                const reply = `\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``

                if (reply.length > 2000) {
                    // Output is too long so just send it as a file instead
                    await interaction.reply({
                        content: 'Output is too long, sending as file...',
                        files: [{
                            attachment: Buffer.from(JSON.stringify(obj, null, 2)),
                            name: 'output.json'
                        }],
                        ephemeral: true
                    })
                } else {
                    await interaction.reply({
                        content: reply.substring(0, 2000),
                        ephemeral: true
                    })
                }
            }
        }
    }
}