const Filter = require('bad-words')
const filter = new Filter();
import _s from './settings.js';
import Battle from './Battle.js';
var EloRating = require('elo-rating');
import dateFns from 'date-fns';
import functions from './functions.js';


const dm = {
  commands: function(db, discord, msg) {
    let m = '';
    m += '**!help**\n';
    m += '**!recruit <name>** - Recruit a new warrior.\n';
    m += '**!retire <name>** - Retire a warrior.\n';
    m += '**!buyRecruit** - Buy a recruit token for '+_s.buyRecruitCost+' gems.\n';
    m += '**!warriors** - View your warriors.\n';
    m += "**!warriors <player name>** - View another player's warriors.\n";
    m += "**!guildWarriors <page number>** - View your guild's warriors.  Page number is optional.\n";
    m += "**!battle <warrior name> -vs <warrior name>** - Put your warrior up against another warrior in the arena.\n";
    m += "**!battleResults <warrior name>** - View a warriors last 3 battles.\n";
    m += "**!predict <warrior name> -vs <warrior name>** - Predict who will win.\n";
    m += "**!guilds <page number>** - View Discord guilds.  Page number is optional.\n";
    m += "**!attack <warrior name> -vs <guild name> -m <message>** - Send a warrior to attack another guild and bring back loot.  Message is optional.\n";
    m += "**!defend <warrior name> -vs <guild name> -m <message>** - Defend against an attack.  Message is optional.\n";
    m += '**!serverTime**\n';
    m += "**!leaveGame** - Leave this guild's game.  This will delete your warriors and all your data.\n";
    msg.author.send(m);
  },


  help: async function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({discordId:msg.author.id});
    if (!user) {
      msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
      return;
    }

    let m = '';
    m += '__Challenge players in the arena.__\n';
    m += "Use **!battle <warrior name> -vs <other warrior name>** to send your warriors off to battle in the arena and win gems.  If your warrior beats a warrior ranked higher than them they will win more than beating one ranked lower.\n";
    m += '\n';
    m += '__Attack other Discord guilds.__\n';
    m += "Use **!attack <warrior name> -vs <guild name>** to send your warrior to attack another Discord guild and bring back any loot they find.  The more warriors your guild sends the higher the chance that they will be successful.\n"
    m += '\n';
    m += '__Build your army.__\n';
    m += 'Recruit warriors with **!recruit <name>**.  Retire warriors with **!retire <name>**.  You can only recuit a warrior if there is one available.  Every day one more becomes available.  You can have ' + _s.maxWarriors + ' warriors max.\n';
    m += '\n';
    m += '**Strength** - How much damage your warrior does.\n';
    m += '**Dexterity** - How likely your warrior is to land a blow.\n';
    m += '**Agility** - Chance that your warrior will dodge/block.\n';
    m += '\n';
    m += 'There are **' + user.recruitsAvailable + '** warriors available for you to recruit.\n';
    m += '\n';
    m += 'Type **!commands** to see available commands.\n';
    msg.author.send(m);
  },


  serverTime: function(db, discord, msg) {
    msg.author.send(new Date().toLocaleString());
  },



  recruit: function(db, discord, msg) {
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

    // get user record
    usersCollection.findOne({discordId:msg.author.id}, {}, (error, user) => {
      if (error) {
        console.log('Error in recruit:findOne');
        console.log(error);
      } else {
        if (user) {

          if (user.recruitsAvailable > 0) {

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
                          energy: 4
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
                          }
                        });

                        usersCollection.updateOne({_id:user._id}, {$inc:{recruitsAvailable:-1}});
                      }
                    }
                  })
                }
              }
            });



          } else {
            msg.author.send('There are no warriors available for you to recruit.  Try again tomorrow.');
          }

        } else {
          msg.author.send("I can't find you in my records.  Type **!joinGame** in a public channel to begin.")
        }
      }
    });
  },



  retire: function(db, discord, msg) {
    let name = msg.content.replace('!retire', '');
    name = name.trim();

    if (!name.length) {
      msg.author.send('Who are you retiring? **!retire <warrior name>**');
      return;
    }

    const warriorsCollection = db.collection('warriors');

    warriorsCollection.deleteOne({name:name, discordId:msg.author.id}, {}, (error, result) => {
      if (result.deletedCount == 1) {
        msg.author.send(name + " is now retired.");
      } else {
        msg.author.send("I could not find a warrior by that name.");
      }
    })
  },



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
          m += '    ' + warriors[n].nickname;
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
          m += otherUser.nickname + "'s warriors.\n";
        }

        warriors.forEach(warrior => {
          m += '\n';
          m += '**' + warrior.name + '**\n';
          m += 'strength: **' + Math.round(warrior.strength*100) + '**, ';
          m += 'dexterity: **' + Math.round(warrior.dexterity*100) + '**, ';
          m += 'agility: **' + Math.round(warrior.agility*100) + '**, ';
          m += 'points: **' + Math.round(warrior.points) + '**, ';
          m += 'energy: **' + warrior.energy + '**, \n';
        });

        msg.author.send(m);
      } else {
        if (isSelf) {
          msg.author.send('You have no warriors.  Use **!recruit <name>** to recruit one.');
        } else {
          msg.author.send(otherUser.nickname + ' has no warriors.');
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
            msg.author.send(result.description);
          });
        } else {
          msg.author.send(name+' has not fought any battles.');
        }
      }
    })
  },



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
  }
}


export default dm
