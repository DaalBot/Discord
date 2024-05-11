// This file is designed to create the database when the bot is launched if it doesn't already exist
const fs = require('fs');

if (!fs.existsSync('./db')) {
    fs.mkdirSync('./db');
    console.log('✅ Created database folder');
}

async function createFolderIfNonExistant(folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        console.log(`✅ Created ${folder} folder`);
    }
}

const subFolders = [
    'antiraid',
    'automod',
    'autorole',
    'beta',
    'config',
    'events',
    'lockdown',
    'logging',
    'scamprot',
    'socialalert',
    'test',
    'tickets',
    'verify',
    'welcome',
    'xp'
]

for (let i = 0; i < subFolders.length; i++) {
    createFolderIfNonExistant(`./db/${subFolders[i]}`);
}