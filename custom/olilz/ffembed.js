const client = require('../../client.js');
const Discord = require('discord.js');
const csvman = require('@npiny/csvman');
const daalbot = require('../../daalbot.js');

client.on('messageCreate', async message => {
    if (message.channel.type == Discord.ChannelType.DM) return; // Ignore DMs
    // || !message.channel.id == '1015649845287075840'
    if (!message.guild.id == '1015322440152383539') return;
    if (message.author.bot) return;

    const command = message.content.toLowerCase().split(' ')[0].replace('$', '');

    if (command === 'ffembed') {
        if (!message.member.roles.cache.has('1178297437123780668')) return;

        const csvText = message.content.split(' ').slice(1).join(' ');
        const csvData = await csvman.tools.csvBuilder(csvText, '    ');

        const embed = new Discord.EmbedBuilder()

        embed.setAuthor({
            name: 'Feature Friday Playtesting',
            iconURL: `https://media.piny.dev/FCHQ.png`
        })

        /**
         * @type {string[][]}
         */
        let data = [];

        data.push(csvData.metadata.join('    '))

        csvData.data.forEach((row, i) => {
            data.push(row);
        })

        data = data.map(row => row.split('    '));

        let mapsProcessed = 0;
        const mapStrings = [];

        data.forEach(async(map) => {
            /**
             * [0] = Playtesting team
             * [1] = Type
             * [2] = Creator (ping)
             * [3] = Creator (code)
             * [4] = Name
             * [5] = Code
             * [6] = Players
             * [7] = Tested before
             * [8] = Feature?
             * [9] = Outstanding?
             * [10] = Feedback (written after playtest)
             * [11] = 'INTERNAL USE' (Previous feedback if applicable)
            */
            map.shift();

            const mapData = {}

            mapData.type = map[0];
            mapData.creator = map[1];
            mapData.creatorCode = map[2];
            mapData.mapName = map[3];
            mapData.mapCode = map[4];
            mapData.playerCount = map[5];
            mapData.testedBefore = map[6];
            mapData.feature = map[7];
            mapData.outstanding = map[8];
            mapData.feedback = map[9];
            mapData.previousFeedback = map[10];

            let output = '';

            output += `## ${mapData.mapName} - ${mapData.creatorCode}\n`
            output += `Code: [${mapData.mapCode}](https://fchq.io/map/${mapData.mapCode})\n`
            output += `Type: ${mapData.type}\n`
            output += `Players: ${mapData.playerCount}\n`
            output += `Tested Before: ${`${mapData.testedBefore}`.toLowerCase() == true ? 'Yes' : 'No'}\n`
            output += `Previous Feedback: `

            if (mapData.feedback || mapData.previousFeedback) {
                const pasteURL = await daalbot.api.pasteapi.createPaste(`${mapData.previousFeedback}`)
                output += `[View](${pasteURL}&raw=1)`
            } else {
                output += `None`
            }

            mapsProcessed++;
            mapStrings.push(output);

            if (mapsProcessed == data.length) {
                embed.setDescription(mapStrings.join('\n\n'));

                message.channel.send({
                    content: `<@&1015702175361540147>`,
                    embeds: [embed]
                })

                message.delete();
            }
        })
    }
})