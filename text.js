const Filter = require('bad-words')
const filter = new Filter();
import _s from './settings.js';


const text = {
  commands: function(db, discord, msg) {
    let m = '';
    m += '**!help**\n';
    m += '**!joinGame** - Join the game.  WarriorBot will send you a direct message.\n';
    m += "**!warriors** - View your guild's best warriors.\n";
    m += "**!players** - View richest players.\n";
    m += "**!guilds** - View other Discord guilds.\n";
    m += '**!timeUntil** - Time until next event.\n';
    m += '**!setResultChannel <channel name>** - Set the channel WarriorBot uses to report battle results.\n';
    msg.channel.send(m);
  },


  help: function(db, discord, msg) {
    let m = '**Warrior Bot**\n';
    m += 'Recuit warriors.  Challenge other players.  Attack other Discord guilds and steal their riches.\n';
    m += '\n';
    m += 'Type **!commands** to see available commands.\n';
    if (msg.channel.type == 'text') {
      msg.channel.send(m);
    } else  if (msg.channel.type == 'dm') {
      msg.author.send(m);
    }
  },



  setResultChannel: function(db, discord, msg) {
    let name = msg.content.replace('!setResultChannel', '');
    name = name.replace('#', '');
    name = name.trim();

    const channel = msg.guild.channels.find(c => c.name == name);

    if (channel) {
      const guildsCollection = db.collection('guilds');

      guildsCollection.updateOne({discordId:msg.guild.id}, {
        $set: {
          channelId:channel.id
        }
      }, {}, (error, result) => {
        if (error) {
          console.log('Error in setResultChannel:updateOne');
          console.log(error);
          msg.reply('Error updating db.  Maybe my creator will fix me soon.  Try again later.');
        } else {
          if (result.matchedCount) {
            msg.reply('Channel updated.');
          } else {
            msg.reply("I couldn't find your guild in the db.  Run this command after someone has joined the game.");
          }
        }
      })
    } else {
      msg.reply('I could not find that channel.');
    }
  },



  joinGame: function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const guildsCollection = db.collection('guilds');

    // save guild to db
    guildsCollection.updateOne({discordId:msg.guild.id}, {
      $setOnInsert: {
        discordId: msg.guild.id,
        channelId: msg.channel.id,
        name: msg.guild.name,
        createdAt: new Date(),
      },
      $set: {
        updatedAt: new Date()
      }
    }, {upsert:true}, (error, result) => {
      if (error) {
        console.log('Error in join:updateOne');
        console.log(error);
      } else {

        // get guild id
        guildsCollection.findOne({discordId:msg.guild.id}, {}, (error, guild) => {
          if (error) {
            console.log('Error in join:findOne');
            console.log(error);
          } else {

            if (guild) {
              // upsert user
              usersCollection.updateOne({discordId:msg.author.id, guildDiscordId:msg.guild.id}, {
                $setOnInsert: {
                  discordId: msg.author.id,
                  guildId: guild._id,
                  guildName: guild.name,
                  guildDiscordId: msg.guild.id,
                  createdAt: new Date(),
                  tag: msg.author.tag,
                  username: msg.author.username,
                  avatar: msg.author.avatar,
                  avatarURL: msg.author.avatarURL,
                  gems: 0,
                  recuitsAvailable: 3
                },
                $set: {
                  updatedAt: new Date()
                }
              }, {upsert:true}, (error, result) => {
                if (error) {
                  console.log('Error in joinGame:updateOne');
                  console.log(error);
                  msg.reply('Error creating user.  Try again soon.');
                } else {
                  if (result.upsertedCount == 0) {
                    msg.author.send('Welcome back.  Type **!commands** to see commands.');
                  } else {
                    msg.author.send('Welcome to the game. Type **!help** to begin.');
                  }
                }
              });

            } else {
              console.error('Could not find guild.  This should not happen.');
              msg.reply('Could not get your guild from the db.  Weird.  Try again soon.');
            }
          }
        })
      }
    });
  },



  warriors: function(db, discord, msg) {
    const warriorsCollection = db.collection('warriors');
    const cursor = warriorsCollection.find({guildDiscordId: msg.guild.id}, {sort:{points:-1, combinedStats:-1}, limit:15});
    cursor.toArray((error, warriors) => {
      if (warriors.length) {
        let m = "Your guild's warriors\n";
        m += 'name/strength/dexterity/agility/points/owner\n'

        for (let n = 0; n < warriors.length; n++) {
          m += '\n';
          m += (n+1)+'. ';
          m += '**' + warriors[n].name + '**';
          m += '    ' + Math.round(warriors[n].strength*100) + '/';
          m += Math.round(warriors[n].dexterity*100) + '/';
          m += Math.round(warriors[n].agility*100) + '';
          m += ' - ' + Math.round(warriors[n].points);
          m += '    ' + warriors[n].username;
        }

        msg.channel.send(m);
      } else {
        msg.channel.send('You have no warriors.');
      }
    });
  },



  players: function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const cursor = usersCollection.find({guildDiscordId: msg.guild.id}, {sort: {gems:-1}, limit:20});
    cursor.toArray((error, users) => {
      if (error) {
        console.log('Error in players:find');
        console.log(error);
      } else {
        let m = 'Top Players\n';
        users.forEach(user => {
          m += '**'+user.username+'** - **' + Math.round(user.gems) + '** gems\n';
        });
        msg.channel.send(m);
      }
    })
  },
}


export default text
