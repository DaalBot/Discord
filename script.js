// This file has no specific purpose it is just used for when i need to do somewhat bulk operations
const fs = require('fs');
const client = require('./client');
require('dotenv').config();
const path = require('path');

let commands = [];

const commandCategories = fs.readdirSync(path.join(__dirname, 'commands'));
commandCategories.forEach(async category => {
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', category)).filter(file => file.endsWith('.js'));

    commandFiles.forEach(async file => {
        const command = require(path.join(__dirname, 'commands', category, file));
        
        if (!command.name) command.name = file.replace('.js', '');
        if (!command.category) command.category = category;

        commands.push(command);
    });
});

console.log(JSON.stringify(commands));