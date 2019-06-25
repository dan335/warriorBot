export default async function joinGame(db, discord, msg) {
  const usersCollection = db.collection('users');
  const guildsCollection = db.collection('guilds');

  // make sure user does not exist already.  maybe in another guild
  const user = await usersCollection.findOne({discordId:msg.author.id});
  if (user) {
    if (user.guildDiscordId != msg.guild.id) {
      msg.author.send("Looks like you're already playing in another guild. You must leave that guild's game to join this one. Type **!leaveGame** to leave.  This will delete all of your warriors and data.");
      return;
    }
  }

  // save guild to db
  guildsCollection.findOneAndUpdate({discordId:msg.guild.id}, {
    $setOnInsert: {
      discordId: msg.guild.id,
      channelId: msg.channel.id,
      name: msg.guild.name,
      createdAt: new Date(),
    },
    $set: {
      updatedAt: new Date()
    }
  }, {upsert:true, returnOriginal:false}, (error, result) => {
    if (error) {
      console.log('Error in join:findOneAndUpdate');
      console.log(error);
    } else {
      const guild = result.value;

      if (!guild) {
        console.error('Could not find guild.  This should not happen.');
        msg.reply('Could not get your guild from the db.  Weird.  Try again soon.');
        return;
      }

      // upsert user
      usersCollection.updateOne({discordId:msg.author.id}, {
        $setOnInsert: {
          discordId: msg.author.id,
          guildId: guild._id,
          guildName: guild.name,
          guildDiscordId: msg.guild.id,
          createdAt: new Date(),
          tag: msg.author.tag,
          username: msg.author.username,
          nickname: msg.member.nickname ? msg.member.nickname : msg.author.username,
          avatar: msg.author.avatar,
          avatarURL: msg.author.avatarURL,
          gems: 0,
          recruitsAvailable: 3
        },
        $set: {
          updatedAt: new Date()
        }
      }, {upsert:true}, (error, result) => {
        if (error) {
          console.log('Error in joinGame:updateOne');
          console.log(error);
          msg.reply('Error creating user.  Try again soon.');
        } else {
          if (result.upsertedCount == 0) {
            msg.author.send('Welcome back.  Type **!commands** to see commands.');
          } else {
            msg.author.send('Welcome to the game. Type **!help** to begin.');
          }
        }
      });
    }
  });
}
