export default function leaveGame(db, discord, msg) {
  const usersCollection = db.collection('users');
  const warriorsCollection = db.collection('warriors');

  warriorsCollection.deleteMany({discordId:msg.author.id}, {}, (error, result) => {
    if (error) {
      console.log('Error leaveGame:deleteMany');
      console.log(error);
    } else {
      usersCollection.deleteMany({discordId:msg.author.id}, {}, (error, result) => {
        if (error) {
          console.log('Error leaveGame:deleteMany');
          console.log(error);
        } else {
          msg.author.send('Your warriors have been retired and your data erased.');
        }
      });
    }
  });
}
