//const stuff
const client = require('./client.js'); const config = require('./config.json'); const DJS = require('discord.js')
const fs = require('fs')

client.on('rateLimit', () => {
  console.warn('Info > Client rate limited')
});

client.on('guildCreate', guild => {
  const embed = new DJS.EmbedBuilder()
    .setTitle('Bot added to server')
    .setDescription(`Bot added to \`${guild.name}\` (${guild.id}) with ${guild.memberCount} members`)
    .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Guild.png')
    .setTimestamp()
    .setFooter({
      text: `Now in ${client.guilds.cache.size} servers`, iconURL: client.user.avatarURL()
    })
    .setColor('#57F28D');

  client.channels.cache.find(channel => channel.id === config.Logchannel).send({
    embeds: [embed]
  });
})

client.on('guildDelete', guild => {
  const embed = new DJS.EmbedBuilder()
    .setTitle('Bot removed from server')
    .setDescription(`Bot removed from \`${guild.name}\` (${guild.id}) with ${guild.memberCount} members`)
    .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Guild.png')
    .setTimestamp()
    .setFooter({
      text: `Now in ${client.guilds.cache.size} servers`, iconURL: client.user.avatarURL()
    })
    .setColor('#EF3D48');

  client.channels.cache.find(channel => channel.id === config.Logchannel).send({
    embeds: [embed]
  });
})

// Stuff i guess (i just copied this from the discord.js server)
client.on('warn', console.warn)

if (config.debug) {
  client.on('debug', data => {
    fs.appendFileSync(`./logs/debug.log`, `${data}\n`)
  })
}