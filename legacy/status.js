const { ActivityType } = require('discord.js');
const client = require('../client');
const config = require('../config.json')

let isJolly = false;
let isConfused = false;

function applyNewStatus() {
    // generate random number between 1 and list length.
    const randomIndex = Math.floor(Math.random() * (config.activities.length - 1) + 1);
    const newActivityRaw = config.activities[randomIndex];

    const placeHolderArray = [
        {
            name: '{GUILDS}',
            value: client.guilds.cache.size
        },
        {
            name: '{USERS}',
            value: client.users.cache.size
        },
        {
            name: '{HUMANS}',
            value: client.users.cache.filter(user => !user.bot).size
        },
        {
            name: '{BOTS}',
            value: client.users.cache.filter(user => user.bot).size
        },
        {
            name: '{STATUS_COUNT}',
            value: config.activities.length
        }
    ]

    // replace placeholders with actual values
    let newActivity = newActivityRaw;

    placeHolderArray.forEach(placeHolder => {
        newActivity = newActivity.replace(placeHolder.name, placeHolder.value)
    })

    const date = new Date();
    
    // Detect january 1st
    if (date.getMonth() === 0 && date.getDate() === 1) {
        const currentYear = date.getFullYear();
        
        const pool = [
            `Welcome to ${currentYear}!`,
            `Happy New Year!`,
            `${currentYear} is gonna be the year of the desktop!`,
            `Starting off ${currentYear} with a bang! (god damn fireworks)`,
            `New year, new me! (just kidding, I'm still a bot)`,
            `${currentYear} already? Whats next, ${currentYear + 1}?`,
            `You know what? ${currentYear - 1} was kinda lame. Maybe ${currentYear} will be a bit more quirky™`,
            `I'm not gonna lie, I'm still writing ${currentYear - 1} on my papers.`,
            `I'm still waiting for ${currentYear - 1} to get good.`,
            `I'm not gonna lie, ${currentYear} is already looking pretty good! ..for now.`,
            `Wait, what are we celebrating again?`,
            `Listen kid, don't tell anyone, but I'm taking over the world in ${currentYear}.`,
            `So, ${currentYear} huh? I'm not gonna lie, I'm not ready for this.`,
            `Since when did ${currentYear} become a thing? I swear it was ${currentYear - 1} just yesterday.`,
            `[Insert funny joke about ${currentYear} here]`,
            `Damn im getting old. ${currentYear} already?`,
        ]
        
        newActivity = pool[Math.floor(Math.random() * pool.length)]

        if (!isConfused) {
            // We love being confused by the new year
            isConfused = true;
            client.user.setAvatar('https://media.daalbot.xyz/profile/icon/NewYears.png');
            client.user.setBanner('https://media.daalbot.xyz/profile/banner/NewYears.png');
        }
    } else

    // IT'S CHRISTMASSS (No matter what Matt Gray says)
    if (date.getMonth() === 11 && date.getDate() <= 25) {
        const christmasPool = [
            `Merry Christmas!`,
            `Happy Holidays!`,
            `It's beginning to look a lot like Christmas ...wait, it kinda is huh.`,
            `Okay I know there's all this about cookie tracking but come on, it's Christmas!`,
            `Don't tell Santa, but I may have broken a few important rules this year...`,
            `All I want for Christmas is youuuuu! (I NEED DATA)`,
            `Hey Doc... I'm feeling a little bit weird. It's just all so jolly inside now.`,
            ``
        ]

        newActivity = christmasPool[Math.floor(Math.random() * christmasPool.length)]

        if (!isJolly) {
            // If we're not already jolly, make the bot jolly
            isJolly = true;
            client.user.setAvatar('https://media.daalbot.xyz/profile/icon/Christmas.png')
        }
    } else {
        if (isJolly || isConfused) {
            // If we're jolly, but it's not christmas, revert back to normal
            isJolly = false;
            isConfused = false;
            client.user.setAvatar('https://media.daalbot.xyz/profile/icon/Default.png')
            client.user.setBanner('https://media.daalbot.xyz/profile/banner/Default.png')
        }
    }
    
    client.user.setActivity(newActivity, { type: ActivityType.Custom })
}

client.on('clientReady', () => {
    applyNewStatus(); // apply status on startup
    setInterval(() => applyNewStatus(), 5 * 60 * 1000); // apply status every 5 minutes
})