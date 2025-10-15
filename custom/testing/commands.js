const { MessageFlags } = require('discord.js');
const client = require('../../client');

client.on('interactionCreate', async(interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.guildId !== '1017715574639431680') return;

    if (interaction.commandName == 'simjoin') {
        const member = interaction.member;
        
        client.emit('guildMemberAdd', member);
        await interaction.reply({ content: `Simulated join for ${member.user.username} (${member.id})`, flags: MessageFlags.Ephemeral });
    }
});