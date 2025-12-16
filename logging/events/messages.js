const client = require("../../client");
const { handleEvent } = require("../shared");

client.on('messageDelete', async(message) => handleEvent('messageDelete', 'message', {}, message));
client.on('messageUpdate', async(oldMessage, newMessage) => handleEvent('messageUpdate', 'message', {}, oldMessage, newMessage));