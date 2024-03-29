const { ApplicationCommandOptionType } = require('discord.js')
const config = require('../../config.json')
module.exports = {
    category: 'Pen',
    description: 'penlog',
  
    slash: true,
    testOnly: true,
    ownerOnly: true,

    options: [
        {
            name: 'text',
            description: 'the text to log',
            type: ApplicationCommandOptionType.String,
            required: true 
        }
    ],
  
    callback: ({ client, interaction }) => {
        function botLog(text) {
            client.channels.cache.find(channel => channel.id === config.Logchannel).send(text)
            console.log(text)
        }
        const text = interaction.options.getString('text')
        const sendText = text.replace(/<nl>/g, "\n");
        botLog(sendText)
        return `Logged:\n${sendText}`
        
        
    },
  }