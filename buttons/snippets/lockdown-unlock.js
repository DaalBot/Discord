const { ButtonInteraction } = require("discord.js");
const fs = require('fs');
const path = require('path');
const daalbot = require('../../daalbot.js');

/**
 * @param {ButtonInteraction} interaction
*/
module.exports = async(interaction) => {
    const guild = interaction.guild;

    const lockeddown = fs.existsSync(path.resolve(`./db/lockdown/${guild.id}/current.json`));

    if (!lockeddown) return interaction.reply({ content: 'The server is not currently locked down.', ephemeral: true });

    const currentLockdown = JSON.parse(fs.readFileSync(path.resolve(`./db/lockdown/${guild.id}/current.json`), 'utf-8'));

    if (currentLockdown.isolation) {
        const isolationChannel = guild.channels.cache.get(currentLockdown.isolation);
        await isolationChannel.delete();

        const isolationRole = guild.roles.cache.get(currentLockdown.isolationRole);
        await isolationRole.delete();
    }

    await guild.roles.cache.get(currentLockdown.role).delete();

    fs.rmSync(path.resolve(`./db/lockdown/${guild.id}/current.json`));

    interaction.reply({ content: 'The server has been unlocked.', ephemeral: true });
}