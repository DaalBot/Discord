const { GuildMember } = require("discord.js");
const client = require("../../client");
const { handleEvent: handleEventOriginal } = require("../shared");
const daalbot = require("../../daalbot");

/**
 * @param {string} type The type of event
 * @param {string} objectName The name of the object involved
 * @param {object} meta Any additional metadata to include
 * @param {GuildMember} object The event object
 * @param {GuildMember} [object2] The new event object (for updates)
*/
function handleEvent(type, objectName, meta, object, object2) {
    console.log('Handling member event with invite tracking');
    const memberId = object.user.id;
    console.log('Member ID:', memberId);
    if (!daalbot.db.managed.exists(object.guild.id, 'inviteTracking.json')) return handleEventOriginal(type, objectName, meta, object, object2);
    console.log('Invite tracking exists for guild:', object.guild.id);

    setTimeout(() => { // Delay to ensure that invite tracking has updated
        /** @type {import('../../invitetracking/membertracking').InviteTracking} */
        const inviteTracking = JSON.parse(daalbot.db.managed.get(object.guild.id, 'inviteTracking.json'));
        if (inviteTracking && inviteTracking.enabled) {
            console.log('Invite tracking is enabled for guild:', object.guild.id);
            for (const invite of inviteTracking.invites) {
                if (invite.users.includes(memberId)) {
                    console.log('Found invite for member:', memberId, 'with invite:', invite);
                    return handleEventOriginal(type, objectName, {
                        ...meta,
                        invite
                    }, object, object2);
                }
            }
        }
        
        console.log('No invite found for member:', memberId);
        return handleEventOriginal(type, objectName, meta, object, object2);
    }, 2000)
}

/**
 * 
 * @param {GuildMember} member 
 */
function getMeta(member) {
    return {
        createdTimestamp: Math.floor(member.user.createdTimestamp / 1000) // For Discord timestamp formatting
    }
}

client.on('guildMemberAdd', async(member) => handleEvent('guildMemberAdd', 'member', getMeta(member), member));
client.on('guildMemberUpdate', async(oldMember, newMember) => handleEvent('guildMemberUpdate', 'member', getMeta(newMember), oldMember, newMember));
client.on('guildMemberRemove', async(member) => handleEvent('guildMemberRemove', 'member', getMeta(member), member));