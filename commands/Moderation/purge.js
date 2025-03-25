const DJS = require('discord.js');

module.exports = {
    category: 'Moderation',
    description: 'Deletes multiple messages at once.',
  
    permissions: [
      `${DJS.PermissionFlagsBits.ManageMessages}`
    ],
  
    guildOnly: true,
    slash: true,
    testOnly: false,

    options: [
      {
        name: 'amount',
        description: 'The amount of messages to delete.',
        type: DJS.ApplicationCommandOptionType.Integer,
        required: true
      }
    ],
  
    callback: async ({ interaction }) => {
      const amount = interaction.options.getInteger('amount');
      const channel = interaction.channel;
  
      // Bulk delete
      if (amount > 100 || amount < 1) {
        return 'Please pick a number from 1 to 100'
      }

      const { size } = await channel.bulkDelete(amount, true)
  
      interaction.reply({
        content: `Deleted ${size} messages.`,
        flags: DJS.MessageFlags.Ephemeral
      })
    },
  }