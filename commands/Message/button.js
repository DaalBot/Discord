const { ApplicationCommandOptionType, ButtonStyle, ChatInputCommandInteraction, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const DJS = require('discord.js');
const daalbot = require('../../daalbot.js')

module.exports = {
    name: 'button',
    description: 'Modifies buttons in a message.',
    category: 'Message',

    options: [
        {
            name: 'add',
            type: ApplicationCommandOptionType.Subcommand,
            description: 'Adds a button to a message.',

            options: [
                {
                    name: 'message',
                    description: 'The message to add the button to.',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'label',
                    description: 'The label of the button.',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'style',
                    description: 'The style of the button.',
                    type: ApplicationCommandOptionType.String,
                    choices: [
                        {
                            name: 'Primary (Blue)',
                            value: `${DJS.ButtonStyle.Primary}`,
                        },
                        {
                            name: 'Secondary (Grey)',
                            value: `${DJS.ButtonStyle.Secondary}`,
                        },
                        {
                            name: 'Success (Green)',
                            value: `${DJS.ButtonStyle.Success}`,
                        },
                        {
                            name: 'Danger (Red)',
                            value: `${DJS.ButtonStyle.Danger}`
                        }
                    ],
                    required: false
                },
                {
                    name: 'url',
                    description: 'The URL the button should open.',
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: 'emoji',
                    description: 'The emoji to display on the button.',
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: 'disabled',
                    description: 'Whether the button should be disabled.',
                    type: ApplicationCommandOptionType.Boolean,
                    required: false
                },
                {
                    name: 'id',
                    description: 'The ID of the button.',
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        }
    ],

    permissions: [
        `${DJS.PermissionsBitField.Flags.ManageWebhooks}`
    ],

    /**
     * @param {{ interaction: ChatInputCommandInteraction }} param0 
     */
    callback: async({ interaction }) => {
        const { options } = interaction;
        const subcommand = options.getSubcommand();

        if (subcommand === 'add') {
            const messageId = options.getString('message');
            const label = options.getString('label');
            const url = options.getString('url');
            const style = options.getString('style') ?? (url ? ButtonStyle.Link : ButtonStyle.Primary);
            const emoji = options.getString('emoji');
            const disabled = options.getBoolean('disabled') ?? false;
            const id = options.getString('id');

            if (url && id) {
                return interaction.reply({
                    content: 'You cannot specify both a URL and an ID.',
                    ephemeral: true
                });
            }

            if (!url && !id) {
                return interaction.reply({
                    content: 'You must specify either a URL or an ID.',
                    ephemeral: true
                });
            }

            if (url && !url.match(/^https?:\/\//)) {
                return interaction.reply({
                    content: 'The URL provided is invalid.',
                    ephemeral: true
                });
            }

            const message = await daalbot.getMessageFromString(messageId);

            if (!message) {
                return interaction.reply({
                    content: 'The message provided does not exist.',
                    ephemeral: true
                });
            }

            if (message.author.id !== daalbot.client.user.id) {
                const webhook = await message.fetchWebhook();
                if (webhook.owner.id !== daalbot.client.user.id) {
                    return interaction.reply({
                        content: 'I cannot modify buttons on this message.',
                        ephemeral: true
                    });
                }
            }

            if (id.match(/[ .[\]\[{}]/)) {
                return interaction.reply({
                    content: 'The ID provided is invalid.',
                    ephemeral: true
                });
            }

            const rows = message.components ?? [];
            const button = new ButtonBuilder()
                .setLabel(label)
                .setStyle(style)
                .setDisabled(disabled);
            
            if (url) button.setURL(url);
            if (emoji) button.setEmoji(emoji);
            if (id) button.setCustomId(`cust_${id}`); // Add prefix to avoid conflicts with other functionality

            const row = rows[0] ?? new ActionRowBuilder();
            
            if (row.components.length >= 5) {
                return interaction.reply({
                    content: 'You cannot have more than 5 buttons in a row.',
                    ephemeral: true
                });
            }

            const styleChanged = url && style !== ButtonStyle.Link; // Style changed to Link

            if (styleChanged) button.setStyle(ButtonStyle.Link);

            row.components.push(button);

            if (!rows[0]) rows.push(row);

            if (message.author.id === daalbot.client.user.id) {
                await message.edit({
                    components: rows
                });
            } else {
                // Webhook
                const webhook = await message.fetchWebhook();
                await webhook.editMessage(message.id, {
                    components: rows
                });
            }

            interaction.reply({
                content: `Button added successfully.${styleChanged ? ` Your style selection has been discarded because you chose a url` : ''} with the custom id \`${url ? 'None' : `cust_${id}`}\``,
                ephemeral: true
            });
        }
    }
}