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


  guildWarriors: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.guildWarriors(db, discord, msg);
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
  },


  serverTime: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.serverTime(db, discord, msg);
    }
  },


  leaveGame: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.leaveGame(db, discord, msg);
    }
  },


  predict: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.predict(db, discord, msg);
    }
  },

  buyRecruit: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.buyRecruit(db, discord, msg);
    }
  },

  battleResults: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.battleResults(db, discord, msg);
    }
  },

  attack: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.attack(db, discord, msg);
    }
  },

  defend: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      dm.defend(db, discord, msg);
    }
  }
}


export default commands
