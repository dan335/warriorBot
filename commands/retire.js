import functions from '../functions.js';



export default async function rip(db, discord, msg) {
  let name = msg.content.replace('!retire', '');
  name = name.trim();

  if (!name.length) {
    msg.author.send('Who are you retiring? **!retire <warrior name>**');
    return;
  }

  const warriorsCollection = db.collection('warriors');
  const guildsCollection = db.collection('guilds');
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({discordId:msg.author.id});
  if (!user) {
    msg.author.send("I can't find you in my records.  Type **!joinGame** in a public channel to begin.");
    return;
  }

  const guild = await guildsCollection.findOne({discordId: user.guildDiscordId});
  if (!guild) {
    msg.author.send('I cannot find your guild.');
    return;
  }

  const warrior = await warriorsCollection.findOne({name:name, discordId:msg.author.id});
  if (!warrior) {
    msg.author.send('I could not find a warrior by that name.');
    return;
  }

  functions.killWarrior(db, discord, warrior, 'Retired.').then(() => {
    msg.author.send(name + " is now retired.");
    discord.channels.get(guild.channelId).send('**'+functions.escapeMarkdown(user.nickname)+'** retired **'+name+'**.');
  }).catch(error => {
    console.log(error);
  })
}
