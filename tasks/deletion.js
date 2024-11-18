const client = require('../client.js');
const fs = require('fs/promises');
const fss = require('fs');
const path = require('path');

async function deleteGuild(guild) {
    const deletionFile = path.resolve(`./temp/del/${guild}.json`);

    try {
        const data = JSON.parse(await fs.readFile(deletionFile, 'utf-8'));
        const { time, reason } = data;

        if (time < Date.now()) {
            console.log(`Deleting ${guild} with reason: ${reason}`);
            const categories = [
                'autorole',
                'config',
                'logging',
                'managed',
                'tickets',
                'xp',
                'events'
            ];

            for (let i = 0; i < categories.length; i++) {
                const category = categories[i];
                const folder = path.resolve(`./db/${category}/${guild}`);

                try {
                    if (!fss.existsSync(folder)) continue;
                    await fs.rm(folder, { recursive: true }); // Delete the folder and all its contents.
                } catch (err) {
                    if (!err?.message?.includes('no such file or directory')) { // It's okay if the folder doesn't exist as we were going to delete it anyways.
                        console.error(err);
                    }
                }
            }

            const eventsJson = JSON.parse(await fs.readFile(path.resolve(`./db/events/events.json`), 'utf-8'));
            const newEvents = eventsJson.filter(event => event.guild !== guild);

            await fs.writeFile(path.resolve(`./db/events/events.json`), JSON.stringify(newEvents, null, 4));
        }
    } catch (err) {
        console.error(err);
    }
}

setTimeout(async() => {
    const files = await fs.readdir(path.resolve(`./temp/del/`));

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const guild = file.split('.')[0];

        if (guild)
            deleteGuild(guild);
    }
}, 5 * 60 * 1000);

client.on('guildCreate', async(guild) => {
    const deletionIsScheduled = fss.existsSync(path.resolve(`./temp/del/${guild.id}.json`));

    if (deletionIsScheduled) {
        const deletionData = JSON.parse(fs.readFileSync(path.resolve(`./temp/del/${guild.id}.json`), 'utf8'));
        const { time, reason } = deletionData;

        if (reason === '[AUTO];;guildDelete') {
            // Guild was going to be deleted but the bot was added back before the deletion time.
            // We can cancel the deletion.
            await fs.rm(path.resolve(`./temp/del/${guild.id}.json`));
        }
    }
})

client.on('guildDelete', async(guild) => {
    const deletionIsScheduled = fss.existsSync(path.resolve(`./temp/del/${guild.id}.json`));

    if (deletionIsScheduled) return; // If the guild was already scheduled for deletion, we don't need to do anything.

    const deletionData = {
        time: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        reason: '[AUTO];;guildDelete',
        type: 'guild'
    }

    fs.writeFile(path.resolve(`./temp/del/${guild.id}.json`), JSON.stringify(deletionData, null, 4));
})