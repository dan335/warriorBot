import Battle from './Battle.js';
import _s from './settings.js';
import dateFns from 'date-fns';
import functions from './functions.js';


const events = {

  nightly: function(db, discord) {
    // give everyone 1 recruit
    const usersCollection = db.collection('users');
    usersCollection.updateMany({}, {$inc:{recruitsAvailable:1}});
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

    const cursor = attacksCollection.find({startedAt: {$lt:cutoff}});

    cursor.toArray((error, attacks) => {
      if (error) {
        console.log('Error tenMinutes:toArray');
        console.log(error);
      } else {
        attacks.forEach(attack => {
          if (attack.isAttacking) {
            // change to defending
            attacksCollection.updateOne({_id:attack._id}, {$set:{
              isAttacking:false,
              startedAt: new Date()
            }});

            const attackMax = functions.arrayMax(attack.attackRolls);

            let am = '__**Attack Launched**__\nAn attack on on **'+functions.escapeMarkdown(attack.defendingGuild.name)+'** has been launched with a power of **'+Math.round(attackMax*100)+'**.  They have '+dateFns.format(dateFns.addMilliseconds(new Date(0), _s.attackDuration), 'm')+' minutes to defend.';
            discord.channels.get(attack.attackingGuild.channelId).send(am);

            let dm = '__**Incoming Attack**__\nAttack from **'+functions.escapeMarkdown(attack.attackingGuild.name)+'** with a power of **'+Math.round(attackMax*100)+'**.  Your guild has '+dateFns.format(dateFns.addMilliseconds(new Date(0), _s.attackDuration), 'm')+' minutes to form a defense.  Use **!defend <warrior name> -vs '+functions.escapeMarkdown(attack.attackingGuild.name)+' -m <message>** to join.';
            discord.channels.get(attack.defendingGuild.channelId).send(dm);

            // send attacking warrior list
            let aw = '**Attacking Warriors**\n';

            for (let n = 0; n < attack.attackingWarriors.length; n++) {
              aw += (n+1)+'. ';
              aw += '**'+functions.escapeMarkdown(attack.attackingWarriors[n].name)+'** rolled **'+Math.round(attack.attackingWarriors[n].roll*100)+'**.';
              if (attack.attackingWarriors[n].message) {
                aw += '  '+attack.attackingWarriors[n].message+'\n';
              } else {
                aw += '\n';
              }
            };

            discord.channels.get(attack.attackingGuild.channelId).send(aw);
            discord.channels.get(attack.defendingGuild.channelId).send(aw);

          } else {
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
                  let am = '__**Attack Successful**__\nAttack on **'+functions.escapeMarkdown(attack.defendingGuild.name)+'** was successful.  Your attack for **'+Math.round(attackMax*100)+'** beat their defense of **'+Math.round(defenseMax*100)+'** and stole **'+Math.round(stolenGems)+' gems**.';

                  discord.channels.get(attack.attackingGuild.channelId).send(am);

                  let defm = '__**Attack Successful**__\nAttack from **'+functions.escapeMarkdown(attack.attackingGuild.name)+'** was successful.  Their attack power of **'+Math.round(attackMax*100)+'** beat your defense of **'+Math.round(defenseMax*100)+'**.  They stole **'+Math.round(stolenGems)+' gems**.';

                  discord.channels.get(attack.defendingGuild.channelId).send(defm);

                  // send attacking warrior list
                  let aw = '**Attacking Warriors**\n';

                  for (let n = 0; n < attack.attackingWarriors.length; n++) {
                    aw += (n+1)+'. ';
                    aw += '**'+functions.escapeMarkdown(attack.attackingWarriors[n].name)+'** rolled **'+Math.round(attack.attackingWarriors[n].roll*100)+'**.';
                    if (attack.attackingWarriors[n].message) {
                      aw += '  '+attack.attackingWarriors[n].message+'\n';
                    } else {
                      aw += '\n';
                    }
                  };

                  discord.channels.get(attack.attackingGuild.channelId).send(aw);
                  discord.channels.get(attack.defendingGuild.channelId).send(aw);

                  // send defending warrior list
                  let dw = '**Defending Warriors**\n';

                  for (let x = 0; x < attack.defendingWarriors.length; x++) {
                    dw += (x+1)+'. ';
                    dw += '**'+functions.escapeMarkdown(attack.defendingWarriors[x].name)+'** rolled **'+Math.round(attack.defendingWarriors[x].roll*100)+'**.';
                    if (attack.defendingWarriors[x].message) {
                      dw += '  '+attack.defendingWarriors[x].message+'\n';
                    } else {
                      dw += '\n';
                    }
                  };

                  discord.channels.get(attack.attackingGuild.channelId).send(dw);
                  discord.channels.get(attack.defendingGuild.channelId).send(dw);
                }
              })


            } else {
              // unsuccessful attack
              let am = '__**Attack Unuccessful**__\nAttack on **'+functions.escapeMarkdown(attack.defendingGuild.name)+'** was unsuccessful.  Your attack for **'+Math.round(attackMax*100)+'** was beat by their defense of **'+Math.round(defenseMax*100)+'**.';

              discord.channels.get(attack.attackingGuild.channelId).send(am);

              let dm = '__**Attack Unuccessful**__\nAttack from **'+functions.escapeMarkdown(attack.attackingGuild.name)+'** was unsuccessful.  Their attack power of **'+Math.round(attackMax*100)+'** was beat by your defense of **'+Math.round(defenseMax*100)+'**.';

              discord.channels.get(attack.defendingGuild.channelId).send(dm);

              // send attacking warrior list
              let aw = '**Attacking Warriors**\n';

              for (let n = 0; n < attack.attackingWarriors.length; n++) {
                aw += (n+1)+'. ';
                aw += '**'+functions.escapeMarkdown(attack.attackingWarriors[n].name)+'** rolled **'+Math.round(attack.attackingWarriors[n].roll*100)+'**.';
                if (attack.attackingWarriors[n].message) {
                  aw += '  '+attack.attackingWarriors[n].message+'\n';
                } else {
                  aw += '\n';
                }
              };

              discord.channels.get(attack.attackingGuild.channelId).send(aw);
              discord.channels.get(attack.defendingGuild.channelId).send(aw);

              // send defending warrior list
              let dw = '**Defending Warriors**\n';

              for (let x = 0; x < attack.defendingWarriors.length; x++) {
                dw += (x+1)+'. ';
                dw += '**'+functions.escapeMarkdown(attack.defendingWarriors[x].name)+'** rolled **'+Math.round(attack.defendingWarriors[x].roll*100)+'**.';
                if (attack.defendingWarriors[x].message) {
                  dw += '  '+attack.defendingWarriors[x].message+'\n';
                } else {
                  dw += '\n';
                }
              };

              discord.channels.get(attack.attackingGuild.channelId).send(dw);
              discord.channels.get(attack.defendingGuild.channelId).send(dw);
            }
          }
        })
      }
    })
  }

}

export default events
