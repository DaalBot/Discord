# This file just helps to update all the files in the events folder instead of me having to manually copy and paste the files
UPDATE_INPUT=$(cat channelUpdate.js)
NORMAL_INPUT=$(cat channelCreate.js)

NORMAL_OUTPUTS="channelDelete guildBanAdd guildBanRemove guildMemberAdd guildMemberRemove guildRoleCreate guildRoleDelete interactionCreate messageCreate messageDelete messageReactionAdd messageReactionRemove"
UPDATE_OUTPUTS="guildMemberUpdate guildRoleUpdate guildUpdate messageUpdate"

for i in $NORMAL_OUTPUTS
do
    echo -e "$NORMAL_INPUT" > $i.js
done

for i in $UPDATE_OUTPUTS
do
    echo -e "$UPDATE_INPUT" > $i.js
done