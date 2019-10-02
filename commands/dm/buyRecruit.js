import _s from '../../settings.js';


export default async function buyRecruit(db, discord, msg) {
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({discordId: msg.author.id});
  if (!user) {
    msg.author.send("Looks like you haven't joined the game yet.  Type **!joinGame** in a public channel to join the game.");
    return;
  }

  if (user.gems < _s.buyRecruitCost) {
    msg.author.send('You do not have enough gems.  This costs '+_s.buyRecruitCost+' gems.');
    return;
  }

  usersCollection.updateOne({_id:user._id}, {$inc:{gems:_s.buyRecruitCost*-1, recruitsAvailable:1}}, {}, (error, result) => {
    if (error) {
      console.log('Error buyRecruit:updatOne');
    } else {
      msg.author.send('Success.  There are now '+(user.recruitsAvailable+1)+' warriors available for recruiting.');
    }
  })
}
