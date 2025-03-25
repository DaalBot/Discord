const DJS = require('discord.js');
const daalbot = require('../../daalbot.js');
const client = require('../../client.js');

/**
 * @param {DJS.StringSelectMenuInteraction<DJS.CacheType>} interaction 
*/
module.exports = async (interaction) => {
    const item = interaction.values[0];
    const items = JSON.parse(await daalbot.db.managed.get(interaction.guild.id, 'shop/items.json'));
    const userCoins = await daalbot.db.managed.get(interaction.guild.id, `coins/${interaction.user.id}`);
    if (userCoins == 'File not found.')
        return interaction.reply({ content: 'You do not have any coins so where are you gonna get the money to buy this?', flags: DJS.MessageFlags.Ephemeral });

    const itemData = items.find(i => i.id == item);

    if (itemData == undefined)
        return interaction.reply({ content: 'That item does not exist.', flags: DJS.MessageFlags.Ephemeral });

    if (parseInt(userCoins) < itemData.price) 
        return interaction.reply({ content: 'You do not have enough coins to buy this item.', flags: DJS.MessageFlags.Ephemeral });

    if (itemData.role) {
        interaction.member.roles.add(itemData.role)
            .then(async() => {
                await interaction.reply({
                    content: `You have bought the ${itemData.name} for ${daalbot.emojis.get('coin', interaction.guild.id)} ${itemData.price}. You now have ${daalbot.emojis.get('coin', interaction.guild.id)} ${userCoins - itemData.price} coins.`,
                    flags: DJS.MessageFlags.Ephemeral
                });

                const newCoins = parseInt(userCoins) - itemData.price;
                await daalbot.db.managed.set(interaction.guild.id, `coins/${interaction.user.id}`, newCoins);

                // Update user data
                await daalbot.db.managed.set(interaction.guild.id, `shop/${interaction.user.id}`, `${itemData.id}\n`)
            })
            .catch((e) => {
                console.error(e);
                interaction.reply({
                    content: `Something went wrong. You still have ${daalbot.emojis.get('coin', interaction.guild.id)} ${userCoins} coins.`,
                    flags: DJS.MessageFlags.Ephemeral
                });
            });
    } else {
        interaction.reply({
            content: 'This item does not have a role associated with it. Please contact an admin.',
            flags: DJS.MessageFlags.Ephemeral
        })
    }
}