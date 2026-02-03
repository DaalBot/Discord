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
        
        // Create a safe copy of Discord.js objects, preserving as much data as possible
        // The convertMetaText function already handles circular references and client removal
        function simplifyDiscordObject(obj, visited = new WeakSet()) {
            if (!obj) return null;
            if (typeof obj !== 'object') return obj;
            
            // Prevent infinite recursion
            if (visited.has(obj)) return null;
            visited.add(obj);
            
            const copy = {};
            
            // Get all own properties including non-enumerable ones (like _roles)
            const ownKeys = Object.getOwnPropertyNames(obj);
            
            // Also get properties from the prototype chain (getters from Discord.js classes)
            const prototypeKeys = new Set();
            let proto = Object.getPrototypeOf(obj);
            while (proto && proto !== Object.prototype) {
                for (const key of Object.getOwnPropertyNames(proto)) {
                    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
                    // Only include getters, not methods
                    if (descriptor && descriptor.get && !descriptor.set) {
                        prototypeKeys.add(key);
                    }
                }
                proto = Object.getPrototypeOf(proto);
            }
            
            // Combine both sets of keys, filtering out underscore-suffixed raw data properties
            // if we have the clean getter version
            const allKeys = new Set([...ownKeys, ...prototypeKeys]);
            
            for (const key of allKeys) {
                // Skip underscore-suffixed properties (raw API data) if present
                if (key.endsWith('_') && allKeys.has(key.slice(0, -1))) {
                    continue;
                }
                
                // Skip problematic properties that cause circular references
                if (key === 'client' || key === 'guild' || 
                    key.endsWith('Manager') || key === 'manager' ||
                    key === 'cache' || key === 'members' || key === 'channels' ||
                    key === 'roles' || key === 'emojis' || key === 'stickers' ||
                    key === 'messages' || key === 'presences' || key === 'voiceStates') {
                    continue;
                }
                
                let value;
                try {
                    value = obj[key];
                } catch (e) {
                    // Skip properties that throw errors when accessed
                    continue;
                }
                
                // Skip functions but NOT undefined - undefined should become null for templates
                if (typeof value === 'function') {
                    continue;
                }
                
                // Convert undefined to null for better template handling
                if (value === undefined) {
                    copy[key] = null;
                    continue;
                }
                
                const valueType = typeof value;
                
                // Copy primitives directly
                if (value === null || 
                    valueType === 'string' || valueType === 'number' || 
                    valueType === 'boolean' || valueType === 'bigint') {
                    copy[key] = value;
                }
                // Handle Discord.js Collections (Map-like objects)
                else if (value && typeof value.toJSON === 'function' && 
                         (value.constructor.name === 'Collection' || value instanceof Map)) {
                    // Convert Collection/Map to array or plain object
                    try {
                        const jsonValue = value.toJSON();
                        copy[key] = jsonValue;
                    } catch (e) {
                        // If toJSON fails, try converting to array
                        copy[key] = Array.from(value.values());
                    }
                }
                // Handle plain arrays
                else if (Array.isArray(value)) {
                    // Copy arrays, recursively simplifying object elements
                    copy[key] = value.map(item => {
                        if (typeof item === 'object' && item !== null) {
                            return simplifyDiscordObject(item, visited);
                        }
                        return item;
                    });
                }
                // Handle nested objects (like parent, user, etc)
                else if (valueType === 'object') {
                    // Check if it's a Discord.js object (has id property) or plain object
                    if (value.id || value.constructor === Object) {
                        copy[key] = simplifyDiscordObject(value, visited);
                    }
                }
            }
            
            // For properties that might be null but templates expect to access nested properties,
            // create placeholder objects so template paths don't break
            const nestedNullableProps = ['parent'];
            for (const prop of nestedNullableProps) {
                if ((prop in obj) && (obj[prop] === null || obj[prop] === undefined) && !(prop in copy)) {
                    // Create a placeholder object with null id so templates can safely access .id
                    copy[prop] = { id: null, name: null };
                }
            }
            
            return copy;
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