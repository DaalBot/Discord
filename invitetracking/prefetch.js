const { DiscordjsError } = require('discord.js');
const client = require('../client');
const daalbot = require('../daalbot');

/**
 * @typedef TrackedInvite
 * @property {string} code - The invite code.
 * @property {number} uses - The number of times the invite has been used.
 * @property {string | null} creator - The user ID of the person who created the invite.
 * @property {Array<string>} users - The list of user IDs who have used the invite.
 */

/**
 * @typedef InviteTracking
 * @property {boolean} enabled - Whether invite tracking is enabled.
 * @property {Array<TrackedInvite>} invites - The list of tracked invites.
 */

client.on('clientReady', () => {
    setTimeout(() => {
        client.guilds.cache.forEach(async guild => {
            if (!daalbot.db.managed.exists(guild.id, 'inviteTracking.json')) return;
            
            /** @type {InviteTracking} */
            const inviteTracking = JSON.parse(daalbot.db.managed.get(guild.id, 'inviteTracking.json'));
            if (inviteTracking && inviteTracking.enabled) {
                try {
                    const result = await guild.invites.fetch();

                    result.forEach(invite => {
                        const trackedInvite = inviteTracking.invites.find(i => i.code === invite.code);
                        if (trackedInvite) {
                            if (trackedInvite.uses < invite.uses)
                                trackedInvite.uses = invite.uses;
                        } else {
                            inviteTracking.invites.push({
                                code: invite.code,
                                uses: invite.uses,
                                creator: invite.inviter ? invite.inviter.id : null,
                                users: []
                            });
                        }
                    });

                    daalbot.db.managed.set(guild.id, 'inviteTracking.json', JSON.stringify(inviteTracking));
                } catch (e) {
                    console.error(`Failed to prefetch invites for guild ${guild.id}:`, e);

                    if (e instanceof DiscordjsError) {
                        console.error(`Discord.js error: ${e.message} (Code: ${e.code}) in guild ${guild.id}`);
                    }
                }
            }
        });
    }, 5000); // "ready" isn't actually ready for reasons.. ig
});