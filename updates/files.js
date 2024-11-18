const fs = require('fs');
const path = require('path');
const client = require('../client.js');
const { EmbedBuilder } = require('discord.js');
const DJS = require('discord.js');

fs.watchFile(path.resolve('./PRIVACY.md'), () => {
    /**
     * @type {DJS.TextChannel}
     */
    const announcementChannel = client.channels.cache.get('1003822202413662248');
    announcementChannel.send({ content: `<@&1011614505324793917> Privacy Policy has been updated`, files: [
        { attachment: path.resolve('./PRIVACY.md'), name: 'PRIVACY.md' }
    ] });
})

fs.watchFile(path.resolve('./TERMS.md'), () => {
    /**
     * @type {DJS.TextChannel}
     */
    const announcementChannel = client.channels.cache.get('1003822202413662248');
    announcementChannel.send({ content: `<@&1011614505324793917> Terms of Service has been updated`, files: [
        { attachment: path.resolve('./TERMS.md'), name: 'TERMS.md' }
    ] });
})