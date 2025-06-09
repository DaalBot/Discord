const client = require('../../client.js');
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const daalbot = require('../../daalbot.js');
const config = require('../../config.json');
const path = require('path');

const blacklistedUsers = [
    '628400349979344919' // StickyBot (pins message to bottom of channel by sending it again and deleting the old one)
];

client.on('messageDelete', async (message) => {
    try {
        if (blacklistedUsers.includes(message.author.id)) return; // Prevent spam from bots

        const enabled = fs.readFileSync(path.resolve(`./db/logging/${message.guild.id}/MESSAGEDELETE.enabled`), 'utf8');
        if (enabled == 'true') {
            if (fs.existsSync(path.resolve(`./db/logging/${message.channel.guild.id}/MESSAGEDELETE.exclude`))) {
                const excluded = fs.readFileSync(path.resolve(`./db/logging/${message.channel.guild.id}/MESSAGEDELETE.exclude`), 'utf8').split('\n');
    
                if (excluded.includes(message.channel.id)) return;
            }

            if (!fs.existsSync(`./db/logging/${message.guild.id}/channel.id`)) return;

            const channelID = fs.readFileSync(path.resolve(`./db/logging/${message.guild.id}/channel.id`), 'utf8');
            const logChannel = client.channels.cache.get(channelID);

            const embed = new EmbedBuilder()
                .setTitle('Message Deleted')
                .setDescription(`<:icon_Person:1043647937487589446> <@${message.author.id}>
<:discordReply:1043869882921533450> <#${message.channel.id}>

<:Message:1117915334855360532> ${message.content}

<:Trash:1118100123713540118> <@${message.author.id}> or a bot[*](https://daalbot.xyz/Details#message-deletion-attribution)`)
                .setThumbnail('https://media.piny.dev/daalbot/embed/thumbnail/logs/Message.png')
                .setColor('#EF3D48')
                .setTimestamp();

            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 1
            })

            const latestAuditLog = fetchedLogs.entries.first();
    
            if (latestAuditLog.action == AuditLogEvent.MessageDelete) {
                if (latestAuditLog.targetId == message.author.id) {
                    try {
                        // Message wasnt deleted by a bot or the author
                        const executor = latestAuditLog?.executorId;
            
                        embed.setDescription(`<:icon_Person:1043647937487589446> <@${message.author.id}>
<:discordReply:1043869882921533450> <#${message.channel.id}>

<:Message:1117915334855360532> ${message.content}

<:Trash:1118100123713540118> <@${executor}>[*](https://daalbot.xyz/Details#message-deletion-attribution)`)
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
            
            logChannel.send({
                content: `Message Deleted`,
                embeds: [embed]
            })
        }
    } catch (err) {
        return;
    }
});