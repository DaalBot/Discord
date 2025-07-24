const client = require('../../client.js');
const config = require('../../config.json');
const fs = require('fs');
const Discord = require('discord.js');
const path = require('path');
const daalbot = require('../../daalbot.js');

client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (oldChannel.type === Discord.ChannelType.DM || newChannel.type === Discord.ChannelType.DM) return;

    // Check if that all that has changed is position
    let changed = false;

    const channelProps = [
        'name',
        'type',
        'topic',
        'rateLimitPerUser',
        'nsfw',
        'permissionOverwrites',
    ]

    for (let i = 0; i < channelProps.length; i++) {
        if (oldChannel[channelProps[i]] !== newChannel[channelProps[i]]) {
            changed = true;
            break;
        }
    }

    if (!changed) return;

    const guildId = oldChannel.guild.id;
    const cooldownPath = `./db/logging/${guildId}/channelUpdate.cooldown`;
    const enabledPath = `./db/logging/${oldChannel.guild.id}/CHANNELUPDATE.enabled`;
    const excludePath = `./db/logging/${oldChannel.guild.id}/CHANNELUPDATE.exclude`;
    const channelIdPath = `./db/logging/${oldChannel.guild.id}/channel.id`;

    if (fs.existsSync(path.resolve(cooldownPath))) {
        const text = daalbot.fs.read(path.resolve(cooldownPath), 'utf8');
        if (text === 'true') return;
        fs.writeFileSync(path.resolve(cooldownPath), 'true');
        setTimeout(() => fs.writeFileSync(path.resolve(cooldownPath), 'false'), 1000);
    } else {
        if (!fs.existsSync(path.resolve(`./db/logging/${guildId}`))) fs.mkdirSync(path.resolve(`./db/logging/${guildId}`), { recursive: true });
        fs.appendFileSync(path.resolve(cooldownPath), 'true');
        setTimeout(() => fs.writeFileSync(path.resolve(cooldownPath), 'false'), 1000);
    }

    const enabled = daalbot.fs.read(path.resolve(enabledPath), 'utf8');
    if (enabled !== 'true') return;

    if (fs.existsSync(path.resolve(excludePath))) {
        const excluded = daalbot.fs.read(path.resolve(excludePath), 'utf8').split('\n');
        if (excluded.includes(oldChannel.id)) return;
    }

    if (!fs.existsSync(path.resolve(channelIdPath))) return;

    const channelID = daalbot.fs.read(path.resolve(channelIdPath), 'utf8');
    const logChannel = client.channels.cache.get(channelID);

    const oldRawData = JSON.stringify(oldChannel, null, 4);
    const newRawData = JSON.stringify(newChannel, null, 4);

    const rawPaste = await daalbot.api.pasteapi.createPaste(`--- OLD ---
${oldRawData}

--- NEW ---
${newRawData}`, 'Channel Update - JSON');

    const embed = new Discord.EmbedBuilder()
        .setTitle('Channel Updated')
        .setDescription(`
            **Before**
            Name: ${oldChannel.name}
            Type: ${oldChannel.type}
            Topic: ${oldChannel.topic}
            Position: ${oldChannel.rawPosition}
            Category: ${oldChannel.parent.name ? oldChannel.parent.name : 'None'} / ${oldChannel.parent.id ? oldChannel.parent.id : 'None'}
            
            **After**
            Name: ${newChannel.name}
            Type: ${newChannel.type}
            Topic: ${newChannel.topic}
            Position: ${newChannel.rawPosition}
            Category: ${newChannel.parent.name ? newChannel.parent.name : 'None'} / ${newChannel.parent.id ? newChannel.parent.id : 'None'}

            [Raw Data](${rawPaste})
        `)
        .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Channel.png')
        .setColor('#FFE467')
        .setTimestamp();

    logChannel.send({
        content: `Channel Updated`,
        embeds: [embed],
    });
});
