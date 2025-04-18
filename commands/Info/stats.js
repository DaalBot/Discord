const daalbot = require('../../daalbot.js');
const Discord = require('discord.js');

module.exports = {
    name: 'stats',
    description: 'Shows the stats of the bot',
    category: 'Info',

    slash: true,
    // testOnly: true, //guild testing

    callback: (interaction) => {
        const client = daalbot.client;

        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;
        const channels = client.channels.cache.size;
        const uptime = client.uptime;
        const ping = client.ws.ping;

        const embed = new Discord.EmbedBuilder()
            .setTitle('DaalBot Stats')
            .setColor('#9B5AB4')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: 'Guilds',
                    value: `DaalBot is in ${guilds} servers`,
                    inline: true
                },
                {
                    name: 'Users',
                    value: `DaalBot is watching over ${users} users`,
                    inline: true
                },
                {
                    name: 'Channels',
                    value: `DaalBot is watching ${channels} channels`,
                    inline: true
                },
                {
                    name: 'Uptime',
                    value: `DaalBot has been online for ${Math.floor(uptime / 1000 / 60 / 60)} hours, ${Math.floor(uptime / 1000 / 60) % 60} minutes, ${Math.floor(uptime / 1000) % 60} seconds`,
                    inline: true
                },
                {
                    name: 'Ping',
                    value: `DaalBots current ping is ${ping}ms`,
                    inline: true
                },
                // {
                //     name: 'Shards',
                //     value: `DaalBot is running on ${client?.shard?.count ?? '0'} shards`,
                //     inline: true
                // },
                // {
                //     name: 'Shard ID',
                //     value: `This shard is shard ${client?.shard?.ids[0] ?? '0'}`,
                //     inline: true
                // }
            )
            .setTimestamp()

            return {
                custom: true,
                embeds: [embed],
                flags: Discord.MessageFlags.Ephemeral
            }
    }
}