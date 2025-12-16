// This file has no specific purpose it is just used for when i need to do somewhat bulk operations
const fs = require('fs');
const client = require('./client');
require('dotenv').config();
const path = require('path');

client.on('clientReady', async() => {
    const clientCommands = await client.application.commands.fetch();
    const totalCommands = clientCommands.size;
    let commandsDeleted = 0;
    console.log(`Total commands to delete: ${totalCommands}`);
    for (const command of clientCommands.values()) {
        await client.application.commands.delete(command.id);
        console.log(`Deleted command: ${command.name} (${command.id})`);
        commandsDeleted++;
        console.log(`Progress: ${commandsDeleted}/${totalCommands} commands deleted.`);
    }
    console.log('All commands deleted.');
});

client.login(process.env.TOKEN);