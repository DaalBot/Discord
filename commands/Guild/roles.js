const { ChatInputCommandInteraction, ApplicationCommandOptionType, MessageFlags } = require('discord.js');
const daalbot = require('../../daalbot.js');

module.exports = {
    name: 'roles',
    description: 'Modifies role related settings within the server.',
    category: 'Guild',

    slash: true,
    testOnly: false,
    guildOnly: true,

    permissions: [
        `${daalbot.DJS.PermissionFlagsBits.ManageRoles}`
    ],

    options: [
        {
            name: 'link',
            description: 'Links two roles.',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'add',
                    description: 'Adds a linked role set.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'role1',
                            description: 'The first role to link.',
                            type: ApplicationCommandOptionType.Role,
                            required: true
                        },
                        {
                            name: 'role2',
                            description: 'The second role to link.',
                            type: ApplicationCommandOptionType.Role,
                            required: true
                        },
                        {
                            name: 'reverse',
                            description: 'Whether or not to link the roles together or just one way.',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false
                        }
                    ]
                },
                {
                    name: 'remove',
                    description: 'Removes a linked role set.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'role1',
                            description: 'The first role to unlink.',
                            type: ApplicationCommandOptionType.Role,
                            required: true
                        },
                        {
                            name: 'role2',
                            description: 'The second role to unlink.',
                            type: ApplicationCommandOptionType.Role,
                            required: true
                        },
                        {
                            name: 'reverse',
                            description: 'Whether or not to apply the unlinking to both roles.',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false
                        }
                    ]
                },
                {
                    name: 'list',
                    description: 'Lists all linked roles.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'role1',
                            description: 'The role to view linked roles for.',
                            type: ApplicationCommandOptionType.Role,
                            required: true
                        },
                        {
                            name: 'role2',
                            description: 'If specified check if the two are linked.',
                            type: ApplicationCommandOptionType.Role,
                            required: false
                        }
                    ]
                }
            ]
        }
    ],

    /**
     * @param {{interaction:ChatInputCommandInteraction}} param0
    */
    callback: async({interaction}) => {
        if (!interaction.guild.members.me.permissions.has(daalbot.DJS.PermissionFlagsBits.ManageRoles, true)) return await interaction.reply({ content: `I need the Manage Roles permission to do this.`, flags: MessageFlags.Ephemeral });
        const topPos = interaction.guild.members.me.roles.highest.position;
        const options = interaction.options;
        const subcommand = options.getSubcommand();
        const subcommandGroup = options.getSubcommandGroup();
        const role1 = options.getRole('role1');
        const role2 = options.getRole('role2');

        if (subcommandGroup == 'link') {
            if (subcommand == 'add') {
                // Check if the roles are already linked
                if (daalbot.db.managed.exists(interaction.guild.id, `linkedRoles/${role1.id}`) && (await daalbot.db.managed.get(interaction.guild.id, `linkedRoles/${role1.id}`)).includes(role2.id))
                    return await interaction.reply({ content: `Roles \`${role1.name}\` and \`${role2.name}\` are already linked.`, flags: MessageFlags.Ephemeral });

                // Check if the roles are the same
                if (role1.id == role2.id)
                    return await interaction.reply({ content: `Roles cannot be linked to themselves.`, flags: MessageFlags.Ephemeral });

                // Check if the roles are manageable
                if (role1.position >= topPos || role2.position >= topPos)
                    return await interaction.reply({ content: `Roles must be lower than the bot's highest role.`, flags: MessageFlags.Ephemeral });

                // Add the roles to the database
                daalbot.db.managed.set(interaction.guild.id, `linkedRoles/${role1.id}`, `${role2.id}\n`, 'a');
                if (options.getBoolean('reverse'))
                    daalbot.db.managed.set(interaction.guild.id, `linkedRoles/${role2.id}`, `${role1.id}\n`, 'a');
                
                return interaction.reply({ content: `Linked roles \`${role1.name}\` and \`${role2.name}\`.`, flags: MessageFlags.Ephemeral });
            }

            if (subcommand == 'remove') {
                // Check if the roles are not linked
                if (!daalbot.db.managed.exists(interaction.guild.id, `linkedRoles/${role1.id}`) || !(await daalbot.db.managed.get(interaction.guild.id, `linkedRoles/${role1.id}`)).includes(role2.id))
                    return await interaction.reply({ content: `Roles \`${role1.name}\` and \`${role2.name}\` are not linked.`, flags: MessageFlags.Ephemeral });

                // Remove the roles from the database
                await daalbot.db.managed.set(interaction.guild.id, `linkedRoles/${role1.id}`, (await daalbot.db.managed.get(interaction.guild.id, `linkedRoles/${role1.id}`)).replace(`${role2.id}\n`, ''));
                if (options.getBoolean('reverse'))
                    await daalbot.db.managed.set(interaction.guild.id, `linkedRoles/${role2.id}`, (await daalbot.db.managed.get(interaction.guild.id, `linkedRoles/${role2.id}`)).replace(`${role1.id}\n`, ''));
    
                return await interaction.reply({ content: `Unlinked roles \`${role1.name}\` and \`${role2.name}\`.`, flags: MessageFlags.Ephemeral });
            }

            if (subcommand == 'list') {
                // Check if the role is linked
                if (!(await daalbot.db.managed.exists(interaction.guild.id, `linkedRoles/${role1.id}`)))
                    return await interaction.reply({ content: `Role \`${role1.name}\` is not linked to any roles.`, flags: MessageFlags.Ephemeral });

                const linkedRoles = (await daalbot.db.managed.get(interaction.guild.id, `linkedRoles/${role1.id}`)).split('\n').filter(Boolean);

                if (role2) {
                    if (linkedRoles.includes(role2.id))
                        return await interaction.reply({ content: `Roles \`${role1.name}\` and \`${role2.name}\` are linked.`, flags: MessageFlags.Ephemeral });
                    return await interaction.reply({ content: `Roles \`${role1.name}\` and \`${role2.name}\` are not linked.`, flags: MessageFlags.Ephemeral });
                }

                return await interaction.reply({ content: `Roles linked to \`${role1.name}\`:\n* ${linkedRoles.map(id => `<@&${id}>`).join('\n')}`, flags: MessageFlags.Ephemeral });
            }
        }
    }
}