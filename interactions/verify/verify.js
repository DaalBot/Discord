const fs = require('fs');
const config = require("../../config.json");
const client = require('../../client.js');

function read(GuildId) {
    try {
        return fs.readFileSync(`${config.botPath}/db/verify/${GuildId}.role`, 'utf8');
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
                console.log(`Added role to ${member.user.tag}`);
            })
            .catch((err) => {
                console.log(`Failed to add role to ${member.user.tag}`);
            })
        // })

        interaction.reply({ content: 'You have been verified!', ephemeral: true })
    }
})