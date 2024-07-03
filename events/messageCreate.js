const client = require('../client.js');
const daalbot = require('../daalbot.js');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

client.on('messageCreate', async (msg) => {
    if (msg.channel.type == Discord.ChannelType.DM) return; // Ignore DMs
    const channel = msg.channel;
    const content = msg.content;
    const author = msg.author;
    const guild = msg.guild;
    let channelName = '';
    if (channel.name) {
        channelName = channel.name;
    }

    if (channelName.startsWith('ticket-')) {
        const ticketId = channelName.replace('ticket-', '');

        if (!fs.existsSync(path.resolve(`./db/tickets/${guild.id}/${ticketId}.ticket`))) return;

        const ticketTranscriptPath = path.resolve(`./db/tickets/${guild.id}/${ticketId}.txt`);
        const dateObj = new Date();

        // Remove this once discord goes to twitter mode with usernames
        const data = `[${dateObj}] ${author.username}: \n${content}\n\n`;

        fs.appendFileSync(ticketTranscriptPath, data);
    }

    if (author.bot && author.id == '1050916041523482766') {
        const issueAuthorId = content.split('> **id**: ')[1].split('>')[0].trim();

        const issueAuthorUser = daalbot.getUser(issueAuthorId);

        if (issueAuthorUser == undefined) return console.error(`Couldn't find user with id ${issueAuthorId}!`);
        if (issueAuthorUser == 'User not found.') return console.error(`Couldn't find user with id ${issueAuthorId}!`);

        try {
            const embed = new Discord.EmbedBuilder()
                .setTitle('Issue received!')
                .setDescription('We have received your issue and will be looking into it shortly.')
                .setColor('#9B5AB4')
                .setFooter({
                    text: 'DaalBot',
                    iconURL: 'https://media.piny.dev/DaalbotCircle.png'
                })
                .setTimestamp();
            
            await issueAuthorUser.send({
                content: `Hey ${issueAuthorUser.username}!`,
                embeds: [embed]
            });

            const userInfoEmbed = new Discord.EmbedBuilder()
                .setTitle('User info')
                .setDescription(`Username: ${issueAuthorUser.username}
ID: ${issueAuthorUser.id}`)
                .setColor('#9B5AB4')
                .setThumbnail(issueAuthorUser.avatarURL() == null ? 'https://media.piny.dev/DaalbotCircle.png' : issueAuthorUser.avatarURL())
                .setTimestamp();

            await msg.channel.send({
                content: `Info about user <@${issueAuthorId}>:`,
                embeds: [userInfoEmbed],
                allowedMentions: []
            });
        } catch (e) {
            console.error(`Something went wrong while sending a message to ${issueAuthorUser.tag}`)
        }
    }

    if (fs.existsSync(path.resolve(`./db/scamprot/${guild.id}.json`))) {
        const scamprotData = JSON.parse(fs.readFileSync(path.resolve(`./db/scamprot/${guild.id}.json`), 'utf8'));
        if (!scamprotData.enabled) return;

        // Scam protection is enabled
        let score = 0;

        const knownBadLinks = fs.readFileSync(path.resolve(`./db/scamprot/badLinks.list`), 'utf8').split('\n').map(link => {
            return {
                value: `${link.replace('.'), '\\.'}`,
                weight: 100,
                reason: 'Known bad link'
            }
        });

        const values = [
            ...knownBadLinks,
            {
                value: '\[.*\]\(.*\)', // Markdown link
                weight: 5,
                reason: 'Markdown link'
            },
            {
                value: 'http(s|)://.*', // HTTP(s) Link
                weight: 2.5,
                reason: 'HTTP(s) link'
            },
            {
                value: '\$[0-9]{1,}', // Money usually used in messages as "$50 Steam gift card giveaway!" or similar
                weight: 1,
                reason: 'Money'
            }
        ]

        /**
         * @type {Array<String>}
        */
        let reasons = [];

        for (let i = 0; i < values.length; i++) {
            if (content.match(new RegExp(values[i].value, 'g'))) {
                score += values[i].weight;

                reasons.push(values[i].reason)
            }
        }

        // console.log(`Score: ${score}`);
        // console.table(reasons);

        // const actions = scamprotData.actions;

        // for (let i = 0; i < actions.length; i++) {
        //     if (score >= actions[i].score) {
        //         const actionArr = actions[i].action.split('+');

        //         for (let j = 0; j < actionArr.length; j++) {

        //         }
        //     }
        // }
    }
});