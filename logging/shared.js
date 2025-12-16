const client = require('../client.js');
const fs = require('fs');
const Discord = require('discord.js');
const path = require('path');
const daalbot = require('../daalbot.js');

const auditLogEventTypeMapping = {
    'channelCreate': Discord.AuditLogEvent.ChannelCreate,
    'channelDelete': Discord.AuditLogEvent.ChannelDelete,
    'channelUpdate': Discord.AuditLogEvent.ChannelUpdate,
    'guildBanAdd': Discord.AuditLogEvent.MemberBanAdd,
    'guildBanRemove': Discord.AuditLogEvent.MemberBanRemove
}

/**
 * @param {string} type The type of event
 * @param {string} objectName The name of the object involved
 * @param {object} meta Any additional metadata to include
 * @param {object} object The event object
 * @param {object} [object2] The new event object (for updates)
 */
async function handleEvent(type, objectName, meta, object, object2) {
    const defaults = require(path.resolve(__dirname + `/defaults/${type}.json`));

    if (
        (
            !fs.existsSync(path.resolve(`./db/logging/${object.guild.id}/${type.toUpperCase()}.enabled`))
            || daalbot.fs.read(path.resolve(`./db/logging/${object.guild.id}/${type.toUpperCase()}.enabled`), 'utf8') != 'true'
        )
        && (
            !daalbot.db.managed.exists(object.guild.id, `logging/${type}`)
            || JSON.parse(daalbot.db.managed.get(object.guild.id, `logging/${type}`)).enabled !== true
        )
    ) return;

    try {
        let messagePayload = defaults.message;
        let destination = '';

        if (fs.existsSync(`./db/logging/${object.guild.id}/channel.id`)) destination = daalbot.fs.read(path.resolve(`./db/logging/${object.guild.id}/channel.id`));
        
        const auditLog = await daalbot.getLatestAuditLogEntries(object.guild.id);
        const auditLogEntry = auditLog.find(entry => entry.action === auditLogEventTypeMapping[type] && entry.target?.id === object.id);
        
        // Create a simplified version of the Discord.js objects for templating
        function simplifyDiscordObject(obj, properties = [
            'id', 'name', 'type', 'guildId', 'nsfw', 'topic', 
            'rateLimitPerUser', 'parentId', 'rawPosition', 'flags', 'reason'
        ]) {
            if (!obj) return null;
            
            const simplified = {};
            
            // Copy specified properties, ensuring we only copy primitive values
            properties.forEach(prop => {
                if (obj[prop] !== undefined && obj[prop] !== null) {
                    const value = obj[prop];
                    // Only copy primitive values to avoid circular references
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        simplified[prop] = value;
                    }
                }
            });
            
            // Handle parent channel specially - only copy safe properties
            if (obj.parent && obj.parent.id) {
                simplified.parent = {
                    id: obj.parent.id,
                    name: obj.parent.name || 'Unknown',
                    type: obj.parent.type || 'Unknown'
                };
            }
            
            // Handle ban user specially - copy user properties
            if (obj.user && obj.user.id) {
                simplified.user = {
                    id: obj.user.id,
                    username: obj.user.username || 'Unknown',
                    discriminator: obj.user.discriminator || '0000',
                    tag: obj.user.tag || `${obj.user.username || 'Unknown'}#${obj.user.discriminator || '0000'}`,
                    displayName: obj.user.displayName || obj.user.globalName || obj.user.username || 'Unknown',
                    avatar: obj.user.avatar || null,
                    banner: obj.user.banner || null,
                    bot: obj.user.bot || false
                };
            }
            
            return simplified;
        }

        // Create templating object with proper structure
        let templatingObject = {
            [objectName]: type.endsWith('Update') ? { 
                old: simplifyDiscordObject(object), 
                new: simplifyDiscordObject(object2) 
            } : simplifyDiscordObject(object),
            meta: {
                ...meta,
                executor: await (async () => {
                    if (!auditLogEntry) {
                        console.error(`[Debug Executor] No audit log entry found for ${type} on object ID ${object.id}`);
                        return { name: 'Unknown', id: 'Unknown' };
                    }
                    
                    const executorId = auditLogEntry.executor?.id || auditLogEntry.user?.id || auditLogEntry.executorId;
                    if (!executorId) {
                        console.error(`[Debug Executor] Audit log entry found but unable to extract executor id for ${type} on object ID ${object.id}`);
                        return { name: 'Unknown', id: 'Unknown' };
                    }
                    
                    // Try to get the username from the executor object first
                    let executorName = auditLogEntry.executor?.username || auditLogEntry.user?.username;
                    
                    // If we don't have the username but have the ID, try to fetch the user
                    if (!executorName && executorId) {
                        try {
                            console.debug(`[Debug Executor] Fetching user ${executorId} for ${type} on object ID ${object.id}`);
                            const user = daalbot.client.users.cache.get(executorId) || await daalbot.client.users.fetch(executorId);
                            executorName = user.username;
                        } catch (error) {
                            console.log(`[Debug Executor] Failed to fetch user ${executorId}:`, error.message);
                            executorName = 'Unknown';
                        }
                    }
                    
                    return {
                        name: executorName || 'Unknown',
                        id: executorId || 'Unknown'
                    };
                })(),
                reason: auditLogEntry?.reason || 'No reason provided'
            }
        }

        // For ban events, add the reason directly to the ban object for template compatibility
        if (objectName === 'ban' && templatingObject.ban) {
            templatingObject.ban.reason = auditLogEntry?.reason || object.reason || 'No reason provided';
        }

        // Check if the guild has custom logging settings for this event
        if (daalbot.db.managed.exists(object.guild.id, `logging/${type}.json`)) {
            const logSettings = JSON.parse(daalbot.db.managed.get(object.guild.id, `logging/${type}.json`));

            if (logSettings.channel) destination = logSettings.channel;
            if (logSettings.message) messagePayload = logSettings.message;
        }

        const messagePayloadString = JSON.stringify(messagePayload);
        
        messagePayload = await daalbot.convertMetaText(messagePayloadString, object.guild.id, templatingObject);

        if (!fs.existsSync(`./db/logging/${object.guild.id}/channel.id`)) return;

        const logChannel = client.channels.cache.get(destination);

        // Check if messagePayload is valid before parsing
        if (!messagePayload) {
            console.error(`[Logging] [${type}] messagePayload is undefined or null`);
            return;
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(messagePayload);
        } catch (parseError) {
            console.error(`[Logging] [${type}] Failed to parse messagePayload:`, parseError);
            console.error(`[Logging] [${type}] Raw messagePayload:`, messagePayload);
            return;
        }

        logChannel.send(parsedPayload).catch(err => {
            daalbot.guilds.log.error(object.guild.id, `[Logging] [${type}] Unable to send message to log channel.`);
        });
    } catch (err) {
        console.error(`[Logging] [${type}] Error:`, err);
        return;
    }
}

module.exports = {
    handleEvent
}