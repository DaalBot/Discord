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
 * @property {{ payload: Object, channel: string }} message - The message content to be sent when an invite is used.
*/

client.on('inviteCreate', invite => {
    const guild = invite.guild;

    if (!daalbot.db.managed.exists(guild.id, 'inviteTracking.json')) return;
    
    /** @type {InviteTracking} */
    const inviteTracking = JSON.parse(daalbot.db.managed.get(guild.id, 'inviteTracking.json'));
    if (inviteTracking && inviteTracking.enabled) {
        const trackedInvite = inviteTracking.invites.find(i => i.code === invite.code);
        if (!trackedInvite) {
            inviteTracking.invites.push({
                code: invite.code,
                uses: invite.uses,
                creator: invite.inviter ? invite.inviter.id : null,
                users: []
            });
            daalbot.db.managed.set(guild.id, 'inviteTracking.json', JSON.stringify(inviteTracking));
        }
    }
});

client.on('inviteDelete', invite => {
    const guild = invite.guild;
    
    if (!daalbot.db.managed.exists(guild.id, 'inviteTracking.json')) return;
    /** @type {InviteTracking} */
    const inviteTracking = JSON.parse(daalbot.db.managed.get(guild.id, 'inviteTracking.json'));
    if (inviteTracking && inviteTracking.enabled) {
        const index = inviteTracking.invites.findIndex(i => i.code === invite.code);
        if (index !== -1) {
            inviteTracking.invites.splice(index, 1);
            daalbot.db.managed.set(guild.id, 'inviteTracking.json', JSON.stringify(inviteTracking));
        }
    }
});