import _s from '../../settings.js';
import functions from '../../functions.js';



export default async function warriors(db, discord, msg) {
  const warriorsCollection = db.collection('warriors');

  let page = Number(msg.content.replace('!warriors', '').trim());
  if (isNaN(page)) {
    page = 1;
  }
  page = Math.max(page, 1);
  page -= 1;  // now starts at 0

  const skip = _s.perPage * page;

  const num = await warriorsCollection.countDocuments({guildDiscordId: msg.guild.id});
  const numPages = Math.ceil(num / _s.perPage)

  const cursor = warriorsCollection.find({guildDiscordId: msg.guild.id}, {sort:{points:-1, combinedStats:-1}, limit:_s.perPage, skip:skip});
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
