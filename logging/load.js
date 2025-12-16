require('./events/channels.js');
require('./events/bans.js');
// require('./events/members.js');

// Members
require('./events/guildMemberAdd.js');
require('./events/guildMemberRemove.js');
require('./events/guildMemberUpdate.js');

// Messages
require('./events/messageDelete.js');
require('./events/messageDeleteBulk.js');
require('./events/messageUpdate.js');

// Roles
require('./events/roleCreate.js');
require('./events/roleDelete.js');
require('./events/roleUpdate.js');

// Other
require('./events/voice.js');