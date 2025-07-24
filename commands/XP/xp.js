const fs = require('fs');
const path = require('path');
const daalbot = require('../../daalbot');
const { ApplicationCommandOptionType, MessageFlags } = require('discord.js');

module.exports = {
    name: 'xp',
    description: 'Modifies the XP of a user',
    category: 'XP',

    slash: true,

    permissions: [
        `${daalbot.DJS.PermissionFlagsBits.ManageChannels}`
    ],

    guildOnly: true,
    testOnly: false,

    options: [
        {
            name: 'user',
            description: 'The user to modify the XP of',
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: 'amount',
            description: 'The amount of XP',
            type: ApplicationCommandOptionType.Integer,
            required: true
        },
        {
            name: 'action',
            description: 'The action to perform',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: 'Add',
                    value: 'add'
                },
                {
                    name: 'Remove',
                    value: 'remove'
                },
                {
                    name: 'Set',
                    value: 'set'
                }
            ]
        }
    ],

    callback: ({ interaction }) => {
        // Looks strange by here but its just for intellisense
        const user = interaction.options.getUser('user')
        const amount = parseInt(`${interaction.options.getInteger('amount')}`)
        const action = `${interaction.options.getString('action')}`

        // Check if the user is a bot
        if (user.bot) return interaction.reply({ content: `<@${user.id}> is a bot and is not have a level`, flags: MessageFlags.Ephemeral });

        if (action === 'add') {
            // Check if the user has a XP file
            if (fs.existsSync(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`))) {
                // Read the XP file
                let xp = parseInt(daalbot.fs.read(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), 'utf8'));
                // Add the XP
                xp += amount;
                // Write the XP file
                fs.writeFileSync(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), `${xp}`);
                // Reply
                interaction.reply({ content: `Added ${amount} XP to <@${user.id}>`, flags: MessageFlags.Ephemeral });
            } else {
                // Just set it if it doesnt exist

                // Save it
                daalbot.fs.write(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), `${amount}`);

                // Reply
                interaction.reply({ content: `Added ${amount} XP to <@${user.id}>`, flags: MessageFlags.Ephemeral });
            }
        } else if (action === 'set') {
            // Save it
            daalbot.fs.write(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), `${amount}`);

            // Reply
            interaction.reply({ content: `Added ${amount} XP to <@${user.id}>`, flags: MessageFlags.Ephemeral });
        } else if (action === 'remove') {
            // Check if the user has a XP file
            if (fs.existsSync(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`))) {
                // Read the XP file
                let xp = parseInt(daalbot.fs.read(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), 'utf8'));
                
                // Remove the XP
                xp -= amount;

                // Write the XP file
                daalbot.fs.write(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), xp < 0 ? `0` : `${xp}`);

                // Reply
                interaction.reply({ content: `Removed ${amount} XP from <@${user.id}>`, flags: MessageFlags.Ephemeral });
            }
        }
    }
}