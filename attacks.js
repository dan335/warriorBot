const Filter = require('bad-words')
const filter = new Filter();
import _s from './settings.js';
import dateFns from 'date-fns';
import functions from './functions.js';


const attacks = {
  defend: async function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const warriorsCollection = db.collection('warriors');
    const guildsCollection = db.collection('guilds');
    const attacksCollection = db.collection('attacks');

    // get user
    const user = await usersCollection.findOne({discordId: msg.author.id});
    if (!user) {
      msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
      return;
    }

    // get command
    let command = msg.content.replace('!defend', '').replace(/ +(?= )/g,'');
    command = command.trim();
    const commandArray = command.split('-vs');

    if (commandArray.length != 2) {
      msg.author.send('Wrong number of arguments. **!defend <warrior name> -vs <guild name> -m <message>**.  Message is optional.');
      return;
    }

    let warriorName = commandArray[0].trim();
    let guildName;
    let message = null;

    if (commandArray[1].includes('-m')) {
      const arr = commandArray[1].split('-m');
      guildName = arr[0].trim();
      message = arr[1].trim();
    } else {
      guildName = commandArray[1].trim();
    }

    if (message) {
      if (message.length > 100) {
        msg.author.send('Message is '+message.length+' characters.  It must be less than 100.');
        return;
      }

      if (filter.isProfane(message)) {
        msg.author.send('No bad words allowed in message.  Keep it clean.');
        return;
      }

      if (!functions.includesNoSpecialCharacters(message)) {
        msg.author.send('Only letters, numbers and .!? allowed in message.');
        return;
      }
    }

    // get warrior
    const warrior = await warriorsCollection.findOne({guildDiscordId: user.guildDiscordId, name:warriorName});

    if (!warrior) {
      msg.author.send('Could not find a warrior named **'+warriorName+'**.');
      return;
    }

    if (warrior.energy < _s.attackCost) {
      msg.author.send(warrior.name+' is too tired.  Defending uses '+_s.attackCost+' energy.');
      return;
    }

    const roll = Math.random();

    // check if warrior is already defending.  only way is to get attack from db
    const at = await attacksCollection.findOne({'attackingGuild.name':guildName, 'defendingGuild.discordId':user.guildDiscordId, isAttacking:false});

    if (at) {
      at.defendingWarriors.forEach(wa => {
        if (wa.warriorId == warrior._id) {
          msg.author.send('You cannot defend more than once.');
          return;
        }
      })
    } else {
      msg.author.send('Could not find an attack from **'+guildName+'**.');
      return;
    }

    //
    attacksCollection.findOneAndUpdate({'attackingGuild.name':guildName, 'defendingGuild.discordId':user.guildDiscordId, isAttacking:false}, {
      $set: {
        updatedAt: new Date()
      },
      $addToSet: {
        defendingWarriors: {
          warriorId: warrior._id,
          name: warrior.name,
          userId: warrior.userId,
          discordId: warrior.discordId,
          roll: roll,
          message: message
        },
        defenseRolls: roll
      }
    }, {returnOriginal: false}, (error, result) => {
      if (error) {
        console.log('Error defend:findAndModify');
        console.log(error);
      } else {
        if (result.value) {
          const defenseMax = functions.arrayMax(result.value.defenseRolls);

          warriorsCollection.updateOne({_id:warrior._id}, {$inc:{energy:_s.attackCost*-1}});

          msg.author.send('**'+warrior.name+"** has joined your guild's defense against an attack from  **"+functions.escapeMarkdown(result.value.attackingGuild.name)+"**.  You rolled a **"+Math.round(roll*100)+"** and your guild now has an defense power of **"+Math.round(defenseMax*100)+"**.");

          discord.channels.get(result.value.defendingGuild.channelId).send('**'+warrior.name+'** has joined the defense against an attack from  **'+functions.escapeMarkdown(result.value.attackingGuild.name)+'**.  They rolled a **'+Math.round(roll*100)+'** and your defense now has a power of **'+Math.round(defenseMax*100)+'**. Use **!defend <warrior name> -vs '+functions.escapeMarkdown(result.value.attackingGuild.name)+'** to join the attack.');

        } else {
          msg.author.send('Could not find an attack from **'+guildName+'**.');
        }
      }
    });
  },



  attack: async function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const warriorsCollection = db.collection('warriors');
    const guildsCollection = db.collection('guilds');
    const attacksCollection = db.collection('attacks');

    // get user
    const user = await usersCollection.findOne({discordId: msg.author.id});
    if (!user) {
      msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
      return;
    }

    // get command
    let command = msg.content.replace('!attack', '').replace(/ +(?= )/g,'');
    command = command.trim();
    const commandArray = command.split('-vs');

    if (commandArray.length != 2) {
      msg.author.send('Wrong number of arguments. **!attack <warrior name> -vs <guild name> -m <message>**.  Message is optional.');
      return;
    }

    let warriorName = commandArray[0].trim();
    let guildName;
    let message = null;

    if (commandArray[1].includes('-m')) {
      const arr = commandArray[1].split('-m');
      guildName = arr[0].trim();
      message = arr[1].trim();
    } else {
      guildName = commandArray[1].trim();
    }

    if (message) {
      if (message.length > 100) {
        msg.author.send('Message is '+message.length+' characters.  It must be less than 100.');
        return;
      }

      if (filter.isProfane(message)) {
        msg.author.send('No bad words allowed in message.  Keep it clean.');
        return;
      }

      if (!functions.includesNoSpecialCharacters(message)) {
        msg.author.send('Only letters, numbers and .!? allowed in message.');
        return;
      }
    }

    // get warrior
    const warrior = await warriorsCollection.findOne({guildDiscordId: user.guildDiscordId, name:warriorName});

    if (!warrior) {
      msg.author.send('Could not find a warrior named **'+warriorName+'**.');
      return;
    }

    if (warrior.energy < _s.attackCost) {
      msg.author.send(warrior.name+' is too tired.  Attacking uses '+_s.attackCost+' energy.');
      return;
    }

    // get defending guild
    const defendingGuild = await guildsCollection.findOne({name:guildName});
    if (!defendingGuild) {
      msg.author.send('Could not find a guild named **'+guildName+'**.');
      return;
    }

    if (defendingGuild.discordId == user.guildDiscordId) {
      msg.author.send('Why are you trying to attack your own guild!?');
      return;
    }

    // get attacking guild
    const attackingGuild = await guildsCollection.findOne({_id:user.guildId});
    if (!attackingGuild) {
      msg.author.send('Could not find your guild.  This should not happen.');
      return;
    }

    const roll = Math.random();

    // get attack
    let attack = await attacksCollection.findOne({'attackingGuild.guildId':attackingGuild._id, 'defendingGuild.guildId':defendingGuild._id, isAttacking:true});

    if (attack) {

      // check if warrior is already attacking
      if (attack.attackingWarriors && attack.attackingWarriors.length) {
        attack.attackingWarriors.forEach(w => {
          if (w.warriorId == warrior._id) {
            msg.author.send('This warrior is already attacking.');
            return;
          }
        })
      }


      let attackRolls = attack.attackRolls;
      attackRolls.push(roll);

      const attackMax = functions.arrayMax(attackRolls);

      attacksCollection.updateOne({_id:attack._id}, {
        $set: {
          updatedAt: new Date()
        },
        $addToSet: {
          attackingWarriors: {
            warriorId: warrior._id,
            name: warrior.name,
            userId: warrior.userId,
            discordId: warrior.discordId,
            roll: roll,
            message: message
          },
          attackRolls: roll
        }
      }, {}, (error, result) => {
        if (error) {
          console.log('Error attack:updateOne');
          console.log(error);
        } else {
          warriorsCollection.updateOne({_id:warrior._id}, {$inc:{energy:_s.attackCost*-1}});

          msg.author.send('**'+warrior.name+'** has joined an attack on **'+defendingGuild.name+'**.  You rolled a **'+Math.round(roll*100)+'** and your guild now has an attack power of **'+Math.round(attackMax*100)+'**.');

          discord.channels.get(attackingGuild.channelId).send('**'+warrior.name+'** has joined the attack on **'+defendingGuild.name+'**.  They rolled a **'+Math.round(roll*100)+'** and your attack now has a power of **'+Math.round(attackMax*100)+'**.');
        }
      })


    } else {

      let data = {
        attackingGuild: {
          guildId: attackingGuild._id,
          discordId: attackingGuild.discordId,
          name: attackingGuild.name,
          channelId: attackingGuild.channelId
        },
        defendingGuild: {
          guildId: defendingGuild._id,
          discordId: defendingGuild.discordId,
          name: defendingGuild.name,
          channelId: defendingGuild.channelId
        },
        attackingWarriors: [
          {
            warriorId: warrior._id,
            name: warrior.name,
            userId: warrior.userId,
            discordId: warrior.discordId,
            roll: roll,
            message: message
          }
        ],
        defendingWarriors: [],
        createdAt: new Date(),
        startedAt: new Date(),  // when started attacking or defending
        updatedAt: new Date(),
        isAttacking: true,
        attackRolls: [roll],
        defenseRolls: []
      };

      attacksCollection.insertOne(data, {}, (error, result) => {
        if (error) {
          console.log('Error attack:insertOne');
          console.log(error);
        } else {
          warriorsCollection.updateOne({_id:warrior._id}, {$inc:{energy:_s.attackCost*-1}});

          msg.author.send('**'+warrior.name+'** has started an attack on **'+defendingGuild.name+'** with a power of **'+Math.round(roll*100)+'**.  Members of your guild have '+dateFns.format(dateFns.addMilliseconds(new Date(0), _s.attackDuration), 'm')+' minutes to join you in the fight.');

          discord.channels.get(attackingGuild.channelId).send('__**Attack Started**__\n**'+warrior.name+'** has started an attack on **'+defendingGuild.name+'** with a power of **'+Math.round(roll*100)+'**.  You have '+dateFns.format(dateFns.addMilliseconds(new Date(0), _s.attackDuration), 'm')+' minutes to join in and try to increase the attack power.  Use **!attack <warrior name> -vs '+defendingGuild.name+'** to join the attack.');
        }
      })
    }
  },



  attacks: async function(db, discord, msg) {
    // get user
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({discordId: msg.author.id});
    if (!user) {
      msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
      return;
    }

    const attacksCollection = db.collection('attacks');

    const cursor = attacksCollection.find({
      $or: [
        {'attackingGuild.discordId': user.guildDiscordId},
        {'defendingGuild.discordId': user.guildDiscordId}
      ]
    }, {sort:{createdAt:-1}});

    cursor.toArray((error, result) => {
      if (error) {
        console.log('Error attacks:toArray');
        console.log(error);
      } else {
        const attacks = result.filter(r => {
          return r.attackingGuild.discordId == user.guildDiscordId;
        });
        const defends = result.filter(r => {
          return r.defendingGuild.discordId == user.guildDiscordId && !r.isAttacking;
        });

        let m = "__Your Guild's Attacks__\n";

        if (attacks.length) {
          for (let n = 0; n < attacks.length; n++) {
            m += 'Attack on **'+functions.escapeMarkdown(attacks[n].defendingGuild.name)+'**.';

            const diff = new Date().getTime() - new Date(attacks[n].startedAt).getTime();
            const minutes = dateFns.format(dateFns.addMilliseconds(new Date(0), diff), 'm');

            if (attacks[n].isAttacking) {
              m += '  You have **'+m+'** minutes left to join.\n';
            } else {
              m += '  They have **'+m+'** minutes left to defend.\n';
            }
          }
        } else {
          m += 'No attacks.\n';
        }

        m += '\n';
        m += "__Incoming Attacks__\n";

        if (defends.length) {
          for (let n = 0; n < defends.length; n++) {
            m += 'Attack from **'+functions.escapeMarkdown(defends[n].attackingGuild.name)+'**.';

            const diff = new Date().getTime() - new Date(defends[n].startedAt).getTime();
            const minutes = dateFns.format(dateFns.addMilliseconds(new Date(0), diff), 'm');

            m += '  You have **'+m+'** minutes left to defend.\n';
          }
        } else {
          m += 'No incoming attacks.\n';
        }

        msg.author.send(m);
      }
    })
  }
}


export default attacks
