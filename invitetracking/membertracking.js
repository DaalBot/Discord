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

client.on('guildMemberAdd', member => {
    const guild = member.guild;

    if (!daalbot.db.managed.exists(guild.id, 'inviteTracking.json')) return;

    /** @type {InviteTracking} */
    const inviteTracking = JSON.parse(daalbot.db.managed.get(guild.id, 'inviteTracking.json'));
    if (inviteTracking && inviteTracking.enabled) {
        guild.invites.fetch().then(invites => {
            // First, remove the user from all invites to prevent duplicates
            inviteTracking.invites.forEach(invite => {
                invite.users = invite.users.filter(id => id !== member.id);
            });

            // Then find which invite was used and add the user to that specific invite
            inviteTracking.invites.find(i => {
                const trackedInvite = invites.get(i.code);
                if (trackedInvite && trackedInvite.uses > i.uses) {
                    i.uses = trackedInvite.uses;
                    i.users.push(member.id); // Add user to the invite they actually used
                    daalbot.db.managed.set(guild.id, 'inviteTracking.json', JSON.stringify(inviteTracking));
                    console.log(`Updated invite tracking for ${member.user.tag} in guild ${guild.id}:`, i);
                    return true; // Stop checking invites once we find a match
                }
                return false; // Continue checking all invites
            });
        }).catch(console.error);
    }
});

client.on('guildMemberRemove', member => {
    const guild = member.guild;

    if (!daalbot.db.managed.exists(guild.id, 'inviteTracking.json')) return;

    /** @type {InviteTracking} */
    const inviteTracking = JSON.parse(daalbot.db.managed.get(guild.id, 'inviteTracking.json'));
    if (inviteTracking && inviteTracking.enabled) {
        inviteTracking.invites.forEach(invite => {
            if (invite.users.includes(member.id)) {
                invite.users = invite.users.filter(id => id !== member.id);
                daalbot.db.managed.set(guild.id, 'inviteTracking.json', JSON.stringify(inviteTracking));
                console.log(`Removed ${member.user.tag} from invite tracking in guild ${guild.id}:`, invite);
            }
        });
    }
});