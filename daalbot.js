const client = require('./client.js');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const cleanText = require('./util/homoglyphs.js');
require('dotenv').config();
const axios = require('axios');
const { EventEmitter } = require('events');
const net = require('net');
const crypto = require('crypto');

const AUDIT_LOG_HISTORY_LIMIT = 5;

/**
 * @type {Map<string, Discord.GuildAuditLogsEntry>}
*/
let auditLogEntryHistory = new Map();

client.on('guildAuditLogEntryCreate', (entry, guild) => {
    // Add the entry to the map
    if (!auditLogEntryHistory.has(guild.id))
        auditLogEntryHistory.set(guild.id, []);

    const guildHistory = auditLogEntryHistory.get(guild.id);
    guildHistory.push(entry);
    if (guildHistory.length > AUDIT_LOG_HISTORY_LIMIT) guildHistory.shift(); // Remove the oldest entry if we exceed the limit
    auditLogEntryHistory.set(guild.id, guildHistory);
});

const serverAmount = client.guilds.cache.size

function findServerVanity(server) {
    if (client.guilds.cache.get(server) == undefined) {
        return "Server not found.";
    } else {
        if (client.guilds.cache.get(server)?.vanityURLCode) {
            return client.guilds.cache.get(server)?.vanityURLCode;
        } else {
            return `No vanity URL found for ${server}`;
        }
    }
}

function fetchServer(server) {
    if (client.guilds.cache.get(server) == undefined) {
        return "Server not found.";
    } else {
        return client.guilds.cache.get(server);
    }
}

function fetchServerName(server) {
    if (client.guilds.cache.get(server) == undefined) {
        return "Server not found.";
    } else {
        return client.guilds.cache.get(server).name;
    }
}

function fetchServerOwner(server) {
    if (client.guilds.cache.get(server) == undefined) {
        return "Server not found.";
    } else {
        return client.users.cache.get(client.guilds.cache.get(server).ownerID);
    }
}

function getRole(server, role) {
    if (client.guilds.cache.get(server) == undefined) {
        return "Server not found.";
    } else {
        if (client.guilds.cache.get(server).roles.cache.get(role)) {
            return client.guilds.cache.get(server).roles.cache.get(role);
        } else {
            return "Role not found.";
        }
    }
}

function getChannel(server, channel) {
    if (client.guilds.cache.get(server) == undefined) {
        return "Server not found.";
    } else {
        if (client.guilds.cache.get(server).channels.cache.get(channel)) {
            return client.guilds.cache.get(server).channels.cache.get(channel);
        } else {
            return "Channel not found.";
        }
    }
}

function getUser(user) {
    if (client.users.cache.get(user)) {
        return client.users.cache.get(user);
    } else {
        return "User not found.";
    }
}

function getMember(server, member) {
    if (client.guilds.cache.get(server) == undefined) {
        return "Server not found.";
    } else {
        if (client.guilds.cache.get(server).members.cache.get(member)) {
            return client.guilds.cache.get(server).members.cache.get(member);
        } else {
            return "Member not found.";
        }
    }
}
   
function db_mongo_warn_create(userId, guildId, staffId, reason) {
    const warnSchema = require('./models/warn-schema.js');
    warnSchema.create({
        userId: userId,
        guildId: guildId,
        staffId: staffId,
        reason: reason
    })
}

function db_mongo_warn_delete(id) {
    const warnSchema = require('./models/warn-schema.js');
    warnSchema.findByIdAndDelete(id).then(() => {
        return `Deleted warn with id "${id}"`;
    }).catch(() => {
        return `Failed to delete warn with id "${id}"`;
    })
}

function botLog(text) {
    console.log(text);
}

function config_get() {
    return config;
}

const warnings = {
    create: db_mongo_warn_create,
    delete: db_mongo_warn_delete
}

function betterFS_write(path, data, encryptContents = false) {
    // Get file directory
    const fileDirectory = path.split('/').slice(0, -1).join('/');

    // Check if the directory exists
    if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory, { recursive: true });
    }

    const wData = encryptContents ? `ENC\n${encrypt(data)}` : data;
    fs.writeFileSync(path, wData, { flag: 'w' });
    return "Success";
}

function betterFS_read(path) {
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf8');

        if (data.startsWith('ENC\n')) {
            // The data inside is encrypted
            const encryptedData = data.replace('ENC\n', '');
            return decrypt(encryptedData);
        } 

        else return data;
    } else {
        return "File not found.";
    }
}

async function getLogChannel(guild) {
    return getChannel(getLogChannelId(guild));
}

async function getLogChannelId(guild) {
    if (fs.existsSync(path.resolve(`./db/logging/${guild}/channel.id`))) {
        return betterFS_read(path.resolve(`./db/logging/${guild}/channel.id`), 'utf8');
    } else {
        return null;
    }
}

async function logEvent(guild, event, embed) {
    if (getLogChannelId(guild)) {
        const logChannel = await getLogChannel(guild);

        if (logChannel === 'Server not found.' || logChannel === 'Channel not found.' || logChannel == undefined) return;

        if (fs.existsSync(path.resolve(`./db/logging/${guild}/${event.toUpperCase()}.enabled`))) {
            if (betterFS_read(path.resolve(`./db/logging/${guild}/${event.toUpperCase()}.enabled`), 'utf8') == 'true') {
                logChannel?.send({
                    content: embed.title,
                    embeds: [embed]
                });
            } else return;
        } else return;
    } else return;
}

class DatabaseEntry {
    constructor({category, subcategory, entry, data}) {
        this.category = `${category}`;
        this.subcategory = `${subcategory ? subcategory : ''}`;
        this.entry = `${entry}`;

        this.path = `${config.botPath}/db/${category}/${subcategory !== '' ? `${subcategory}/` : ''}${entry}`;

        if (fs.existsSync(this.path)) {
            this.data = fs.readFileSync(this.path, 'utf8');
        } else {
            this.data = `${data}`;

            if (fs.existsSync(`${config.botPath}/db/${category}/${subcategory}`)) {
                fs.appendFileSync(this.path, this.data);
            } else {
                fs.mkdirSync(`${config.botPath}/db/${category}/${subcategory}`, { recursive: true });

                fs.appendFileSync(this.path, this.data);
            }
        }
    }

    modify(data) {
        fs.writeFileSync(this.path, data);
        this.data = data;
    }

    delete() {
        fs.unlinkSync(this.path);
        this.data = null;
    }
}

async function DatabaseSetChannel(guild, type, channel) {
    const filePath = path.resolve(`./db/config/${guild}/channels/${type}.id`);
    const fileDirectory = path.resolve(`./db/config/${guild}/channels`);

    if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory, { recursive: true });
    }

    betterFS_write(filePath, channel);
}

async function DatabaseGetChannel(guild, type) {
    const filePath = path.resolve(`./db/config/${guild}/channels/${type}.id`);

    if (fs.existsSync(filePath)) {
        return betterFS_read(filePath);
    } else {
        return null;
    }
}

/**
 * @param {string} guild
 * @param {string} pathName
 * @param {string} data
 * @param {'w' | 'a'} flags
*/
async function managedDBSet(guild, pathName, data, flags = 'w') {
    switch (flags) {
        case 'w':
            betterFS_write(path.resolve(`./db/managed/${guild}/${pathName}`), `${data}`, true);
            break;
        case 'a':
            if (!fs.existsSync(path.resolve(`./db/managed/${guild}/${pathName}`.split('/').slice(0, -1).join('/')))) {
                fs.mkdirSync(path.resolve(`./db/managed/${guild}/${pathName}`.split('/').slice(0, -1).join('/')), { recursive: true });
                return fs.appendFileSync(path.resolve(`./db/managed/${guild}/${pathName}`), `ENC\n${encrypt(data)}`);
            }

            // If the file exists, It may be encrypted or not, so we need to use the betterFS_read function to get the data and manually append the data to it
            const existingData = betterFS_read(path.resolve(`./db/managed/${guild}/${pathName}`));
            const newData = existingData + data;
            
            betterFS_write(path.resolve(`./db/managed/${guild}/${pathName}`), newData, true);

            break;
    }
}

/**
 * @param {string} guild 
 * @param {string} pathName 
 * @returns {string | "File not found."}
 */
function managedDBGet(guild, pathName) {
    return betterFS_read(path.resolve(`./db/managed/${guild}/${pathName}`));
}

/**
 * @param {string} guild 
 * @param {string} pathName
*/
function managedDBExists(guild, pathName) {
    return fs.existsSync(path.resolve(`./db/managed/${guild}/${pathName}`)) ?? false;
}

/**
 * @param {string} guild
 * @param {string} pathName
*/
function managedDBDelete(guild, pathName) {
    fs.unlinkSync(path.resolve(`./db/managed/${guild}/${pathName}`));
}

/**
 * @param {string} guild
 * @param {string} pathName
 * @param {string | Object} data
 * @param {('exists')[]} failures
*/
async function managedDBInsert(guild, pathName, data, failures) {
    const dataType = typeof data;

    const existingFile = managedDBExists(guild, pathName) ? await managedDBGet(guild, pathName) : null;
    
    if (dataType == 'object' && data.id) {
        if (existingFile) {
            const existingData = JSON.parse(existingFile);
            const existingDataIndex = existingData.findIndex(d => d.id === data.id);

            if (existingDataIndex !== -1) {
                if (failures.includes('exists')) throw new Error('Entry already exists.');

                // Update the existing entry
                existingData[existingDataIndex] = data;
                await managedDBSet(guild, pathName, JSON.stringify(existingData));
            } else {
                // Add the new entry
                existingData.push(data);
                managedDBSet(guild, pathName, JSON.stringify(existingData));
            }
        } else {
            await managedDBSet(guild, pathName, JSON.stringify([data]));
        }
    } else {
        if (existingFile) {
            const existingData = JSON.parse(existingFile);

            if (existingData.includes(data) && failures.includes('exists'))
                throw new Error('Entry already exists.');

            managedDBSet(guild, pathName, JSON.stringify([...existingData, data]));
        } else {
            managedDBSet(guild, pathName, JSON.stringify([data]));
        }
    }
}

async function sendAlert(guild, embed, message) {
    const alertChannel = await DatabaseGetChannel(guild, 'alerts');

    if (alertChannel) {
        client.channels.cache.get(alertChannel).send({
            content: message ? message : null,
            embeds: [embed]
        });
    }
}

/**
 * @param {string} id
 */
async function API_get_user(id) {
    try {
        const response = await axios.get(`https://discord.com/api/v9/users/${id}`, {
            headers: {
                'Authorization': `Bot ${process.env.TOKEN}`
            }
        });

        return response.data;
    } catch (error) {
        return error;
    }
}

async function API_get_guild(id) {
    try {
        const response = await axios.get(`https://discord.com/api/v9/guilds/${id}`, {
            headers: {
                'Authorization': `Bot ${process.env.TOKEN}`
            }
        });

        return response.data;
    } catch (err) {
        return err;
    }
}

async function API_get_role(guild, id) {
    try {
        const response = await axios.get(`https://discord.com/api/v9/guilds/${guild}/roles/${id}`, {
            headers: {
                'Authorization': `Bot ${process.env.TOKEN}`
            }
        });

        return response.data;
    } catch (err) {
        return err;
    }
}

/**
 * @param {string} url
 * @returns {Promise<string>}
*/
async function createPermanentImgLink(url, checkHash = false) {
    try {
        if (!url) return 'https://media.piny.dev/Error.png';

        if (checkHash) {
            const imageReq = await axios.get(url);
            const imageData = imageReq.data;

            const hash = crypto.createHash('sha256').update(imageData).digest('hex');

            const hashFile = await managedDBGet('global', 'imgbb.hash');

            if (hashFile.includes(hash)) {
                // We know this image has been uploaded before now we just need to get the URL
                const combos = hashFile.split('\n');
                const combo = combos.find(c => c.includes(hash));

                return combo.split(':')[1];
            }
        }

        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_KEY}&image=${url}`);
        const imageUrl = response.data.data.display_url;

        if (checkHash) managedDBSet('global', 'imgbb.hash', `\n${hash}:${imageUrl}`, 'a');

        return imageUrl;
    } catch (err) {
        console.error(err.response.data.error)
        console.error(err.response)
        return 'https://media.piny.dev/Error.png'
    }
}

function premiumActivateServer(guild, user) {
    /**
     * @type {{users: {id: string, boosts: number, servers_activated: number, servers: string[]}[], guilds: {id: string, activated_by: string}[]}}
    */
    const premiumJSON = JSON.parse(betterFS_read(path.resolve(`./db/premium.json`), 'utf8'));

    const premiumUser = premiumJSON.users.find(u => u.id === user);

    if (!premiumUser) {
        return 1;
    }

    if (premiumUser.servers_activated >= premiumUser.boosts) {
        return 2;
    }

    const premiumGuild = premiumJSON.guilds.find(g => g.id === guild);

    if (premiumGuild) {
        return 3;
    }

    premiumUser.servers_activated += 1;

    premiumJSON.guilds.push({
        id: guild,
        activated_by: user
    })

    premiumUser.servers.push(guild);

    fs.writeFileSync(path.resolve(`./db/premium.json`), JSON.stringify(premiumJSON, null, 4));

    return 0;
}

function premiumDeactivateServer(guild, user) {
    /**
     * @type {{users: {id: string, boosts: number, servers_activated: number, servers: string[]}[], guilds: {id: string, activated_by: string}[]}}
    */
    const premiumJSON = JSON.parse(betterFS_read(path.resolve(`./db/premium.json`), 'utf8'));

    const premiumUser = premiumJSON.users.find(u => u.id === user);

    if (!premiumUser) {
        return 1;
    }

    const premiumGuild = premiumJSON.guilds.find(g => g.id === guild);

    if (!premiumGuild) {
        return 2;
    }

    if (premiumGuild.activated_by !== user) {
        return 3;
    }

    premiumUser.servers_activated -= 1;

    premiumJSON.guilds.splice(premiumJSON.guilds.indexOf(premiumGuild), 1);

    premiumUser.servers.splice(premiumUser.servers.indexOf(guild), 1);

    fs.writeFileSync(path.resolve(`./db/premium.json`), JSON.stringify(premiumJSON, null, 4));

    return 0;
}

function premiumIsServerActivated(guild) {
    /**
     * @type {{users: {id: string, boosts: number, servers_activated: number, servers: string[]}[], guilds: {id: string, activated_by: string}[]}}
    */
    const premiumJSON = JSON.parse(betterFS_read(path.resolve(`./db/premium.json`), 'utf8'));

    const premiumGuild = premiumJSON.guilds.find(g => g.id === guild);

    if (!premiumGuild) {
        return false;
    }

    return true;
}

/**
 * @param {string} input
 * @param {Discord.TextChannel | undefined} channel
*/
async function getMessageFromString(input, channel) {
    let messageId = null;
    let channelId = null;

    let channelObj = channel?.id ? channel : null;

    if (input.includes('https')) {
        let cleanLink = input.trim().replace(/https:\/\/(.*|)discord.com\/channels\//g, ''); // Remove the discord.com/channels/ part of the link (leaves 1017715574639431680/1017715576073895958/1222990713088643243)
        const components = cleanLink.split('/');
        channelId = components[1];
        messageId = components[2];

        channelObj = client.channels.cache.get(channelId);
    } else {
        messageId = input;
    }

    if (!channelObj) return null;

    const message = await channelObj.messages.fetch(messageId);

    return message;
}

async function youtube_GetChannelUploads(channelId, minified = false) {
    try {
        // Get channel info
        const response = await axios.get(`https://pipedapi.kavin.rocks/channel/${channelId}`);
        const data = response.data;

        if (minified) {
            return data.relatedStreams.map(video => {
                return video.url.replace('/watch?v=', ''); // Only need the video id to get the video in the future
            })
        } else {
            return data.relatedStreams;
        }
    } catch(e) {
        console.error(e);
        return null;
    }
}

async function youtube_isVideoValid(videoId) {
    try {
        const response = await axios.get(`https://pipedapi.kavin.rocks/video/${videoId}`);
        const data = response.data;

        return !(data.disabled); // If the video is disabled, return false (not valid)
    } catch {
        return false;
    }
}

async function youtube_channelIdToName(channelId) {
    try {
        const response = await axios.get(`https://pipedapi.kavin.rocks/channel/${channelId}`);
        const data = response.data;

        return data.name;
    } catch {
        return null;
    }
}

async function id_generatestring(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    // Default settings: 2.08592483976E93 possible combinations [length ^ 62 (< charset length)]
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result.replace(/\B(?=(.{5})+(?!.))/g, '-');
}

/**
 * @param {string} host
 * @param {number} port
 * @param {string} data
 * @returns {Promise<string>}
*/
async function netcat(host, port, data) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = '';

        client.connect(port, host, () => {
            client.write(data);
        });

        client.on('data', (data) => {
            responseData += data;
        });

        client.on('end', () => {
            client.destroy(); // Clean up the client socket
            resolve(responseData);
        });

        client.on('error', (err) => {
            client.destroy(); // Clean up the client socket
            reject(err);
        });
    });
}

/**
 * @param {string} string
 * @returns {Promise<string>}
*/
async function pasteapi_create_paste(string) {
    try {
        // Termbin URL
        const response = await netcat('termbin.com', 9999, string);

        const data = {
            termbin: response.replace('https://termbin.com/', ''), // Just get the id
            ts: Date.now()
        }

        const base64 = Buffer.from(JSON.stringify(data)).toString('base64');

        return `https://daalbot.xyz/api/paste?data=${encodeURIComponent(base64)}`
    } catch (err) {
        console.error(err);
        return 'https://daalbot.xyz/api/paste?data=error'
    }
}

async function addXP(guild, user, amount) {
    const DJS = Discord;
    const XPamount = parseInt(amount);
    const GuildXpFolder = path.resolve(`./db/xp/${guild}`);
    const MemberXpFile = path.resolve(`./db/xp/${guild}/${user}.xp`);

    if (!fs.existsSync(GuildXpFolder)) {
        fs.mkdirSync(GuildXpFolder);
    }

    const newXp = fs.existsSync(MemberXpFile) ? `${parseInt(betterFS_read(MemberXpFile)) + XPamount}` : `${XPamount}`;

    betterFS_write(MemberXpFile, `${newXp}`);

    const level = parseInt(newXp.slice(0, -3)) || 0;

    if (level == 0) return;

    const levelFile = path.resolve(`./db/xp/${guild}/rewards/${level}.reward`);

    if (!fs.existsSync(levelFile)) return;

    const rewardRole = betterFS_read(levelFile, 'utf8')

    if (rewardRole == undefined) return;

    const role = getRole(guild, rewardRole);

    if (role == undefined || role == 'Role not found.' || role == 'Server not found.') return;

    const member = getMember(guild, user)

    if (member.roles.cache.has(role.id)) return;

    member.roles.add(role.id)
        .then(async() => {
            const silentUsers = betterFS_read(path.resolve(`./db/xp/silent.users`), 'utf8').split('\n');

            const levelUpChannel = getChannel(guild, await DatabaseGetChannel(guild, 'levels'));

            if (levelUpChannel == null) return;

            const levelUpEmbed = new DJS.EmbedBuilder()
                .setTitle('Level Up!')
                .setDescription(`Congratulations on leveling up <@${user}>! You are now level ${level} and have unlocked the ${role.name} role`)
                .setTimestamp();

            const row = new DJS.ActionRowBuilder()

            const menuButton = new DJS.ButtonBuilder()
                .setLabel('Menu')
                .setStyle(DJS.ButtonStyle.Primary)
                .setCustomId('levelUpMenu')
                .setEmoji('📖');

            row.addComponents(menuButton);
            
            levelUpChannel.send({
                content: silentUsers.includes(user) ? null : `<@${user}>`,
                embeds: [levelUpEmbed],
                components: [row]
            })
        })
}

const timestampEvents = new EventEmitter();

setInterval(() => {
    timestampEvents.emit(Date.now())
}, 1 * 1000);

async function getFutureDiscordTimestamp(ms) {
    // Get current time
    const currentTime = Date.now();

    // Add the time to the current time
    const futureTime = currentTime + ms;

    // Convert the future time to a Discord timestamp (epoch time)
    return Math.floor(futureTime / 1000);
}

/**
 * @param {string} message - Template string to process
 * @param {string} guild - Guild identifier
 * @param {Object | undefined} data - Data object for placeholder resolution
 */
async function convertMetaText(message, guild, data) {
  if (!data) return message;

  // Recursively remove client objects and handle circular references
  function removeClientObjects(obj, visited = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (visited.has(obj)) return {};
    visited.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => removeClientObjects(item, visited));
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = key === 'client' ? {} : removeClientObjects(value, visited);
    }
    return cleaned;
  }

  let replacementData = removeClientObjects(data);
  replacementData.guild = guild;

  // Parse and resolve a single placeholder with all features
  function resolvePlaceholder(path, depth = 0, customContext = null) {
    const currentContext = customContext || replacementData;
    if (depth > 50) {
      return null; // Prevent stack overflow
    }
    
    // Check for array slicing first: Array<start,end>
    const sliceMatch = path.match(/^(.+?)<(-?\d+),(-?\d+)>(.*)$/s);
    if (sliceMatch) {
      const [, arrayPath, start, end, rest] = sliceMatch;
      const arr = resolveSimplePath(arrayPath, currentContext);
      if (!Array.isArray(arr)) {
        return null;
      }
      
      const startIdx = parseInt(start);
      const endIdx = parseInt(end);
      const sliced = arr.slice(
        startIdx < 0 ? arr.length + startIdx : startIdx,
        endIdx < 0 ? arr.length + endIdx + 1 : endIdx + 1
      );
      
      if (rest) {
        // If rest starts with *, it's a loop on the sliced array
        if (rest.startsWith('*')) {
          const tempData = { ...currentContext, _tempSliced: sliced };
          const result = resolvePlaceholder('_tempSliced' + rest, depth + 1, tempData);
          return result;
        }
        return resolvePlaceholder(JSON.stringify(sliced) + rest, depth + 1);
      }
      return sliced;
    }
    
    // Check for array loop syntax: Array*varName[expression]
    const loopMatch = path.match(/^(.+?)\*(\w+)\[(.+)\]$/s);
    if (loopMatch) {
      const [, arrayPath, varName, expression] = loopMatch;
      const arr = resolveSimplePath(arrayPath, currentContext);
      if (!Array.isArray(arr)) {
        return null;
      }
      
      const result = arr.map(item => {
        const tempData = { ...replacementData, [varName]: item };
        return processTemplate(expression, tempData);
      }).join('');
      return result;
    }

    // Check for array indexing: Array[index]
    const indexMatch = path.match(/^(.+?)\[(-?\d+)\](.*)$/);
    if (indexMatch) {
      const [, arrayPath, index, rest] = indexMatch;
      const arr = resolveSimplePath(arrayPath, currentContext);
      if (!Array.isArray(arr)) {
        return null;
      }
      
      const idx = parseInt(index);
      const item = arr[idx < 0 ? arr.length + idx : idx];
      
      if (rest) {
        // Continue resolving with the rest of the path
        const itemStr = typeof item === 'object' ? item : { value: item };
        const tempData = { ...currentContext, _tempItem: itemStr };
        return resolvePlaceholder(`_tempItem${rest}`, depth + 1, tempData);
      }
      return item;
    }

    // Check for conditional: #condition[true][false]
    if (path.startsWith('#')) {
      
      // Find the condition part and the two bracket sections
      let conditionEnd = -1;
      let bracketCount = 0;
      let inQuotes = false;
      
      for (let i = 1; i < path.length; i++) {
        const char = path[i];
        const prevChar = i > 0 ? path[i-1] : '';
        
        // Check if this is an actual quote (not part of escaped quote marker)
        if (char === '"') {
          // Look backwards to see if this is part of an escaped quote marker
          const beforeQuote = path.slice(Math.max(0, i-21), i);
          const isEscapedQuote = beforeQuote.includes('\uE000ESCAPED_QUOTE\uE000');
          
          if (!isEscapedQuote) {
            inQuotes = !inQuotes;
          }
        } else if (!inQuotes && char === '[') {
          if (bracketCount === 0) {
            conditionEnd = i;
          }
          bracketCount++;
          break;
        }
      }
      
      if (conditionEnd > 0) {
        const condition = path.slice(1, conditionEnd);
        
        // Find the true and false values
        let pos = conditionEnd + 1;
        let depth = 1;
        let trueEnd = -1;
        inQuotes = false;
        
        for (let i = pos; i < path.length; i++) {
          const char = path[i];
          
          // Check if this is an actual quote (not part of escaped quote marker)
          if (char === '"') {
            // Look backwards to see if this is part of an escaped quote marker
            const beforeQuote = path.slice(Math.max(0, i-21), i);
            const isEscapedQuote = beforeQuote.includes('\uE000ESCAPED_QUOTE\uE000');
            
            if (!isEscapedQuote) {
              inQuotes = !inQuotes;
            }
          } else if (!inQuotes) {
            if (char === '[') {
              depth++;
            } else if (char === ']') {
              depth--;
              if (depth === 0) {
                trueEnd = i;
                break;
              }
            }
          }
        }
        
        if (trueEnd > 0) {
          const trueVal = path.slice(conditionEnd + 1, trueEnd);
          
          // Find false value
          let falseStart = trueEnd + 2; // Skip ][
          if (falseStart < path.length && path.slice(trueEnd, falseStart) === '][') {
            let falseEnd = path.lastIndexOf(']');
            const falseVal = path.slice(falseStart, falseEnd);
            
            const result = evaluateCondition(condition, currentContext);
            const chosen = result ? trueVal : falseVal;
            
            // Remove quotes if present (handle both regular quotes and escaped quote markers)
            let finalValue = chosen;
            
            // First restore escaped quotes
            finalValue = finalValue.replace(/\uE000ESCAPED_QUOTE\uE000/g, '"');
            
            // Then remove outer quotes if present
            finalValue = finalValue.replace(/^"(.*)"$/, '$1');
            
            return finalValue;
          }
        }
      }
    }

    // Check for defaults: placeholder|default1|default2
    const parts = path.split('|');
    for (const part of parts) {
      // Check if it's a quoted string
      if (part.match(/^".*"$/)) {
        const unquoted = part.slice(1, -1);
        return unquoted;
      }
      
      const trimmedPart = part.trim();
      // Skip parts that contain escaped characters (these are from broken escape sequences)
      if (trimmedPart.includes('\x00')) {
        continue;
      }
      
      const value = resolveSimplePath(trimmedPart, currentContext);
      if (value !== null && value !== undefined) {
        // If it's an array, return it as-is for further processing
        if (Array.isArray(value)) {
          return value;
        }
        // For non-arrays, convert to string with any modifiers
        return String(value);
      }
    }

    return null;
  }

  // Resolve simple dot-notation path with modifiers
  function resolveSimplePath(path, customContext = null) {
    const contextData = customContext || replacementData;
    let modifier = null;
    let cleanPath = path;

    // Check for modifiers - but only if it's not a special key like _tempSliced or _tempItem
    if (path.startsWith('_') && !path.startsWith('_temp')) {
      modifier = 'lower';
      cleanPath = path.slice(1);
    } else if (path.startsWith('-')) {
      modifier = 'upper';
      cleanPath = path.slice(1);
    }

    // Handle nested placeholders in path - process them first
    let processedPath = cleanPath;
    let lastPath;
    let iterations = 0;
    
    
    do {
      lastPath = processedPath;
      let i = 0;
      let newPath = '';
      
      while (i < processedPath.length) {
        if (processedPath.slice(i, i + 3) === '%%{') {
          // Find matching }%%
          let depth = 1;
          let j = i + 3;
          
          while (j < processedPath.length && depth > 0) {
            if (processedPath.slice(j, j + 3) === '%%{') {
              depth++;
              j += 3;
            } else if (processedPath.slice(j, j + 3) === '}%%') {
              depth--;
              if (depth === 0) {
                const innerPath = processedPath.slice(i + 3, j);
                const resolved = resolvePlaceholder(innerPath);
                newPath += resolved !== null ? String(resolved) : processedPath.slice(i, j + 3);
                i = j + 3;
                break;
              }
              j += 3;
            } else {
              j++;
            }
          }
          
          if (depth > 0) {
            newPath += processedPath[i];
            i++;
          }
        } else {
          newPath += processedPath[i];
          i++;
        }
      }
      
      processedPath = newPath;
      iterations++;
    } while (processedPath !== lastPath && iterations < 5);

    // Split path and resolve
    const keys = processedPath.split('.');
    let value = contextData;
    
    for (const key of keys) {
      // Handle array indexing in paths like "array[0]"
      const arrayMatch = key.match(/^(.+?)\[(-?\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        value = value?.[arrayKey];
        if (Array.isArray(value)) {
          const idx = parseInt(index);
          value = value[idx < 0 ? value.length + idx : idx];
        } else {
          return null;
        }
      } else {
        value = value?.[key];
      }
      
      if (value === null || value === undefined) {
        return null;
      }
    }

    let result = value; // Don't convert to string yet if it's an array
    
    // Only convert to string if we're not dealing with an array that might be used for further processing
    if (!Array.isArray(value)) {
      result = String(value);
      if (modifier === 'lower') {
        result = result.toLowerCase();
      }
      if (modifier === 'upper') {
        result = result.toUpperCase();
      }
    } else {
      // For arrays, we might still need to apply modifiers to string representation later
    }

    return result;
  }

  // Evaluate conditional expressions
  function evaluateCondition(condition, context = null) {
    const currentContext = context || replacementData;
    const operators = ['!==', '===', '!=', '==', '>=', '<=', '>', '<', '^=', '$=', '~=', '*=', '='];
    
    for (const op of operators) {
      const idx = condition.indexOf(op);
      if (idx === -1) continue;

      const leftPart = condition.slice(0, idx).trim();
      const rightPart = condition.slice(idx + op.length).trim();
      
      const left = String(resolvePlaceholder(leftPart, 0, currentContext) || '');
      let right = rightPart;
      
      // Handle escaped quotes in the right part first
      if (right.includes('\uE000ESCAPED_QUOTE\uE000')) {
        right = right.replace(/\uE000ESCAPED_QUOTE\uE000/g, '"');
      }
      
      // Handle quoted strings more carefully
      if (right.startsWith('"') && right.endsWith('"')) {
        right = right.slice(1, -1);
      }
      

      let result;
      switch (op) {
        case '!==': result = left !== right; break;
        case '===': result = left === right; break;
        case '!=': result = left != right; break;
        case '==': result = left == right; break;
        case '>': result = parseFloat(left) > parseFloat(right); break;
        case '<': result = parseFloat(left) < parseFloat(right); break;
        case '>=': result = parseFloat(left) >= parseFloat(right); break;
        case '<=': result = parseFloat(left) <= parseFloat(right); break;
        case '^=': result = left.startsWith(right); break;
        case '$=': result = left.endsWith(right); break;
        case '*=': result = left.includes(right); break;
        case '~=': result = new RegExp(`\\b${right}\\b`).test(left); break;
        case '=': result = left == right; break;
      }
      return result;
    }
    return false;
  }

  // Process template with given data context
  function processTemplate(template, contextData = replacementData) {
    const originalData = replacementData;
    if (contextData !== replacementData) {
      replacementData = contextData;
    }
    
    // First handle JSON-style escaped quotes specifically
    let preprocessed = template.replace(/\\"/g, '\uE000ESCAPED_QUOTE\uE000');
    
    // Then handle other escaping
    let escaped = preprocessed.replace(/\\(%%{|}%%|\||\\|\[|\])/g, '\x00$1\x00');
    
    // Parse placeholders manually to handle nesting and complex syntax
    let result = '';
    let i = 0;
    
    while (i < escaped.length) {
      // Look for placeholder start
      if (escaped.slice(i, i + 3) === '%%{') {
        // Find matching }%%
        let depth = 1;
        let j = i + 3;
        
        while (j < escaped.length && depth > 0) {
          if (escaped.slice(j, j + 3) === '%%{') {
            depth++;
            j += 3;
          } else if (escaped.slice(j, j + 3) === '}%%') {
            depth--;
            if (depth === 0) {
              // Found matching closing
              const placeholder = escaped.slice(i + 3, j);
              const value = resolvePlaceholder(placeholder);
              
              if (value !== null && value !== undefined) {
                const stringValue = String(value);
                result += stringValue;
              } else {
                // For null/undefined values, use empty string instead of leaving placeholder
                result += '';
              }
              
              i = j + 3;
              break;
            }
            j += 3;
          } else {
            j++;
          }
        }
        
        if (depth > 0) {
          // Unmatched placeholder
          result += escaped[i];
          i++;
        }
      } else {
        result += escaped[i];
        i++;
      }
    }
    
    // Restore escaped characters including JSON-style escaped quotes
    const unescaped = result.replace(/\x00(.+?)\x00/g, '$1').replace(/\uE000ESCAPED_QUOTE\uE000/g, '"');
    
    if (contextData !== originalData) {
      replacementData = originalData;
    }
    return unescaped;
  }

  const replacedOutput = processTemplate(message);

  // Handle encoded client ID replacement (original functionality)
  if (typeof client !== 'undefined' && client?.user?.id) {
    const encodedClientId = Buffer.from(client.user.id).toString('base64');
    const words = replacedOutput.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (words[i].startsWith(`${encodedClientId}.`)) {
        words[i] = `${encodedClientId}.Sombo.dyOnceToldMeTheWorldWasGonnaRollMe`;
      }
    }
    return words.join(' ');
  }

  return replacedOutput;
}

/**
 * Finds information related to a id (ex. find guild from channel id)
 * @param {string} id 
 * @param {"channel" | "guild" | "role"} from 
 * @param {"channel" | "guild" | "role" | "all"} to 
*/
async function resolveId(id, from, to) {
    const lookupFile = await fs.promises.readFile(path.resolve(`./db/lookup.json`), 'utf8');
    const lookupJSON = JSON.parse(lookupFile);

    if (from === 'guild') {
        if (to == 'all') {
            return lookupJSON.filter(l => l.guild === id); // [{type: 'channel', id: '1234', guild: '5678'}...] or [{type: 'role', id: '1234', guild: '5678'}...]
        } else {
            return lookupJSON.filter(l => l.guild === id).filter(l => l.type === to); // [{type: '[TYPE]', id: '1234', guild: '5678'}...]
        }
    } else if (to === 'guild') {
        // Checking object type doesn't matter because the IDs are unique (I hope)
        return lookupJSON.find(l => l.id == id).guild;
    } else
        throw new Error('Invalid from/to'); // Some day it will automatically find a link between the two but not today
}

/**
 * @param {string} guild
 * @param {string} type
 * @param {string} id
*/
async function createIdReference(guild, type, id) {
    const lookupFile = await fs.promises.readFile(path.resolve(`./db/lookup.json`), 'utf8');
    const lookupJSON = JSON.parse(lookupFile);

    if (lookupJSON.find(l => l.id == id)) return 'ID already exists';

    lookupJSON.push({
        type,
        id,
        guild
    });
}

const encryption_key = Buffer.from(process.env.DB_ENC_KEY, 'base64');

/**
 * @param {string} data 
 * @returns {string}
 */
function encrypt(data) {
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', encryption_key, iv);
    
    const encrypted = cipher.update(data, 'utf8');
    const final = cipher.final();
    const tag = cipher.getAuthTag(); // 16 bytes
    
    return Buffer.concat([iv, tag, encrypted, final]).toString('base64');
}

/**
 * @param {string} data
 * @returns {string}
 */
function decrypt(data) {
    // Check if it's the old hex format (contains ':' separator)
    if (data.includes(':')) {
        // Old CBC hex format
        const parts = data.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', encryption_key, iv);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } else {
        // New GCM base64 format
        const combined = Buffer.from(data, 'base64');
        const iv = combined.subarray(0, 12);
        const tag = combined.subarray(12, 28);
        const encrypted = combined.subarray(28);
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryption_key, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

/**
 * @param {string} guild The guild to fetch audit log entries for
 * @param {number} limit The maximum amount of entries to fix (Max defined by AUDIT_LOG_HISTORY_LIMIT constant when not fetching new data)
 * @param {boolean} fetch Whether to fetch new entries from Discord or use the cached ones
 * @param {number} delay The delay in milliseconds before fetching new entries (to allow Discord to process the action, default 1000ms)
 * @returns {Promise<Discord.GuildAuditLogsEntry[]>}
 */
async function getLatestAuditLogEntries(guild, limit = 5, fetch = false, delay = 1000) {
    await new Promise(resolve => setTimeout(resolve, delay));

    if (fetch) {
        // Fetch new entries from Discord
        const results = await client.guilds.cache.get(guild).fetchAuditLogs({
            limit
        });
        return results;
    }

    if (!auditLogEntryHistory.has(guild)) {
        console.warn(`No audit log history found for guild ${guild}. Returning empty array.`);
        return [];
    }

    // Use cached entries
    return auditLogEntryHistory.get(guild).slice(-limit);
}

const youtube = {
    getChannelUploads: youtube_GetChannelUploads,
    isVideoValid: youtube_isVideoValid,
    channelIdToName: youtube_channelIdToName
}

const items = {
    generateId: id_generatestring
}

const premium = {
    activateServer: premiumActivateServer,
    deactivateServer: premiumDeactivateServer,
    isServerActivated: premiumIsServerActivated
}

const images = {
    createPermLink: createPermanentImgLink,
}

const text = {
    cleanHomoglyphs: cleanText,
}

const better_fs = {
    write: betterFS_write,
    read: betterFS_read
}

const db = {
    setChannel: DatabaseSetChannel,
    getChannel: DatabaseGetChannel,
    managed: {
        set: managedDBSet,
        get: managedDBGet,
        exists: managedDBExists,
        delete: managedDBDelete,
        insert: managedDBInsert
    }
}

const guilds = {
    sendAlert,
    log: {
        /** 
         * @param {string} guild
         * @param {string} data
        */
        info: (guild, data) => {
            let currentLogFile = managedDBGet(guild, 'logs/info.log');
            if (currentLogFile == 'File not found.') currentLogFile = '';
            const newLogFile = `${currentLogFile}\n[${new Date().toISOString()}] ${data}`;
            managedDBSet(guild, 'logs/info.log', newLogFile);
        },
        /**
         * @param {string} guild
         * @param {string} data
        */
        warn: (guild, data) => {
            let currentLogFile = managedDBGet(guild, 'logs/warn.log');
            if (currentLogFile == 'File not found.') currentLogFile = '';
            const newLogFile = `${currentLogFile}\n[${new Date().toISOString()}] ${data}`;
            managedDBSet(guild, 'logs/warn.log', newLogFile);
        },
        /**
         * @param {string} guild
         * @param {string} data
        */
        error: (guild, data) => {
            let currentLogFile = managedDBGet(guild, 'logs/error.log');
            if (currentLogFile == 'File not found.') currentLogFile = '';
            const newLogFile = `${currentLogFile}\n[${new Date().toISOString()}] ${data}`;
            managedDBSet(guild, 'logs/error.log', newLogFile);
        }
    }
}

const api = {
    discord: {
        getUser: API_get_user,
        getGuild: API_get_guild,
        getRole: API_get_role
    },

    pasteapi: {
        createPaste: pasteapi_create_paste
    }
}

const xp = {
    add: addXP
}

const colours = {
    daalbot_purple: '#826ae3',
    vortex_blue: '#00aae3'
}

const emojis = {
    '973711816226136095': {
        coin: '<:VTXCoin:1261812231327318058>',
        xp: '<:VTXXP:1261807723255955516>'
    },
    coin: '<:Coin:1247554973512896533>',
    xp: '<:XP:1245805234115313747>',
    /**@param {string} name; @param {string?} guild*/get: (name,guild)=>{}
}

/**
 * @param {string} name
 * @param {string?} guild
*/
const getEmoji = (name, guild) => {
    if (guild && emojis[guild] && emojis[guild][name]) {
        return emojis[guild][name];
    } else {
        return emojis[name];
    }
}
emojis.get = getEmoji;

const timestamps = {
    getFutureDiscordTimestamp
}

module.exports = {
    client,
    serverAmount,
    warnings,
    text,
    fs: better_fs,
    db,
    guilds,
    DJS: Discord,
    images,
    colours,
    premium,
    timestampEvents,
    timestamps,
    youtube,
    items,
    xp,
    emojis,
    findServerVanity,
    fetchServer,
    fetchServerName,
    fetchServerOwner,
    getRole,
    getChannel,
    getUser,
    getMember,
    log: botLog,
    config: config_get,
    getLogChannel,
    getLogChannelId,
    logEvent,
    getMessageFromString,
    resolveId,
    createIdReference,
    convertMetaText,
    encrypt,
    decrypt,
    getLatestAuditLogEntries,
    api,
    embed: Discord.EmbedBuilder,
    DatabaseEntry
}