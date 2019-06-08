export default function rip(db, discord, msg) {
  const ripsCollection = db.collection('rips');

  let m = '__RIP__\n\n';

  const cursor = ripsCollection.find({}, {sort:{gems:-1}});

  cursor.toArray((error, rips) => {
    if (!error) {
      if (rips.length) {
        for (let n = 0; n < rips.length; n++) {
          m += (n+1)+'. ';
          m += '**'+rips[n].name+'**';
          m += ' '+rips[n].strength+'/'+rips[n].dexterity+'/'+rips[n].agility;
          m += ' gems:**'+rips[n].gemsWon+'**';
          m += ' points:**'+rips[n].points+'**';
          m += '    '+rips[n].nickname;
        }
      } else {
        m += 'No deaths.';
      }

      msg.channel.send(m);
    }
  })
}
