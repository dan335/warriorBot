import functions from '../../functions.js';


export default async function warriors(db, discord, msg) {
  const warriorsCollection = db.collection('warriors');
  const usersCollection = db.collection('users');

  // get author's guild id
  const user = await usersCollection.findOne({discordId: msg.author.id});
  if (!user) {
    msg.author.send('Could not find you in the db.  Type **!join** in a public channel to join the game.');
    return;
  }

  let cursor = null;
  let otherUser = null;
  let isSelf;
  const msgArray = msg.content.split(' ');

  if (msgArray.length == 1) {
    cursor = warriorsCollection.find({discordId:msg.author.id}, {sort:{rating:-1, combinedStats:-1}});
    isSelf = true;
  } else {
    let name = msg.content.replace('!warriors', '');
    name = name.trim();

    if (!name.length) {
      return;
    }

    // get other player
    otherUser = await usersCollection.findOne({guildDiscordId:user.guildDiscordId, nickname:name});
    if (!otherUser) {
      msg.author.send('Player not found.');
      return;
    }

    // get warriors
    cursor = warriorsCollection.find({userId: otherUser._id}, {sort:{rating:-1, combinedStats:-1}});
    isSelf = false;
  }

  cursor.toArray((error, warriors) => {
    if (warriors.length) {
      let m = '';
      if (isSelf) {
        m += 'Your warriors\n';
        m += 'There are '+user.recruitsAvailable+' warriors available for recruiting.\n';
      } else {
        m += functions.escapeMarkdown(otherUser.nickname) + "'s warriors.\n";
      }

      warriors.forEach(warrior => {
        m += '\n';
        m += '**' + warrior.name + '**\n';
        m += 'strength: **' + Math.round(warrior.strength*100) + '**, ';
        m += 'dexterity: **' + Math.round(warrior.dexterity*100) + '**, ';
        m += 'agility: **' + Math.round(warrior.agility*100) + '**, ';
        m += 'points: **' + Math.round(warrior.points) + '**, ';
        m += 'energy: **' + warrior.energy + '**, ';
        m += 'battles: **'+warrior.numBattles+'**, ';
        m += 'attacks: **'+warrior.numAttacks+'**, ';
        m += 'wins: **'+warrior.wins+'**, ';
        m += 'loses: **'+warrior.lost+'**, ';
        m += 'ties: **'+warrior.ties+'**, ';
        m += 'gems won: **'+Math.round(warrior.gemsWon)+'**, ';
        m += 'kills: **'+warrior.kills+'**, ';
        m += 'age: **'+warrior.age+'**';
        m += '\n';
      });

      msg.author.send(m);
    } else {
      if (isSelf) {
        msg.author.send('You have no warriors.  Use **!recruit <name>** to recruit one.');
      } else {
        msg.author.send(functions.escapeMarkdown(otherUser.nickname) + ' has no warriors.');
      }
    }
  });
}
