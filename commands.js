import dateFns from 'date-fns';
import events from './events.js';
import recruit from './commands/dm/recruit.js';
import rip from './commands/text/rip.js';
import retire from './commands/dm/retire.js';
import commandsText from './commands/text/commands.js';
import commandsDm from './commands/dm/commands.js';
import helpText from './commands/text/help.js';
import helpDm from './commands/dm/help.js';
import setResultChannel from './commands/text/setResultChannel.js';
import joinGame from './commands/text/joinGame.js';
import warriorsText from './commands/text/warriors.js';
import warriorsDm from './commands/dm/warriors.js';
import playersText from './commands/text/players.js';
import serverTime from './commands/dm/serverTime.js';
import attacks from './attacks.js';
import guilds from './commands/shared/guilds.js';
import dbGuildWarriors from './commands/dm/guildWarriors.js';
import leaveGame from './commands/dm/leaveGame.js';
import predict from './commands/dm/predict.js';
import battle from './commands/dm/battle.js';
import buyRecruit from './commands/dm/buyRecruit.js';
import battleResults from './commands/dm/battleResults.js';


const commands = {
  help: function(db, discord, msg) {
    try {
      if (msg.channel.type == 'text') {
        helpText(db, discord, msg);
      } else if (msg.channel.type == 'dm') {
        helpDm(db, discord, msg);
      }
    } catch (error) {
      console.log(error);
    }
  },


  commands: function(db, discord, msg) {
    try {
      if (msg.channel.type == 'text') {
        commandsText(db, discord, msg);
      } else if (msg.channel.type == 'dm') {
        commandsDm(db, discord, msg);
      }
    } catch (error) {
      console.log(error);
    }
  },


  setResultChannel: function(db, discord, msg) {
    if (msg.channel.type == 'text') {
      try {
        setResultChannel(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },

  attack: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        attacks.attack(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },

  defend: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        attacks.defend(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },

  attacks: function(db, discord, msg) {
    try {
      attacks.attacks(db, discord, msg);
    } catch (error) {
      console.log(error);
    }
  },


  guilds: function(db, discord, msg) {
    try {
      guilds(db, discord, msg);
    } catch (error) {
      console.log(error);
    }
  },


  joinGame: function(db, discord, msg) {
    if (msg.channel.type == 'text') {
      try {
        joinGame(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },


  recruit: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        recruit(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },


  retire: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        retire(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },


  warriors: function(db, discord, msg) {
    try {
      if (msg.channel.type == 'dm') {
        warriorsDm(db, discord, msg);
      } else if (msg.channel.type == 'text') {
        warriorsText(db, discord, msg);
      }
    } catch (error) {
      console.log(error);
    }
  },


  guildWarriors: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        dbGuildWarriors(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },


  players: function(db, discord, msg) {
    try {
      if (msg.channel.type == 'dm') {
        //dm.players(db, discord, msg);
      } else {
        playersText(db, discord, msg);
      }
    } catch (error) {
      console.log(error);
    }
  },


  battle: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        battle(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },


  battles: function(db, discord, msg) {
    try {
      shared.battles(db, discord, msg);
    } catch (error) {
      console.log(error);
    }
  },


  serverTime: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        serverTime(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },


  leaveGame: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        leaveGame(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },


  predict: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        predict(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },

  buyRecruit: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        buyRecruit(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },

  battleResults: function(db, discord, msg) {
    if (msg.channel.type == 'dm') {
      try {
        battleResults(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  },

  rip: function(db, discord, msg) {
    if (msg.channel.type == 'text') {
      try {
        rip(db, discord, msg);
      } catch (error) {
        console.log(error);
      }
    }
  }
}


export default commands
