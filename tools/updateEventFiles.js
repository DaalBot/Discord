const fs = require('fs');

const normalOutputs = [
    'channelDelete', 
    'guildBanAdd',
    'guildBanRemove',
    'guildMemberAdd', 
    'guildMemberRemove', 
    'guildRoleCreate', 
    'guildRoleDelete', 
    'interactionCreate',
    'messageCreate',
    'messageDelete',
    'messageReactionAdd',
    'messageReactionRemove'
];

const updateOutputs = [
    'guildMemberUpdate',
    'guildRoleUpdate',
    'guildUpdate',
    'messageUpdate'
];

const normalInput = fs.readFileSync('../automations/events/channelCreate.js', 'utf8');
const updateInput = fs.readFileSync('../automations/events/channelUpdate.js', 'utf8');

normalOutputs.forEach(output => {
    const outputPath = `../automations/events/${output}.js`;
    fs.writeFileSync(outputPath, normalInput);
    console.log(`Editied ${outputPath}`);
});

updateOutputs.forEach(output => {
    const outputPath = `../automations/events/${output}.js`;
    fs.writeFileSync(outputPath, updateInput);
    console.log(`Editied ${outputPath}`);
});