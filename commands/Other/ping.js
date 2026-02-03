const { ChatInputCommandInteraction } = require('discord.js');
module.exports = {
    category: 'Other',
    description: 'Replies with pong',
  
    slash: 'both',
    testOnly: false,
  
    /**
     * @param {ChatInputCommandInteraction} interaction
     */
    callback: ({interaction}) => {
        return 'Pong!'
    },
}