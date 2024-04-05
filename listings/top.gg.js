const client = require('../client.js');
const axios = require('axios');
require('dotenv').config();

client.on('guildCreate', async (guild) => {
    const data = {
        server_count: client.guilds.cache.size
    }

    const headers = {
        'Authorization': process.env.TOPGG_TOKEN
    }

    axios.post(`https://top.gg/api/bots/${client.user.id}/stats`, data, { headers })
        .then((res) => {
            console.log(`[LISTINGS] Posted server count to top.gg. Status: ${res.status}`);
        })
        .catch((err) => {
            console.error(`[LISTINGS] Error posting server count to top.gg: ${err}`);
        })
})

client.on('guildDelete', async (guild) => {
    const data = {
        server_count: client.guilds.cache.size
    }

    const headers = {
        'Authorization': process.env.TOPGG_TOKEN
    }

    axios.post(`https://top.gg/api/bots/${client.user.id}/stats`, data, { headers })
        .then((res) => {
            console.log(`[LISTINGS] Posted server count to top.gg. Status: ${res.status}`);
        })
        .catch((err) => {
            console.error(`[LISTINGS] Error posting server count to top.gg: ${err}`);
        })
})