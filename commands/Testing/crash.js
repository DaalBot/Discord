const actions = ['exit', 'undefined', 'reply']

module.exports = {
  category: 'Testing',
  description: 'Crashes the bot for debugging',

  minArgs: 1,
  expectedArgs: `<"${actions.join('", "')}">`,

  slash: true,
  testOnly: true,
  ownerOnly: true,
  guildOnly: true,

  options: [
    {
      name: 'method',
      description: `The crash to perform. One of: ${actions.join(', ')}`,
      type: 'STRING',
      required: true,
      choices: actions.map((action) => ({
        name: action,
        value: action,
      })),
    },
    {
      name: 'password',
      description: 'The password to crash the bot',
      type: 'STRING',
      required: true
    }
  ],

  callback: ({ guild, args, client, interaction }) => {
    const action = args.shift()
    if (!action || !actions.includes(action)) {
      console.log('oof.');
    }

    if (interaction.options.getString('password') === 'RandomPasswordLol') {
      if (action === 'exit') {
        console.log(`|---------------|`);
        console.log(`|  Process.exit |`);
        console.log(`|has been called|`);
        console.log(`|---------------|`);
        process.exit();
    }

    if (action === 'reply') {
      interaction.reply({
        content: 'Done!',
        ephemeral: true
      })
    }
    } else {
      return 'Wrong password!'
    }

    return 'Unknown action'
  },
}