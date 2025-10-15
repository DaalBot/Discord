const { ActivityType } = require('discord.js');
const client = require('../client');
const config = require('../config.json')

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
    }
    
    client.user.setActivity(newActivity, { type: ActivityType.Custom })
}

client.on('clientReady', () => {
    applyNewStatus(); // apply status on startup
    setInterval(() => applyNewStatus(), 5 * 60 * 1000); // apply status every 5 minutes
})