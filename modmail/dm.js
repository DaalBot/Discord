// const client = require('../client.js');
// const { EmbedBuilder, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, Guild } = require('discord.js');
// const daalbot = require('../daalbot.js');

// client.on('messageCreate', async (message) => {
//     if (message.author.bot) return;
//     if (message.channel.type != ChannelType.DM) return;

//     /**
//      * @type {Array<Guild>}
//     */
//     let mutualGuilds = [];

//     client.guilds.cache.forEach(guild => {
//         if (guild.members.cache.has(message.author.id)) {
//             mutualGuilds.push(guild);
//         }
//     });
    
//     // if (mutualGuilds.length === 0)
//         // return message.channel.send(`You must be in a server with the bot to use modmail.`);

//     const guildRow = new ActionRowBuilder();
//     const buttonRow = new ActionRowBuilder(); // For the buttons

//     const backButton = new ButtonBuilder()
//         .setCustomId('modmail_back')
//         .setLabel('◀️')
//         .setStyle(ButtonStyle.Primary);

//     const nextButton = new ButtonBuilder()
//         .setCustomId('modmail_next')
//         .setLabel('▶️')
//         .setStyle(ButtonStyle.Primary);

//     const sendButton = new ButtonBuilder()
//         .setCustomId('modmail_start')
//         .setLabel('Send')
//         .setStyle(ButtonStyle.Success);

//     buttonRow.addComponents(backButton, sendButton, nextButton);

//     const guildsDropdown = new StringSelectMenuBuilder();

//     message.channel.send(`You are in ${mutualGuilds.length} servers with the bot.`);

//     mutualGuilds.forEach(guild => {
//         guildsDropdown.addOptions(
//             {
//                 label: guild.name,
//                 value: guild.id
//             }
//         )
//     })

//     guildRow.addComponents(guildsDropdown);

//     console.log(JSON.stringify(guildRow.data, null, 4));

//     message.channel.send({
//         content: 'Select a server to send a modmail to:',
//         components: [guildRow, buttonRow]
//     })
// })