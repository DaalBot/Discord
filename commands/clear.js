module.exports = {
  category: 'Moderation',
  description: 'Deletes multiple messages at once.',

  permissions: ['ADMINISTRATOR'],
  requireRoles: true,

  minArgs: 1,
  maxArgs: 1,
  expectedArgs: '[amount]',

  slash: 'both',
  testOnly: true,

  callback: async ({ message, interaction, channel, args }) => {
    console.log(`${msg.author.tag} ran /clear`)
    const amount = parseInt(args.shift()/*!*/)

    if (message) {
      await message.delete()
    }

    // Bulk delete
    const { size } = await channel.bulkDelete(amount, true)

    // Fetch and then delete messages
    // const messages = await channel.messages.fetch({ limit: amount })
    // const { size } = messages
    // messages.forEach((message) => message.delete())

    const reply = `Deleted ${size} message(s).`

    if (interaction) {
      return {
        content: reply,
        ephemeral: true
      }
    }

    channel.send(reply)
  },
}
