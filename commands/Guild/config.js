const { PermissionFlagsBits, ApplicationCommandOptionType, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const daalbot = require('../../daalbot.js');

module.exports = {
    name: 'config',
    description: 'Configure the bot for your server',
    category: 'Guild',

    guildOnly: true,
    testOnly: false,
    
    slash: true,
    permissions: [
        `${PermissionFlagsBits.ManageGuild}`
    ],

    options: [],

    callback: async ({ interaction }) => {
        const options = [
            {
                label: 'Channels',
                value: 'channels',
                emoji: '#️⃣'
            }
        ]

        const admins = daalbot.config().WOKCommands.ownerIds;

        if (admins.includes(interaction.user.id)) {
            options.push({
                label: 'Global',
                value: 'admin_api',
                emoji: '🌐'
            })
        }

        const row = new ActionRowBuilder()

        for (i = 0; i < options.length; i++) {
            row.addComponents([
                new ButtonBuilder()
                    .setCustomId(`handler_config-${options[i].value}`)
                    .setLabel(options[i].label)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(options[i].emoji)
            ])
        }

        await interaction.reply({
            content: 'Please select a category to configure',
            components: [row],
            flags: MessageFlags.Ephemeral
        })
    }
}