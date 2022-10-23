const client = require('../../client.js');
const config = require('../../config.json');
const fs = require('fs');
const Discord = require('discord.js');
const path = require('path');

client.on('channelDelete', async(channel) => {
    if (channel.type === 'DM') return;
    try {
    console.log(`Channel Deleted: ${channel.name} (${channel.id})`);
    const enabled = fs.readFileSync(path.resolve(`./db/logging/${channel.guild.id}/CHANNELDELETE.enabled`), 'utf8');
    if (enabled == 'true') {
        if (!fs.existsSync(`./db/logging/${channel.guild.id}/channel.id`)) return;

        const channelID = fs.readFileSync(path.resolve(`./db/logging/${channel.guild.id}/channel.id`), 'utf8');
        const logChannel = client.channels.cache.get(channelID);

        const embed = new Discord.MessageEmbed()
            .setTitle('Channel Deleted')
            .setDescription(`Channel: ${channel.name}\nID: ${channel.id}\nType: ${channel.type}`)
            .setThumbnail('https://pinymedia.web.app/hashtag.png')
            .setColor('RED')
            .setTimestamp()

        logChannel.send({
            content: `Channel Deleted`,
            embeds: [embed]
        })
    }
} catch (err) {
    return;
}
})