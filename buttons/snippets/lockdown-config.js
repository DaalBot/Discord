const { ButtonInteraction } = require("discord.js");
const DJS = require('discord.js');

const options = [
    'New users',
    'Bot adding',
    'Excluded roles',
    'Excluded users'
]

/**
 * @param {ButtonInteraction} interaction 
*/
module.exports = (interaction) => {
    const embed = new DJS.EmbedBuilder();
    const guild = interaction.guild;
    
    embed.setTitle('Lockdown Configuration');
    embed.setDescription(`Please select an option to configure the lockdown settings.`);
    
    const row = new DJS.ActionRowBuilder();

    const dropdown = new DJS.StringSelectMenuBuilder()
        .setCustomId('handler_lockdown-config')
        .setPlaceholder('Select an option')
        .setMinValues(1)
        .setMaxValues(1);

    dropdown.addOptions(options.map(option => {
        return {
            label: option,
            value: option.toLowerCase().replace(' ', '_')
        }
    }));

    row.addComponents([dropdown]);

    interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
}