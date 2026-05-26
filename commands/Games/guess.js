const fs = require('fs')
const path = require('path')
const daalbot = require('../../daalbot.js');
const { ApplicationCommandOptionType } = require('discord.js');

const DIFFICULTIES = {
    baby: { guesses: 20, xp: 25 },
    noob: { guesses: 10, xp: 75 },
    alright: { guesses: 5, xp: 125 },
    pro: { guesses: 3, xp: 175 },
    hacker: { guesses: 1, xp: 300 },
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

async function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

function win(member, xp) {
    const currentXP = parseInt(daalbot.fs.read(path.resolve(`./db/xp/${member.guild.id}/${member.id}.xp`)))

    daalbot.fs.write(path.resolve(`./db/xp/${member.guild.id}/${member.id}.xp`), `${currentXP + xp}`)
}

module.exports = {
    name: 'guess',
    description: 'Guess a number between 1 and 100 and win xp',
    category: 'Games',

    slash: true,

    options: [
        {
            name: 'difficulty',
            description: 'How hard do you want it to be?',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Baby (20 guesses, 25 XP)', value: 'baby' },
                { name: 'Noob (10 guesses, 75 XP)', value: 'noob' },
                { name: 'Alright (5 guesses, 125 XP)', value: 'alright' },
                { name: 'Pro (3 guesses, 175 XP)', value: 'pro' },
                { name: 'Hacker (1 guess, 300 XP)', value: 'hacker' },
            ],
        },
    ],

    callback: async ({ interaction }) => {
        const difficultyKey = interaction.options.getString('difficulty') ?? 'alright'
        const difficulty = DIFFICULTIES[difficultyKey]
        const number = getRandomInt(100)
        const filter = m => m.author.id === interaction.user.id

        const startingmessage = await interaction.reply({ content: `Guess a number from 1-100, you have **${difficulty.guesses}** ${difficulty.guesses === 1 ? 'chance' : 'chances'} and can win **${difficulty.xp} XP**. Starting now!`, fetchReply: true })

        const gameThread = await startingmessage.startThread({
            name: 'Guess the number',
            autoArchiveDuration: 60,
        })

        await gameThread.members.add(daalbot.getUser(interaction.user.id))

        async function ask(current, total) {
            try {
                gameThread.send({
                    content: `Guess a number between 1 and 100 — guess **${current}/${total}** (expires in <t:${Math.floor((Date.now() + (30 * 1000)) / 1000)}:R>)`,
                })

                const messagesCollected = await gameThread.awaitMessages({ filter: filter, max: 1, time: 30 * 1000, errors: ['time'] })
                const guess = parseInt(messagesCollected.first().content)

                if (guess === number) {
                    await gameThread.send({ content: `Correct! You won ${difficulty.xp} XP!`, })
                    win(interaction.member, difficulty.xp)

                    return 'win'
                }

                if (guess > number) {
                    gameThread.send({ content: `Too high! (**${current}/${total}**)`, })

                    return 'ask'
                }

                if (guess < number) {
                    gameThread.send({ content: `Too low! (**${current}/${total}**)`, })

                    return 'ask'
                }
            } catch (e) {
                await gameThread.send({ content: 'You took too long to respond!', })
                return 'timeout'
            }
        }

        const chances = difficulty.guesses;

        for (let i = 0; i < chances; i++) {
            const result = await ask(i + 1, chances)

            if (result === 'win') {
                await wait(3)
                await gameThread.delete()

                break;
            }

            if (result === 'timeout') {
                await wait(3)
                await gameThread.delete()

                break;
            }

            if (i === chances - 1) {
                gameThread.send({ content: `You lost! The number was ${number}`, })

                await wait(3)
                await gameThread.delete()
            }

            await wait(1)
        }
    }
}