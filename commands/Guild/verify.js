const config = require("../../config.json");
const fs = require('fs');
const daalbot = require('../../daalbot.js');
const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord.js');

function save(GuildId, RoleId) {
    try {
        daalbot.fs.write(`${config.botPath}/db/verify/${GuildId}.role`, `${RoleId}`);
    } catch (err) {
        console.error(err);
    }
}

function autoUpdateSave(GuildId, enabled) {
    try {
        daalbot.fs.write(`${config.botPath}/db/verify/${GuildId}.autoUpdate`, `${enabled}`);
    } catch {
        return 'Error saving auto update setting';
    }
}

const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')

module.exports = {
    category: 'Guild',
    description: 'Creates a verification message in the server',
    guildOnly: true,
    permissions: [
        `${PermissionFlagsBits.ManageRoles}`,
        `${PermissionFlagsBits.ManageChannels}`
    ],
    testOnly: false,
    type: 'SLASH',
    options: [
        {
            name: 'verified_role',
            description: 'The role to give to verified users',
            type: ApplicationCommandOptionType.Role,
            required: true
        },
        {
            name: 'channel',
            description: 'The channel to send the message in',
            type: ApplicationCommandOptionType.Channel,
            required: true
        },
        {
            name: 'auto_update',
            description: 'Automatically adds the recommended permissions to new channels (coming soon)',
            type: ApplicationCommandOptionType.Boolean,
            required: false
        },
        {
            name: 'message-id',
            description: 'If used, the bot will add a button to the message instead of sending a new one',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],

    callback: ({ interaction, client }) => {
        const channel = interaction.options.getChannel('channel')
        const verified_role = interaction.options.getRole('verified_role')
        const roleId = verified_role.id;
        const messageId = interaction.options.getString('message-id');
        const { guild } = interaction

        save(interaction.guild.id, roleId);
        // autoUpdateSave(interaction.guild.id, interaction.options.getBoolean('auto_update'));

        const embed = new EmbedBuilder()
            .setTitle('Verification')
            .setDescription('Click the button below to verify yourself.')
            .setColor(0x3cff00)

        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setLabel('Verify')
            .setCustomId('verify')

        const row = new ActionRowBuilder().addComponents(button)

        if (messageId == null) {
            channel.send({ embeds: [embed], components: [row] })
        } else {
            daalbot.getMessageFromString(messageId, channel).then(message => {
                message.edit({ components: [row] })
            })
        }

        return 'Verified button created!'
    }
}