export default function setResultChannel(db, discord, msg) {
  let name = msg.content.replace('!setResultChannel', '');
  name = name.replace('#', '');
  name = name.trim();

  const channel = msg.guild.channels.find(c => c.name == name);

  if (channel) {
    const guildsCollection = db.collection('guilds');

    guildsCollection.updateOne({discordId:msg.guild.id}, {
      $set: {
        channelId:channel.id
      }
    }, {}, (error, result) => {
      if (error) {
        console.log('Error in setResultChannel:updateOne');
        console.log(error);
        msg.reply('Error updating db.  Maybe my creator will fix me soon.  Try again later.');
      } else {
        if (result.matchedCount) {
          msg.reply('Channel updated.');
        } else {
          msg.reply("I couldn't find your guild in the db.  Run this command after someone has joined the game.");
        }
      }
    })
  } else {
    msg.reply('I could not find that channel.');
  }
}
