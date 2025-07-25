const daalbot = require('../../daalbot.js');
const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');

module.exports = {
    name: 'antiraid',
    description: 'Configure the anti raid system.',
    category: 'Guild',

    slash: true,
    testOnly: true,

    guildOnly: true,
    permissions: [
        `${Discord.PermissionFlagsBits.ManageGuild}`
    ],

    options: [
        {
            name: 'toggle',
            description: 'Toggle the anti raid system.',
            type: Discord.ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'all',
                    description: 'Toggles the entire anti raid system.',
                    type: Discord.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'enabled',
                            description: 'Whether or not the anti raid system is enabled.',
                            type: Discord.ApplicationCommandOptionType.Boolean,
                            required: true
                        }
                    ]
                },
                {
                    name: 'names',
                    description: 'Toggles the anti raid system for known raid names.',
                    type: Discord.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'enabled',
                            description: 'Whether or not the anti raid system for names is enabled.',
                            type: Discord.ApplicationCommandOptionType.Boolean,
                            required: true
                        }
                    ]
                },
                {
                    name: 'treshold',
                    description: 'Toggles the anti raid system for the treshold.',
                    type: Discord.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'enabled',
                            description: 'Whether or not the anti raid system for the treshold is enabled.',
                            type: Discord.ApplicationCommandOptionType.Boolean,
                            required: true
                        }
                    ]
                }
            ]
        },
        {
            name: 'settings',
            description: 'Configure the anti raid system.',
            type: Discord.ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'threshold',
                    description: 'Set the threshold for the anti raid system.',
                    type: Discord.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'threshold',
                            description: 'Set the threshold for the anti raid system.',
                            type: Discord.ApplicationCommandOptionType.Integer,
                            required: true
                        },
                        {
                            name: 'time',
                            description: 'Sets the time before the threshold resets. (in seconds)',
                            type: Discord.ApplicationCommandOptionType.Integer,
                            required: true
                        }
                    ]
                },
                {
                    name: 'action',
                    description: 'The action to take when the anti raid system is triggered.',
                    type: Discord.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'action',
                            description: 'The action to take when the anti raid system is triggered.',
                            type: Discord.ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'Kick',
                                    value: 'kick'
                                },
                                {
                                    name: 'Ban',
                                    value: 'ban'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],

    callback: ({ interaction }) => {
        const subCommandGroup = interaction.options.getSubcommandGroup();
        const subCommand = interaction.options.getSubcommand();

        const guild = daalbot.fetchServer(interaction.guild.id);

        if (subCommandGroup == 'toggle') {
            const enabled = interaction.options.getBoolean('enabled');
            const dir = path.resolve(`./db/antiraid/${guild.id}.toggle`);
            const dataExists = fs.existsSync(dir);
            
            if (subCommand == 'all') {
                if (dataExists) {
                    let data = daalbot.fs.read(dir, 'utf8').split(',');
                    data[0] = enabled;
                    daalbot.fs.write(dir, `${data[0]},${data[1]},${data[2]}`);
                } else {
                    daalbot.fs.write(dir, `${enabled},${enabled},${enabled}`);
                }
            }

            if (subCommand == 'names') {
                if (dataExists) {
                    let data = daalbot.fs.read(dir, 'utf8').split(',');
                    data[1] = enabled;
                    daalbot.fs.write(dir, `${data[0]},${data[1]},${data[2]}`);
                } else {
                    daalbot.fs.write(dir, `false,${enabled},false`);
                }
            }

            if (subCommand == 'treshold') {
                if (dataExists) {
                    let data = daalbot.fs.read(dir, 'utf8').split(',');
                    data[2] = enabled;
                    daalbot.fs.write(dir, `${data[0]},${data[1]},${data[2]}`);
                } else {
                    daalbot.fs.write(dir, `false,false,${enabled}`);
                }
            }
        }

        if (subCommand == 'threshold') {
            const threshold = interaction.options.getInteger('threshold');
            const time = interaction.options.getInteger('time');
            const dir = path.resolve(`./db/antiraid/${guild.id}.threshold`);
            
            daalbot.fs.write(dir, `${threshold},${time}`);
        }

        if (subCommand == 'action') {
            const action = interaction.options.getString('action');
            const dir = path.resolve(`./db/antiraid/${guild.id}.action`);
            
            daalbot.fs.write(dir, action);
        }

        return 'Done!';
    }
}