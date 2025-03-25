const daalbot = require('../../daalbot');
const { EmbedBuilder } = require('discord.js');
const DJS = require('discord.js');

module.exports = {
    name: 'shop',
    description: 'Buy items with your coins',
    category: 'Econ',

    type: 'SLASH',
    
    guildOnly: true,
    testOnly: false,

    /**
     * @param {{ interaction: DJS.ChatInputCommandInteraction }} param0
     */
    callback: async({ interaction }) => {
        if (!(await daalbot.db.managed.exists(interaction.guild.id, `shop/enabled`))) {
            return await interaction.reply({
                content: `The shop is currently disabled.`,
                components: [
                    interaction.member.permissions.has(DJS.PermissionsBitField.Flags.ManageGuild) ? new DJS.ActionRowBuilder().addComponents(
                        new DJS.ButtonBuilder()
                            .setCustomId('handler_shop_manage')
                            .setLabel('Manage')
                            .setStyle(DJS.ButtonStyle.Primary)
                    ) : null
                ],
                flags: DJS.MessageFlags.Ephemeral
            })
        }

        const jsonFile = await daalbot.db.managed.get(interaction.guild.id, `shop/items.json`);
        if (jsonFile == 'File not found.' || jsonFile == '[]') {
            return await interaction.reply({
                content: `The shop is currently empty.`,
                components: [
                    interaction.member.permissions.has(DJS.PermissionsBitField.Flags.ManageGuild) ? new DJS.ActionRowBuilder().addComponents(
                        new DJS.ButtonBuilder()
                            .setCustomId('handler_shop_manage')
                            .setLabel('Manage')
                            .setStyle(DJS.ButtonStyle.Primary)
                    ) : null
                ],
                flags: DJS.MessageFlags.Ephemeral
            })
        }

        const items = JSON.parse(jsonFile);
        let userCoins = await daalbot.db.managed.get(interaction.guild.id, `coins/${interaction.user.id}`);
        if (userCoins == 'File not found.') {
            userCoins = 0;
        }

        const embed = new EmbedBuilder()
            .setTitle('Shop')
            .setDescription(`Welcome to the shop. Here are all of the items you can buy`)
            .setColor(daalbot.colours.vortex_blue)
            .setFooter({
                text: `You have ${userCoins} coins`
            })
            .setTimestamp();

        const row = new DJS.ActionRowBuilder();
        const dropdown = new DJS.StringSelectMenuBuilder()
            .setCustomId('handler_shop_selection')
            .setMinValues(1)
            .setMaxValues(1)
            .setPlaceholder('Select an item to buy');

        items.forEach(item => {
            if (embed?.data?.fields?.length == 25) return; // Discord embed limit
            embed.addFields([
                {
                    name: item.name,
                    value: `Description: \`${item.description}\`\nCost: ${daalbot.emojis.get('coin', interaction.guild.id)} ${item.price}`,
                    inline: true
                }
            ])

            dropdown.addOptions([
                {
                    label: item.name,
                    value: item.id
                }
            ])
        })

        let components = [];

        components.push(row.addComponents(dropdown));
        const row2 = new DJS.ActionRowBuilder();

        if (interaction.member.permissions.has(DJS.PermissionsBitField.Flags.ManageGuild)) {
            row2.addComponents(new DJS.ButtonBuilder()
                .setCustomId('handler_shop_manage')
                .setLabel('Manage')
                .setStyle(DJS.ButtonStyle.Primary)
            )

            components.push(row2);
        }

        await interaction.reply({
            embeds: [embed],
            components,
            flags: DJS.MessageFlags.Ephemeral
        });
    }
}