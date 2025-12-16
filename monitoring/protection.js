const client = require('../client.js');
const DJS = require('discord.js');
const daalbot = require('../daalbot.js');

/**
 * @type {Map<string, DJS.Message[]>}
*/
const userMessageHistory = new Map();

const defaultNotifyMessage = `# You've been hacked :(
Heya! It seems you've been hacked. Not great; however, the first thing you want to do now is change your discord password **from a different device**, you just need to assume they have full control over the device they hacked you on (your best bet is to change your password from your phone). Once you've done that because that is your **top priority** at this point, you can continue reading.

## What next?
Right okay, you should've been able to secure your discord account at this point but we're still not done.

### Malware or Phishing?
I want you to think back to before this all happened, did you download anything? Did you login to "discord" or something that required you to log into your discord account? If you inputted your discord login somewhere there's a good chance this is just a phishing attack in which case your discord account is already safe, but if you downloaded something recently that could have caused this then it is most likely malware instead where you should see below on how to deal with malware. If you're unsure whether something is phishing or malware it's best to assume malware.
### PC Hacked?
If you ended up getting hacked via some kind of malware you need to take the following steps:
1. Run a malware scan - Should be under \`Windows Security\` for windows 11 and \`Windows Defender\` for windows 10 (Mac users: you probably have something similar to this, just try searching for it)
2. Delete anything you think may have given you malware - Keep in mind: Malware can have many forms from a exe to a random Minecraft mod, if you are unsure on what the cause was then you probably just want to delete most things you've downloaded recently.
Note: While these steps can help identify and potentially even clean up some malware, the only 100% effective method to remove malware is to reinstall windows using a USB stick

## This could have affected other things
Whether you got infected with malware or you just happen to reuse passwords (which you shouldn't be doing), there is a chance this isn't limited to just your discord account. If this was malware you should assume everything that you were logged into is now hacked and you should perform the actions at the top of the message for ALL your accounts, if you reuse your discord login elsewhere then you should also perform the above actions on those other services.

## Prevention
Obviously, we don't want this happening again so here's some generic security advice:
* Make sure your antivirus, programs, and operating system is up to date
* Use a password manager - For this any dedicated password manager should suffice, ideally avoid using your browsers built in password manager.
* Be careful what you run - If you were trying to for example do something such as exploit in certain games, a lot of those programs and tools are in fact malware, but it can also hide in mundane applications.

**You should read the top of this message first.**
-# You are receiving this message because you triggered a scam protection system in {serverName} (ID: {serverId}) that detected potentially malicious behavior from your account. If you believe this was a mistake, please contact the server administrators.
`;

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (daalbot.db.managed.exists(message.guild.id, 'protection/scams.json')) {
        /**
         * @type {{flags: Record<string, number>, enabled: boolean, threshold: Record<string, {action: string, duration?: number, reason?: string, notify?: boolean}>}}
         */
        const scamsData = JSON.parse(daalbot.db.managed.get(message.guild.id, 'protection/scams.json'));
        if (!scamsData.enabled) return;

        const { flags } = scamsData;
        const scores = {
            orderedImageLinks: 0,
            rolePings: 0,
            everyonePings: 0,
            inviteLinks: 0,
            imageMasking: 0,
            messageRepeating: 0,
            ocrFinance: 0, // OCR detecting terms related to finance such as "withdrawl", "bank", "crypto", etc. (not implemented yet)
            ocrCrypto: 0, // Same as above but specifically for crypto terms and coins (e.g. "USDT", "Bitcoin", "ETH", etc.) (not implemented yet)
        };
        let totalScore = 0;

        const defaults = {
            imageMasking: 10,
            messageRepeating: 5,
            ocrFinance: 15,
            ocrCrypto: 3, // Given the amount of letter jumbling that can happen with OCR, this is lowered due to a higher chance of false positives
        }

        const normalisedMessage = {
            c: message.content,
            s: message.stickers
        }

        const userMessages = userMessageHistory.get(message.author.id) || [];
        userMessages.push(normalisedMessage);
        while (userMessages.length > 5) {
            userMessages.pop();
        }
        userMessageHistory.set(message.author.id, userMessages);

        if (flags.orderedImageLinks != 0) {
            /**
             * This is to deal with the type of scam that uses multiple image links mainly called 1.jpg, 2.jpg, 3.jpg, etc.
            */
            const urlPattern = /https?:\/\/[^\s]+/g;
            const allUrls = message.content.match(urlPattern) || [];

            const imageLinks = allUrls.filter(link => link.match(/\.(jpeg|jpg|gif|png|webp|bmp)(?:\?[^\s]*)?$/i));

            const imageFileNames = imageLinks?.map(link => {
                try {
                    const url = new URL(link);
                    const fileName = url.pathname.split('/').pop();
                    return fileName;
                } catch {
                    return null;
                }
            }).filter(name => name !== null);

            // Extract numbers from filenames in their original order
            const numberedFiles = [];
            imageFileNames?.forEach(file => {
                const match = file.match(/^(\d+)\.(jpeg|jpg|gif|png|webp|bmp)$/i);
                if (match) {
                    const fileNumber = parseInt(match[1], 10);
                    numberedFiles.push(fileNumber);
                }
            });

            // Check for consecutive sequences in the original order
            let consecutiveCount = 1;
            let highestConsecutiveCount = 1;

            for (let i = 1; i < numberedFiles.length; i++) {
                if (numberedFiles[i] === numberedFiles[i - 1] + 1) {
                    consecutiveCount++;
                    highestConsecutiveCount = Math.max(highestConsecutiveCount, consecutiveCount);
                } else {
                    consecutiveCount = 1; // Reset count if not consecutive
                }
            }

            // Only count as suspicious if we have at least 2 consecutive files
            scores.orderedImageLinks = numberedFiles.length >= 2 ? highestConsecutiveCount : 0;
            const addedScore = scores.orderedImageLinks * flags.orderedImageLinks;
            totalScore += addedScore;
        }

        if (flags.rolePings != 0) {
            const roleMentions = message.mentions.roles;
            if (roleMentions.size > 0) {
                scores.rolePings = roleMentions.size;
                const addedScore = scores.rolePings * flags.rolePings;
                totalScore += addedScore;
            }
        }

        if (flags.everyonePings != 0) {
            if (message.mentions.everyone) {
                scores.everyonePings = 1;
                const addedScore = flags.everyonePings;
                totalScore += addedScore;
            }
        }

        if (flags.inviteLinks != 0) {
            const invitePattern = /(https?:\/\/)?(www\.)?(discord\.gg|discord(app)?\.com\/invite)\/[^\s]+/g;
            const inviteLinks = message.content.match(invitePattern) || [];
            if (inviteLinks.length > 0) {
                scores.inviteLinks = inviteLinks.length;
                const addedScore = scores.inviteLinks * flags.inviteLinks;
                totalScore += addedScore;
            }
        }

        if (
            (
                message.content.startsWith('||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|||' + 
                '|​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|||' +
                '|​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|||' +
                '|​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|||' +
                '|​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|||' +
                '|​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||'
                ) 
                || message.content.includes(' _ _ _ _ _ _  ')
            ) && message.content.includes('https://imgur.com')
        ) {
            scores.imageMasking = 1;
            const addedScore = scores.imageMasking * (flags.imageMasking ?? defaults.imageMasking);
            totalScore += addedScore;
        }

        let repeatedCount = 0;
        for (let i = 0; i < userMessages.length; i++) {
            if (userMessages[i].c === normalisedMessage.c && userMessages[i].s === normalisedMessage.s) {
            repeatedCount++;
            }
        }
        if (repeatedCount > 1) {
            scores.messageRepeating = repeatedCount - 1;
            const addedScore = scores.messageRepeating * (flags.messageRepeating ?? defaults.messageRepeating);
            totalScore += addedScore;
        }

        let highestMetThreshold = 0;

        const sortedThresholdKeys = Object.keys(scamsData.threshold).map(key => parseInt(key, 10)).sort((a, b) => a - b);
        for (const thresholdKey of sortedThresholdKeys) {
            if (totalScore >= thresholdKey) {
                highestMetThreshold = thresholdKey;
            }
        }

        if (highestMetThreshold === 0) {
            return;
        }
        const thresholdActions = scamsData.threshold[highestMetThreshold];
        if (!thresholdActions) {
            return;
        }

        for (const actionData of thresholdActions) {
            const { action, duration } = actionData;

            let defaultedReason = false;
            let { reason } = actionData;
            if (!reason || typeof reason !== 'string' || reason.trim() === '') {
                reason = `Scam protection triggered (score: ${totalScore})`;
                defaultedReason = true;
            } else {
                reason = reason.replace(/{score}/g, totalScore);
            }

            try {
                switch (action) {
                    case 'delete':
                        await message.delete();
                        break;
                    case 'warn':
                        const reportObject = {
                            subject: message.author.id,
                            by: message.user.id,
                            time: Date.now(),
                            id: crypto.randomBytes(4).toString('hex'),
                            reason,
                        };

                        await daalbot.db.managed.insert(message.guild.id, 'warns.json', reportObject);

                        client.emit('guildWarnCreate', {
                            guild: message.guild,
                            ...reportObject
                        });

                        if (actionData.notify) {
                            try {
                                await message.author.send(`You have been warned in **${message.guild.name}** for: ${defaultedReason
                                    ? defaultNotifyMessage.replace('{serverName}', message.guild.name).replace('{serverId}', message.guild.id)
                                    : reason
                                    }`);
                            } catch (e) {
                                daalbot.guilds.log.warn(message.guild.id, `Failed to send DM to user ${message.author.id} about warning for scam protection.`);
                            }
                        }

                        break;
                    case 'timeout':
                        if (!message.guild.members.me.permissions.has(DJS.PermissionFlagsBits.ModerateMembers)) {
                            daalbot.guilds.log.warn(message.guild.id, `Missing Moderate Members permission to timeout user ${message.author.id} for scam protection.`);
                            break;
                        }
                        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
                        if (!member) {
                            break;
                        }
                        await member.timeout(duration * 1000, reason).catch(err => {
                            daalbot.guilds.log.error(message.guild.id, `Failed to timeout user ${message.author.id} for scam protection:`, err);
                        });

                        if (actionData.notify) {
                            try {
                                await message.author.send(`You have been timed out in **${message.guild.name}** for ${duration} seconds for: ${defaultedReason
                                    ? defaultNotifyMessage.replace('{serverName}', message.guild.name).replace('{serverId}', message.guild.id)
                                    : reason
                                    }`);
                            } catch (e) {
                                daalbot.guilds.log.warn(message.guild.id, `Failed to send DM to user ${message.author.id} about timeout for scam protection.`);
                            }
                        }

                        break;
                    case 'kick':
                        if (!message.guild.members.me.permissions.has(DJS.PermissionFlagsBits.KickMembers)) {
                            daalbot.guilds.log.warn(message.guild.id, `Missing Kick Members permission to kick user ${message.author.id} for scam protection.`);
                            break;
                        }
                        {
                            const member = await message.guild.members.fetch(message.author.id).catch(() => null);
                            if (!member) {
                                break;
                            }
                            if (!member.kickable) {
                                daalbot.guilds.log.warn(message.guild.id, `Cannot kick user ${message.author.id} for scam protection: not kickable.`);
                                break;
                            }

                            if (actionData.notify) {
                                try {
                                    await message.author.send(`You have been kicked from **${message.guild.name}** for: ${defaultedReason
                                        ? defaultNotifyMessage.replace('{serverName}', message.guild.name).replace('{serverId}', message.guild.id)
                                        : reason
                                        }`);
                                } catch (e) {
                                    daalbot.guilds.log.warn(message.guild.id, `Failed to send DM to user ${message.author.id} about kick for scam protection.`);
                                }
                            }

                            await member.kick(reason).catch(err => {
                                daalbot.guilds.log.error(message.guild.id, `Failed to kick user ${message.author.id} for scam protection:`, err);
                            });
                        }
                        break;
                    case 'ban':
                        if (!message.guild.members.me.permissions.has(DJS.PermissionFlagsBits.BanMembers)) {
                            daalbot.guilds.log.warn(message.guild.id, `Missing Ban Members permission to ban user ${message.author.id} for scam protection.`);
                            break;
                        }
                        {
                            const member = await message.guild.members.fetch(message.author.id).catch(() => null);
                            if (!member) {
                                break;
                            }
                            if (!member.bannable) {
                                daalbot.guilds.log.warn(message.guild.id, `Cannot ban user ${message.author.id} for scam protection: not bannable.`);
                                break;
                            }

                            if (actionData.notify) {
                                try {
                                    await message.author.send(`You have been banned from **${message.guild.name}** for: ${defaultedReason
                                        ? defaultNotifyMessage.replace('{serverName}', message.guild.name).replace('{serverId}', message.guild.id)
                                        : reason
                                        }`);
                                } catch (e) {
                                    daalbot.guilds.log.warn(message.guild.id, `Failed to send DM to user ${message.author.id} about ban for scam protection.`);
                                }
                            }

                            await member.ban({ reason, deleteMessageSeconds: actionData.deleteSeconds ?? 0 }).catch(err => {
                                daalbot.guilds.log.error(message.guild.id, `Failed to ban user ${message.author.id} for scam protection:`, err);
                            });
                        }
                        break;
                    default:
                        daalbot.guilds.log.warn(message.guild.id, `Unknown action "${action}" for scam protection.`);
                        break;
                }
            } catch (error) {
                console.error(`[SCAM PROTECTION] Failed to execute action ${action} for user ${message.author.id} in guild ${message.guild.id}:`, error);
            }
        }
    } else {
        // No scam protection configuration found for this guild
    }
});