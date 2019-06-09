const Filter = require('bad-words')
const filter = new Filter();
import _s from '../../settings.js';
import functions from '../../functions.js';


export default async function recruit(db, discord, msg) {
  let name = msg.content.replace('!recruit', '');
  name = name.trim();

  if (!name.length) {
    msg.author.send('Your warrior needs a name.  Type **!recruit <name>** to create a warrior.  For example **!recruit Bob** to name it Bob.');
    return;
  }

  if (name.length > 32) {
    msg.author.send('That name is too long.  Must be less than 32 characters.');
    return;
  }

  if (filter.isProfane(name)) {
    msg.author.send('The warrior refuses to be called that.  Choose another name.');
    return;
  }

  if (!name.match("^[A-z0-9 ]+$")) {
    msg.author.send('Only letters numbers and spaces allowed in name.');
    return;
  }

  const usersCollection = db.collection('users');
  const warriorsCollection = db.collection('warriors');
  const guildsCollection = db.collection('guilds');

  const user = await usersCollection.findOne({discordId:msg.author.id});
  if (!user) {
    msg.author.send("I can't find you in my records.  Type **!joinGame** in a public channel to begin.");
    return;
  }

  if (user.recruitsAvailable < 1) {
    msg.author.send('There are no warriors available for you to recruit.  Try again tomorrow.');
    return;
  }

  const guild = await guildsCollection.findOne({discordId: user.guildDiscordId});
  if (!guild) {
    msg.author.send('I cannot find your guild.');
    return;
  }

  // check if name is duplicate
  warriorsCollection.countDocuments({guildDiscordId:user.guildDiscordId, name:name}, {}, (error, exists) => {
    if (error) {
      console.log('Error in recruit:countDocuments');
      console.log(error);
    } else {
      if (exists) {
        msg.author.send('There is already a warrior by that name.  Choose another.');
      } else {

        // make sure user doesn't have max warriors already
        warriorsCollection.countDocuments({userId:user._id}, {}, (error, numWarriors) => {
          if (error) {
            console.log('Error in createWrecruitarrior:countDocuments');
            console.log(error);
          } else {
            if (numWarriors >= _s.maxWarriors) {
              msg.author.send('Your ranks are full.  You cannot have more than '+_s.maxWarriors+' warriors.');
            } else {

              let strength = Math.random();
              let dexterity = Math.random();
              let agility = Math.random();

              const warrior = {
                name: name,
                userId: user._id,
                username: user.username,
                nickname: user.nickname,
                userTag: user.tag,
                discordId: msg.author.id,
                guildDiscordId: user.guildDiscordId,
                createdAt: new Date(),
                updatedAt: new Date(),
                strength: strength,
                dexterity: dexterity,
                agility: agility,
                combinedStats: agility + dexterity + strength,
                points: 1000,
                energy: 4,
                numAttacks: 0,
                numBattles: 0,
                wins: 0,
                lost: 0,
                ties: 0,
                gemsWon: 0,
                kills: 0,
                age: _s.startAge
              };

              // save warriors to db
              warriorsCollection.insertOne(warrior, {}, (error, result) => {
                if (error) {
                  console.log('Error in recruit:insertOne');
                  console.log(error);
                  msg.author.send('Error creating warrior.  Try again soon.');
                } else {
                  let m = '**'+name+'** has joined your ranks.\n';
                  m += 'strength: ' + Math.round(warrior.strength*100) + '\n';
                  m += 'dexterity: ' + Math.round(warrior.dexterity*100) + '\n';
                  m += 'agility: ' + Math.round(warrior.agility*100) + '\n';
                  m += '\n';
                  m += 'There are **' + (user.recruitsAvailable-1) + '** warriors available for you to recruit.\n';
                  msg.author.send(m);

                  let tm = '**'+functions.escapeMarkdown(user.nickname)+'** recruited **'+name+'**.  '+Math.round(warrior.strength*100)+'/'+Math.round(warrior.dexterity*100)+'/'+Math.round(warrior.agility*100);

                  discord.channels.get(guild.channelId).send(tm);
                }
              });

              usersCollection.updateOne({_id:user._id}, {$inc:{recruitsAvailable:-1}});
            }
          }
        })
      }
    }
  });
}
