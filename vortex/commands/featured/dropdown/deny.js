const client = require('../../../../client.js');
const { EmbedBuilder } = require('discord.js');

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu()) {
       if (interaction.customId === 'vortex-featured-deny-dropdown') {
            const member = interaction.guild.members.cache.get(interaction.message.embeds[0].title);
            const denyReason = interaction.values[0];

            const denyEmbed = new EmbedBuilder()
            .setTitle('Featured Creator Application Denied')
            .setDescription(`You should not be seeing this as it is meant to be switched to the reason before you see it please DM <@900126154881646634> about this`)
            .setAuthor({
                name: 'Vortex creative',
                iconURL: 'https://media.piny.dev/VortexIcon.png'
            })
            .setTimestamp()
            .setColor('#EF3D48');

            if (denyReason === 'invalid-map-code') {
                denyEmbed.setDescription('Your application has been denied for the following reason: Invalid Map Code\n\nPlease make sure you have the correct map code and try again.');
            } else if (denyReason === 'invalid-sac-code') {
                denyEmbed.setDescription('Your application has been denied for the following reason: Invalid username\n\nPlease make sure you have the correct username and try again.');
            } else if (denyReason === 'not-a-featured-creator') {
                denyEmbed.setDescription('Your application has been denied for the following reason: Not a featured creator');
            } else if (denyReason === 'other') {
                denyEmbed.setDescription('Your application has been denied for the following reason: Other');
            }

            member?.send({ embeds: [denyEmbed] })
                .then(() => {
                    console.log(`Sent message to ${member?.user.tag}`)
                })
                .catch(() => {
                    console.log(`Failed to send message to ${member?.user.tag}`)
                })

            interaction.reply({ content: 'Successfully denied application!', ephemeral: true });
       }
   }
})