module.exports = {
    name: 'test',
    description: 'Test event',
    id: 'testing',

    execute: (async(message, utils) => {
        if (message.content.startsWith('!p')) {
            if (message.channel.nsfw) {
                const axios = utils.libaries.axios;

                const response = await axios.get('http://api.nekos.fun:8080/api/boobs');
                const data = response.data;

                message.channel.send(data.image);
            } else {
                message.reply('Gotta use it in a nsfw channel')
            }
        }
    })
}