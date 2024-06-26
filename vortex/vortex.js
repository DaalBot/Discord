//const stuff 
const client = require('../client'); // Loads all info needed to login as the bot 
const daalbot = require('../daalbot.js');
const warnSchema = require('../models/warn-schema');
const { EmbedBuilder } = require('discord.js');
function AutomodLog(word, message) {
    const embed = new EmbedBuilder()
        .setTitle('Info')
        .setDescription(`**Message:** ${message.content}\n**Word:** ${word}\n**User:** ${message.author.tag}\n**Channel:** ${message.channel}`)
        .setTimestamp()
        .setColor('#EF3D48')
    daalbot.getChannel('973711816226136095', '974376513891860511').send({
        content: 'Automod blocked a message.',
        embeds: [embed]
    })
}

// Loading commands
require('./commands/featured/command.js');
require('./commands/tests/simjoin.js');
require('./commands/tests/ticket-drop.js');

// Loading events
require('./events/join.js');
require('./events/messageCreate.js');

// Loading private stuff
require('./private/load-priv.js');

// If you want to see this code in action join the vortex discord server https://discord.gg/byBXVJbsYe

client.on("messageCreate", msg => {
    if (msg.guild.id === '973711816226136095') { // Checks if guild id is the same as the vortex server
        const profanity = require('../db/automod/lists.json').profanityDefault; // Loads the profanity list
        if (msg.author.id == '752363621723537598') {
            if (msg.content.includes(':eyes:')) return msg.delete();
        }
        profanity.forEach(word => {
            if (msg.content.toLowerCase().includes(word)) {
                if (msg.channelId === '974533113042599966') return;
                if (msg.member.roles.cache.has('1037796843603644578')) return; 
            msg.delete()
            .then(() => {
                console.log(`Deleted message from ${msg.author.tag} in ${msg.guild.name} for saying ${word}`)
            })
            .catch(() => {
                console.log(`Failed to delete message from ${msg.author.tag} in ${msg.guild.name} for saying ${word}`)
            })
            warnSchema.create({
                userId: msg.author.id,
                staffId: client.user.id,
                guildId: msg.guildId,
                reason: 'Automod: Profanity'
            })
            .then(() => {
                console.log(`Warned ${msg.author.tag} in ${msg.guild.name} for saying ${word}`)
            })
            .catch(() => {
                console.log(`Failed to warn ${msg.author.tag} in ${msg.guild.name} for saying ${word}`)
            })
            msg.channel.send(`Hey <@${msg.author.id}>, please don't use that word!`); // Sends a message to the channel
            AutomodLog(word, msg); // Sends a message to the automod log channel
            }
        })
    } else {
        return // Returns if guild id does not match
    }
})

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.guild.id === '973711816226136095') {
        const profanity = require('../db/automod/lists.json').profanityDefault; // Loads the profanity list
        profanity.forEach(word => {
            if (newMessage.content.toLowerCase().includes(word)) {
                if (newMessage.channelId === '974533113042599966') return;
                if (newMessage.member.roles.cache.has('1037796843603644578')) return; 
            newMessage.delete()
            .then(() => {
                console.log(`Deleted message from ${newMessage.author.tag} in ${newMessage.guild.name} for saying ${word}`)
            })
            .catch(() => {
                console.log(`Failed to delete message from ${newMessage.author.tag} in ${newMessage.guild.name} for saying ${word}`)
            })
            warnSchema.create({
                userId: newMessage.author.id,
                staffId: client.user.id,
                guildId: newMessage.guildId,
                reason: 'Automod: Profanity'
            })
            .then(() => {
                console.log(`Warned ${newMessage.author.tag} in ${newMessage.guild.name} for saying ${word}`)
            })
            .catch(() => {
                console.log(`Failed to warn ${newMessage.author.tag} in ${newMessage.guild.name} for saying ${word}`)
            })
            newMessage.channel.send(`Hey <@${newMessage.author.id}>, please don't use that word!`); // Sends a message to the channel
            AutomodLog(word, newMessage); // Sends a message to the automod log channel
            }
        })
    }
})