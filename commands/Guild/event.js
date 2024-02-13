const DJS = require("discord.js");
const path = require("path");
const fs = require("fs");
const daalbot = require('../../daalbot.js');

module.exports = {
    name: 'event',
    description: 'Modifies events for the guild.',
    category: 'Guild',

    // Note: Switch this to " type: 'SLASH' " when updating to V14
    type: 'SLASH',
    testOnly: true,

    guildOnly: true,

    permissions: [
        `${DJS.PermissionFlagsBits.ManageGuild}`
    ],

    options: [
        {
            name: 'create',
            description: 'Creates an event.',
            type: DJS.ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'delete',
            description: 'Deletes an event.',
            type: DJS.ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'list',
            description: 'Lists all events.',
            type: DJS.ApplicationCommandOptionType.Subcommand
        }
    ],

    callback: async ({ interaction }) => {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'create') {
            // Create event
            const createEventDropdown = new DJS.ActionRowBuilder()
            .addComponents(
                new DJS.StringSelectMenuBuilder()
                    .setCustomId('eventDropdown_create')
                    .setPlaceholder('Select an event')
                    .addOptions([
                        {
                            label: 'Message create',
                            description: 'Triggers the event when a message is created.',
                            value: 'MSG_CREATE'
                        },
                        {
                            label: 'Message delete',
                            description: 'Triggers the event when a message is deleted.',
                            value: 'MSG_DELETE'
                        },
                        {
                            label: 'Message update',
                            description: 'Triggers the event when a message is updated.',
                            value: 'MSG_UPDATE'
                        },
                        {
                            label: 'Message reaction add',
                            description: 'Triggers the event when a reaction is added to a message.',
                            value: 'MSG_REACTION_ADD'
                        },
                        {
                            label: 'Message reaction remove',
                            description: 'Triggers the event when a reaction is removed from a message.',
                            value: 'MSG_REACTION_REMOVE'
                        },
                        {
                            label: 'Message reaction remove all',
                            description: 'Triggers the event when all reactions are removed from a message.',
                            value: 'MSG_REACTION_REMOVE_ALL'
                        }
                    ])
                    .setMinValues(1)
                    .setMaxValues(1)
            );

            interaction.reply({
                content: 'Select an event to create.',
                components: [createEventDropdown],
                ephemeral: true
            })
        } else if (subCommand === 'delete') {
            // Delete event
        } else if (subCommand === 'list') {
            // List events
        }
    }
}