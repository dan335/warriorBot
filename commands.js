import text from './text.js';
import dm from './dm.js';
import shared from './shared.js';
import dateFns from 'date-fns';
import events from './events.js';

const commands = {
  help: function(db, discord, msg) {
    if (msg.channel.type == 'text') {
      text.help(db, discord, msg);
    } else if (msg.channel.type == 'dm') {
      dm.help(db, discord, msg);
    }
  },


  commands: function(db, discord, msg) {
    if (msg.channel.type == 'text') {
      text.commands(db, discord, msg);
    } else if (msg.channel.type == 'dm') {
      dm.commands(db, discord, msg);
    }
  },


  setResultChannel: function(db, discord, msg) {
    if (msg.channel.type == 'text') {
      text.setResultChannel(db, discord, msg);
    }
  },


  joinGame: function(db, discord, msg) {
    if (msg.channel.type == 'text') {
      text.joinGame(db, discord, msg);
    }
  },


  recruit: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.recruit(db, discord, msg);
    }
  },


  retire: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.retire(db, discord, msg);
    }
  },


  warriors: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.warriors(db, discord, msg);
    } else if (msg.channel.type == 'text') {
      text.warriors(db, discord, msg);
    }
  },


  timeUntil: function(db, discord, msg) {
    shared.timeUntil(db, discord, msg);
  },


  // TODO: remove this
  doEvent: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      events.nightly(db, discord);
    }
  },


  players: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.players(db, discord, msg);
    } else {
      text.players(db, discord, msg);
    }
  },


  guilds: function(db, discord, msg) {
    shared.guilds(db, discord, msg);
  },


  battle: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.battle(db, discord, msg);
    }
  },


  battles: function(db, discord, msg) {
    shared.battles(db, discord, msg);
  }
}


export default commands
