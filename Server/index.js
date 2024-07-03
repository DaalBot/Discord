// This exists for bot.daalbot.xyz to get info about the actual bot :D
const { Colors } = require('discord.js');
const DJS = require('discord.js');
const client = require('../client');
const express = require('express');
const app = express();
const port = 8923;
const axios = require('axios');
const path = require('path');

app.use(express.json());

app.get('/api/status', (req, res) => {
    // Status type not defined so send all data about the client
    if (req.headers['user-agent'].toLowerCase().includes('mozilla') && !req.query.noinject) {
        // Page is being loaded in a browser so add javascript to automatically refresh the page every 5 seconds
        const JSONDataString = JSON.stringify({
            guilds: client.guilds.cache.size,
            uptime: client.uptime,
            ping: client.ws.ping,
            process: {
                memoryPercentage: process.memoryUsage().heapTotal / process.memoryUsage().heapUsed,
            }
        }, null, 4).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')

        res.send(`<div class="content">${JSONDataString}</div><br/><br/>This page has been injected with javascript and css to automatically update the data and make it look fancy to disable this click <a href="?noinject=1">here</a><style>body { background-color: #1e1e1e; color: #ffffff; font-family: system-ui; } .content { font-size: 2.5rem; }</style><script>setTimeout(() => { window.location.reload() }, 5000)</script>`)
    } else {
        // Page is either being loaded by a http library or a browser that doesnt support mozilla stuff so just send the data
        res.json({
            guilds: client.guilds.cache.size,
            uptime: client.uptime,
            ping: client.ws.ping,
            process: {
                memoryPercentage: process.memoryUsage().heapTotal / process.memoryUsage().heapUsed,
            }
        })
    }
})

// Allow the user to get up to date information about the privacy policy and terms of service (incase i forget to commit the changes or smth)
app.get('/md/privacy', (req, res) => {
    res.sendFile(path.resolve(`./PRIVACY.md`)) // Send the privacy policy file
})

app.get('/md/tos', (req, res) => {
    res.sendFile(path.resolve(`./TERMS.md`)) // Send the terms of service file
})

app.listen(port, () => {
    console.log(`Internal API listening on port ${port}`);
})

// Downtime checks
app.get('/api/ping', (req, res) => {
    res.status(200).send('OK'); // Send back data to show that the server is up
})

let extAPIStatus = 3; // 1 = up, 0 = down, 2 = unknown, 3 = not checked
let intAPIStatus = 3; // ^
let botAPIStatus = 3; // ^

app.get('/api/services', (req, res) => {
    res.json([
        {
            name: 'Bot',
            status: `${botAPIStatus}`,
        },
        {
            name: 'EXTAPI',
            status: `${extAPIStatus}`,
        },
        {
            name: 'INTAPI',
            status: `${intAPIStatus}`,
        }
    ])
})

setInterval(async() => {
    // Execute every 5 minutes
    try {
        await axios.get('https://bot.daalbot.xyz/get/test/ping')
        intAPIStatus = 1;
    } catch {
        intAPIStatus = 0;
    }

    try {
        await axios.get('https://api.daalbot.xyz/get/test/ping')
        extAPIStatus = 1;
    } catch {
        extAPIStatus = 0;
    }

    try {
        await axios.get('http://bot.daalbot.xyz:8923/api/ping')
        botAPIStatus = 1;
    } catch {
        botAPIStatus = 0;
    }

    const downServices = [
        extAPIStatus === 0 ? 'External API' : '',
        intAPIStatus === 0 ? 'Internal API' : '',
        botAPIStatus === 0 ? 'Bot' : ''
    ].filter(Boolean)

    if (downServices.length > 0) {
        const embed = new DJS.EmbedBuilder()
            .setTitle(`Service${downServices.length > 1 ? 's' : ''} down`)
            .setDescription(`The following services are down: ${downServices.join(', ')}`)
            .setColor(Colors.Red)
            .setFooter({
                text: 'Noticed by: BOT'
            })
            .setTimestamp()

        const downtimeWebhook = process.env.DOWNTIME_WEBHOOK;

        if (downtimeWebhook) {
            return;
            await axios.post(downtimeWebhook, {
                content: '<@&1173214195605590097> Shit happened lmao',
                embeds: [embed]
            })
        }
    }
}, 5 * 60 * 1000)
