const fs = require('fs');
const config = require("../../config.json");
const client = require('../../client.js');
const { MessageFlags } = require('discord.js');
const daalbot = require('../../daalbot.js');

function read(GuildId) {
    try {
        return daalbot.fs.read(`${config.botPath}/db/verify/${GuildId}.role`, 'utf8');
    } catch (err) {
        console.log(err);
    }
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return

    const { customId } = interaction
    const verified_role = read(interaction.guild.id);

    if (customId === 'verify') {
        const member = interaction.guild.members.cache.get(interaction.user.id)
        // verified_roles.forEach(verified_role => {
            const role = interaction.guild.roles.cache.get(verified_role);

            member.roles.add(role)
            .then(() => {
            })
            .catch((err) => {
                console.log(`Failed to add role to ${member.user.tag}`);
            })
        // })

        interaction.reply({ content: 'You have been verified!', flags: MessageFlags.Ephemeral })
    }
})