const client = require('./client');
require('dotenv').config();
require('./launch-extra.js');
client.setMaxListeners(0); // Sets max client listeners to infinity
const fs = require('fs'); // File system

client.on('ready', () => {
  require('./handler.js');
  console.log('Load > DaalBot is ready')
})

// DB check
if (!fs.existsSync(`./db/`)) {
  require('./db-setup.js') // If the database doesn't exist, run the setup
}

fs.writeFileSync('/home/piny/.pm2/logs/Discord-error.log', '') // Clean the error log on startup

client.login(process.env.TOKEN);