// Messages
require('./events/messageCreate.js');
require('./events/messageUpdate.js');
require('./events/messageDelete.js');

// Channels
require('./events/channelCreate.js');
require('./events/channelUpdate.js');
require('./events/channelDelete.js');

// Guild
require('./events/guildUpdate.js');

// Bans
require('./events/guildBanAdd.js');
require('./events/guildBanRemove.js');

// Members
require('./events/guildMemberAdd.js');
require('./events/guildMemberRemove.js');
require('./events/guildMemberUpdate.js');

// Roles
require('./events/guildRoleCreate.js');
require('./events/guildRoleUpdate.js');
require('./events/guildRoleDelete.js');

// Interactions
require('./events/interactionCreate.js');