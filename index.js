const client = require('./client');
require('dotenv').config(); 
const path = require('path'); 
const WOKCommands = require('wokcommands'); 
const config = require('./config.json');
require('./launch-extra.js');
client.setMaxListeners(0); // Sets max client listeners to infinity
const fs = require('fs'); // File system

// Functions
function OnReady() {
  console.log('Load > DaalBot is ready')
}

client.on('ready', () => {
  new WOKCommands({
    client,
    commandsDir: path.join(__dirname, 'commands'),
    featuresDir: path.join(__dirname, 'features'),
    typeScript: false,
    testServers: config.WOKCommands.TestServers,
    botOwners: config.WOKCommands.BotOwners,
    mongoUri: process.env.MONGO_URI,
  })

  OnReady();
})

// DB check
if (!fs.existsSync(`./db/`)) {
  require('./db-setup.js') // If the database doesn't exist, run the setup
}

setInterval(() => {
  fs.writeFileSync('/home/piny/.pm2/logs/Discord-error.log', '') // Clear the error log every 5 minutes because now curl spams it every 10 seconds and it's annoying
}, 5 * 60 * 1000)

client.login(process.env.TOKEN);