const client = require('../client.js');
const config = require('../config.json');
const daalbot = require('../daalbot.js');
const fs = require('fs');
const path = require('path');
const DJS = require('discord.js');

client.on('messageCreate', msg => {
    if (msg.author.bot) return;
    if (msg.content.startsWith(['!', '$', '.'])) return;
    const XPamount = Math.floor(Math.random() * 10) + 1;
    
    const GuildXpFolder = path.resolve(`./db/xp/${msg.guild.id}`);
    const MemberXpFile = path.resolve(`./db/xp/${msg.guild.id}/${msg.author.id}.xp`);

    if (!fs.existsSync(GuildXpFolder)) {
        fs.mkdirSync(GuildXpFolder);
    }

    const newXp = fs.existsSync(MemberXpFile) ? `${parseInt(fs.readFileSync(MemberXpFile)) + XPamount}` : `${XPamount}`;

    daalbot.fs.write(MemberXpFile, newXp);

    const level = parseInt(newXp.slice(0, -3)) || 0;

    if (msg.guild.id ==  config.servers.vortex.id) {
        if (level == 0) return;

        const levelObj = config.servers.vortex.roles.levels.find(obj => obj.level == level);
        if (!levelObj || levelObj.level == undefined) return;

        const role = daalbot.getRole(msg.guild.id, levelObj.role);

        if (role == undefined || role == 'Role not found.' || role == 'Server not found.') return;

        if (msg.member.roles.cache.has(role.id)) return;

        msg.member.roles.add(role.id)
            .then(() => {
                const botCmdsChannel = msg.guild.channels.cache.get(config.servers.vortex.channels.botCmds);

                // if (!botCmdsChannel.type == 'GUILD_TEXT') return;

                const embed = new daalbot.embed()
                    .setTitle('Level Up!')
                    .setDescription(`Congratulations on leveling up ${msg.author.username}! You are now level ${level} and have unlocked the ${role.name.split(' - ')[0]} role`)
                    .setThumbnail(msg.author.avatarURL())
                    .setColor('#00aae3')
                    .setImage('https://pinymedia.web.app/Vortex/LevelUp.png')
                    .setAuthor({
                        name: 'Vortex Creative',
                        iconURL: 'https://pinymedia.web.app/VortexLogo.png',
                    });

                const row = new DJS.MessageActionRow()

                const moreInfoButton = new DJS.MessageButton()
                    .setLabel('More Info')
                    .setStyle('LINK')
                    .setURL('https://discord.com/channels/973711816226136095/1001724255215558766/1059587784496648212')
                    .setEmoji('📖');

                row.addComponents(moreInfoButton);

                botCmdsChannel.send({
                    content: `<@${msg.author.id}>`,
                    embeds: [embed],
                    components: [
                        row
                    ]
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch(err => {
                console.log(err);
            })
    } else {
        if (level == 0) return;

        const levelFile = path.resolve(`./db/xp/${msg.guild.id}/rewards/${level}.reward`);

        if (!fs.existsSync(levelFile)) return;

        const rewardRole = fs.readFileSync(levelFile, 'utf8')

        if (rewardRole == undefined) return;

        const role = daalbot.getRole(msg.guild.id, rewardRole);

        if (role == undefined || role == 'Role not found.' || role == 'Server not found.') return;

        if (msg.member.roles.cache.has(role.id)) return;

        msg.member.roles.add(role.id)
            .then(async() => {
                const silentUsers = fs.readFileSync(path.resolve(`./db/xp/silent.users`), 'utf8').split('\n');

                const levelUpChannel = daalbot.getChannel(msg.guild.id, await daalbot.db.getChannel(msg.guild.id, 'levels'));

                if (levelUpChannel == null) return;

                const levelUpEmbed = new DJS.MessageEmbed()
                    .setTitle('Level Up!')
                    .setDescription(`Congratulations on leveling up <@${msg.author.id}>! You are now level ${level} and have unlocked the ${role.name} role`)
                    .setTimestamp();

                const row = new DJS.MessageActionRow()

                const menuButton = new DJS.MessageButton()
                    .setLabel('Menu')
                    .setStyle('PRIMARY')
                    .setCustomId('levelUpMenu')
                    .setEmoji('📖');

                row.addComponents(menuButton);

                levelUpChannel.send({
                    content: silentUsers.includes(msg.author.id) ? null : `<@${msg.author.id}>`,
                    embeds: [levelUpEmbed],
                    components: [row]
                })
            })
    }
})