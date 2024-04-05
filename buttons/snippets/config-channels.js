const DJS = require('discord.js');
const daalbot = require('../../daalbot.js');

/**
 * @param {DJS.ButtonInteraction} interaction
*/
module.exports = (interaction) => {
    const menu = [
        {
            label: 'Levels',
            description: 'Configure where level up messages are sent.',
            emoji: '📈',
        },
        {
            label: 'Alerts',
            description: 'Configure where alerts from DaalBot are sent.',
            emoji: '🚨',
        }
    ]

    const row = new DJS.ActionRowBuilder()

    const dropdown = new DJS.StringSelectMenuBuilder()
        .setCustomId('handler_config-channels')
        .setPlaceholder('Select a category to configure')
        .setMinValues(1)
        .setMaxValues(1)

    for (let i = 0; i < menu.length; i++) {
        dropdown.addOptions([
            {
                label: menu[i].label,
                description: menu[i].description,
                value: `init_${menu[i].label.toLowerCase()}`,
                emoji: menu[i].emoji
            }
        ])
    }

    row.addComponents([dropdown])

    interaction.reply({
        content: 'Please select what kind of channel you want to configure.',
        components: [row],
        ephemeral: true
    })
}