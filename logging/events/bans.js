const client = require("../../client");
const { handleEvent } = require("../shared");

client.on('guildBanAdd', async(ban) => handleEvent('guildBanAdd', 'ban', {}, ban));
client.on('guildBanRemove', async(ban) => handleEvent('guildBanRemove', 'ban', {}, ban));