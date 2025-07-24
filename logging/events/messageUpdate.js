const client = require('../../client.js');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const daalbot = require('../../daalbot.js');

client.on('messageUpdate', async (oldMessage, newMessage) => {
    try {
        const enabled = daalbot.fs.read(path.resolve(`./db/logging/${oldMessage.guild.id}/MESSAGEUPDATE.enabled`), 'utf8');
        if (enabled == 'true') {
            if (fs.existsSync(path.resolve(`./db/logging/${oldMessage.channel.guild.id}/MESSAGEDELETE.exclude`))) {
                const excluded = daalbot.fs.read(path.resolve(`./db/logging/${oldMessage.channel.guild.id}/MESSAGEDELETE.exclude`), 'utf8').split('\n');
    
                if (excluded.includes(oldMessage.channel.id)) return;
            }

            if (!fs.existsSync(`./db/logging/${oldMessage.guild.id}/channel.id`)) return;
            if (oldMessage.author.bot) return;

            const channelID = daalbot.fs.read(path.resolve(`./db/logging/${oldMessage.guild.id}/channel.id`), 'utf8');
            const logChannel = client.channels.cache.get(channelID);
            const description = `**Before**
            Content: ${oldMessage.content}
            Embeds: ${oldMessage.embeds.length}
            Attachments: ${oldMessage.attachments.size}
            Components: ${oldMessage.components.length}
            
            **After**
            Content: ${newMessage.content}
            Embeds: ${newMessage.embeds.length}
            Attachments: ${newMessage.attachments.size}
            Components: ${newMessage.components.length}`;

            const embed = new EmbedBuilder()
                .setTitle('Message Edited')
                .setDescription(description)
                .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Message.png')
                .setColor('#FFE467')
                .setTimestamp()

            if (description.length >= 4000) {
                embed.setDescription('Data too long to display. Check the raw data below.');
            }

            const pasteUrl = await daalbot.api.pasteapi.createPaste(`--- OLD ---
${JSON.stringify(oldMessage, null, 4)}

--- NEW ---
${JSON.stringify(newMessage, null, 4)}`, 'Message Update - JSON');

            embed.setDescription(embed.data.description + `\n\n[Raw Data](${pasteUrl})`)

            logChannel.send({
                content: `Message Edited`,
                embeds: [embed]
            })
        }
    } catch (err) {
        return;
    }
});