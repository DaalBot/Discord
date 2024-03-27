const daalbot = require('../../daalbot.js');
const fs = require('fs');
const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord.js');
const path = require('path');

const modules = [
    {
        name: 'Social / Twitter',
        value: 'socialtwt'
    },
    {
        name: 'Events / Creation',
        value: 'cmdevents'
    },
    {
        name: 'Moderation / Lockdown',
        value: 'cmdlockdown'
    }
]

module.exports = {
    name: 'beta',
    description: 'Manages the servers beta involvement',
    category: 'Bot',

    testOnly: false,
    guildOnly: true,

    permissions: [
        `${PermissionFlagsBits.ManageGuild}`
    ],

    options: [
        {
            name: 'change',
            description: 'Change the servers beta involvement',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'module',
                    description: 'The module to change',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: modules
                },
                {
                    name: 'value',
                    description: 'The value to change to',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true
                }
            ]
        }
    ],

    callback: async ({ interaction }) => {
        const subcommand = interaction.options.getSubcommand();
        const selectedModule = interaction.options.getString('module');
        const moduleName = modules.find(m => m.value === selectedModule).name;
        const value = interaction.options.getBoolean('value');

        if (subcommand === 'change') {
            const betaData = daalbot.fs.read(path.resolve(`./db/beta/${selectedModule}.txt`))
            if (betaData === 'File not found.') {
                // Should never happen but just create the file if it does
                fs.appendFileSync(path.resolve(`./db/beta/${selectedModule}.txt`), ``); // Write a blank file
            }

            if (betaData.includes(interaction.guild.id)) {
                if (!value) {
                    const newData = betaData.replace(`${interaction.guild.id}\n`, '');
                    fs.writeFileSync(path.resolve(`./db/beta/${selectedModule}.txt`), newData);
                    return await interaction.reply({
                        content: `The server has been removed from the beta involvement for the \`${moduleName}\` module`,
                        ephemeral: true
                    })
                } else {
                    return await interaction.reply({
                        content: `The server is already involved in the beta for the \`${moduleName}\` module`,
                        ephemeral: true
                    })
                }
            } else {
                if (value) {
                    fs.appendFileSync(path.resolve(`./db/beta/${selectedModule}.txt`), `${interaction.guild.id}\n`);

                    return await interaction.reply({
                        content: `The server has been added to the beta involvement for the \`${moduleName}\` module`,
                        ephemeral: true
                    })
                } else {
                    return await interaction.reply({
                        content: `The server is not involved in the beta for the \`${moduleName}\` module`,
                        ephemeral: true
                    })
                }
            }
        }
    }
}