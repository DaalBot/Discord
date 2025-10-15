const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { client } = require('../daalbot');
const { AttachmentBuilder, TextChannel } = require('discord.js');

const generateSnowflakeFromDate = (date = new Date()) =>
  ((BigInt(date.valueOf()) - BigInt(1420070400000)) << BigInt(22)).toString();

async function createBackup() {
    const dataDir = path.join(__dirname, '../db');
    const backupDir = path.join(__dirname, '../temp/backup');

    const creationDate = Date.now();
    const retentionPeriod = 1000 * 60 * 60 * 24 * 90;

    execSync(`7z a -p"${process.env.DB_ENC_KEY}" -mhe=on ${backupDir}/${creationDate}.7z ${dataDir}`, {
        stdio: 'inherit'
    });

    const files = fs.readdirSync(backupDir);
    if (files.length > 10) {
        files.sort((a, b) => fs.statSync(path.join(backupDir, a)).mtime - fs.statSync(path.join(backupDir, b)).mtime);
        const filesToDelete = files.slice(0, files.length - 10);
        for (const file of filesToDelete) {
            fs.unlinkSync(path.join(backupDir, file));
        }
    }

    /**
     * @type {TextChannel | undefined}
    */
    let channel = client.channels.cache.get('1400912660253507645');
    if (!channel) channel = await client.channels.fetch('1400912660253507645');

    if (channel) {
        const attachment = new AttachmentBuilder(path.join(backupDir, `${creationDate}.7z`));
        attachment.setName(`${creationDate}.7z`);
        await channel.send({ files: [attachment] });

        const expiredBackups = await channel.messages.fetch({
            limit: 100,
            before: generateSnowflakeFromDate(new Date(creationDate - retentionPeriod))
        });

        for (const message of expiredBackups.values()) {
            console.log(`Deleting expired backup message: ${message.id}`);
            await message.delete().catch(console.error);
        }
    } else {
        console.error('Backup channel not found.');
    }
}

client.once('clientReady', () => {
    console.log('Backup task started.');
    createBackup().catch(console.error);
});

setInterval(createBackup, 1000 * 60 * 60);