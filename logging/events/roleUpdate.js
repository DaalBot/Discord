const client = require('../../client.js');
const config = require('../../config.json');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ChannelType } = require('discord.js');
const daalbot = require('../../daalbot.js');

client.on('roleUpdate', async(oldRole, newRole) => {
    try {
        if (fs.existsSync(path.resolve(`./db/logging/${oldRole.guild.id}/roleUpdate.cooldown`))) {
            const text = daalbot.fs.read(path.resolve(`./db/logging/${oldRole.guild.id}/roleUpdate.cooldown`), 'utf8');
            if (text == 'true') {
                // Check if all that has changed is the position of the role
                if (oldRole.name == newRole.name && oldRole.color == newRole.color && oldRole.hoist == newRole.hoist && oldRole.mentionable == newRole.mentionable && oldRole.permissions == newRole.permissions) {
                    return;
                }
            } else {
                fs.writeFileSync(path.resolve(`./db/logging/${oldRole.guild.id}/roleUpdate.cooldown`), 'true');
                setTimeout(() => {
                    fs.writeFileSync(path.resolve(`./db/logging/${oldRole.guild.id}/roleUpdate.cooldown`), 'false');
                }, 10000);
            }
        } else {
            fs.appendFileSync(path.resolve(`./db/logging/${oldRole.guild.id}/roleUpdate.cooldown`), 'true');
            setTimeout(() => {
                fs.writeFileSync(path.resolve(`./db/logging/${oldRole.guild.id}/roleUpdate.cooldown`), 'false');
            }, 10000);
        }

        const enabled = daalbot.fs.read(path.resolve(`./db/logging/${oldRole.guild.id}/ROLEUPDATE.enabled`), 'utf8');
        if (enabled == 'true') {
            if (!fs.existsSync(`./db/logging/${oldRole.guild.id}/channel.id`)) return;

            const channelID = daalbot.fs.read(path.resolve(`./db/logging/${oldRole.guild.id}/channel.id`), 'utf8');
            const logChannel = client.channels.cache.get(channelID);

            if (logChannel.type == ChannelType.DM) return;
            if (logChannel == undefined) return;

            const embed = new EmbedBuilder()
                .setTitle('Role Updated')
                .setDescription(`
                **Before**
                Name: ${oldRole.name}
                Color: ${oldRole.hexColor}
                Hoisted: ${oldRole.hoist}
                Mentionable: ${oldRole.mentionable}
                Position: ${oldRole.rawPosition}\n
                **After**
                Name: ${newRole.name}
                Color: ${newRole.hexColor}
                Hoisted: ${newRole.hoist}
                Mentionable: ${newRole.mentionable}
                Position: ${newRole.rawPosition}


                **IDs:**
                Role: ${newRole.id}
                `)
                .setThumbnail('https://pinymedia.web.app/daalbot/embed/thumbnail/logs/Role.png')
                .setColor('#FFE467')
                .setTimestamp()

            const pasteUrl = await daalbot.api.pasteapi.createPaste(`--- OLD ---
${JSON.stringify(oldRole, null, 4)}

--- NEW ---
${JSON.stringify(newRole, null, 4)}`, 'Role Update - JSON');

            embed.setDescription(embed.data.description + `\n[Raw Data](${pasteUrl})`)
            
            logChannel.send({
                content: `Role Updated`,
                embeds: [embed]
            })
            .then(msg => {
                // Stuff went well :)
            })
            .catch(err => {
                console.error(err);
            })
        }
    } catch (err) {
        return;
    }
});