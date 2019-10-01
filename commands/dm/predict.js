var EloRating = require('elo-rating');


export default async function predict(db, discord, msg) {
  const usersCollection = db.collection('users');
  const warriorsCollection = db.collection('warriors');

  const user = await usersCollection.findOne({discordId: msg.author.id});
  if (!user) {
    msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
    return;
  }

  let command = msg.content.replace('!predict', '');
  command = command.trim();
  const commandArray = command.split('-vs');

  if (commandArray.length != 2) {
    msg.author.send('Wrong number of arguments. **!predict <warrior name> -vs <warrior name>**.');
    return;
  }

  let name1 = commandArray[0].trim();
  let name2 = commandArray[1].trim();

  if (name1 == name2) {
    msg.author.send('Warriors cannot fight themselves.');
    return;
  }

  const warrior1 = await warriorsCollection.findOne({guildDiscordId: user.guildDiscordId, name:name1});

  if (!warrior1) {
    msg.author.send('Could not find a warrior named **'+name1+'**.');
    return;
  }

  const warrior2 = await warriorsCollection.findOne({guildDiscordId: user.guildDiscordId, name:name2});

  if (!warrior2) {
    msg.author.send('Could not find a warrior named **'+name2+'**.');
    return;
  }

  const expected = EloRating.expected(warrior1.points, warrior2.points);

  msg.author.send('Based on points there is '+Math.round(expected*100)+'% chance that '+warrior1.name+' will beat '+warrior2.name);
}
