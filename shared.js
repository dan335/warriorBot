const Filter = require('bad-words')
const filter = new Filter();
import _s from './settings.js';
import dateFns from 'date-fns';


const shared = {

  timeUntil: function(db, discord, msg) {
    const msUntil = dateFns.differenceInMilliseconds(dateFns.endOfToday(), new Date());
    const hours = Math.floor(msUntil / (1000 * 60 * 60));
    const minutes = Math.floor((msUntil - (hours * 1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((msUntil - (hours * 1000 * 60 * 60) - (minutes * 1000 * 60)) / 1000);
    let m = '';
    if (hours) {
      m += hours + ' hours ';
    }
    if (minutes) {
      m += minutes + ' minutes ';
    }
    m += seconds + ' seconds.';

    if (msg.channel.type == 'text') {
      msg.channel.send('Next day in ' + m);
    } else  if (msg.channel.type == 'dm') {
      msg.author.send('Next day in ' + m);
    }
  },


  guilds: function(db, discord, msg) {
    const usersCollection = db.collection('users');

    usersCollection.aggregate([
      {$group: {
        _id: '$guildId',
        name: {$first: '$guildName'},
        users: {$sum: 1},
        gems: {$sum: '$gems'}
      }}
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
