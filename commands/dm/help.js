import _s from '../../settings.js';


export default async function help(db, discord, msg) {
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({discordId:msg.author.id});
  if (!user) {
    msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
    return;
  }

  let m = '';
  m += '__Build your army.__\n';
  m += 'Recruit warriors with **!recruit <name>**.  Retire warriors with **!retire <name>**.  You can only recruit a warrior if there is one available.  Every day one more becomes available.  You can have ' + _s.maxWarriors + ' warriors max.\n';
  m += '\n';
  m += '__Challenge players in the arena.__\n';
  m += "Use **!battle <warrior name> -vs <other warrior name>** to send your warriors off to battle in the arena and win gems.  If your warrior beats a warrior ranked higher than them they will win more than beating one ranked lower.\n";
  m += '\n';
  m += '**Strength** - How much health your warrior has.\n';
  m += '**Dexterity** - How much damage your warrior does.\n';
  m += '**Agility** - Chance that your warrior will block.\n';
  m += '\n';
  m += 'There are **' + user.recruitsAvailable + '** warriors available for you to recruit.\n';
  m += '\n';
  m += 'Type **!commands** to see available commands.\n';
  msg.author.send(m);
}
