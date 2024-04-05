const { ButtonInteraction } = require("discord.js");
const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * @param {ButtonInteraction} interaction
*/
module.exports = (interaction) => {
    const embed = new DJS.EmbedBuilder()
        .setTitle('Commands')
        .setDescription('Please select a category for the commands')
        .setThumbnail('https://cdn.discordapp.com/emojis/1222659759908323520.png?v=1') // TODO: Change the URL to a higher quality export from figma
    
    const row = new DJS.ActionRowBuilder()
    const row2 = new DJS.ActionRowBuilder()
    const row3 = new DJS.ActionRowBuilder()

    const categories = fs.readdirSync(path.resolve(`./commands/`));

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        if (category === 'Help' || category === 'Pen' || category === 'Testing') continue;
        const mappings = [
            {
                name: 'Bot',
                emoji: '🤖',
            },
            {
                name: 'Games',
                emoji: '🎮',
            },
            {
                name: 'Guild',
                overrideName: 'Server',
                emoji: '🏰',
            },
            {
                name: 'Info',
                emoji: 'ℹ️',
            },
            {
                name: 'Message',
                emoji: '1117915334855360532'
            },
            {
                name: 'Moderation',
                emoji: '🔨',
            },
            {
                name: 'NonWOK',
                overrideName: 'Unknown',
                emoji: '❓',
            },
            {
                name: 'Other',
                emoji: '🔗',
            },
            {
                name: 'Social',
                emoji: '👥',
            },
            {
                name: 'Utility',
                emoji: '🔧',
            },
            {
                name: 'XP',
                emoji: '📈',
            }
        ];

        const button = new DJS.ButtonBuilder()
            .setCustomId(`handler_help-commands-${category.toLowerCase()}`)
            .setLabel(mappings.find(m => m.name === category)?.overrideName ?? category)
            .setEmoji(mappings.find(m => m.name === category)?.emoji ?? '❓')
            .setStyle(DJS.ButtonStyle.Primary);
        
        if (i <= 4) {
            row.addComponents([button]);
        } else if (i > 4 && i <= 9) {
            row2.addComponents([button]);
        } else {
            row3.addComponents([button]);
        }
    }

    interaction.reply({
        embeds: [embed],
        components: [
            row,
            row2,
            row3
        ],
        ephemeral: true
    })
}