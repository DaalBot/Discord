const { EmbedBuilder, ApplicationCommandOptionType, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const daalbot = require('../../daalbot.js');
const crypto = require('crypto');
const client = daalbot.client;

module.exports = {
    category: "Moderation",
    description: "Warns a user",

    permissions: [
        `${daalbot.DJS.PermissionFlagsBits.ModerateMembers}`,
    ],

    slash: true,
    testOnly: false,
    guildOnly: true,

    options: [
        {
            name: 'add',
            description: 'Add a warning to a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user to warn',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for the warning',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Remove a warning from a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'id',
                    description: 'The ID of the warning to remove',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                }
            ],
        },
        {
            name: 'list',
            description: 'List all warnings for a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user to list warnings for',
                    type: ApplicationCommandOptionType.User,
                    required: false,
                },
            ],
        }
    ],

    /**
     * @param {{interaction: import('discord.js').ChatInputCommandInteraction}} param0
     */
    callback: async ({ interaction }) => {
        const subcommand = interaction.options.getSubcommand()
        
        if (subcommand == 'add') {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');

            const reportObject = {
                subject: user.id,
                by: interaction.user.id,
                time: Date.now(),
                id: crypto.randomBytes(4).toString('hex'),
                reason,
            };

            await daalbot.db.managed.insert(interaction.guild.id, 'warns.json', reportObject);

            interaction.reply({ content: `Warned <@${user.id}> for \`${reason}\` (${reportObject.id})`, flags: MessageFlags.Ephemeral });

            client.emit('guildWarnCreate', {
                guild: interaction.guild,
                ...reportObject
            });
            return;
        }

        if (subcommand == 'remove') {
            const id = interaction.options.getString('id');
            let warns = daalbot.db.managed.get(interaction.guild.id, 'warns.json');

            if (warns == 'File Not Found.')
                return interaction.reply({ content: `Warning database missing, No users have any warnings.`, flags: MessageFlags.Ephemeral });
            else warns = JSON.parse(warns);

            const warn = warns.find(warn => warn.id == id);
            if (!warn) return interaction.reply({ content: `Warning not found.`, flags: MessageFlags.Ephemeral });

            warns = warns.filter(warn => warn.id != id);

            await daalbot.db.managed.set(interaction.guild.id, 'warns.json', JSON.stringify(warns));

            interaction.reply({
                content: `Removed warning \`${id}\` from <@${warn.subject}>.\nReason: ${warn.reason}\nBy: <@${warn.by}>\nTime: <t:${Math.floor(warn.time / 1000)}:R>`,
                flags: MessageFlags.Ephemeral,
            });

            client.emit('guildWarnDelete', {
                guild: interaction.guild,
                ...warn
            });
            return;
        }

        if (subcommand == 'list') {
            const user = interaction.options.getUser('user');
            let warns = daalbot.db.managed.get(interaction.guild.id, 'warns.json');

            if (warns == 'File Not Found.')
                return interaction.reply({ content: `Warning database missing, No users have any warnings.`, flags: MessageFlags.Ephemeral });
            else warns = JSON.parse(warns);

            if (user) warns = warns.filter(warn => warn.subject == user.id);

            if (warns.length == 0)
                return interaction.reply({ content: `No users have any warnings.`, flags: MessageFlags.Ephemeral });

            const embed = new EmbedBuilder()
                .setTitle(`Warnings (${warns.length})`)
                .setDescription(`Warnings for ${user ? `<@${user.id}>` : 'all users'}`);

            let overflown = 0;
            for (let i = 0; i < warns.length; i++) {
                const warn = warns[i];
                if (embed.data.fields?.length >= 10) {
                    overflown++;
                    continue;
                }
            
                const warnUser = user || (client.users.cache.get(warn.subject) ?? (await client.users.fetch(warn.subject)));
            
                embed.addFields({
                    name: `\`${i + 1}.\` ${!user ? `${warnUser?.username} (<@${warn.subject}>) - ` : ''}\`${warn.id}\``,
                    value: `By: <@${warn.by}>\nReason: ${warn.reason.substring(0, 197) + (warn.reason.length > 197 ? '...' : '')}\nTime: <t:${Math.floor(warn.time / 1000)}:R>`,
                    inline: false,
                });
            }

            const row = new ActionRowBuilder()

            if (overflown > 0) {
                embed.setFooter({ text: `And ${overflown} more warnings...` })

                const nextButton = new ButtonBuilder()
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`warns_${user?.id ?? 'all'}_2`)

                const previousButton = new ButtonBuilder()
                    .setLabel('Previous')
                    .setDisabled(true)
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`warns_${user?.id ?? 'all'}_1`)

                const infoButton = new ButtonBuilder()
                    .setLabel('Page #1')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
                    .setCustomId(`neverclick`)

                row.addComponents(
                    previousButton,
                    infoButton,
                    nextButton
                )
            };

            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral, components: overflown > 0 ? [row] : [] });
        }
    }
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith('warns_')) return;
    const [user, page] = interaction.customId.split('_').slice(1);

    const userId = user == 'all' ? null : user;
    const pageNum = parseInt(page) || 1;
    const pageSize = 10;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;

    const warns = daalbot.db.managed.exists(interaction.guild.id, 'warns.json') ? JSON.parse(await daalbot.db.managed.get(interaction.guild.id, 'warns.json')) : [];
    const filteredWarns = userId ? warns.filter(warn => warn.subject == userId) : warns;

    const totalPages = Math.ceil(filteredWarns.length / pageSize);
    const embed = new EmbedBuilder()
        .setTitle(`Warnings (${filteredWarns.length})`)
        .setDescription(`Warnings for ${userId ? `<@${userId}>` : 'all users'}`);

    for (let i = 0; i < filteredWarns.slice(start, end).length; i++) {
        const warn = filteredWarns.slice(start, end)[i];
        const warnUser = client.users.cache.get(userId || warn.subject) ?? (await client.users.fetch(userId || warn.subject));
    
        embed.addFields({
            name: `\`${start + (i + 1)}.\` ${!userId ? `${warnUser?.username} (${warn.subject}) - ` : ''}\`${warn.id}\``,
            value: `By: <@${warn.by}>\nReason: ${warn.reason.substring(0, 197) + (warn.reason.length > 197 ? '...' : '')}\nTime: <t:${Math.floor(warn.time / 1000)}:R>`,
            inline: false,
        });
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`warns_${userId ?? 'all'}_${pageNum - 1}`)
                .setDisabled(pageNum <= 1),
            new ButtonBuilder()
                .setLabel(`Page #${pageNum}`)
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`neverclick`)
                .setDisabled(true),
            new ButtonBuilder()
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`warns_${userId ?? 'all'}_${pageNum + 1}`)
                .setDisabled(pageNum >= totalPages),
        );

    await interaction.update({ embeds: [embed], components: [row] });
})