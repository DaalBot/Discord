//const stuff 
const client = require('../client'); // Loads all info needed to login as the bot 
const daalbot = require('../daalbot.js');
const { EmbedBuilder, ChannelType } = require('discord.js');

// Loading commands
require('./commands/featured/command.js');
require('./commands/tests/simjoin.js');
require('./commands/tests/ticket-drop.js');

// Loading events
require('./events/join.js');
require('./events/messageCreate.js');

// Loading private stuff
require('./private/load-priv.js')