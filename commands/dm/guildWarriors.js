import _s from '../../settings.js';
import functions from '../../functions.js';


export default async function guildWarriors(db, discord, msg) {
  const usersCollection = db.collection('users');
  const warriorsCollection = db.collection('warriors');

  const user = await usersCollection.findOne({discordId:msg.author.id});
  if (!user) {
    msg.author.send("I can't find you in my records.  Type **!joinGame** in a public channel to begin.");
    return;
  }

  let page = Number(msg.content.replace('!guildWarriors', '').trim());
  if (isNaN(page)) {
    page = 1;
  }
  page = Math.max(page, 1);
  page -= 1;  // now starts at 0

  const skip = _s.perPage * page;

  const num = await warriorsCollection.countDocuments({guildDiscordId: user.guildDiscordId});
  const numPages = Math.ceil(num / _s.perPage);

  const cursor = warriorsCollection.find({guildDiscordId: user.guildDiscordId}, {sort:{points:-1, combinedStats:-1}, limit:_s.perPage, skip:skip});
  cursor.toArray((error, warriors) => {
    if (warriors.length) {
      let m = "Your guild's warriors.\n";
      m += 'name   strength/dexterity/agility - points   owner\n';
      m += 'Page '+(page+1)+' of '+numPages+'\n';

      for (let n = 0; n < warriors.length; n++) {
        m += '\n';
        m += (page*_s.perPage+n+1)+'. ';
        m += '**' + warriors[n].name + '**';
        m += '    ' + Math.round(warriors[n].strength*100) + '/';
        m += Math.round(warriors[n].dexterity*100) + '/';
        m += Math.round(warriors[n].agility*100) + '';
        m += ' - ' + Math.round(warriors[n].points);
        m += '    ' + functions.escapeMarkdown(warriors[n].nickname);
        if (!warriors[n].lost) {
          m += '   :crown:';
        }
      }

      msg.channel.send(m);
    } else {
      msg.channel.send('No warriors.');
    }
  });
}
