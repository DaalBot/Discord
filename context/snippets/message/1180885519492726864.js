// Get message info
const { EmbedBuilder, MessageContextMenuCommandInteraction } = require('discord.js');
const daalbot = require('../../../daalbot');

/**
 * @param {MessageContextMenuCommandInteraction} interaction
*/
module.exports = async (interaction) => {
    const message = interaction.targetMessage;

    const embed = new EmbedBuilder()
        .setTitle('Message Info')
        .addFields([
            {
                name: `Author`,
                value: `${message.author.username} (${message.author.id})`,
                inline: true
            },
            {
                name: `Channel`,
                value: `${message.channel.name} (${message.channel.id})`,
                inline: true
            },
            {
                name: `ID`,
                value: `${message.id}`,
                inline: false
            },
            {
                name: `Raw`,
                value: `[Click Here](${await daalbot.api.pasteapi.createPaste(JSON.stringify(message, null, 4))})`,
            }
        ])

    await interaction.reply({
        content: `${JSON.stringify(message, null, 4)}`,
        embeds: [embed]
    });
}