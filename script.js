// This file has no specific purpose it is just used for when i need to do somewhat bulk operations
const fs = require('fs');
const client = require('./client');
require('dotenv').config();

client.on('ready', () => {
    client.destroy();
})

client.login(process.env.TOKEN);