const client = require('../../client.js');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const daalbot = require('../../daalbot.js');

client.on('roleCreate', async (role) => {
    try {
        const enabled = daalbot.fs.read(path.resolve(`./db/logging/${role.guild.id}/ROLECREATE.enabled`), 'utf8');
        if (enabled == 'true') {
            if (!fs.existsSync(`./db/logging/${role.guild.id}/channel.id`)) return;

            const channelID = daalbot.fs.read(path.resolve(`./db/logging/${role.guild.id}/channel.id`), 'utf8');
            const logChannel = client.channels.cache.get(channelID);

            const embed = new EmbedBuilder()
                .setTitle('Role Created')
                .setDescription(`Role: ${role.name}\nID: ${role.id}`)
                .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Role.png')
                .setColor('#57F28D')
                .setTimestamp()

            logChannel.send({
                content: `Role Created`,
                embeds: [embed]
            })
        }
    } catch (err) {
        return;
    }
});