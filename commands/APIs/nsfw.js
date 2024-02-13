const axios = require('axios');
const validTypes = 'hass,pgif,4k,hentai,anal,hanal,gonewild,ass,pussy,thigh,hthigh,paizuri,tentacle,boobs,hboobs'.split(',');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const daalbot = require('../../daalbot.js');

const get = async (url) => {
    try {
    const response = await axios.get(url);
    return response.data;
    } catch {
    }
};

module.exports = {
    name: 'nsfw',
    description: 'Sends a NSFW image depending on the options provided.',
    category: 'APIs',

    type: 'SLASH',
    testOnly: true,

    options: [
        {
            name: 'type',
            description: 'The type of NSFW image you want to see.',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'gif',
            description: 'Whether or not you want the result to be a gif.',
            type: ApplicationCommandOptionType.Boolean,
            required: true
        }
    ],

    callback: async ({ interaction, client }) => {
        if (interaction.channel.nsfw) {
        } else {
            return 'Channel is not NSFW'
        }

        const type = interaction.options.getString('type');
        const gif = interaction.options.getBoolean('gif');

        if (validTypes.includes(type)) {
            try {
            await interaction.reply({
                content: 'Please wait...',
                ephemeral: true
            })
        } catch {
        }

            const data = await get(`https://nekobot.xyz/api/image?type=${type}`);

            const embed = new EmbedBuilder()
                .setTitle(`Result: `)
                .setImage(data.message)

            if (gif) {
                if (data.message.endsWith('.gif')) {
                    interaction.editReply({
                        embeds: [embed],
                        ephemeral: true
                    })
                } else {
                    const loopTillGif = async() => {
                        const data = await get(`https://nekobot.xyz/api/image?type=${type}`);
                        if (`${data.message}`.endsWith('.gif')) {
                            embed.setImage(data.message);
                            try {
                            interaction.editReply({
                                embeds: [embed],
                                ephemeral: true
                            })
                        } catch {
                        }
                        } else {
                            setTimeout(loopTillGif, 1000);
                        }
                    }
                    loopTillGif();
                }
            } else {
                if (data.message.endsWith('.gif')) {
                    interaction.editReply({
                        content: 'The result was a gif.',
                        ephemeral: true
                    })
                } else {
                interaction.editReply({
                    embeds: [embed],
                    ephemeral: true
                })
            }
            }
        }
    }
}