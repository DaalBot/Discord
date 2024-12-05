const DJS = require('discord.js');
const daalbot = require('../../daalbot.js');
const client = require('../../client.js');

/**
 * @param {DJS.StringSelectMenuInteraction<DJS.CacheType>} interaction 
*/
module.exports = async (interaction) => {
    const value = interaction.values[0];
    let selection = value; // This will be gradually stripped of its parts until we have the final selection
    let action = selection.split('_')[0];
    selection = selection.slice(action.length + 1);

    if (action == 'init') {
        // Starting button
        const mode = selection;

        if (mode == 'add') {
            await interaction.reply({
                content: `Loading...`,
                ephemeral: true
            })
            const item = {
                name: '',
                price: 0,
                description: '',
                id: await daalbot.items.generateId(5),
                role: ''
            }

            const questions = [
                'Enter the name of the item:',
                'Enter the price of the item:',
                'Enter the description of the item:',
                'Enter the role ID of the item:'
            ]

            for (let i = 0; i < questions.length; i++) {
                await interaction.editReply({
                    content: `${questions[i]} (You have 60 seconds to respond)`
                })

                const filter = m => m.author.id === interaction.user.id;
                const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60 * 1000, errors: ['time'] });
                const answer = response.first().content;

                switch (i) {
                    case 0:
                        item.name = answer;
                        break;
                    case 1:
                        item.price = parseInt(answer);
                        break;
                    case 2:
                        item.description = answer;
                        break;
                    case 3:
                        if (answer.trim().startsWith('<@&') && answer.trim().endsWith('>')) {
                            item.role = answer.trim().slice(3, -1);
                        } else {
                            item.role = answer; // Assume it's an ID
                        }
                        break;
                }

                await response.first().delete();

                await new Promise(r => setTimeout(r, 500));
            }

            await interaction.editReply({
                content: `Adding item...`
            })

            const currentShop = JSON.parse((await daalbot.db.managed.exists('shop/items.json')) ? (await daalbot.db.managed.get(interaction.guild.id, `shop/items.json`)) : '[]') || [];
            currentShop.push(item);
            await daalbot.db.managed.set(interaction.guild.id, `shop/items.json`, JSON.stringify(currentShop));

            await interaction.editReply({
                content: `Item added!`
            })
        } else if (mode == 'remove') {
            await interaction.reply({
                content: `Loading...`,
                ephemeral: true
            })

            const currentShop = JSON.parse(await daalbot.db.managed.get(interaction.guild.id, `shop/items.json`));
            const items = currentShop.map(item => {
                return {
                    name: item.name,
                    id: `${item.id}`
                }
            });

            const row = new DJS.ActionRowBuilder();
            row.addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('handler_shop_manage')
                    .addOptions(items.map(item => {
                        return {
                            label: item.name,
                            description: `${item.id}`,
                            value: `remove_${item.id}`
                        }
                    }))
            )

            await interaction.editReply({
                content: `Select an item to remove:`,
                components: [row]
            })
        } else if (mode == 'enable') {
            await daalbot.db.managed.set(interaction.guild.id, `shop/enabled`, '');

            await interaction.reply({
                content: `Shop enabled!`,
                ephemeral: true
            })
        } else if (mode == 'disable') {
            await daalbot.db.managed.delete(interaction.guild.id, `shop/enabled`);

            await interaction.reply({
                content: `Shop disabled!`,
                ephemeral: true
            })
        }
    } else if (action == 'remove') {
        const itemId = selection;

        await interaction.reply({
            content: `Removing item...`,
            ephemeral: true
        })

        const currentShop = JSON.parse(await daalbot.db.managed.get(interaction.guild.id, `shop/items.json`));
        const updatedShop = currentShop.filter(item => item.id != itemId);
        await daalbot.db.managed.set(interaction.guild.id, `shop/items.json`, JSON.stringify(updatedShop));

        await interaction.editReply({
            content: `Item removed!`
        })
    }
}