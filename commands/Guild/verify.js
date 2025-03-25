const config = require("../../config.json");
const fs = require('fs');
const daalbot = require('../../daalbot.js');
const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, ChannelType, MessageFlags } = require('discord.js');

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
        // {
        //     name: 'channel',
        //     description: 'The channel to send the message in',
        //     type: ApplicationCommandOptionType.Channel,
        //     required: true
        // },
        // {
        //     name: 'auto_update',
        //     description: 'Automatically adds the recommended permissions to new channels (coming soon)',
        //     type: ApplicationCommandOptionType.Boolean,
        //     required: false
        // },
        // {
        //     name: 'message-id',
        //     description: 'If used, the bot will add a button to the message instead of sending a new one',
        //     type: ApplicationCommandOptionType.String,
        //     required: false
        // }
    ],

    /**
     * @param {{ interaction: ChatInputCommandInteraction }} param0
     */
    callback: async({ interaction }) => {
        interaction.reply({
            content: `Please send a message link to a message you want to become the verification message. (Expires <t:${await daalbot.timestamps.getFutureDiscordTimestamp(60 * 1000)}:R>)`,
            flags: MessageFlags.Ephemeral,
        })

        const filter = m => (m.author.id === interaction.user.id);

        try {
            const collector = await interaction.channel.awaitMessages({ filter, time: 60 * 1000, max: 1, errors: ['time'] });
            
            const message = collector.first();
            message.delete();

            const targetMessage = await daalbot.getMessageFromString(message.content, undefined);

            const row = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setLabel('Verify')
                    .setCustomId('verify')
            ]);

            targetMessage.edit({ components: [row] });

            interaction.editReply({
                content: `The verification button has been added to the message! Would you like us to proactively update the permissions of all channels? ("yes" or "no" [Defaulting to "no" <t:${await daalbot.timestamps.getFutureDiscordTimestamp(60 * 1000)}:R>])`
            });
            try {
                const AUCollector = await interaction.channel.awaitMessages({ filter, time: 60 * 1000, max: 1, errors: ['time'] });
                const AUMessage = AUCollector.first();
                AUMessage.delete();

                autoUpdateSave(interaction.guild.id, AUMessage.content.toLowerCase() === 'yes');

                interaction.editReply('Permissions will be updated proactively.');
            } catch (err) {
                console.error(err); // DEBUG
                interaction.editReply('You took too long to send a response. We will not automatically update permissions of channels.');
                autoUpdateSave(interaction.guild.id, false);
            }
        } catch (e) {
            console.error(e); // DEBUG
            return interaction.editReply('You took too long to send a response or something went wrong. Please try again.');
        }




        // const channel = interaction.options.getChannel('channel')
        // const verified_role = interaction.options.getRole('verified_role')
        // const roleId = verified_role.id;
        // const messageId = interaction.options.getString('message-id');
        // const { guild } = interaction

        // save(interaction.guild.id, roleId);
        // // autoUpdateSave(interaction.guild.id, interaction.options.getBoolean('auto_update'));

        // const embed = new EmbedBuilder()
        //     .setTitle('Verification')
        //     .setDescription('Click the button below to verify yourself.')
        //     .setColor(0x3cff00)

        // const button = new ButtonBuilder()
        //     .setStyle(ButtonStyle.Success)
        //     .setLabel('Verify')
        //     .setCustomId('verify')

        // const row = new ActionRowBuilder().addComponents(button)

        // if (messageId == null) {
        //     channel.send({ embeds: [embed], components: [row] })
        // } else {
        //     daalbot.getMessageFromString(messageId, channel).then(message => {
        //         message.edit({ components: [row] })
        //     })
        // }

        // return 'Verified button created!'
    }
}