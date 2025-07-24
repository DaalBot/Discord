const { ChatInputCommandInteraction, ApplicationCommandOptionType, PermissionsBitField, MessageFlags } = require('discord.js');
const client = require('../../client.js');

module.exports = {
    name: 'webhook',
    description: 'Manages the webhooks owned by the bot.',
    type: 'SLASH',
    category: 'Message',

    options: [
        {
            name: 'create',
            description: 'Creates a new webhook.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'The channel to create the webhook in.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                },
                {
                    name: 'name',
                    description: 'The name of the webhook.',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'list',
            description: 'Lists all webhooks owned by the bot in the current channel.',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],

    permissions: [
        `${PermissionsBitField.Flags.ManageWebhooks}` // Well you gotta be able to manage webhooks to be able to manage webhooks.
    ],

    /**
     * @param {{ interaction: ChatInputCommandInteraction }} param0
    */
    callback:async({interaction})=>{
        const subcommand = interaction.options.getSubcommand();

        if(subcommand === 'create'){
            const channel = interaction.options.getChannel('channel');
            const name = interaction.options.getString('name');
            const webhook = await channel.createWebhook({
                name: name,
                avatar: client.user.displayAvatarURL({format: 'png'}),
                reason: `Webhook created by ${interaction.user.username} (${interaction.user.id})`
            })

            await interaction.reply({
                content: `Webhook created with the name \`${webhook.name}\` in <#${channel.id}>.`,
                flags: MessageFlags.Ephemeral
            });
        }else if(subcommand === 'list'){
            const webhooks = await interaction.channel.fetchWebhooks();
            const botWebhooks = webhooks.filter(webhook => webhook.owner.id === client.user.id);

            if(botWebhooks.size === 0){
                return interaction.reply({
                    content: 'No webhooks owned by the bot in this channel.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const webhookList = botWebhooks.map(webhook => `**${webhook.name}** (ID: ${webhook.id})`).join('\n');

            await interaction.reply({
                content: `Webhooks owned by the bot in this channel:\n${webhookList}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}