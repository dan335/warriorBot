const MongoClient = require('mongodb').MongoClient;
const mongo = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true });
const Discord = require('discord.js');
const discord = new Discord.Client();
import commands from './commands.js';
import _s from './settings.js';
import dateFns from 'date-fns';
import events from './events.js';


mongo.connect(error => {
  if (error) {
    console.log('Error connecting to mongodb.');
    console.log(error);
    return;
  }

  const db = mongo.db(process.env.MONGO_DB);

  db.createIndex('guilds', {discordId:1});
  db.createIndex('users', {discordId:1});
  db.createIndex('users', {guildDiscordId:1});
  db.createIndex('users', {username:1});
  db.createIndex('users', {gems:-1});
  db.createIndex('warriors', {name:1});
  db.createIndex('warriors', {userId:1});
  db.createIndex('warriors', {discordId:1});
  db.createIndex('warriors', {guildDiscordId:1});
  db.createIndex('warriors', {combinedStats:-1});
  db.createIndex('warriors', {points:-1});
  db.createIndex('battles', {guildDiscordId:1});
  db.createIndex('battles', {warrior1Id:1});
  db.createIndex('battles', {warrior1Name:1});
  db.createIndex('battles', {warrior1DiscordId:1});
  db.createIndex('battles', {warrior2Name:1});
  db.createIndex('battles', {warrior2DiscordId:1});

  if (process.env.NODE_ENV == 'development') {
    console.log('Started Warriors in development mode.');
  } else {
    console.log('Started Warriors in production mode.');
  }

  discord.on('ready', () => {
    console.log(`Logged in as ${discord.user.tag}!`);
  });

  discord.on('message', msg => {
    if (msg.content.charAt(0) == _s.actionCharacter) {
      const msgArray = msg.content.split(' ');
      try {
        commands[msgArray[0].substring(1)](db, discord, msg);
      } catch (error) {
        // command does not exist
        if (msg.channel.type == 'dm') {
          msg.author.send('I did not understand that command.  Try **!help** or **!commands**.');
        }
      }
    }
  });

  discord.login(process.env.DISCORD_TOKEN);


  // nightly
  setTimeout(() => {
    events.nightly(db, discord);

    // delay a second just to be sure
    setTimeout(() => {
      setInterval(() => {
        events.nightly(db, discord);
      }, 1000 * 60 * 60 * 24);
    }, 1000);

  }, dateFns.differenceInMilliseconds(dateFns.endOfToday(), new Date()));

  // hourly
  setTimeout(() => {
    events.hourly(db, discord);

    setTimeout(() => {
      setInterval(() => {
        events.hourly(db, discord);
      }, 1000 * 60 * 60);
    }, 1000);

  }, dateFns.differenceInMilliseconds(dateFns.endOfHour(new Date()), new Date()));


  // half hour
  const now = new Date();
  const minutes = dateFns.getMinutes(now);
  let next;
  if (minutes < 30) {
    next = dateFns.setMinutes(now, 30);
  } else {
    next = dateFns.endOfHour(now);
  }
  setTimeout(() => {
    event.halfHour(db, discord);

    setInterval(() => {
      events.halfHour(db, discord);
    }, 1000 * 60 * 30);
  }, dateFns.differenceInMilliseconds(next, now));


  // // temp - fix names
  // const c = db.collection('warriors');
  // const curs = c.find({});
  // curs.toArray((error, warriors) => {
  //   warriors.forEach(warrior => {
  //     c.updateOne({_id:warrior._id}, {$set:{
  //       recruitsAvailable: warrior.recuitsAvailable
  //     }})
  //   })
  // })

  // temp
  // const u = db.collection('users');
  // const cur = u.find({});
  // cur.toArray((error, users) => {
  //   users.forEach(user => {
  //     u.updateOne({_id:user._id}, {$set: {recruitsAvailable:user.recuitsAvailable}})
  //   })
  // })
})
