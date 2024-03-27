const { ActivityType, ApplicationCommandOptionType } = require('discord.js')
const daalbot = require('../../daalbot.js')

module.exports = {
    name: 'status',
    description: 'Change the status of the bot',
    category: 'Pen',

    slash: true,
    ownerOnly: true,
    testOnly: true,

    options: [
        {
            name: 'status',
            description: 'The new status',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'type',
            description: 'The type of status (piny.tv/ActivityTypes)',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],

    callback: ({ interaction }) => {
        const newActivity = interaction.options.getString('status')
        const type = parseInt(interaction.options.getString('type')) || ActivityType.Custom

        daalbot.client.user.setActivity(newActivity, { type: type })

        interaction.reply(`Successfully changed status to "${newActivity}"`, { ephemeral: true })
    }
}