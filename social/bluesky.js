const axios = require('axios');
const daalbot = require('../daalbot');
const client = require('../client');
const fs = require('fs/promises');
const path = require('path');

setInterval(async() => {
    const blueskyProfiles = await fs.readFile(path.resolve(`./db/socialalert/bsky.txt`), 'utf-8');
    const detectedPosts = await fs.readFile(path.resolve(`./db/socialalert/bsky.detected`), 'utf-8');
    let detectedPostsArray = detectedPosts.split('\n');
    const profiles = blueskyProfiles.split('\n');

    let userData = [];

    for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        if (profile.length === 0) continue;

        const did = profile.split(';;[DCS];;')[0];
        const channels = profile.split(';;[DCS];;')[1].split(';;[NC];;'); // [ { "id": "123456789", "message": "%%{LINK}%%" } ]

        const response = await axios.get(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}`);

        const posts = response.data.feed;

        userData.push({
            did,
            channels,
            posts
        });
    }

    for (let i = 0; i < userData.length; i++) {
        const user = userData[i];
        const channels = user.channels;
        const posts = user.posts;

        for (let j = 0; j < posts.length; j++) {
            const post = posts[j].post;
            if (detectedPostsArray.includes(post.cid)) continue;
            detectedPostsArray.push(post.cid);

            const postUrl = post.uri.replace('at://', 'https://bsky.app/profile/').replace('app.bsky.feed.post', 'post');

            for (let k = 0; k < channels.length; k++) {
                const channel = JSON.parse(channels[k]); // { "id": "123456789", "message": "%%{LINK}%%" }
                const channelId = channel.id;
                const channelMessage = channel.message;
                if (!channelMessage || !channelMessage.includes('%%{LINK}%%')) continue;

                const channelObj = client.channels.cache.get(channelId);
                if (!channelObj) continue;

                const message = channelMessage.replace('%%{LINK}%%', postUrl);
                channelObj.send(message);
            }
        }
    }

    await fs.writeFile(path.resolve(`./db/socialalert/bsky.detected`), detectedPostsArray.join('\n'));
}, 60 * 1000);