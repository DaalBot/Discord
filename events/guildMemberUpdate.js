const client = require('../client.js');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const daalbot = require('../daalbot.js');

client.on('guildMemberUpdate', async(oldMember, newMember) => {
    if (oldMember.roles.cache.size != newMember.roles.cache.size) {
        const newRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

        newRoles.forEach(async(role) => {
            if (!(await daalbot.db.managed.exists(newMember.guild.id, `linkedRoles/${role.id}`))) return;

            const linkedRoles = await daalbot.db.managed.get(newMember.guild.id, `linkedRoles/${role.id}`);
            const roles = linkedRoles.split('\n');

            roles.forEach(async(linkedRole) => {
                if (linkedRole == '') return;

                const role = newMember.guild.roles.cache.get(linkedRole);

                if (!newMember.roles.cache.has(role.id)) {
                    newMember.roles.add(role);
                }
            })
        })
    }
})