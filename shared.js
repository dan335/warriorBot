const Filter = require('bad-words')
const filter = new Filter();
import _s from './settings.js';
import dateFns from 'date-fns';


const shared = {

  guilds: async function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const guildsCollection = db.collection('guilds');

    let page = Number(msg.content.replace('!guilds', '').trim());
    if (isNaN(page)) {
      page = 1;
    }
    page = Math.max(page, 1);
    page -= 1;  // now starts at 0

    const skip = _s.perPage * page;

    const num = await guildsCollection.countDocuments({});
    const numPages = Math.ceil(num / _s.perPage)

    usersCollection.aggregate([
      {$group: {
        _id: '$guildId',
        name: {$first: '$guildName'},
        users: {$sum: 1},
        gems: {$sum: '$gems'}
      }},
      {$sort: {gems:-1}},
      {$limit: _s.perPage},
      {$skip: skip}
    ], {}, (error, cursor) => {
      if (error) {
        console.log('Error in guilds:aggregate');
        console.log(error);
      } else {
        cursor.toArray((error, guilds) => {
          if (error) {
            console.log('Error in guilds:toArray');
            console.log(error);
          } else {
            let m = '__Discord Guilds__\n';
            m += 'Page '+(page+1)+' of '+numPages+'\n';
            m += '\n';

            guilds.forEach(guild => {
              m += '**' + guild.name + '** - **' +guild.users+ '** players, **' +Math.round(guild.gems)+ '** gems.\n';
            });

            if (msg.channel.type == 'text') {
              msg.channel.send(m);
            } else if (msg.channel.type == 'dm') {
              msg.author.send(m);
            }
          }
        })
      }
    });
  },
}


export default shared
