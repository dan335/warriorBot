import Battle from './Battle.js';
import _s from './settings.js';


const events = {

  nightly: function(db, discord) {
    // give everyone 1 recruit
    const usersCollection = db.collection('users');
    usersCollection.updateMany({}, {$inc:{recuitsAvailable:1}}, {}, (error, result) => {
      console.log('nightly', result.matchedCount, result.modifiedCount)
    });
  },


  hourly: function(db, discord) {
    const warriorsCollection = db.collection('warriors');
    warriorsCollection.updateMany({energy: {$lt:_s.maxEnergy}}, {$inc:{energy:1}});
  },


  halfHour: function(db, discord) {

  }

}

export default events
