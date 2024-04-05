const DJS = require('discord.js');
const daalbot = require('../../daalbot.js');

/**
 * @param {DJS.StringSelectMenuInteraction} interaction
*/
module.exports = async(interaction) => {
    const value = interaction.values[0];

    if (value.startsWith('init_')) { // This is the initial dropdown
        const category = value.split('_')[1];

        const currentValue = await daalbot.db.getChannel(interaction.guild.id, category);
        const channels = interaction.guild.channels.cache.filter(channel => channel.type === DJS.ChannelType.GuildText && channel.permissionsFor(interaction.guild.members.me).has(DJS.PermissionsBitField.Flags.SendMessages) /** && channel.id !== currentValue */);

        const row = new DJS.ActionRowBuilder()
        const dropdown = new DJS.StringSelectMenuBuilder()
            .setCustomId(`handler_config-channels`)
            .setPlaceholder('Select a channel.')
            .setMinValues(1)
            .setMaxValues(1)

        let i = 0;
        channels.forEach(async(channel) => {
            if (i < 25) {
                try {
                    dropdown.addOptions([
                        {
                            label: channel.name,
                            value: `channel_${channel.id};${category}`,
                            default: channel.id === currentValue
                        }
                    ])
                } catch (e) {
                    console.error('Config > Something went wrong while adding a channel to the dropdown.');
                }
            }

            i++;
        })

        row.addComponents([dropdown])
        if (channels.size > 25) {
            interaction.reply({
                content: `There are too many channels to display in a dropdown. Please send a message with the channel you want to configure. eg. "<#${interaction.guild.channels.cache.random().id}>"`,
                components: [],
                ephemeral: true
            })

            const collector = await interaction.channel.awaitMessages({
                filter: m => m.author.id === interaction.user.id,
                max: 1,
                time: 60_000
            })

            if (collector.size === 0) 
                return interaction.editReply({
                    content: `You took too long to respond. Please try again.`,
                    components: [],
                    ephemeral: true
                })
            
            const channel = collector.first().mentions.channels.first();
            if (!channel) 
                return interaction.editReply({
                    content: `You didn't mention a channel. Please try again.`,
                    components: [],
                    ephemeral: true
                })
            
            daalbot.db.setChannel(interaction.guild.id, category, channel.id);

            await interaction.editReply({
                content: `The channel has been set to <#${channel.id}>.`,
                components: [],
                ephemeral: true
            })

            return await collector.first().delete();
        } else {
            interaction.reply({
                content: `Please select a channel. (If you don't see the channel you're looking for, make sure I can send messages in that channel and it's a text channel.)`,
                components: [row],
                ephemeral: true
            })
        }
    } else {
        const data = value.split('_')[1].split(';');
        const channelId = data[0];
        const category = data[1];

        daalbot.db.setChannel(interaction.guild.id, category, channelId);

        interaction.reply({
            content: `The channel has been set to <#${channelId}>.`,
            ephemeral: true
        })
    }
}