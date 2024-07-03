const { PermissionFlagsBits, ApplicationCommandOptionType, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

    options: [
        // {
        //     name: 'channels',
        //     description: 'Configure the channels for the bot',
        //     type: ApplicationCommandOptionType.SubcommandGroup,
        //     options: [
        //         {
        //             name: 'levels',
        //             description: 'Configure the channel for level up messages',
        //             type: ApplicationCommandOptionType.Subcommand,
        //             options: [
        //                 {
        //                     name: 'channel',
        //                     description: 'The channel to send level up messages to',
        //                     type: ApplicationCommandOptionType.Channel,
        //                     channel_types: [
        //                         ChannelType.GuildText
        //                     ],
        //                     required: true
        //                 }
        //             ]
        //         },
        //         {
        //             name: 'logs',
        //             description: 'Set the channel for the bot to send alerts to',
        //             type: ApplicationCommandOptionType.Subcommand,
        //             options: [
        //                 {
        //                     name: 'channel',
        //                     description: 'The channel to send alerts to',
        //                     type: ApplicationCommandOptionType.Channel,
        //                     channel_types: [
        //                         ChannelType.GuildText
        //                     ],
        //                     required: true
        //                 }
        //             ]
        //         }
        //     ]
        // }
    ],

    

    callback: async ({ interaction }) => {
        const options = [
            {
                label: 'Channels',
                value: 'channels',
                emoji: '#️⃣'
            },
            // { // No clue what i meant by this so disable for now
            //     label: 'Permissions',
            //     value: 'permissions',
            //     emoji: '🔒'
            // }
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
            ephemeral: true
        })

        // const subCommandGroup = interaction.options.getSubcommandGroup();
        // const subCommand = interaction.options.getSubcommand();

        // if (subCommandGroup === 'channels') {
        //     const channel = interaction.options.getChannel('channel');

        //     if (subCommand === 'levels') {
        //         // Set the channel for level up messages
        //         await daalbot.db.setChannel(interaction.guild.id, 'levels', channel.id);

        //         // Send a confirmation message
        //         await interaction.reply(`Level up messages will now be sent to ${channel}`);
        //     } else if (subCommand === 'logs') {
        //         // Set the channel for alerts
        //         await daalbot.db.setChannel(interaction.guild.id, 'alerts', channel.id);

        //         // Send a confirmation message
        //         await interaction.reply(`Alerts for daalbot will now be sent to ${channel}`);
        //     }
        // }
    }
}