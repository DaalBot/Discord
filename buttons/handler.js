const client = require('../client.js');
const fs = require('fs');
const DJS = require('discord.js');
const { MessageFlags } = require('discord.js');

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (!customId.startsWith('handler_')) return;

    const snippet = customId.replace('handler_', '')

    // if (fs.existsSync(`./snippets/${snippet}.js`)) {
        try {
            require(`./snippets/${snippet}.js`)(interaction);
        } catch(e) {
            console.error(e)
            const errorEmbed = new DJS.EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription('Something went wrong and the button failed to execute please try again later.')
                .setTimestamp();

            interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
    // } else {
    //     const errorEmbed = new DJS.EmbedBuilder()
    //         .setColor('Red')
    //         .setTitle('Unknown Modal')
    //         .setDescription('It seems like the modal you are trying to execute does not exist.')
    //         .setTimestamp();

    //     interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    // }
})