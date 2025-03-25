const DJS = require("discord.js");
const path = require("path");
const daalbot = require('../../daalbot.js');
const fs = require('fs')
const eventTypes = [
    {
        name: 'Message Create',
        value: 'messageCreate'
    },
    {
        name: 'Message Update',
        value: 'messageUpdate'
    },
    {
        name: 'Message Delete',
        value: 'messageDelete'
    },
    {
        name: 'Channel Create',
        value: 'channelCreate'
    },
    {
        name: 'Channel Update',
        value: 'channelUpdate'
    },
    {
        name: 'Channel Delete',
        value: 'channelDelete'
    },
    {
        name: 'Guild Update',
        value: 'guildUpdate'
    },
    {
        name: 'Guild Ban Add',
        value: 'guildBanAdd'
    },
    {
        name: 'Guild Ban Remove',
        value: 'guildBanRemove'
    },
    {
        name: 'Guild Member Add',
        value: 'guildMemberAdd'
    },
    {
        name: 'Guild Member Remove',
        value: 'guildMemberRemove'
    },
    {
        name: 'Guild Member Update',
        value: 'guildMemberUpdate'
    },
    {
        name: 'Guild Role Create',
        value: 'guildRoleCreate'
    },
    {
        name: 'Guild Role Update',
        value: 'guildRoleUpdate'
    },
    {
        name: 'Guild Role Remove',
        value: 'guildRoleRemove'
    },
    {
        name: 'Message Reaction Add',
        value: 'messageReactionAdd'
    },
    {
        name: 'Message Reaction Remove',
        value: 'messageReactionAdd'
    },
    {
        name: 'Interaction Create',
        value: 'interactionCreate'
    }
]

module.exports = {
    name: 'event',
    description: 'Modifies events for the guild.',
    category: 'Guild',

    testOnly: false,

    guildOnly: true,

    permissions: [
        `${DJS.PermissionFlagsBits.ManageGuild}`
    ],

    options: [
        {
            name: 'create',
            description: 'Creates an event.',
            type: DJS.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'trigger',
                    description: 'The gateway event that triggers the event.',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: true,
                    choices: eventTypes
                }
            ]
        },
        {
            name: 'delete',
            description: 'Deletes an event.',
            type: DJS.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'event',
                    description: 'The id for the event you want to delete',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'list',
            description: 'Lists all events.',
            type: DJS.ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'trigger',
                    description: 'The gateway event that triggers the event.',
                    type: DJS.ApplicationCommandOptionType.String,
                    required: false,
                    choices: eventTypes
                }
            ]
        }
    ],

    /**
     * @param {{ interaction: DJS.ChatInputCommandInteraction }} param0
     */
    callback: async ({ interaction }) => {
        const subCommand = interaction.options.getSubcommand();

        const betaData = fs.readFileSync(path.resolve('./db/beta/cmdevents.txt'))

        if (!betaData.includes(interaction.guild.id)) {
            return interaction.reply({
                content: 'This server is not in the beta for events please use `/beta change` to opt in. (Note: Beta does not yet support code editing)',
                flags: DJS.MessageFlags.Ephemeral
            })
        }

        /**
         * @type {Array<{ id: string, guild: string, on: string, enabled: boolean }>}
         */
        const eventsJSON = JSON.parse(fs.readFileSync(path.resolve('./db/events/events.json')))

        if (subCommand === 'create') {
            // Create event
            const eventId = await daalbot.items.generateId(16);
            const type = interaction.options.getString('trigger');

            const embed = new DJS.EmbedBuilder()
                .setTitle('Create event')
                .addFields([
                    {
                        name: 'ID',
                        value: eventId,
                        inline: true
                    },
                    {
                        name: 'Trigger',
                        value: type,
                        inline: true
                    },
                    {
                        name: 'Name',
                        value: 'Not set',
                        inline: false
                    },
                    {
                        name: 'Description',
                        value: 'Not set',
                        inline: false
                    }
                ])

            interaction.reply({
                content: `Please send a message containing the name for the event (expires <t:${Math.floor((Date.now() + 30 * 1000) / 1000)}:R>).`,
                embeds: [embed],
                flags: DJS.MessageFlags.Ephemeral
            })

            const filter = (message) => message.author.id === interaction.user.id;
            
            try {
                const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1, errors: ['time'] });

                const messageA = await collector.next;
                const name = messageA.content;
                messageA.delete();

                embed.spliceFields(2, 1, { name: 'Name', value: name, inline: false });

                interaction.editReply({
                    content: `Please send a message containing the description for the event (expires <t:${Math.floor((Date.now() + 5 * 60 * 1000) / 1000)}:R>).`,
                    embeds: [embed],
                    flags: DJS.MessageFlags.Ephemeral
                })

                const collectorB = interaction.channel.createMessageCollector({ filter, time: 5 * 60 * 1000, max: 1, errors: ['time'] });

                const messageB = await collectorB.next;
                const description = messageB.content;
                messageB.delete();

                embed.spliceFields(3, 1, { name: 'Description', value: description, inline: false });

                eventsJSON.push({
                    id: eventId,
                    guild: interaction.guild.id,
                    on: type,
                    name: name,
                    description: description,
                    enabled: true
                })

                let objectName = type.replace('Create', '').replace('Update', '').replace('Delete', '').replace('Add', '').replace('Remove', '').toLowerCase();

                switch (objectName) {
                    case 'guildmember':
                        objectName = 'member';
                        break;
                    case 'guildban':
                        objectName = 'ban';
                        break;
                    default:
                        break;
                }
                if (!fs.existsSync(path.resolve(`./db/events/${eventId}`))) fs.mkdirSync(path.resolve(`./db/events/${eventId}`))
                daalbot.fs.write(path.resolve(`./db/events/${eventId}/event.js`), `module.exports = {
    name: '${name}',
    description: '${description}',
    id: '${eventId}',
    
    execute: (async(${objectName}, util) => {
// To learn more visit https://lnk.daalbot.xyz/EventsGuide
    })
}`)

                fs.writeFileSync(path.resolve(`./db/events/events.json`), JSON.stringify(eventsJSON, null, 4))

                interaction.editReply({
                    content: `Event created. To edit the code for the event click [here](https://daalbot.xyz/Dashboard/Guild/${interaction.guild.id}/feature/guild/events/edit?id=${eventId}).`,
                    embeds: [embed],
                    flags: DJS.MessageFlags.Ephemeral
                })
            } catch {
                interaction.editReply({
                    content: 'You did not respond in time.',
                    embeds: [],
                    flags: DJS.MessageFlags.Ephemeral
                })
            }
        } else if (subCommand === 'delete') {
            const eventId = interaction.options.getString('event');

            const event = eventsJSON.find(e => e.id === eventId)

            if (!event) {
                return interaction.reply({
                    content: 'That event doesnt exist.',
                    flags: DJS.MessageFlags.Ephemeral
                })
            }

            if (event.guild !== interaction.guild.id) {
                return interaction.reply({
                    content: 'This server doesnt own that event',
                    flags: DJS.MessageFlags.Ephemeral
                })
            }

            const eventIndex = eventsJSON.indexOf(event)
            eventsJSON.splice(eventIndex, 1)

            fs.writeFileSync(path.resolve(`./db/events/events.json`), JSON.stringify(eventsJSON, null, 4))

            fs.rmSync(path.resolve(`./db/events/${eventId}`), {
                recursive: true
            })
            
            interaction.reply({
                content: `Successfully deleted event \`${eventId}\``,
                flags: DJS.MessageFlags.Ephemeral
            })
        } else if (subCommand === 'list') {
            // List events
            const events = eventsJSON.filter(e => e.guild === interaction.guild.id && e.on === (interaction.options.getString('trigger') ?? e.on))

            if (events.length === 0) {
                return await interaction.reply({
                    content: 'No events found.',
                    flags: DJS.MessageFlags.Ephemeral
                })
            }

            const embed = new DJS.EmbedBuilder()
                .setTitle(`Events for ${interaction.guild.name}`)

            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                const eventFile = require(path.resolve(`./db/events/${event.id}/event.js`))

                embed.setDescription((embed.data.description ?? '') + `


**${i + 1}.** ${eventFile.name} - [\[Edit\]](https://daalbot.xyz/Dashboard/${interaction.guild.id}/events/editor?id=${event.id})
Description: \`${eventFile.description}\`${interaction.options.getString('trigger') ? '' : `
Trigger: \`${eventTypes.find(e => e.value === event.on).name}`}\`
ID: \`${event.id}\``)

                delete require.cache[require.resolve(path.resolve(`./db/events/${event.id}/event.js`))]
            }

            if (embed.data.description.length > 2048) {
                return await interaction.reply({
                    content: `The list of events is too long to send. Please visit this [link](https://daalbot.xyz/Dashboard/${interaction.guild.id}/events/plaintext?filter=${interaction.options.getString('trigger') ?? 'none'}) to view the list.`,
                    flags: DJS.MessageFlags.Ephemeral
                })
            }

            interaction.reply({
                embeds: [embed],
                flags: DJS.MessageFlags.Ephemeral
            })
        }
    }
}