const client = require('../client.js');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const daalbot = require('../daalbot.js');

client.on('guildMemberAdd', (member) => {
    const autorole_dbFolder = path.resolve(`./db/autorole/${member.guild.id}`);
    const welcomeData = path.resolve(`./db/welcome/${member.guild.id}.json`);

    if (fs.existsSync(`${welcomeData}`) && !member.user.bot) {
        const welcome = JSON.parse(daalbot.fs.read(`${welcomeData}`, 'utf8'));
        const channel = daalbot.getChannel(member.guild.id, welcome.channel);

        let variables = {
            '{user}': `<@${member.user.id}>`,
            '{memberCount}': `${member.guild.memberCount}`
        }

        let message = welcome.message

        for (const [key, value] of Object.entries(variables)) {
            message = message.replace(key, value);
        }

        let payload = {
            content: message,
        }

        if (welcome.embed != 'none') {
            let embed = new Discord.EmbedBuilder(welcome.embed);

            let description = welcome.embed.description;

            for (const [key, value] of Object.entries(variables)) {
                description = description.replace(key, value);

                embed.setDescription(description);
            }

            payload = {
                content: message,
                embeds: [embed]
            }
        }

        channel.send(payload);
    }
    
    if (fs.existsSync(`${autorole_dbFolder}`)) {
        const files = fs.readdirSync(`${autorole_dbFolder}`);

        let roles = [];

        files.forEach(file => {
            const roleID = file.replace('.id', '');
            roles.push(roleID);
        })

        roles.forEach(role => {
            const roleObj = daalbot.getRole(member.guild.id, role);
            if (roleObj == 'Server not found.') {
                console.warn(`Autorole > Server not found.`);
            } else if (roleObj == 'Role not found.') {
                console.warn(`Autorole > Role not found.`);
            } else if (roleObj == undefined) {
                console.warn(`Autorole > Role is undefined.`);
            }

            member.roles.add(roleObj)
                .then(() => {
                })
                .catch(err => {
                    console.error(`Autorole > Failed to add ${roleObj.name} to ${member.user.tag} (${err}, Server owned by ${member.guild.ownerId})`);
                })
        });
    }

    const lockeddown = fs.existsSync(path.resolve(`./db/lockdown/${member.guild.id}/current.json`))

    if (lockeddown) {
        const lockdownConf = JSON.parse(daalbot.fs.read(path.resolve(`./db/lockdown/${member.guild.id}/config.json`), 'utf8'));
        const lockdownJSON = JSON.parse(daalbot.fs.read(path.resolve(`./db/lockdown/${member.guild.id}/current.json`), 'utf8'));

        if (member.user.bot && !lockdownConf.botAdding) member.kick(`Lockdown is active. Bots are not allowed to join.`)
        if (!member.user.bot && lockdownConf.newUsers === 'kick') member.kick(`Lockdown is active. New users are not allowed to join.`)
        if (!member.user.bot && lockdownConf.newUsers === 'isolate') {
            member.roles.add(lockdownJSON.isolationRole, `Lockdown is active. New users will be isolated.`)
        }

        const memberExists = member.guild.members.cache.get(member.user.id)?true:false;

        if (memberExists) {
            member.roles.add(lockdownJSON.role, `Lockdown is active. This role is granted to everyone during lockdown.`)
        }
    }

    // Invite tracking
    (async() => {
        if (await daalbot.db.managed.exists(member.guild.id, 'invitetracker/enabled')) {
            const data = JSON.parse(await daalbot.db.managed.get(member.guild.id, 'invitetracker/data.json'));
            
        }
    })();
});