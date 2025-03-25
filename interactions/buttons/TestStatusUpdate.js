const { MessageFlags } = require('discord.js');
const client = require('../../client.js');

client.on('interactionCreate', (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId == 'testPingButtonStatusUpdate') {
            interaction.reply({
                content: `If you see this everything is working fine (i hope)`,
                flags: MessageFlags.Ephemeral
            })
        }
    }   
})