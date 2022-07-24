module.exports = {
    category: 'Other',
    description: 'Brings up info about a user',
  
    slash: true,
    testOnly: true,

    minArgs: 1,
    expectedArgs: `<user @>`,

    options: [
        {
          name: 'user',
          description: `The user to lookup`,
          type: 'USER',
          required: true,
        }
    ],
  
    callback: async({ client, guild, args }) => {
        const id = args.shift()
        const user = await client.users.fetch(id).catch(console.error);
        console.log(user);
        return `ID: ${user.id}\nName: ${user.name}\nTag: #${user.discriminator}`
    },
  }