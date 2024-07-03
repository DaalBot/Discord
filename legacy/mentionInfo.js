const client = require('../client');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
const config = require('../config.json')

client.on('messageCreate', msg => {
  const iEmbed = new EmbedBuilder()
  .setTitle('Hello!')
  .setDescription(`My default prefix is \`${config.WOKCommands.prefix}\` though it may change depending on what server your in\n\n**LINKS:**\nWebsite: https://daalbot.xyz/\nInvite: https://daalbot.xyz/Invite\nCommands: https://daalbot.xyz/Commands`)
  .setTimestamp(msg.createdTimestamp)
  .setImage('https://media.piny.dev/Daalbot.png');

    if (msg.author.bot) return;
    
    if (msg.content.toLowerCase() === '<@1016086353085222993>') {
      msg.reply({
        content: 'Thanks for pinging me! Here is some info:',
        embeds: [iEmbed]
      })
    }
})