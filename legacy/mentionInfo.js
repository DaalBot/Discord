const client = require('../client');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
const config = require('../config.json')

client.on('messageCreate', msg => {
  const iEmbed = new EmbedBuilder()
  .setTitle('Hello!')
  .setDescription(`I'm DaalBot, a multi-purpose discord designed to be infinitely customisable. There's a lot of things I can do but I'm not going to list them all here. If you want a list of features please visit https://daalbot.xyz`)
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