export default function rip(db, discord, msg) {
  const ripsCollection = db.collection('rips');

  let m = '__RIP__\n\n';

  const cursor = ripsCollection.find({}, {sort:{points:-1}});

  cursor.toArray((error, rips) => {
    if (!error) {
      if (rips.length) {
        for (let n = 0; n < rips.length; n++) {
          m += (n+1)+'. ';
          m += '**'+rips[n].name+'**';
          m += '   '+Math.round(rips[n].strength*100)+'/'+Math.round(rips[n].dexterity*100)+'/'+Math.round(rips[n].agility*100);
          m += '   gems:**'+Math.round(rips[n].gemsWon)+'**';
          m += '   points:**'+Math.round(rips[n].points)+'**';
          m += '    '+rips[n].nickname;
          m += '\n';
        }
      } else {
        m += 'No deaths.';
      }

      msg.channel.send(m);
    }
  })
}
