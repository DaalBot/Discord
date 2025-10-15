const client = require('../client');
const daalbot = require('../daalbot');

const wait = require('timers/promises').setTimeout;

/**
 * @typedef TrackedInvite
 * @property {string} code - The invite code.
 * @property {number} uses - The number of times the invite has been used.
 * @property {Array<string>} users - The list of user IDs who have used the invite.
 */

/**
 * @typedef InviteTracking
 * @property {boolean} enabled - Whether invite tracking is enabled.
 * @property {Array<TrackedInvite>} invites - The list of tracked invites.
 */

/**
 * @typedef LinkedRoles
 * @property {boolean} enabled - Whether role linking is enabled.
 * @property {Object<string, Array<string>>} links - The mapping of invite codes to role IDs.
 */

client.on('guildMemberAdd', async(member) => {
    const guild = member.guild;
    if (!daalbot.db.managed.exists(guild.id, 'roleLinks.json')) return;
    await wait(2000); // Let invite tracking catch up

    if (!daalbot.db.managed.exists(guild.id, 'inviteTracking.json')) return;

    /** @type {InviteTracking} */
    const tracking = JSON.parse(daalbot.db.managed.get(guild.id, 'inviteTracking.json'));
    if (!tracking.enabled) return; // Data is probably outdated if tracking is disabled

    let usedInvite = 'unknown';

    tracking.invites.forEach((invite) => {
        if (invite.users.includes(member.id)) {
            usedInvite = invite.code;
            return;
        }
    });

    if (usedInvite === 'unknown') return console.warn(`Could not determine invite used by ${member.user.tag} (${member.id}) in guild ${guild.name} (${guild.id})`);
    console.log(`Member ${member.user.tag} (${member.id}) joined guild ${guild.name} (${guild.id}) using invite ${usedInvite}`);
    
    /** @type {LinkedRoles} */
    const roleLinks = JSON.parse(daalbot.db.managed.get(guild.id, 'roleLinks.json'));
    if (!roleLinks.enabled) return;

    if (Object.keys(roleLinks.links).includes(usedInvite)) {
        const rolesToAdd = roleLinks.links[usedInvite];
        rolesToAdd.forEach(async(roleId) => {
            const role = guild.roles.cache.get(roleId);
            if (!role) return console.warn(`Role ID ${roleId} linked to invite ${usedInvite} in guild ${guild.name} (${guild.id}) does not exist`);
            try {
                await member.roles.add(role, 'Role linked to invite used for joining the server');
                console.log(`Added role ${role.name} (${role.id}) to ${member.user.tag} (${member.id}) in guild ${guild.name} (${guild.id}) for using invite ${usedInvite}`);
            } catch (err) {
                console.error(`Failed to add role ${role.name} (${role.id}) to ${member.user.tag} (${member.id}) in guild ${guild.name} (${guild.id}):`, err);
            }
        });
    }
});