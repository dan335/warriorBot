import Battle from './Battle.js';
import _s from './settings.js';
import dateFns from 'date-fns';
import functions from './functions.js';


const events = {

  nightly: function(db, discord) {
    // give everyone 1 recruit
    const usersCollection = db.collection('users');
    usersCollection.updateMany({}, {$inc:{recruitsAvailable:1}});

    const warriorsCollection = db.collection('warriors');

    // kill warriors
    const cursor = warriorsCollection.find({});
    cursor.toArray((error, warriors) => {
      if (!error) {
        warriors.forEach(warrior => {
          const chance = (warrior.age - _s.startAge) / (_s.maxAge - _s.startAge);
          if (Math.random() <= chance) {
            functions.killWarrior(db, discord, warrior, 'died of old age.');
          }
        })
      }
    })

    // age warriors
    warriorsCollection.updateMany({}, {$inc:{age:1}});
  },


  hourly: function(db, discord) {

  },


  halfHour: function(db, discord) {
    const warriorsCollection = db.collection('warriors');
    warriorsCollection.updateMany({energy: {$lt:_s.maxEnergy}}, {$inc:{energy:1}});
  },


  tenMinutes: function(db, discord) {

  },


  minute: function(db, discord) {
    const attacksCollection = db.collection('attacks');

    const cutoff = dateFns.subMilliseconds(new Date(), _s.attackDuration - 1000);

    const cursor = attacksCollection.find({createdAt: {$lt:cutoff}});

    cursor.toArray((error, attacks) => {
      if (error) {
        console.log('Error minute:toArray');
        console.log(error);
      } else {
        attacks.forEach(attack => {

          attacksCollection.deleteOne({_id:attack._id});

          // end attack
          const attackMax = functions.arrayMax(attack.attackRolls);
          const defenseMax = functions.arrayMax(attack.defenseRolls);

          if (attackMax > defenseMax) {
            // successful attack

            // give gems
            let stolenGems = 0;
            const usersCollection = db.collection('users');
            let bulk = usersCollection.initializeUnorderedBulkOp();
            let hasBulkOp = false;

            const cursor = usersCollection.find({guildDiscordId: attack.defendingGuild.discordId}, {projection:{gems:1}});

            cursor.toArray((error, users) => {
              if (error) {
                console.log('Error minute event: toArray');
                console.log(error);
              } else {

                // steal gems
                users.forEach(u => {
                  let stolen = u.gems * 0.1;
                  stolenGems += stolen;

                  bulk.find({_id:u._id}).updateOne({$inc:{gems:stolen*-1}});
                  hasBulkOp = true;
                });

                // give gems
                attack.attackingWarriors.forEach(war => {
                  bulk.find({_id:war.userId}).updateOne({$inc:{gems:stolenGems/attack.attackingWarriors.length}});
                  hasBulkOp = true;
                });

                // save users
                if (hasBulkOp) {
                  bulk.execute({}, (error, result) => {
                    if (error) {
                      console.log('Error event minute: bulk execute');
                      console.log(error);
                    }
                  });
                }

                // print results
                let am = '__**'+functions.escapeMarkdown(attack.defendingGuild.name)+'  was Defeated**__\nAttack on **'+functions.escapeMarkdown(attack.defendingGuild.name)+'** was successful.  Your attack for **'+Math.round(attackMax*100)+'** beat their defense of **'+Math.round(defenseMax*100)+'** and stole **'+Math.round(stolenGems)+' gems**.';

                discord.channels.get(attack.attackingGuild.channelId).send(am);

                let defm = '__**Your Guild Lost**__\nAttack from **'+functions.escapeMarkdown(attack.attackingGuild.name)+'** was successful.  Their attack power of **'+Math.round(attackMax*100)+'** beat your defense of **'+Math.round(defenseMax*100)+'**.  They stole **'+Math.round(stolenGems)+' gems**.';

                discord.channels.get(attack.defendingGuild.channelId).send(defm);

                // send attacking warrior list
                let aw = '**Attacking Warriors**\n';
                aw += printWarriors(attack.attackingWarriors);

                discord.channels.get(attack.attackingGuild.channelId).send(aw);
                discord.channels.get(attack.defendingGuild.channelId).send(aw);

                // send defending warrior list
                let dw = '**Defending Warriors**\n';
                dw += printWarriors(attack.defendingWarriors);

                discord.channels.get(attack.attackingGuild.channelId).send(dw);
                discord.channels.get(attack.defendingGuild.channelId).send(dw);
              }
            })


          } else {
            // unsuccessful attack
            let am = '__**Attack Unuccessful**__\nAttack on **'+functions.escapeMarkdown(attack.defendingGuild.name)+'** was unsuccessful.  Your attack for **'+Math.round(attackMax*100)+'** was beat by their defense of **'+Math.round(defenseMax*100)+'**.';

            discord.channels.get(attack.attackingGuild.channelId).send(am);

            let dm = '__**Your Guild Won**__\nAttack from **'+functions.escapeMarkdown(attack.attackingGuild.name)+'** was unsuccessful.  Their attack power of **'+Math.round(attackMax*100)+'** was beat by your defense of **'+Math.round(defenseMax*100)+'**.';

            discord.channels.get(attack.defendingGuild.channelId).send(dm);

            // send attacking warrior list
            let aw = '**Attacking Warriors**\n';
            aw += printWarriors(attack.attackingWarriors);

            discord.channels.get(attack.attackingGuild.channelId).send(aw);
            discord.channels.get(attack.defendingGuild.channelId).send(aw);

            // send defending warrior list
            let dw = '**Defending Warriors**\n';
            dw += printWarriors(attack.defendingWarriors);

            discord.channels.get(attack.attackingGuild.channelId).send(dw);
            discord.channels.get(attack.defendingGuild.channelId).send(dw);
          }
        })
      }
    })
  }
}

export default events


var printWarriors = function(warriors) {
  let msg = '';

  for (let x = 0; x < warriors.length; x++) {
    msg += (x+1)+'. ';
    msg += '**'+functions.escapeMarkdown(warriors[x].name)+'** rolled **'+Math.round(warriors[x].roll*100)+'**.';
    if (warriors[x].message) {
      msg += '  '+warriors[x].message+'\n';
    } else {
      msg += '\n';
    }
  };

  return msg;
}
