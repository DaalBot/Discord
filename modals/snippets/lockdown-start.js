const { ModalSubmitInteraction, ChannelType, PermissionFlagsBits, Colors } = require("discord.js");
const daalbot = require('../../daalbot.js');
const path = require('path');
const fs = require('fs');

/**
 * @param {ModalSubmitInteraction} interaction 
*/
module.exports = async(interaction) => {
    let lockdownJSON = {
        starter: interaction.user.id,
        timestamp: Date.now(),
        reason: interaction.fields.getTextInputValue('lockdown-reason'),
        role: null, // Assigned to all members to prevent them from sending messages
        isolation: null, // Isolation channel if new users are isolated
        isolationRole: null // Isolation role to tell new users apart from others
    }

    if (!(fs.existsSync(path.resolve(`./db/lockdown/${interaction.guild.id}/config.json`)))) {
        daalbot.fs.write(path.resolve(`./db/lockdown/${interaction.guild.id}/config.json`), JSON.stringify({
            botAdding: false,
            excludedRoles: [],
            excludedUsers: [],
            newUsers: 'isolate'
        }));
    }

    const config = JSON.parse(daalbot.fs.read(path.resolve(`./db/lockdown/${interaction.guild.id}/config.json`)));

    if (config.newUsers === 'isolate') {
        const isolationRole = await interaction.guild.roles.create({
            name: 'Isolated',
            color: Colors.Grey,
            mentionable: false
        })
        lockdownJSON.isolationRole = isolationRole.id;

        const isolationChannel = await interaction.guild.channels.create({
            name: 'isolation',
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.CreatePrivateThreads,
                    ]
                },
                {
                    id: isolationRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                    ]
                }
            ]
        });

        lockdownJSON.isolation = isolationChannel.id;

        isolationChannel.send({
            content: `This server is currently in lockdown. New users like you are isolated here until the lockdown is lifted.`
        })
    }

    const lockdownRole = await interaction.guild.roles.create({
        name: 'DaalBot - Lockdown',
        color: Colors.Red,
        mentionable: false
    })

    lockdownJSON.role = lockdownRole.id;

    daalbot.fs.write(path.resolve(`./db/lockdown/${interaction.guild.id}/current.json`), JSON.stringify(lockdownJSON));

    interaction.reply({
        content: `The server is now in lockdown. New users will be ${config.newUsers === 'isolate' ? 'isolated' : 'kicked'} until the lockdown is lifted.`,
        ephemeral: true
    });

    interaction.guild.channels.cache.forEach(async(channel) => {
        if (channel.type === ChannelType.GuildText && channel.id !== lockdownJSON.isolation) {
            if (config.newUsers === 'isolate') {
                await channel.permissionOverwrites.create(lockdownJSON.isolationRole, {
                    ViewChannel: false
                })
            }

            await channel.permissionOverwrites.create(lockdownJSON.role, {
                SendMessages: false,
                AddReactions: false
            })
        } else if (channel.type === ChannelType.GuildVoice) {
            await channel.permissionOverwrites.create(lockdownJSON.role, {
                Connect: false,
                Speak: false
            })
        }
    })

    interaction.guild.members.cache.forEach(async(member) => {
        let shouldExclude = false;

        if (config.excludedUsers.includes(member.id)) shouldExclude = true;
        if (member.id === interaction.client.user.id) shouldExclude = true;
        for (let i = 0; i < config.excludedRoles.length; i++) {
            if (member.roles.cache.has(config.excludedRoles[i])) shouldExclude = true;
        }

        if (!shouldExclude) {
            await member.roles.add(lockdownJSON.role);
        }
    })
}