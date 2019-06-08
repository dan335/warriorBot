import BattleRound from './BattleRound.js';
var EloRating = require('elo-rating');
import functions from './functions.js';


export default class Battle {
  constructor(db, discord, msg, warrior1, warrior2, user1, user2) {
    this.db = db;
    this.discord = discord;
    this.msg = msg;
    this.warrior1 = warrior1;
    this.warrior2 = warrior2;
    this.user1 = user1;
    this.user2 = user2;

    this.warrior1.health = (Math.random() * 0.5 + 0.5) * this.warrior1.strength * 300 + 50;
    this.warrior2.health = (Math.random() * 0.5 + 0.5) * this.warrior2.strength * 300 + 50;
    this.warrior1.swingsFirst = false;
    this.warrior2.swingsFirst = true;
    this.isTie = false;
    this.warrior1.died = false;
    this.warrior2.died = false;

    this.description = '';
    this.description += '**'+this.warrior1.name+'** starts with **'+Math.round(this.warrior1.health)+'** health.\n';
    this.description += '**'+this.warrior2.name+'** starts with **'+Math.round(this.warrior2.health)+'** health.\n';

    const warriorsCollection = db.collection('warriors');
    const usersCollection = db.collection('users');

    this.rounds = [];
    let roundNum = 1;
    while (roundNum <= 10 && this.warrior1.health > 0 && this.warrior2.health > 0) {
      this.rounds.push(new BattleRound(db, roundNum, warrior1, warrior2));
      this.warrior1.swingsFirst = !this.warrior1.swingsFirst;
      this.warrior2.swingsFirst = !this.warrior2.swingsFirst;
      roundNum++;
    }

    // get description for rounds
    this.rounds.forEach(round => {
      round.swings.forEach(swing => {
        this.description += swing.description + '\n';
      })
    })

    // get winner
    if (this.warrior1.health > this.warrior2.health) {
      this.warrior1.isWinner = true;
      this.warrior2.isWinner = false;
      this.description += '__'+this.warrior1.name + ' is the winner.__\n';
      this.shortDescription = '**'+this.warrior1.name+'** defeated '+this.warrior2.name;
    } else if (this.warrior2.health > this.warrior1.health) {
      this.warrior2.isWinner = true;
      this.warrior1.isWinner = false;
      this.description += '__'+this.warrior2.name + ' is the winner.__\n';
      this.shortDescription = this.warrior2.name+' defeated **'+this.warrior1.name+'**';
    } else {
      this.isTie = true;
      this.description += '__Battle ended in a tie.__\n';
      this.shortDescription = this.warrior2.name+' and **'+this.warrior1.name+'** tied.';
    }

    // deaths
    if (!this.warrior1.isWinner && this.warrior1.health <= 0) {
      if (Math.random() <= 0.05) {
        this.warrior1.died = true;
      }
    }

    // gems and points
    if (this.warrior1.isWinner) {
      const expected = EloRating.expected(this.warrior1.points, this.warrior2.points);
      const gems = (Math.random() * 100 + 50) * (1 - expected);
      this.description += this.warrior1.name+' won **'+Math.round(gems)+'** gems.\n';
      this.shortDescription += ' and won '+Math.round(gems)+' gems.';
      usersCollection.updateOne({_id:this.user1._id}, {$inc:{gems:gems}});

      const newPoints = EloRating.calculate(this.warrior1.points, this.warrior2.points, true);
      this.description += this.warrior1.name+' gained **'+(newPoints.playerRating - this.warrior1.points)+'** points.\n';
      this.description += this.warrior2.name+' lost **'+(this.warrior2.points - newPoints.opponentRating)+'** points.\n';

      warriorsCollection.updateOne({_id:this.warrior1._id}, {
        $inc:{
          energy:-1,
          numAttacks: 1,
          numBattles: 1,
          wins: 1,
          lost: 0,
          ties: 0,
          gemsWon: gems
        },
        $set:{
          points:newPoints.playerRating
        }
      });

      warriorsCollection.updateOne({_id:this.warrior2._id}, {
        $inc: {
          numBattles: 1,
          lost: 1,
          kills: this.warrior1.died ? 1 : 0
        },
        $set:{
          points:newPoints.opponentRating
        }
      });
    }

    if (this.warrior2.isWinner) {
      const expected = EloRating.expected(this.warrior2.points, this.warrior1.points);
      const gems = (Math.random() * 100 + 50) * (1 - expected);
      this.description += this.warrior2.name+' won **'+Math.round(gems)+'** gems.\n';
      this.shortDescription += ' and won '+Math.round(gems)+' gems.';
      usersCollection.updateOne({_id:this.user2._id}, {$inc:{gems:gems}});

      const newPoints = EloRating.calculate(this.warrior2.points, this.warrior1.points, true);
      this.description += this.warrior2.name+' gained **'+(newPoints.playerRating - this.warrior2.points)+'** points.\n';
      this.description += this.warrior1.name+' lost **'+(this.warrior1.points - newPoints.opponentRating)+'** points.\n';

      warriorsCollection.updateOne({_id:this.warrior1._id}, {
        $inc:{
          energy:-1,
          lost: 1,
          numAttacks: 1,
          numBattles: 1
        },
        $set:{
          points:newPoints.opponentRating
        }
      });
      warriorsCollection.updateOne({_id:this.warrior2._id}, {
        $inc:{
          wins: 1,
          numBattles: 1,
          gemsWon: gems,
          kills: this.warrior1.died ? 1 : 0
        },
        $set:{
          points:newPoints.playerRating
        }
      });
    }

    if (this.isTie) {

    }

    // did someone die?
    if (this.warrior1.died) {
      this.description += '**'+this.warrior1.name + ' died**.\n';
      this.shortDescription += ' **'+this.warrior1.name + ' died**.';
      warriorsCollection.deleteOne({_id:this.warrior1._id});
      functions.killWarrior(db, discord, this.warrior1, 'Killed by '+this.warrior2.name+'.');
    }
    // if (!this.warrior2.isWinner && this.warrior2.health <= 0) {
    //   if (Math.random() <= 0.05) {
    //     this.warrior2.died = true;
    //     this.description += this.warrior2.name + ' died.\n';
    //     this.shortDescription += this.warrior2.name + ' died.';
    //     warriorsCollection.deleteOne({_id:this.warrior2._id});
    //   }
    // }

    this.shortDescription += '\n';

    this.saveToDb();
    this.printToDiscord();
  }


  printToDiscord() {
    this.msg.author.send(this.description + this.warrior1.name+' has **'+(this.warrior1.energy-1)+'** energy left.');

    const guildsCollection = this.db.collection('guilds');
    guildsCollection.findOne({discordId:this.user1.guildDiscordId}, {}, (error, guild) => {
      if (error) {

      } else {
        if (guild) {
          this.discord.channels.get(guild.channelId).send(':crossed_swords: '+this.shortDescription);
        }
      }
    });
  }


  saveToDb() {
    let data = {
      warrior1Id: this.warrior1._id,
      warrior1Name: this.warrior1.name,
      warrior1UserId: this.user1._id,
      warrior1Username: this.user1.username,
      warrior1UserTag: this.user1.tag,
      warrior1DiscordId: this.user1.discordId,
      warrior1Points: this.warrior1.points,
      warrior1Nickname: this.user1.nickname,

      warrior2Id: this.warrior2._id,
      warrior2Name: this.warrior2.name,
      warrior2UserId: this.user2._id,
      warrior2Username: this.user2.username,
      warrior2UserTag: this.user2.tag,
      warrior2DiscordId: this.user2.discordId,
      warrior2Points: this.warrior2.points,
      warrior2Nickname: this.user2.nickname,

      guildDiscordId: this.user1.guildDiscordId,
      createdAt: new Date(),
      guildId: this.user1.guildId,
      guildName: this.user1.guildName,

      description: this.description,
      shortDescription: this.shortDescription,
      discordIds: [this.warrior1.discordId, this.warrior2.discordId],
      userIds: [this.warrior1.userId, this.warrior2.userId],
      warriorIds: [this.warrior1._id, this.warrior2._id],
      warriorNames: [this.warrior1.name, this.warrior2.name]
    }

    const battleresultsCollection = this.db.collection('battleresults');
    battleresultsCollection.insertOne(data)
  }
}
