import _s from '../../settings.js';
import functions from '../../functions.js';


export default function players(db, discord, msg) {
  const usersCollection = db.collection('users');

  let page = Number(msg.content.replace('!players', '').trim());
  if (isNaN(page)) {
    page = 1;
  }
  page = Math.max(page, 1);
  page -= 1;  // now starts at 0

  const skip = _s.perPage * page;

  const num = await usersCollection.countDocuments({guildDiscordId: msg.guild.id});
  const numPages = Math.ceil(num / _s.perPage)

  const cursor = usersCollection.find({guildDiscordId: msg.guild.id}, {sort: {gems:-1}, limit:_s.perPage, skip:skip});
  cursor.toArray((error, users) => {
    if (error) {
      console.log('Error in players:find');
      console.log(error);
    } else {
      if (users && users.length) {
        let m = 'Players\n';
        m += 'Page '+(page+1)+' of '+numPages+'\n';
        m += '\n';
        for (let n = 0; n < users.length; n++) {
          m += (page*_s.perPage+n+1)+'. ';
          m += '**'+functions.escapeMarkdown(users[n].nickname)+'** - **' + Math.round(users[n].gems) + '** gems\n';
        };
        msg.channel.send(m);
      } else {
        msg.channel.send('No players.');
      }
    }
  })
}
