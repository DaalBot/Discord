const client = require('../client.js');
const fs = require('fs/promises');
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
                    await fs.rm(folder, { recursive: true });
                } catch (err) {
                    if (!err?.message?.includes('no such file or directory')) { // It's okay if the folder doesn't exist as we were going to delete it anyways.
                        console.error(err);
                    }
                }
            }
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