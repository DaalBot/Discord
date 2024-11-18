const config = require('./config.json');
require('./legacy/launch.js'); 
require('./logs.js');
require('./XP/message.js');
require('./XP/levelupmessagebutton.js');
require('./custom/launch.js');
require('./automod/automod.js');
require('./vortex/vortex.js');
require('./buttons/ticket.js');
require('./buttons/selfrole.js');
require('./logging/load.js');
require('./db-setup.js');
require('./events/join.js');
require('./events/messageCreate.js');
require('./interactions/load.js');
require('./events/channelCreate.js');

// Social links
require('./social/twitch.js');
// require('./social/youtube.js');

// Monitoring
require('./monitoring/monitor.js');

// Modals
require('./modals/handler.js');

// Automations
require('./automations/launch.js');

// Internal server
require('./Server/index.js');

// Updates
require('./updates/files.js');

// Buttons
require('./buttons/handler.js');

// Dropdowns
require('./dropdown/handler.js');

// Context menus
require('./context/handler.js');

// Listings
require('./listings/top.gg.js');

// Modmail
require('./modmail/dm.js');

// Tickets (V2)
require('./tickets/button.js');
require('./tickets/message.js');

// Data privacy tools
require('./tasks/deletion.js'); // Deletes old unused and manually deleted data