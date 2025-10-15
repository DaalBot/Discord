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
require('./events/guildMemberUpdate.js');

// Social links
require('./social/twitch.js');
require('./social/bluesky.js');
// require('./social/youtube.js');

// Monitoring
require('./monitoring/protection.js');

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

// Tasks
require('./tasks/deletion.js'); // Deletes old unused and manually deleted data
require('./tasks/backups.js'); // Creates backups of the database

// Invite tracking
require('./invitetracking/prefetch.js');
require('./invitetracking/invitetracking.js');
require('./invitetracking/membertracking.js');

// Role links
require('./rolelinks/membertracking.js');