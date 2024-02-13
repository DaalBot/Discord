const { PermissionFlagsBits, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: 'customcommand',
    description: 'Modify the custom commands for your server.',
    category: 'Guild',

    options: [
        {
            name: 'create',
            description: 'Create a custom command.',
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],

    permissions: [
        `${PermissionFlagsBits.Administrator}`
    ],
    testOnly: true,
    guildOnly: true,
    slash: true,

    callback: () => {
        console.log('Custom command command executed.');
    }
}