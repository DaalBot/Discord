const fs = require('fs');
const path = require('path');
const daalbot = require('../../daalbot');
const { ApplicationCommandOptionType, MessageFlags, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { request } = require('undici');
const config = require('../../config.json');
const botPath = config.botPath;

module.exports = {
    name: 'xp',
    description: 'XP management commands',
    category: 'XP',

    slash: true,

    guildOnly: true,
    testOnly: false,

    options: [
        {
            name: 'grant',
            description: 'Modifies the XP of a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user to modify the XP of',
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: 'amount',
                    description: 'The amount of XP',
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                },
                {
                    name: 'action',
                    description: 'The action to perform',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: 'Add',
                            value: 'add'
                        },
                        {
                            name: 'Remove',
                            value: 'remove'
                        },
                        {
                            name: 'Set',
                            value: 'set'
                        }
                    ]
                }
            ]
        },
        {
            name: 'reward',
            description: 'Sets up a reward for levels',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'level',
                    description: 'The level to grant the reward upon reaching',
                    type: ApplicationCommandOptionType.Integer,
                    required: true
                },
                {
                    name: 'role',
                    description: 'The role to grant upon reaching the level',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        },
        {
            name: 'level',
            description: 'Shows your or another members level',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user to show the level of',
                    type: ApplicationCommandOptionType.User,
                    required: false
                }
            ]
        }
    ],

    callback: async ({ interaction }) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'grant') {
            // Check permissions for grant subcommand
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ content: 'You need the `Moderate Members` permission to use this command.', flags: MessageFlags.Ephemeral });
            }

            // Looks strange by here but its just for intellisense
            const user = interaction.options.getUser('user');
            const amount = parseInt(`${interaction.options.getInteger('amount')}`);
            const action = `${interaction.options.getString('action')}`;

            // Check if the user is a bot
            if (user.bot) return interaction.reply({ content: `<@${user.id}> is a bot and is not have a level`, flags: MessageFlags.Ephemeral });

            if (action === 'add') {
                // Check if the user has a XP file
                if (fs.existsSync(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`))) {
                    // Read the XP file
                    let xp = parseInt(daalbot.fs.read(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), 'utf8'));
                    // Add the XP
                    xp += amount;
                    // Write the XP file
                    fs.writeFileSync(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), `${xp}`);
                    // Reply
                    interaction.reply({ content: `Added ${amount} XP to <@${user.id}>`, flags: MessageFlags.Ephemeral });
                } else {
                    // Just set it if it doesnt exist

                    // Save it
                    daalbot.fs.write(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), `${amount}`);

                    // Reply
                    interaction.reply({ content: `Added ${amount} XP to <@${user.id}>`, flags: MessageFlags.Ephemeral });
                }
            } else if (action === 'set') {
                // Save it
                daalbot.fs.write(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), `${amount}`);

                // Reply
                interaction.reply({ content: `Added ${amount} XP to <@${user.id}>`, flags: MessageFlags.Ephemeral });
            } else if (action === 'remove') {
                // Check if the user has a XP file
                if (fs.existsSync(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`))) {
                    // Read the XP file
                    let xp = parseInt(daalbot.fs.read(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), 'utf8'));
                    
                    // Remove the XP
                    xp -= amount;

                    // Write the XP file
                    daalbot.fs.write(path.resolve(`./db/xp/${interaction.guild.id}/${user.id}.xp`), xp < 0 ? `0` : `${xp}`);

                    // Reply
                    interaction.reply({ content: `Removed ${amount} XP from <@${user.id}>`, flags: MessageFlags.Ephemeral });
                }
            }
        } else if (subcommand === 'reward') {
            // Check permissions for reward subcommand
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.reply({ content: 'You need the `Manage Roles` permission to use this command.', flags: MessageFlags.Ephemeral });
            }

            // Get the level and role from the interaction.
            const level = parseInt(`${interaction.options.getInteger('level')}`);
            const roleID = interaction.options.getRole('role').id;

            // Convert the roleID to a role object.
            const role = daalbot.getRole(interaction.guild.id, roleID);

            // Functions
            function generateErrorEmbed(error) {
                const embed = new EmbedBuilder()
                    .setColor('#EF3D48')
                    .setTitle('Error')
                    .setDescription(error)
                    .setTimestamp();

                return embed;
            }

            // Check if the role exists.
            if (role === 'Role not found.') {
                const embed = generateErrorEmbed('The bot could not find the role you specified.');
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (role === 'Server not found.') {
                const embed = generateErrorEmbed('The bot could not find the server that you are in.');
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (role == undefined) {
                const embed = generateErrorEmbed('The role just returned undefined and has no explanation as to why.');
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                const embed = generateErrorEmbed('The role you specified is higher than or equal to the bots highest role. Please move the bot\'s role higher in the role list.');
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
                const embed = generateErrorEmbed('The role you specified is higher than or equal to your highest role. You cannot assign roles higher than or equal to your highest role.');
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Check if the level is a positive number and not 0.
            if (!(level >= 1)) {
                const embed = generateErrorEmbed('The level you specified is not a valid number.');
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Write the reward to the file.
            const filepath = path.resolve(`./db/xp/${interaction.guild.id}/rewards/${level}.reward`);
            const fileDir = path.resolve(`./db/xp/${interaction.guild.id}/rewards/`);

            // Check if the directory exists.
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir);
            }

            // Write the file (or overwrite it if it already exists)
            daalbot.fs.write(filepath, roleID);

            // Send the success embed.
            const embed = new EmbedBuilder()
                .setColor('#57F28D')
                .setTitle('Success')
                .setDescription(`The role <@&${role.id}> will be granted to users when they reach level ${level}.`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else if (subcommand === 'level') {
            let user = interaction.user;

            if (interaction.options.getUser('user') !== null) {
                user = interaction.options.getUser('user');
            }

            if (user.bot) return interaction.reply({ content: `Humans have levels, Bots don't`, flags: MessageFlags.Ephemeral });

            if (fs.existsSync(`${botPath}/db/xp/${interaction.guild.id}/${user.id}.xp`)) {
                let xp = daalbot.fs.read(`${botPath}/db/xp/${interaction.guild.id}/${user.id}.xp`, 'utf8');
                let level = xp.slice(0, -3) || 0;

                // Test server
                const canvas = Canvas.createCanvas(700, 250);
                const ctx = canvas.getContext('2d');
        
                const background = await Canvas.loadImage(path.resolve(`./assets/level.png`));
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        
                Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-Black.ttf'), 'Poppins-Black');
                Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-Light.ttf'), 'Poppins-Light');
                Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-SemiBold.ttf'), 'Poppins-SemiBold');
                Canvas.GlobalFonts.registerFromPath(path.resolve('./assets/Poppins-Bold.ttf'), 'Poppins-Bold');

                ctx.font = '45px Poppins-Black';
                ctx.fillStyle = '#ffffff';

                // Username
                ctx.fillText(user.globalName, canvas.width / 2.4, canvas.height / 3.5);

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
                ctx.fillText(`Level ${level}`, 200, canvas.height / 2);

                // XP
                ctx.font = '12px Poppins-Light';
                ctx.fillText(`Level progress (xp)`, 200, canvas.height / 1.7);

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
                ctx.fillText(`0`, 200, canvas.height / 1.6 + 40);
                ctx.fillText(`1000`, 475, canvas.height / 1.6 + 40);

                // XP bar progress
                ctx.font = '12px Poppins-Bold';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`${Math.round(parseInt(xp.slice(level.length)) / 10)}%`, 325, canvas.height / 1.6 + 17);

                const attachment = new daalbot.DJS.AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
                return interaction.reply({ content: `${user.username} is level ${level}.`, files: [attachment], flags: MessageFlags.Ephemeral });
            } else {
                interaction.reply({ content: `We were unable to find a entry for ${user.username}`, flags: MessageFlags.Ephemeral });
            }
        }
    }
}