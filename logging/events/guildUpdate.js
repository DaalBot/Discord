const client = require('../../client.js');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const daalbot = require('../../daalbot.js');

client.on('guildUpdate', async (oldGuild, newGuild) => {
    try {
        const enabled = fs.readFileSync(path.resolve(`./db/logging/${newGuild.id}/GUILDUPDATE.enabled`), 'utf8');
        if (enabled == 'true') {
            if (!fs.existsSync(`./db/logging/${newGuild.id}/channel.id`)) return;

            const channelID = fs.readFileSync(path.resolve(`./db/logging/${newGuild.id}/channel.id`), 'utf8');
            const logChannel = client.channels.cache.get(channelID);
            let changes = [];

            const embed = new EmbedBuilder()
                .setTitle('Guild Updated')
                .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Guild.png')
                .setColor('#FFE467')
                .setTimestamp()

            if (oldGuild.name !== newGuild.name) {
                changes.push(`Name: ${oldGuild.name} -> ${newGuild.name}`);
            }

            if (oldGuild.iconURL() !== newGuild.iconURL()) {
                changes.push(`Icon: [Click me](${oldGuild.iconURL()}) -> [Click me](${newGuild.iconURL()})`);
            }

            if (oldGuild.splashURL() !== newGuild.splashURL()) {
                changes.push(`Splash: [Click me](${oldGuild.splashURL()}) -> [Click me](${newGuild.splashURL()})`);
            }

            if (oldGuild.bannerURL() !== newGuild.bannerURL()) {
                changes.push(`Banner: [Click me](${oldGuild.bannerURL()}) -> [Click me](${newGuild.bannerURL()})`);
            }

            if (oldGuild.ownerId !== newGuild.ownerId) {
                changes.push(`Owner: <@${oldGuild.ownerId}> -> <@${newGuild.ownerId}>`);
            }

            if (oldGuild.region !== newGuild.region) {
                changes.push(`Region: ${oldGuild.region} -> ${newGuild.region}`);
            }

            if (oldGuild.description !== newGuild.description) {
                changes.push(`Description: ${oldGuild.description} -> ${newGuild.description}`);
            }

            if (oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount) {
                changes.push(`Boosts: ${oldGuild.premiumSubscriptionCount} -> ${newGuild.premiumSubscriptionCount}`);
            }

            if (oldGuild.premiumTier !== newGuild.premiumTier) {
                changes.push(`Boost Tier: ${oldGuild.premiumTier} -> ${newGuild.premiumTier}`);
            }

            if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
                changes.push(`Verification Level: ${oldGuild.verificationLevel} -> ${newGuild.verificationLevel}`);
            }

            if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
                changes.push(`Explicit Content Filter: ${oldGuild.explicitContentFilter} -> ${newGuild.explicitContentFilter}`);
            }

            const rawChanges = `--- OLD ---
${JSON.stringify(oldGuild, null, 4)}

--- NEW ---
${JSON.stringify(newGuild, null, 4)}`;

            const pasteUrl = await daalbot.api.pastebin.createPaste(rawChanges, 'Guild Update - JSON');

            let description = changes.join('\n');

            description += `\n[Raw Data](${pasteUrl})`;
            
            // Make sure the description is not too long (max: 4096 characters)
            if (description.length > 4096) {
                description = `Changes are too long to display. [Raw Data](${pasteUrl})`;
            }

            logChannel.send({
                content: `Guild Updated`,
                embeds: [embed]
            })
        }
    } catch (err) {
        return;
    }
});