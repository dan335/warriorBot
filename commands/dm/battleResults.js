export default async function battleResults(db, discord, msg) {
  let name = msg.content.replace('!battleResults', '');
  name = name.trim();

  if (!name.length) {
    msg.author.send('Name not found. **!battleResults <warrior name>**');
    return;
  }

  const warriorsCollection = db.collection('warriors');
  const usersCollection = db.collection('users');
  const battleresultsCollection = db.collection('battleresults');

  const user = await usersCollection.findOne({discordId: msg.author.id});
  if (!user) {
    msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
    return;
  }

  const warrior = await warriorsCollection.findOne({guildDiscordId: user.guildDiscordId, name:name});
  if (!warrior) {
    msg.author.send('No warrior by the name of '+name+' found.');
    return;
  }

  const cursor = battleresultsCollection.find({warriorIds: warrior._id}, {sort:{createdAt:-1}, limit:3});
  cursor.toArray((error, results) => {
    if (error) {
      console.log('Error battleResults:toArray');
      console.log(error);
    } else {
      if (results && results.length) {
        results.reverse();
        results.forEach(result => {
          msg.author.send('__**Battle Result**__\n'+result.description);
        });
      } else {
        msg.author.send(name+' has not fought any battles.');
      }
    }
  })
}
