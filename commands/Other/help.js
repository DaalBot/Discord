const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Bring up the help panel',
    category: 'Other',
    testOnly: false,
    ownerOnly: false,
    type: 'SLASH',

    callback: async ({ interaction }) => {
        const embed = new EmbedBuilder()
            .setTitle('Help')
            .setDescription('Please select a category')

        const row = new ActionRowBuilder()

        const commandsButton = new ButtonBuilder()
            .setCustomId('handler_help-commands')
            .setLabel('Commands')
            .setEmoji('1222659759908323520')
            .setStyle(ButtonStyle.Secondary)

        row.addComponents([commandsButton])

        interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral
        })
    }
}