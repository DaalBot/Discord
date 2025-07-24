const DJS = require('discord.js');
const fs = require('fs');
const path = require('path');
const daalbot = require('../../daalbot.js');

module.exports = {
    name: 'lockdown',
    description: 'Locksdown the server',
    category: 'Guild',

    type: 'SLASH',
    testOnly: true,
    guildOnly: true,

    permissions: [
        `${DJS.PermissionFlagsBits.ManageGuild}`
    ],
    
    /**
     * @param {{ interaction: import('discord.js').Interaction }} param0
     */
    callback: async ({ interaction }) => {
        const embed = new DJS.EmbedBuilder();
        const guild = interaction.guild;
        const lockeddown = fs.existsSync(path.resolve(`./db/lockdown/${guild.id}/current.json`));

        fs.mkdirSync(path.resolve(`./db/lockdown/${guild.id}`), { recursive: true }); // Create the directory if it doesn't exist

        embed.setTitle('Lockdown Panel');
        embed.setDescription(`Hello, ${interaction.user.displayName}! This is the current lockdown status of the server.`);

        // Always visible
        embed.addFields([
            {
                name: 'Lockdown Status',
                value: lockeddown ? 'Locked' : 'Unlocked',
                inline: false
            }
        ]);

        if (lockeddown) {
            const currentLockdown = JSON.parse(daalbot.fs.read(path.resolve(`./db/lockdown/${guild.id}/current.json`), 'utf-8'));

            embed.addFields([
                {
                    name: 'Reason',
                    value: currentLockdown.reason,
                    inline: true
                },
                {
                    name: 'Locked By',
                    value: `<@${currentLockdown.starter}>`,
                    inline: true
                },
                {
                    name: 'Locked At',
                    value: `<t:${Math.floor(currentLockdown.timestamp / 1000)}:d> at <t:${Math.round(currentLockdown.timestamp / 1000)}:T>`,
                    inline: true
                },
                {
                    name: 'Isolation Channel',
                    value: currentLockdown.isolation ? `<#${currentLockdown.isolation}>` : 'N/A',
                    inline: true
                },
                {
                    name: 'Isolated Role',
                    value: currentLockdown.isolationRole ? `<@&${currentLockdown.isolationRole}>` : 'N/A',
                    inline: true
                }
            ]);
        }

        embed.setColor(lockeddown ? DJS.Colors.Red : DJS.Colors.Green);

        const row = new DJS.ActionRowBuilder()

        if (!lockeddown) {
            row.addComponents([new DJS.ButtonBuilder().setCustomId('handler_lockdown-lock').setLabel('Lock').setStyle(DJS.ButtonStyle.Danger).setEmoji('🔒')]);
        } else {
            row.addComponents([new DJS.ButtonBuilder().setCustomId('handler_lockdown-unlock').setLabel('Unlock').setStyle(DJS.ButtonStyle.Success).setEmoji('🔓')]);
        }

        row.addComponents([
            new DJS.ButtonBuilder().setCustomId('handler_lockdown-config').setLabel('Config').setStyle(DJS.ButtonStyle.Secondary).setEmoji('⚙️'),
        ])

        interaction.reply({ embeds: [embed], components: [row], flags: DJS.MessageFlags.Ephemeral });
    }
}