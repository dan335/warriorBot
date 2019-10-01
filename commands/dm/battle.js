import Battle from './Battle.js';


export default async function battle(db, discord, msg) {
  const usersCollection = db.collection('users');
  const warriorsCollection = db.collection('warriors');

  const user = await usersCollection.findOne({discordId: msg.author.id});
  if (!user) {
    msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
    return;
  }

  let command = msg.content.replace('!battle', '');
  command = command.trim();
  const commandArray = command.split('-vs');

  if (commandArray.length != 2) {
    msg.author.send('Wrong number of arguments. **!battle <warrior name> -vs <warrior name>**.');
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

  if (warrior1.discordId != user.discordId) {
    msg.author.send('You do not control **'+name1+'**.  Choose one of your warriors for the first name.');
    return;
  }

  const user2 = await usersCollection.findOne({_id: warrior2.userId});
  if (!user2) {
    console.error('Error: could not find user2 in battle.');
    return;
  }

  if (warrior1.energy <= 0) {
    msg.author.send(name1+' is too tired to fight.  Your warrior has no energy left.  Try again in an hour.');
    return;
  }

  new Battle(db, discord, msg, warrior1, warrior2, user, user2);
}
