const fs = require('fs');
const path = require('path');
const daalbot = require('../../daalbot');
const { EmbedBuilder, Colors } = require('discord.js');

async function getMsUntilTomorrow() {
    // Create a new Date object for the current date
    const currentDate = new Date();

    // Create a new Date object for the next day
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    tomorrowDate.setHours(0, 0, 0, 0);

    // Calculate the difference in milliseconds
    const diffInMilliseconds = tomorrowDate.getTime() - currentDate.getTime();

    return diffInMilliseconds;
}

module.exports = {
    name: 'daily',
    description: 'Claim your daily rewards',
    category: 'XP',

    type: 'SLASH',
    
    guildOnly: true,
    testOnly: false,

    callback: async({ interaction }) => {
        const tomorrowTS = await daalbot.timestamps.getFutureDiscordTimestamp(await getMsUntilTomorrow());
        const tomorrowDate = new Date(tomorrowTS * 1000);

        const userHasData = await daalbot.db.managed.exists(interaction.guild.id, `daily/${interaction.user.id}`);

        let extraRewards = ''

        if (daalbot.db.managed.exists(interaction.guild.id, `shop/enabled`)) {
            const addedCoins = 10;
            extraRewards += `\n${daalbot.emojis.get('coin', interaction.guild.id)} +${addedCoins}`;

            const currentCoins = await daalbot.db.managed.get(interaction.guild.id, `coins/${interaction.user.id}`)
            const newCoins = currentCoins == 'File not found.' ? addedCoins : parseInt(currentCoins) + addedCoins;

            await daalbot.db.managed.set(interaction.guild.id, `coins/${interaction.user.id}`, `${newCoins}`);
        }

        if (!userHasData) {
            const embed = new EmbedBuilder()
                .setTitle('Claimed Rewards!')
                .setDescription('You can claim again <t:' + tomorrowTS + ':R>.')
                .setColor(Colors.Green)
                .setFields([
                    {
                        name: 'Rewards',
                        value: `${daalbot.emojis.xp} +100${extraRewards}`,
                        inline: true
                    },
                    {
                        name: 'Streak',
                        value: '0',
                        inline: true
                    }
                ])
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

            await daalbot.db.managed.set(interaction.guild.id, `daily/${interaction.user.id}`, `${tomorrowDate.getTime()}`); // Set the timestamp to tomorrow
            await daalbot.db.managed.set(interaction.guild.id, `daily/${interaction.user.id}.redeems`, `\n${new Date().toISOString().split('T')[0]}`, 'a');
        } else {
            const userDailyData = await daalbot.db.managed.get(interaction.guild.id, `daily/${interaction.user.id}`);
            const userDailyDate = new Date(parseInt(userDailyData));

            if (userDailyDate.getTime() > Date.now()) {
                const embed = new EmbedBuilder()
                    .setTitle('You already claimed your daily rewards!')
                    .setDescription('You can claim again <t:' + userDailyDate.getTime() / 1000 + ':R>.')
                    .setColor(Colors.Red)
                    .setTimestamp()

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } else {
                let streak = 0;

                /**
                 * Should be something like
                 * 
                    2024-04-30
                    2024-05-30
                    2024-05-31
                 */
                const userDailyRedeems = await daalbot.db.managed.get(interaction.guild.id, `daily/${interaction.user.id}.redeems`);
                const userDailyRedeemsArray = userDailyRedeems.split('\n');
                userDailyRedeemsArray.push(new Date().toISOString().split('T')[0]); // Add the current date to the array to add it to the streak


                // Read from the end of the array to the beginning
                for (let i = userDailyRedeemsArray.length - 1; i >= 0; i--) {
                    if (userDailyRedeemsArray[i] === '') continue;

                    const lastDate = new Date(userDailyRedeemsArray[i - 1]);
                    const newDate = new Date(userDailyRedeemsArray[i]);

                    const lastDay = lastDate.getDate();
                    const newDay = newDate.getDate();

                    if (newDay - lastDay == 1) {
                        streak++;
                    } else {
                        const lastMonth = lastDate.getMonth();
                        const newMonth = newDate.getMonth();

                        // If the last date was the last day of the month and the new date is the first day of the next month
                        if (newMonth - lastMonth == 1 && newDay == 1) {
                            streak++;
                        }
                    }
                }

                const addedXP = Math.ceil(100 + (streak * 10));

                const embed = new EmbedBuilder()
                    .setTitle('Claimed daily rewards!')
                    .setDescription('You can claim again <t:' + tomorrowTS + ':R>.')
                    .setColor(Colors.Green)
                    .setFields([
                        {
                            name: 'Rewards',
                            value: `${daalbot.emojis.xp} +${addedXP}`,
                            inline: true
                        },
                        {
                            name: 'Streak',
                            value: `${streak}`,
                            inline: true
                        }
                    ])
                    .setTimestamp()

                if (daalbot.db.managed.exists(interaction.guild.id, `shop/enabled`)) {
                    const addedCoins = Math.floor(addedXP / 10);
                    embed.data.fields.find(f => f.name === 'Rewards').value += `\n${daalbot.emojis.get('coin', interaction.guild.id)} +${addedCoins}`;

                    const currentCoins = await daalbot.db.managed.get(interaction.guild.id, `coins/${interaction.user.id}`)
                    const newCoins = currentCoins == 'File not found.' ? addedCoins : parseInt(currentCoins) + addedCoins;

                    await daalbot.db.managed.set(interaction.guild.id, `coins/${interaction.user.id}`, `${newCoins}`);
                }

                await interaction.reply({
                    embeds: [embed]
                });

                await daalbot.xp.add(interaction?.guild?.id, interaction.user.id, `${addedXP}`);
                await daalbot.db.managed.set(interaction.guild.id, `daily/${interaction.user.id}`, `${tomorrowDate.getTime()}`); // Set the timestamp to tomorrow
                await daalbot.db.managed.set(interaction.guild.id, `daily/${interaction.user.id}.redeems`, userDailyRedeemsArray.join('\n') /** + '\n' + new Date().toISOString().split('T')[0] */);
            }
        }
    }
}