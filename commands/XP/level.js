const config = require('../../config.json');
const botPath = config.botPath;
const fs = require('fs');
const path = require('path');
const Canvas = require('@napi-rs/canvas')
const Discord = require('discord.js');
const { request } = require('undici');
module.exports = {
    name: 'level',
    description: 'Shows your or another members level',
    type: 'SLASH',
    testOnly: false,
    ownerOnly: false,
    guildOnly: true,
    category: 'XP',
    options: [
        {
            name: 'user',
            description: 'The user to show the level of',
            type: Discord.ApplicationCommandOptionType.User,
            required: false
        }
    ],

    
    callback: async({ interaction }) => {
        let user = interaction.user;

        if (interaction.options.getUser('user') !== null) {
            user = interaction.options.getUser('user');
        }

        if (user.bot) return interaction.reply({ content: `<@${user.id}> is a bot and does not have a level`, ephemeral: true });

        if (fs.existsSync(`${botPath}/db/xp/${interaction.guild.id}/${user.id}.xp`)) {
            let xp = fs.readFileSync(`${botPath}/db/xp/${interaction.guild.id}/${user.id}.xp`, 'utf8');
            let level = xp.slice(0, -3) || 0;

            // Test server
            const canvas = Canvas.createCanvas(700, 250);
            const ctx = canvas.getContext('2d');
    
            const background = await Canvas.loadImage(path.resolve(`./assets/level.png`));
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
            Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-Black.ttf'), 'Poppins-Black')
            Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-Light.ttf'), 'Poppins-Light')
            Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-SemiBold.ttf'), 'Poppins-SemiBold')
            Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-Bold.ttf'), 'Poppins-Bold')

            ctx.font = '45px Poppins-Black';
            ctx.fillStyle = '#ffffff';

            // Username
            ctx.fillText(user.globalName, canvas.width / 2.4, canvas.height / 3.5)

            // Avatar
            const { body } = await request(user.displayAvatarURL());
            const avatar = await Canvas.loadImage(await body.arrayBuffer());

            ctx.save();
            ctx.beginPath();
            ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
    
            ctx.drawImage(avatar, 50, 50, 150, 150);

            ctx.restore();
    
            // Level
            ctx.font = '40px Poppins-SemiBold';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Level ${level}`, 200, canvas.height / 2)

            // XP
            ctx.font = '12px Poppins-Light';
            ctx.fillText(`Level progress (xp)`, 200, canvas.height / 1.7)

            // XP bar
            // Background
            ctx.fillStyle = '#1E1E1E';
            ctx.beginPath();
            ctx.moveTo(200, canvas.height / 1.6);
            ctx.arcTo(200, canvas.height / 1.6, 210, canvas.height / 1.6, 10); // Round top-left corner
            ctx.arcTo(200, canvas.height / 1.6 + 25, 500, canvas.height / 1.6 + 25, 10); // Round top-right corner
            ctx.arcTo(500, canvas.height / 1.6 + 25, 500, canvas.height / 1.6, 10); // Round bottom-right corner
            ctx.arcTo(500, canvas.height / 1.6, 200, canvas.height / 1.6, 10); // Round bottom-left corner
            ctx.closePath();
            ctx.fill();

            // Foreground
            ctx.fillStyle = '#3279E3';
            const foreBarWidth = parseInt(xp.slice(level.length) / 3);
            const foreBarHeight = 25;
            const foreBorderRadius = 10;
            const foreBarX = 200;
            const forBarY = canvas.height / 1.6;

            ctx.beginPath();
            ctx.moveTo(foreBarX + foreBorderRadius, forBarY);
            ctx.lineTo(foreBarX + foreBarWidth - foreBorderRadius, forBarY);
            ctx.quadraticCurveTo(foreBarX + foreBarWidth, forBarY, foreBarX + foreBarWidth, forBarY + foreBorderRadius);
            ctx.lineTo(foreBarX + foreBarWidth, forBarY + foreBarHeight - foreBorderRadius);
            ctx.quadraticCurveTo(foreBarX + foreBarWidth, forBarY + foreBarHeight, foreBarX + foreBarWidth - foreBorderRadius, forBarY + foreBarHeight);
            ctx.lineTo(foreBarX + foreBorderRadius, forBarY + foreBarHeight);
            ctx.quadraticCurveTo(foreBarX, forBarY + foreBarHeight, foreBarX, forBarY + foreBarHeight - foreBorderRadius);
            ctx.lineTo(foreBarX, forBarY + foreBorderRadius);
            ctx.quadraticCurveTo(foreBarX, forBarY, foreBarX + foreBorderRadius, forBarY);
            ctx.closePath();

            ctx.fill();

            // XP bar labels
            ctx.font = '10px Poppins-Light';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`0`, 200, canvas.height / 1.6 + 40)
            ctx.fillText(`1000`, 475, canvas.height / 1.6 + 40)

            // XP bar progress
            ctx.font = '12px Poppins-Bold';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${Math.round(parseInt(xp.slice(level.length)) / 10)}%`, 325, canvas.height / 1.6 + 17)

            const attachment = new Discord.AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' })
            return interaction.reply({ content: `${user.username} is level ${level}.`, files: [attachment], ephemeral: true });
        } else {
            interaction.reply({ content: `We were unable to find a entry for ${user.username}`, ephemeral: true });
        }
    }
}