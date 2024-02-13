const client = require('../../client.js')

module.exports = {
    category: 'Testing',
    description: 'Simulates a join.',
  
    slash: 'both',
    testOnly: true,
  
    callback: ({ interaction }) => {
        client.emit('guildMemberAdd', member)
        
        interaction.reply('Simulated join.')
    },
}