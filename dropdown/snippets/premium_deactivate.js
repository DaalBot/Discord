const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');
const daalbot = require('../../daalbot.js');
const client = require('../../client.js');

/**
 * @param {DJS.StringSelectMenuInteraction<DJS.CacheType>} interaction 
*/
module.exports = async (interaction) => {
    const guild = client.guilds.cache.get(interaction.values[0]);

    /**
     * @type {number}
    */
    const activation = daalbot.premium.deactivateServer(guild.id, interaction.user.id);

    switch (activation) {
        case 1:
            return interaction.reply({ content: 'You do not have DaalBot premium!', flags: DJS.MessageFlags.Ephemeral });
        case 2:
            return interaction.reply({ content: 'Server is not activated (How did you do this there was a check to prevent you getting to this stage)', flags: DJS.MessageFlags.Ephemeral });
        case 3:
            return interaction.reply({ content: 'You did not activate this server.', flags: DJS.MessageFlags.Ephemeral });
        case 0:
            return interaction.reply({ content: 'Server has been deactivated.', flags: DJS.MessageFlags.Ephemeral });
    }
}