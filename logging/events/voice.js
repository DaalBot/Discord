const client = require('../../client.js');
const config = require('../../config.json');
const fs = require('fs');
const Discord = require('discord.js');
const path = require('path');

client.on('voiceStateUpdate', async(oldState, newState) => {
    if (oldState?.channelId === newState?.channelId) return;
    if (!oldState?.channelId) {
        try {
            if (!fs.existsSync(path.resolve(`./db/logging/${oldState.guild.id}/VOICEJOIN.enabled`))) return;
            const enabled = fs.readFileSync(path.resolve(`./db/logging/${oldState.guild.id}/VOICEJOIN.enabled`), 'utf8');
            if (enabled == 'true') {
                if (!fs.existsSync(`./db/logging/${oldState.guild.id}/channel.id`)) return;

                const channelID = fs.readFileSync(path.resolve(`./db/logging/${oldState.guild.id}/channel.id`), 'utf8');
                const logChannel = client.channels.cache.get(channelID);

                const embed = new Discord.EmbedBuilder()
                    .setTitle('Voice Channel Joined')
                    .setDescription(`User: ${oldState.member}\nChannel: ${newState.channel.name}`)
                    .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Voice.png')
                    .setColor('Green')
                    .setTimestamp()

                logChannel.send({
                    content: `Voice Channel Joined`,
                    embeds: [embed]
                })
            }
        } catch (err) {
            return;
        }
    } else if (!newState?.channelId) {
        try {
            if (!fs.existsSync(path.resolve(`./db/logging/${oldState.guild.id}/VOICELEAVE.enabled`))) return;
            const enabled = fs.readFileSync(path.resolve(`./db/logging/${oldState.guild.id}/VOICELEAVE.enabled`), 'utf8');
            if (enabled == 'true') {
                if (!fs.existsSync(`./db/logging/${oldState.guild.id}/channel.id`)) return;

                const channelID = fs.readFileSync(path.resolve(`./db/logging/${oldState.guild.id}/channel.id`), 'utf8');
                const logChannel = client.channels.cache.get(channelID);

                const embed = new Discord.EmbedBuilder()
                    .setTitle('Voice Channel Left')
                    .setDescription(`User: ${oldState.member}\nChannel: ${oldState.channel.name}`)
                    .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Voice.png')
                    .setColor('Red')
                    .setTimestamp()

                logChannel.send({
                    content: `Voice Channel Left`,
                    embeds: [embed]
                })
            }
        } catch (err) {
            return;
        }
    }
})