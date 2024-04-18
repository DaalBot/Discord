const client = require('../../client.js');

client.on('guildMemberUpdate', async(oldMember, newMember) => {
    if (!newMember.guild.id === '1015322440152383539') return; // Check if the guild is the olilz server
    if (newMember.user.id === '1101980561138008095' && false) {
        // Blacklist roles
        const rolesBlacklist = [
            // '1023561501933572116', // Head moderator
            // '1015608653132349480', // Moderator
            '1015703997736308776', // Super Admin
            '1015609359956463626', // Management
            '1015592213633318953', // Owner
        ]

        // Check if minity has any of the blacklisted roles
        for (let i = 0; i < rolesBlacklist.length; i++) {
            if (newMember.roles.cache.has(rolesBlacklist[i])) {
                // If minity has any of the blacklisted roles, remove them
                newMember.roles.remove(rolesBlacklist[i]);
                
                newMember.guild.channels.cache.get('1016768441769803808').send({
                    content: `<@747928399326216334><@900126154881646634>\nMinity has been removed from the role <@&${rolesBlacklist[i]}> because he is not allowed to have it.`,
                    allowedMentions: {
                        users: [
                            '747928399326216334',
                            '900126154881646634'
                        ],
                        roles: []
                    }
                })
            }
        }
    }
})