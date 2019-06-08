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
    const warriorsCollection = db.collection('warriors');
    const ripsCollection = db.collection('rips');
    const usersCollection = db.collection('users');
    const guildsCollection = db.collection('guilds');

    ripsCollection.insertOne(warriorsCollection, {}, (error, result) => {

      // delete if more than 10
      const cursor = ripsCollection.find({}, {sort:{gems:-1}});
      cursor.toArray((error, rips) => {
        for (let n = 0; n < rips.length; n++) {
          if (n > 9) {
            ripsCollection.deleteOne({_id:rips[n]._id});
          }
        }
      })
    });

    // send notification to channel
    const user = await usersCollection.findOne({_id:warrior.userId}, {projection:{guildId:1}});
    if (!user) {
      console.error('No user found.');
    }

    const guild = await guildsCollection.findOne({_id:user.guildId}, {projection:{channelId:1}});
    if (!guild) {
      console.error('No guild found.');
    }

    discord.channels.get(guild.channelId).send('**'+warrior.name+'** died. '+cause);
  }
}

export default functions
