const daalbot = require(`../../daalbot.js`);
const DJS = require(`discord.js`);

module.exports = {
    name: `economy`,
    description: `Modify the economy system`,
    category: `Econ`,

    type: `SLASH`,

    guildOnly: true,
    testOnly: false,

    options: [
        {
            name: `user`,
            description: `The user to modify`,
            type: DJS.ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: `action`,
            description: `The action to perform`,
            type: DJS.ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: `Add`,
                    value: `add`
                },
                {
                    name: `Remove`,
                    value: `remove`
                },
                {
                    name: `Set`,
                    value: `set`
                },
                {
                    name: `View`,
                    value: `view`
                }
            ]
        },
        {
            name: `amount`,
            description: `The amount to modify the user's coins by`,
            type: DJS.ApplicationCommandOptionType.Integer,
            required: false,
        }
    ],

    permissions: [
        `${DJS.PermissionsBitField.Flags.ManageGuild}`
    ],

    /**
     * @param {{ interaction: DJS.ChatInputCommandInteraction }} param0
    */
    callback: async({ interaction }) => {
        const user = interaction.options.getUser(`user`);
        const action = interaction.options.getString(`action`);
        const amount = interaction.options.getInteger(`amount`);

        if (user.bot) return await interaction.reply({
            content: `Uhh hey if you haven't noticed, bots can't have coins.`,
            flags: DJS.MessageFlags.Ephemeral
        })
        
        const userCoinsFile = await daalbot.db.managed.get(interaction.guild.id, `coins/${user.id}`);
        let userCoins = 0;
        if (userCoinsFile == `File not found.`) userCoins = 0;
        else userCoins = parseInt(userCoinsFile);

        if (action == `add`) {
            userCoins += amount;

            await daalbot.db.managed.set(interaction.guild.id, `coins/${user.id}`, userCoins);
        } else if (action == `remove`) {
            userCoins -= amount;

            if (userCoins < 0) {
                return await interaction.reply({
                    content: `You cannot remove more coins than the user has.`,
                    flags: DJS.MessageFlags.Ephemeral
                });
            }

            await daalbot.db.managed.set(interaction.guild.id, `coins/${user.id}`, userCoins);
        } else if (action == `set`) {
            userCoins = amount;

            if (userCoins < 0) {
                return await interaction.reply({
                    content: `You cannot set a user's coins to a negative value.`,
                    flags: DJS.MessageFlags.Ephemeral
                });
            }

            await daalbot.db.managed.set(interaction.guild.id, `coins/${user.id}`, `${userCoins}`)
        } else if (action == `view`) {
            return await interaction.reply({
                content: `**${user.tag}** has ${userCoins} coins.`,
                flags: DJS.MessageFlags.Ephemeral
            });
        }

        switch (action) {
            case `add`:
                return await interaction.reply({
                    content: `Added ${amount} coins to **${user.tag}**. They now have ${userCoins} coins.`,
                    flags: DJS.MessageFlags.Ephemeral
                });
            case `remove`:
                return await interaction.reply({
                    content: `Removed ${amount} coins from **${user.tag}**. They now have ${userCoins} coins.`,
                    flags: DJS.MessageFlags.Ephemeral
                });
            case `set`:
                return await interaction.reply({
                    content: `Set **${user.tag}**'s coins to ${userCoins}.`,
                    flags: DJS.MessageFlags.Ephemeral
                });
        }
    }
}