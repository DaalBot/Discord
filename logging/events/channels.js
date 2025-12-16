const client = require('../../client.js');
const { handleEvent } = require('../shared.js');
const Discord = require('discord.js');
const channelTypeMapping = {
    [Discord.ChannelType.GuildText]: 'Text Channel',
    [Discord.ChannelType.GuildVoice]: 'Voice Channel',
    [Discord.ChannelType.GuildCategory]: 'Category',
    [Discord.ChannelType.GuildAnnouncement]: 'Announcement Channel',
    [Discord.ChannelType.AnnouncementThread]: 'Announcement Thread',
    [Discord.ChannelType.PublicThread]: 'Public Thread',
    [Discord.ChannelType.PrivateThread]: 'Private Thread',
    [Discord.ChannelType.GuildStageVoice]: 'Stage Channel',
    [Discord.ChannelType.GuildForum]: 'Forum Channel',
    [Discord.ChannelType.DM]: 'Direct Message',
    [Discord.ChannelType.GroupDM]: 'Group Direct Message',
    [Discord.ChannelType.GuildDirectory]: 'Directory Channel',
    [Discord.ChannelType.GuildForum]: 'Forum Channel',
    [Discord.ChannelType.GuildMedia]: 'Media Channel'
};

client.on('channelCreate', async(object) => handleEvent('channelCreate', 'channel', { type: channelTypeMapping[object.type] || `Unknown Type (${object.type})` }, object));
client.on('channelDelete', async(object) => handleEvent('channelDelete', 'channel', { type: channelTypeMapping[object.type] || `Unknown Type (${object.type})` }, object));
client.on('channelUpdate', async(oldChannel, newChannel) => handleEvent('channelUpdate', 'channel', { new: { type: channelTypeMapping[newChannel.type] || `Unknown Type (${newChannel.type})` }, old: { type: channelTypeMapping[oldChannel.type] || `Unknown Type (${oldChannel.type})` } }, oldChannel, newChannel));