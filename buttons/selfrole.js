const client = require('../client.js');
const { MessageFlags } = require('discord.js');

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) {
            try {
                if (!interaction.customId.startsWith('selfrole-')) return;

                const role = interaction.customId.split('-')[1];
                const member = interaction.member;

                if (member.roles.cache.has(role)) {
                    member.roles.remove(role);
                    interaction.reply({ content: `You no longer have the <@&${role}> role`, flags: MessageFlags.Ephemeral });
                } else {
                    member.roles.add(role);
                    interaction.reply({ content: `You now have the <@&${role}> role`, flags: MessageFlags.Ephemeral });
                }
            } catch(e) {
                console.error(e)
                interaction.reply({ content: 'Something went wrong and we were unable to process your request.', flags: MessageFlags.Ephemeral });
            }
        }
    } catch {
        console.error('Tickets > Error encountered while dealing with a request.');
        return interaction.reply({ content: 'An error occurred.', flags: MessageFlags.Ephemeral });
    }
})