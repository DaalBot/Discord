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
 * @returns {Promise<string | "File not found.">}
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

            if (guild == config.servers.vortex.id) {
                const vortexMoreInfoButton = new DJS.ButtonBuilder()
                    .setLabel('More Info')
                    .setStyle(DJS.ButtonStyle.Link)
                    .setURL('https://discord.com/channels/973711816226136095/1001724255215558766')
                    .setEmoji('🔗');

                row.addComponents(vortexMoreInfoButton);
            }

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
 * @param {string} message
 * @param {string} guild
 * @param {Object | undefined} data
*/
async function convertMetaText(message, guild, data) {
    if (!data) return message;
    
    // Remove the client object from the data object incase it's there because of the token property o~o
    const replacementData = data.client ? {
        ...data,
        client: {}
    } : data;
    replacementData.guild = guild;

    // Replace the placeholders in the message with their values
    return message.replace(/%%{([^}]+)}%%/g, (match, path) => {
        const value = path.split('.').reduce((obj, key) => obj?.[key], replacementData);
        return value !== undefined ? value : match;
    });
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
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryption_key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

/**
 * @param {string} data
*/
function decrypt(data) {
    const parts = data.split(':')
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryption_key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
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
    sendAlert
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
    api,
    embed: Discord.EmbedBuilder,
    DatabaseEntry
}