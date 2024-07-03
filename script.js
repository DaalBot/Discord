// This file has no specific purpose it is just used for when i need to do somewhat bulk operations
const fs = require('fs');
const client = require('./client');
require('dotenv').config();
const Discord = require('discord.js');

client.on('ready', async() => {
    // const loggingDB = fs.readdirSync('./db/logging/'); // Only allow testing guild until i am sure it works

    // for (let i = 0; i < loggingDB.length; i++) {
    //     const guildID = loggingDB[i];

    //     if (!fs.existsSync(`./db/logging/${guildID}/channel.id`)) continue;

    //     const channelID = fs.readFileSync(`./db/logging/${guildID}/channel.id`, 'utf-8');
    //     /**
    //      * @type {Discord.TextChannel}
    //     */
    //     const channel = client.channels.cache.get(channelID);
    //     if (!channel) { console.error(`Channel not found for guild ${guildID}`); continue; }

    //     // Check for old webhook
    //     if (fs.existsSync(`./db/managed/${guildID}/logging/webhook.json`)) {
    //         const webhookData = JSON.parse(fs.readFileSync(`./db/managed/${guildID}/logging/webhook.json`, 'utf-8'));
    //         const webhook = new Discord.WebhookClient(webhookData);

    //         await webhook.delete('Triggered by logging webhook creation script.');
    //     }

    //     const webhook = await channel.createWebhook({
    //         name: 'DaalBot Logging',
    //         avatar: 'https://media.piny.dev/DaalBotSquare.png',
    //         reason: 'Triggered by logging webhook creation script.'
    //     })

    //     const output = {
    //         id: webhook.id,
    //         token: webhook.token,
    //         url: webhook.url
    //     }

    //     console.log(JSON.stringify(output, null, 4))

    //     if (!fs.existsSync(`./db/managed/${guildID}/logging/`)) fs.mkdirSync(`./db/managed/${guildID}/logging/`, { recursive: true });
    //     fs.writeFileSync(`./db/managed/${guildID}/logging/webhook.json`, JSON.stringify(output, null, 4), { flag: 'w' });
    // }

    // Get all the guilds with a webhook
    const guilds = fs.readdirSync('./db/managed/');

    for (let i = 0; i < guilds.length; i++) {
        const guildID = guilds[i];

        if (!fs.existsSync(`./db/managed/${guildID}/logging/webhook.json`)) {
            console.log(`[X] No webhook found for guild ${guildID}`);
            continue;
        };

        const webhookData = JSON.parse(fs.readFileSync(`./db/managed/${guildID}/logging/webhook.json`, 'utf-8'));
        const webhook = new Discord.WebhookClient({
            id: webhookData.id,
            token: webhookData.token
        });

        await webhook.send({
            content: `Hello! This a test webhook message from DaalBot this webhook will be used for logging purposes. If you see this message then the webhook is working as intended.`,
        })

        console.log(`[/] Sent test message to webhook for guild ${guildID}`);
    }

    client.destroy();
})

client.login(process.env.TOKEN);