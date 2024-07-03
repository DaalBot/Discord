const DJS = require('discord.js');
const daalbot = require('../../daalbot.js');

/**
 * @param {DJS.ButtonInteraction} interaction
*/
module.exports = async(interaction) => {
    const row = new DJS.ActionRowBuilder();
    const shopState = await daalbot.db.managed.exists(interaction.guild.id, `shop/enabled`);

    row.addComponents(
        shopState 
        ? new DJS.StringSelectMenuBuilder() // Enabled
            .setCustomId('handler_shop_manage')
            .addOptions([
                {
                    label: 'Add Item',
                    value: 'init_add'
                },
                {
                    label: 'Remove Item',
                    value: 'init_remove'
                },
                {
                    label: 'Disable Shop',
                    value: 'init_disable'
                }
            ])
        : new DJS.StringSelectMenuBuilder() // Disabled
        .setCustomId('handler_shop_manage')
        .addOptions([
            {
                label: 'Enable Shop',
                value: 'init_enable'
            }
        ])
    )

    interaction.reply({
        content: 'Select an action to perform:',
        components: [row],
        ephemeral: true
    })
}