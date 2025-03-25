const { StringSelectMenuInteraction } = require("discord.js");
const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');
const daalbot = require('../../daalbot.js');

/**
 * @param {StringSelectMenuInteraction} interaction
 */
module.exports = async(interaction) => {
    const option = interaction.values[0];
    const guild = interaction.guild;

    const config = daalbot.fs.read(path.resolve(`./db/lockdown/${guild.id}/config.json`));
    const configExists = config !== 'File not found.';

    if (!configExists) fs.appendFileSync(path.resolve(`./db/lockdown/${guild.id}/config.json`), JSON.stringify({
        botAdding: false,
        excludedRoles: [],
        excludedUsers: [],
        newUsers: 'isolate'
    }));

    let configData = configExists ? JSON.parse(config) : {
        botAdding: false,
        excludedRoles: [],
        excludedUsers: [],
        newUsers: 'isolate'
    };

    if (option === 'bot_adding') {
        const embed = new DJS.EmbedBuilder()
            .setTitle('Bot Adding')
            .setDescription('What should happen when a bot joins the server during a lockdown?')
            .addFields([
                {
                    name: 'Current Setting',
                    value: configData.botAdding ? 'Ignore' : 'Kick',
                    inline: false
                }
            ]);
        
        const row = new DJS.ActionRowBuilder()
            .addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('handler_lockdown-config') // Call back to this file when the user selects an option
                    .setPlaceholder('Select an option')
                    .addOptions([
                        {
                            label: 'Kick (Default)',
                            value: 'bot_adding_kick',
                            description: 'Kicks the bot when it joins the server',
                        },
                        {
                            label: 'Ignore',
                            value: 'bot_adding_ignore',
                            description: 'Ignores the bot when it joins the server',
                        }
                    ])
                    .setMinValues(1)
                    .setMaxValues(1)
                    .setPlaceholder('Select an option to change the setting')
            );

        interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
    }

    if (option === 'excluded_roles') {
        const embed = new DJS.EmbedBuilder()
            .setTitle('Excluded Roles')
            .setDescription('Which roles should be excluded from the lockdown?')
            .addFields([
                {
                    name: 'Current Setting',
                    value: configData.excludedRoles.length ? configData.excludedRoles.map(role => `<@&${role}>`).join(', ') : 'None',
                    inline: false
                }
            ]);

        const row = new DJS.ActionRowBuilder()
            .addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('handler_lockdown-config') // Call back to this file when the user selects an option
                    .setPlaceholder('Select an option')
                    .addOptions([
                        {
                            label: 'Add Role',
                            value: 'excluded_roles_add',
                            description: 'Add a role to the list of excluded roles',
                        },
                        {
                            label: 'Remove Role',
                            value: 'excluded_roles_remove',
                            description: 'Remove a role from the list of excluded roles',
                        }
                    ])
                    .setMaxValues(1) // Allow deselecting so the same option can be selected again
                    .setPlaceholder('Select an option to change the setting')
            );

        interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
    }

    if (option === 'excluded_users') {
        const embed = new DJS.EmbedBuilder()
            .setTitle('Excluded Users')
            .setDescription('Which users should be excluded from the lockdown?')
            .addFields([
                {
                    name: 'Current Setting',
                    value: configData.excludedUsers.length ? configData.excludedUsers.map(user => `<@${user}>`).join(', ') : 'None',
                    inline: false
                }
            ]);

        const row = new DJS.ActionRowBuilder()
            .addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('handler_lockdown-config') // Call back to this file when the user selects an option
                    .setPlaceholder('Select an option')
                    .addOptions([
                        {
                            label: 'Add User',
                            value: 'excluded_users_add',
                            description: 'Add a user to the list of excluded users',
                        },
                        {
                            label: 'Remove User',
                            value: 'excluded_users_remove',
                            description: 'Remove a user from the list of excluded users',
                        }
                    ])
                    .setMaxValues(1) // Allow deselecting so the same option can be selected again
                    .setPlaceholder('Select an option to change the setting')
            );

        interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
    }

    if (option === 'new_users') {
        const embed = new DJS.EmbedBuilder()
            .setTitle('New Users')
            .setDescription('What should happen to new users during a lockdown?')
            .addFields([
                {
                    name: 'Current Setting',
                    value: configData.newUsers === 'isolate' ? 'Isolate' : 'Kick',
                    inline: false
                }
            ]);

        const row = new DJS.ActionRowBuilder()
            .addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('handler_lockdown-config') // Call back to this file when the user selects an option
                    .setPlaceholder('Select an option')
                    .addOptions([
                        {
                            label: 'Isolate (Default)',
                            value: 'new_users_isolate',
                            description: 'Isolates new users when they join the server',
                        },
                        {
                            label: 'Kick',
                            value: 'new_users_kick',
                            description: 'Kicks new users when they join the server',
                        }
                    ])
                    .setMaxValues(1) // Allow deselecting so the same option can be selected again
                    .setPlaceholder('Select an option to change the setting')
            );

        interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
    }

    if (option === 'bot_adding_kick') {
        configData.botAdding = false;
    }

    if (option === 'bot_adding_ignore') {
        configData.botAdding = true;
    }

    if (option === 'excluded_roles_add') {
        await interaction.reply({
            embeds: [
                new DJS.EmbedBuilder()
                    .setTitle('Add Excluded Role')
                    .setDescription('Please mention the role you would like to add to the list of excluded roles.')
                    .setFields([
                        {
                            name: 'Accepted Formats',
                            value: 'Role mention, Role ID',
                            inline: true
                        },
                        {
                            name: 'Multiple Roles (example)',
                            value: `<@&${interaction.guild.roles.cache.random(1)[0].id}> <@&${interaction.guild.roles.cache.random(1)[0].id}> or ${interaction.guild.roles.cache.random(2).map(role => `${role.id}`).join(',')}`,
                            inline: true
                        },
                        {
                            name: 'Timeout',
                            value: `This prompt will timeout <t:${Math.round((Date.now() + 60 * 1000) / 1000)}:R> if no response is given.`,
                        }
                    ])
            ],
            flags: DJS.MessageFlags.Ephemeral
        })

        const filter = m => m.author.id === interaction.user.id;
        
        try {
            const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1, errors: ['time'] });

            collector.on('collect', async(m) => {
                const roleType = m.content.match(/<@&(\d+)>/) ? 1 : 2;
                
                if (roleType === 1) {
                    const roles = m.mentions.roles.map(role => role.id);

                    for (let i = 0; i < roles.length; i++) {
                        configData.excludedRoles.push(roles[i]);
                    }
                } else {
                    const roles = m.content.split(/, */);

                    for (let i = 0; i < roles.length; i++) {
                        // Check if the role exists
                        if (interaction.guild.roles.cache.get(roles[i])) {
                            configData.excludedRoles.push(roles[i]);
                        }
                    }
                }

                fs.writeFileSync(path.resolve(`./db/lockdown/${guild.id}/config.json`), JSON.stringify(configData));

                interaction.editReply({ content: 'Role(s) added to the list of excluded roles.', embeds: [], flags: DJS.MessageFlags.Ephemeral });
            });
        } catch {
            return interaction.editReply({ content: 'You took too long to respond. Please try again.', flags: DJS.MessageFlags.Ephemeral });
        }
    }

    if (option === 'excluded_roles_remove') {
        const embed = new DJS.EmbedBuilder()
            .setTitle('Remove Excluded Role')
            .setDescription('Please select the role(s) you would like to remove from the list of excluded roles.')

        const options = configData.excludedRoles.map(role => {
            const roleData = interaction.guild.roles.cache.get(role);
            return {
                label: roleData.name,
                value: `excluded_roles_remove_${role}`,
                description: `ID: ${roleData.id}`
            }
        })

        const row = new DJS.ActionRowBuilder()
            .addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('handler_lockdown-config') // Call back to this file when the user selects an option
                    .setPlaceholder('Select an option')
                    .addOptions(options)
                    .setPlaceholder('Select an option to change the setting')
            );

        interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
    }

    if (option === 'excluded_users_add') {
        await interaction.reply({
            embeds: [
                new DJS.EmbedBuilder()
                    .setTitle('Add Excluded User')
                    .setDescription('Please mention the user you would like to add to the list of excluded users.')
                    .setFields([
                        {
                            name: 'Accepted Formats',
                            value: 'User mention, User ID',
                            inline: true
                        },
                        {
                            name: 'Multiple Users (example)',
                            value: `<@${interaction.guild.members.cache.random(1)[0].id}> <@${interaction.guild.members.cache.random(1)[0].id}> or ${interaction.guild.members.cache.random(2).map(user => `${user.id}`).join(',')}`,
                            inline: true
                        },
                        {
                            name: 'Timeout',
                            value: `This prompt will timeout <t:${Math.round((Date.now() + 60 * 1000) / 1000)}:R> if no response is given.`,
                        }
                    ])
            ],
            flags: DJS.MessageFlags.Ephemeral
        })

        const filter = m => m.author.id === interaction.user.id;
        
        try {
            const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1, errors: ['time'] });

            collector.on('collect', async(m) => {
                const userType = m.content.match(/<@!?(\d+)>/) ? 1 : 2;
                
                if (userType === 1) {
                    const users = m.mentions.users.map(user => user.id);

                    for (let i = 0; i < users.length; i++) {
                        configData.excludedUsers.push(users[i]);
                    }
                } else {
                    const users = m.content.split(/, */);

                    for (let i = 0; i < users.length; i++) {
                        // Check if the user exists
                        if (interaction.guild.members.cache.get(users[i])) {
                            configData.excludedUsers.push(users[i]);
                        }
                    }
                }

                fs.writeFileSync(path.resolve(`./db/lockdown/${guild.id}/config.json`), JSON.stringify(configData));

                interaction.editReply({ content: 'User(s) added to the list of excluded users.', embeds: [], flags: DJS.MessageFlags.Ephemeral });
            });
        } catch {
            return interaction.editReply({ content: 'You took too long to respond. Please try again.', flags: DJS.MessageFlags.Ephemeral });
        }
    }

    if (option === 'excluded_users_remove') {
        const embed = new DJS.EmbedBuilder()
            .setTitle('Remove Excluded User')
            .setDescription('Please select the user(s) you would like to remove from the list of excluded users.')

        const options = configData.excludedUsers.map(user => {
            const userData = interaction.guild.members.cache.get(user);
            return {
                label: userData.user.username,
                value: `excluded_users_remove_${user}`,
                description: `ID: ${userData.id}`
            }
        })

        const row = new DJS.ActionRowBuilder()
            .addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('handler_lockdown-config') // Call back to this file when the user selects an option
                    .setPlaceholder('Select an option')
                    .addOptions(options)
                    .setPlaceholder('Select an option to change the setting')
            );

        interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
    }

    if (option === 'new_users_isolate') {
        configData.newUsers = 'isolate';
    }

    if (option === 'new_users_kick') {
        configData.newUsers = 'kick';
    }

    for (let i = 0; i < interaction.values.length; i++) {
        const value = interaction.values[i];

        if (value.startsWith('excluded_roles_remove')) {
            const role = value.split('_')[3];
            const index = configData.excludedRoles.indexOf(role);
            configData.excludedRoles.splice(index, 1);
        }

        if (value.startsWith('excluded_users_remove')) {
            const user = value.split('_')[3];
            const index = configData.excludedUsers.indexOf(user);
            configData.excludedUsers.splice(index, 1);
        }
    }

    try {
        interaction.reply({ content: 'Setting were updated however there was no reply sent to your action so your seing this, So just know your pretty cool :>', flags: DJS.MessageFlags.Ephemeral });
    } catch (e) {
        // Chances are the interaction was already replied to
    }

    fs.writeFileSync(path.resolve(`./db/lockdown/${guild.id}/config.json`), JSON.stringify(configData));
}