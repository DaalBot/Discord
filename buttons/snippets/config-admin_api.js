const { ButtonInteraction, EmbedBuilder, MessageFlags } = require("discord.js");
const axios = require('axios');

/**
 * @param {ButtonInteraction} interaction
 */
module.exports = async(interaction) => {

    const configListReq = await axios.get(`https://api.daalbot.xyz/config/list`);
    /**
     * @type {Array<string>}
    */
    const configList = configListReq.data;

    const embed = new EmbedBuilder()
        .setTitle('API Configuration')
        .setDescription(`Here are the available configurations for the API:\n${configList.map((config, index) => `${index + 1}. ${config}`).join('\n')}`)
        .setFooter({
            text: 'Send the number of the configuration you want to edit',
        })

    interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
    })

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 60 * 1000, max: 1 });

    collector.on('collect', async(msg) => {
        const config = configList[parseInt(msg.content) - 1];
        if (!config) {
            return interaction.followUp({
                content: 'Invalid configuration number',
                flags: MessageFlags.Ephemeral,
            })
        }

        msg.delete();

        const value = await axios.get(`https://api.daalbot.xyz/config/${config}`).then(res => res.data);

        const embed = new EmbedBuilder()
            .setTitle(config)
            .setDescription(`The current value of this configuration is: \n\`\`\`json\n${JSON.stringify(value, null, 4)}\n\`\`\``)
            .setFooter({
                text: 'Send the new value for this configuration',
            })

        interaction.followUp({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        })

        const collector = interaction.channel.createMessageCollector({ filter, time: 60 * 1000 });

        let updated = false;

        collector.on('collect', async(msg) => {
            try {
                const newValue = JSON.parse(msg.content);
                msg.delete();
                await axios.patch(`https://api.daalbot.xyz/config/${config}`, newValue, {
                    headers: {
                        'Authorization': process.env.DBAPI_KEY
                    }
                });

                interaction.followUp({
                    content: `Successfully updated the value of \`${config}\`.`,
                    flags: MessageFlags.Ephemeral,
                })
            } catch(e) {
                interaction.followUp({
                    content: `Something went wrong :sob:\n\`\`\`json\n${e}\n\`\`\``,
                    flags: MessageFlags.Ephemeral
                })
            }

            updated = true;
            collector.stop();
        })

        collector.on('end', () => {
            if (!updated) interaction.followUp({
                content: 'You took too long to respond',
                flags: MessageFlags.Ephemeral,
            })
        })
    })
}