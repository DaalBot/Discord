const client = require('../client.js');
const daalbot = require('../daalbot.js');
const DJS = require('discord.js');

client.on('messageCreate', async(message) => {
  try {
    if (message.channel.type === DJS.ChannelType.DM) return; // Ignore DMs (as they are a pain to handle)
    const channelId = message.channel.id;
    if (message.author.id === client.user.id && !message.content) return; // Ignore embed only messages as a ticket events copy will be added
    const ticketChannels = await daalbot.db.managed.get(message?.guild?.id, 'tickets/channels');
    if (ticketChannels == 'File not found.') return;
    const ticketChannelIds = ticketChannels.split('\n').map(c => c.split(':')[0]);
    if (!ticketChannelIds.includes(channelId)) return; // Shouldn't happen, but just in case
    const channels = ticketChannels.split('\n');
    if (!channels.find(c=>c.startsWith(channelId))) return;
    
    // File looks a bit like this:
    /**
     * 123456789012345678:z-txXiF
     * 123456789012345678:M-pNLGk
    */

    const ticketId = channels.find(c => c.startsWith(channelId)).split(':')[1];

    const transcriptTxt = await daalbot.db.managed.get(message.guild.id, `tickets/${ticketId}/transcript.json`);
    if (transcriptTxt == 'File not found.') return;

    const transcript = JSON.parse(transcriptTxt);

    if (!transcript.entities.users[message.author.id]) {
        transcript.entities.users[message.author.id] = {
            avatar: message.author.avatarURL(),
            username: message.author.username,
            discriminator: message.author.discriminator,
            badge: null
        }
    }

    transcript.messages.push({
        content: message.content,
        author: message.author.id,
        time: Date.now(),
        id: message.id
    })

    await daalbot.db.managed.set(message.guild.id, `tickets/${ticketId}/transcript.json`, JSON.stringify(transcript));
  } catch {}
})

client.on('messageUpdate', async(oldMessage, newMessage) => {
  try {
    const message = newMessage; // Rename for consistency
    const channelId = message.channel.id;
    if (message.author.id === client.user.id && !message.content) return; // Ignore embed only messages as a ticket events copy will be added
    const ticketChannels = await daalbot.db.managed.get(message.guild.id, 'tickets/channels');
    if (ticketChannels == 'File not found.') return;
    const ticketChannelIds = ticketChannels.split('\n').map(c => c.split(':')[0]);
    if (!ticketChannelIds.includes(channelId)) return; // Shouldn't happen, but just in case
    const channels = ticketChannels.split('\n');
    if (!channels.find(c=>c.startsWith(channelId))) return;
    
    // File looks a bit like this:
    /**
     * 123456789012345678:z-txXiF
     * 123456789012345678:M-pNLGk
    */

    const ticketId = channels.find(c => c.startsWith(channelId)).split(':')[1];

    const transcriptTxt = await daalbot.db.managed.get(message.guild.id, `tickets/${ticketId}/transcript.json`);
    if (transcriptTxt == 'File not found.') return;

    const transcript = JSON.parse(transcriptTxt);

    transcript.messages.find(m => m.id === message.id).content = `${message.content} [Edited]`; // Update the message content

    await daalbot.db.managed.set(message.guild.id, `tickets/${ticketId}/transcript.json`, JSON.stringify(transcript))
  } catch {}
})