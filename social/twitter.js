const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const client = require('../client.js');
const { parse } = require('rss-to-json');
const nitterLink = 'nitter.poast.org';
const crypto = require('crypto');

/**
 * @param {string} user
 * @returns {Promise<Array<
    * {
        * uid: string,
        * content: string,
        * link: string,
        * date: string,
        * images: Array<string> | undefined
    * }
 * >>}
*/
async function getTweets(user) {
    try {
        const feed = await parse(`https://${nitterLink}/${user}/rss`);
        
        const tweets = feed.items.map(item => {
            return {
                uid: crypto.createHash('md5').update(item.link).digest('hex'),
                content: item.title,
                link: item.link.replace(nitterLink, 'twitter.com'),
                date: item.published,
                images: item.description.match(/src="(.+?)"/g)?.map(image => image.replace('src="', '')?.replace('"', ''))
            }
        });

        return tweets;
    } catch (error) {
        console.error(`Error getting tweets for ${user}:`, error);
        return null;
    }
}

const sendNewTweets = async (username, channelEntries) => {
    const tweets = await getTweets(username);
    const oldTweetData = fs.readFileSync(path.resolve('./db/socialalert/twitter.detected'), 'utf8').split('\n');
    if (!tweets) return; // If error getting tweets, return

    for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        
        // Skip if tweet has already been processed
        if (oldTweetData.find(t => t === tweet.uid)) {
            continue;
        }

        fs.appendFileSync(path.resolve('./db/socialalert/twitter.detected'), `${tweet.uid}\n`); // Append tweet to detected file to prevent duplicate alerts

        const embed = new Discord.EmbedBuilder()
            .setColor('#1DA1F2')
            .setAuthor({
                name: `@${username}`,
                url: `https://twitter.com/${username}`
            })
            .setDescription(tweet.content)
            .setTitle(`New tweet from ${username}`)
            .setURL(tweet.link)
            .setTimestamp(new Date(tweet.date));

        if (tweet.images) {
            embed.setImage(tweet.images[0]);
        }

        for (const { id, role } of channelEntries) {
            const channel = client.channels.cache.get(id);
            if (!channel) continue; // Skip if channel does not exist

            const betaInvolved = fs.readFileSync(path.resolve(`./db/beta/socialtwt.txt`), 'utf8').split('\n').includes(channel.guild.id); // Disable this line too to prevent uselessly checking if server is involved in beta
            if (!betaInvolved) continue; // Skip if server is not involved in beta (comment out this line to send to all servers)
            
            await channel.send({
                content: role ? `<@&${role}>` : null,
                embeds: [embed]
            })
        }
    }
};

setInterval(async () => {
    const twitterJson = JSON.parse(fs.readFileSync(path.resolve('./db/socialalert/twitter.json'), 'utf8'));

    let completedUsers = [];

    for (const { username, channel: { id, role } } of twitterJson) {
        if (completedUsers.includes(username)) continue; // Skip if user has already been processed this interval
        completedUsers.push(username);
        let channelEntries = twitterJson.filter(i => i.username === username);
        channelEntries = channelEntries.map(i => {
            return {
                id: i.channel.id,
                role: i.channel.role
            }
        })

        await sendNewTweets(username, channelEntries);
    }
}, 10 * 60 * 1000);