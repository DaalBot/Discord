const { Client, IntentsBitField, Partials } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.DirectMessages
    ],

    partials: [
        Partials.Channel
    ]
})

module.exports = client;