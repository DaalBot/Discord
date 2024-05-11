const client = require('../client');
const config = require('../config.json');

client.on("messageCreate", message => {
    if (message.content.toLowerCase().startsWith('$ping-repeat')) {
        if (config.WOKCommands.ownerIds.includes(message.author.id)) {
            const args = message.content.split(' ').slice(2);
            const user = message.mentions.users.first();

            if (!user) return message.channel.send('Please specify a user to ping.');

            console.log(`Spam pinging @${user.username} (Args: ${args.join(' ')})`)

            if (message.content.toLowerCase().includes('-a')) {
                message.delete();
                for (let i = 0; i < args[1]; i++) {
                    setTimeout(() => {
                        message.channel.send(`<@${user.id}>`)
                    }, 2.5 * 1000);
                }
            } else {
                for (let i = 0; i < args[1]; i++) {
                    setTimeout(() => {
                        message.channel.send(`<@${user.id}> roses are red, violets are blue, ${message.author.username} spam pings you.`);
                    }, 2.5 * 1000);
                }
            }
        }
    }
})