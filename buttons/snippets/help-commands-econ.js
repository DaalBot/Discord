const { ButtonInteraction } = require("discord.js");
const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');
const overrides = require('../data/help-commands.overrides.json')

/**
 * @param {ButtonInteraction} interaction
*/
module.exports = (interaction) => {
    const category = interaction.component.label;

    const embed = new DJS.EmbedBuilder()
        .setTitle(`${category} Commands`)
        .setDescription('Below is a list of commands for the selected category')

    const files = fs.readdirSync(path.resolve(`./commands/${overrides.find(o => o.overrideName === category)?.name ?? category}`));

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const command = require(`../../commands/${overrides.find(o => o.overrideName === category)?.name ?? category}/${file}`);
        if (command.ownerOnly) continue;
        if (command.testOnly) continue;

        embed.addFields([
            {
                name: `/${command.name}`,
                value: `${command.description}`,
                inline: true
            }
        ]);
    }

    interaction.reply({ embeds: [embed], ephemeral: true })
}