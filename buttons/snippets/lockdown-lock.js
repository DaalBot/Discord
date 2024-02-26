const { ButtonInteraction } = require("discord.js");
const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * @param {ButtonInteraction} interaction
*/
module.exports = (interaction) => {
    const guild = interaction.guild;
    const lockeddown = fs.existsSync(path.resolve(`./db/lockdown/${guild.id}/current.json`));

    fs.mkdirSync(path.resolve(`./db/lockdown/${guild.id}`), { recursive: true }); // Create the directory if it doesn't exist

    if (lockeddown) {
        return interaction.reply({
            content: 'The server is already locked down.',
            components: [
                new DJS.ActionRowBuilder()
                    .addComponents([
                        new DJS.ButtonBuilder()
                            .setCustomId('handler_lockdown-unlock')
                            .setLabel('Unlock Server')
                            .setStyle(DJS.ButtonStyle.Success)
                    ])
            ],
            ephemeral: true
        })
    }

    const modal = new DJS.ModalBuilder()
        .setTitle('Lockdown Server')
        .setCustomId('handler_lockdown-start')
        .addComponents([
            new DJS.ActionRowBuilder()
                .addComponents([
                    new DJS.TextInputBuilder()
                        .setCustomId('lockdown-reason')
                        .setLabel('Reason')
                        .setPlaceholder('Enter the reason for the lockdown')
                        .setStyle(DJS.TextInputStyle.Paragraph)
                        .setRequired(true)
                ])
        ])

    interaction.showModal(modal);
}