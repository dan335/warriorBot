const functions = {
  escapeMarkdown: function(str) {
    var unescaped = str.replace(/\\(\*|_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
    var escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1'); // escape *, _, `, ~, \
    return escaped;
  },

  includesNoSpecialCharacters: function(str) {
    return str.match("^[a-zA-Z0-9.!? ]+$");
  },

  arrayMax: function(arr) {
    if (arr.length == 0) {
      return 0;
    }

    if (arr.length == 1) {
      return arr[0];
    }

    return arr.reduce((a, b) => {
      return Math.max(a, b);
    });
  },


  killWarrior: async function(db, discord, warrior, cause) {
    return new Promise((resolve, reject) => {
      const warriorsCollection = db.collection('warriors');
      const ripsCollection = db.collection('rips');
      const usersCollection = db.collection('users');
      const guildsCollection = db.collection('guilds');

      let ripData = Object.assign({cause:cause}, warrior);
      delete ripData._id;

      ripsCollection.insertOne(ripData, {}, (error, result) => {

        warriorsCollection.deleteOne({_id:warrior._id});

        // delete if more than 15
        const cursor = ripsCollection.find({}, {sort:{points:-1, gemsWon:-1}, projection:{_id:1}});
        cursor.toArray((error, rips) => {
          for (let n = 0; n < rips.length; n++) {
            if (n > 14) {
              ripsCollection.deleteOne({_id:rips[n]._id});
            }
          }
        })
      });

      usersCollection.findOne({_id:warrior.userId}, {projection:{guildId:1}}, (error, user) => {
        if (error) {
          console.log(error);
          reject();
          return;
        }
        if (!user) {
          console.error('No user found.');
          reject();
          return;
        }

        guildsCollection.findOne({_id:user.guildId}, {projection:{channelId:1}}, (error, guild) => {
          if (error) {
            console.log(error);
            reject();
            return;
          }
          if (!guild) {
            console.error('No user found.');
            reject();
            return;
          }

          const channel = discord.channels.get(guild.channelId);
          if (channel) {
            channel.send('**'+warrior.name+'** '+cause);
          }
          resolve();
        })
      })
    })
  }
}

export default functions
