const Filter = require('bad-words')
const filter = new Filter();
import _s from './settings.js';


const text = {
  commands: function(db, discord, msg) {
    let m = '';
    m += '**!help**\n';
    m += '**!joinGame** - Join the game.  WarriorBot will send you a direct message.\n';
    m += "**!warriors <page number>** - View your guild's warriors.  Page number optional.\n";
    m += "**!players <page number>** - View players.  Page number is optional.\n";
    m += "**!guilds <page number>** - View Discord guilds.  Page number is optional.\n";
    m += '**!setResultChannel <channel name>** - Set the channel WarriorBot uses to report battle results.\n';
    msg.channel.send(m);
  },


  help: function(db, discord, msg) {
    let m = '**Warrior Bot**\n';
    m += 'Recuit warriors.  Challenge other players.  Attack other Discord guilds and steal their riches.\n';
    m += '\n';
    m += 'Type **!commands** to see available commands.\n';
    msg.channel.send(m);
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



  joinGame: async function(db, discord, msg) {
    const usersCollection = db.collection('users');
    const guildsCollection = db.collection('guilds');

    // make sure user does not exist already.  maybe in another guild
    const user = await usersCollection.findOne({discordId:msg.author.id});
    if (user) {
      if (user.guildDiscordId != msg.guild.id) {
        msg.author.send("Looks like you're already playing in another guild. You must leave that guild's game to join this one. Type **!leaveGame** to leave.  This will delete all of your warriors and data.");
        return;
      }
    }

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
    }, {upsert:true}, async (error, result) => {
      if (error) {
        console.log('Error in join:updateOne');
        console.log(error);
      } else {

        // get guild id
        const guild = await guildsCollection.findOne({discordId:msg.guild.id});
        if (!guild) {
          console.error('Could not find guild.  This should not happen.');
          msg.reply('Could not get your guild from the db.  Weird.  Try again soon.');
          return;
        }

        // upsert user
        usersCollection.updateOne({discordId:msg.author.id}, {
          $setOnInsert: {
            discordId: msg.author.id,
            guildId: guild._id,
            guildName: guild.name,
            guildDiscordId: msg.guild.id,
            createdAt: new Date(),
            tag: msg.author.tag,
            username: msg.author.username,
            nickname: msg.member.nickname,
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
      }
    });
  },



  warriors: async function(db, discord, msg) {
    const warriorsCollection = db.collection('warriors');

    let page = Number(msg.content.replace('!warriors', '').trim());
    if (isNaN(page)) {
      page = 1;
    }
    page = Math.max(page, 1);
    page -= 1;  // now starts at 0

    const skip = _s.perPage * page;

    const num = await warriorsCollection.countDocuments({guildDiscordId: msg.guild.id});
    const numPages = Math.ceil(num / _s.perPage)

    const cursor = warriorsCollection.find({guildDiscordId: msg.guild.id}, {sort:{points:-1, combinedStats:-1}, limit:_s.perPage, skip:skip});
    cursor.toArray((error, warriors) => {
      if (warriors.length) {
        let m = "Your guild's warriors.\n";
        m += 'name   strength/dexterity/agility - points   owner\n';
        m += 'Page '+(page+1)+' of '+numPages+'\n';

        for (let n = 0; n < warriors.length; n++) {
          m += '\n';
          m += (n*(page+1)+1)+'. ';
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



  players: async function(db, discord, msg) {
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
        if (users) {
          let m = 'Players\n';
          m += 'Page '+(page+1)+' of '+numPages+'\n';
          m += '\n';
          users.forEach(user => {
            m += '**'+user.nickname+'** - **' + Math.round(user.gems) + '** gems\n';
          });
          msg.channel.send(m);
        } else {
          msg.channel.send('No players.');
        }
      }
    })
  },
}


export default text
