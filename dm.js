const Filter = require('bad-words')
const filter = new Filter();
import _s from './settings.js';
import Battle from './Battle.js';
var EloRating = require('elo-rating');
import dateFns from 'date-fns';
import functions from './functions.js';


const dm = {

  guildWarriors: async function(db, discord, msg) {
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
  },



  warriors: async function(db, discord, msg) {
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
  },


  battle: async function(db, discord, msg) {
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
  },


  leaveGame: function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const warriorsCollection = db.collection('warriors');

    warriorsCollection.deleteMany({discordId:msg.author.id}, {}, (error, result) => {
      if (error) {
        console.log('Error leaveGame:deleteMany');
        console.log(error);
      } else {
        usersCollection.deleteMany({discordId:msg.author.id}, {}, (error, result) => {
          if (error) {
            console.log('Error leaveGame:deleteMany');
            console.log(error);
          } else {
            msg.author.send('Your warriors have been retired and your data erased.');
          }
        });
      }
    });
  },



  predict: async function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const warriorsCollection = db.collection('warriors');

    const user = await usersCollection.findOne({discordId: msg.author.id});
    if (!user) {
      msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
      return;
    }

    let command = msg.content.replace('!predict', '');
    command = command.trim();
    const commandArray = command.split('-vs');

    if (commandArray.length != 2) {
      msg.author.send('Wrong number of arguments. **!predict <warrior name> -vs <warrior name>**.');
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

    const expected = EloRating.expected(warrior1.points, warrior2.points);

    msg.author.send('Based on points there is '+Math.round(expected*100)+'% chance that '+warrior1.name+' will beat '+warrior2.name);
  },



  buyRecruit: async function(db, discord, msg) {
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({discordId: msg.author.id});
    if (!user) {
      msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
      return;
    }

    if (user.gems < _s.buyRecruitCost) {
      msg.author.send('You do not have enough gems.  This costs '+_s.buyRecruitCost+' gems.');
      return;
    }

    usersCollection.updateOne({_id:user._id}, {$inc:{gems:_s.buyRecruitCost*-1, recruitsAvailable:1}}, {}, (error, result) => {
      if (error) {
        console.log('Error buyRecruit:updatOne');
      } else {
        msg.author.send('Success.  There are now '+(user.recruitsAvailable+1)+' warriors available for recruiting.');
      }
    })
  },



  battleResults: async function(db, discord, msg) {
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
  },




}


export default dm
