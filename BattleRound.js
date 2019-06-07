export default class BattleRound {
  constructor(db, roundNum, warrior1, warrior2) {
    this.db = db;
    this.roundNum = roundNum;
    this.warrior1 = warrior1;
    this.warrior2 = warrior2;

    this.swings = [];

    if (this.warrior1.swingsFirst) {
      this.swings.push(this.swing(this.warrior1, this.warrior2));
      if (this.warrior2.health > 0) {
        this.swings.push(this.swing(this.warrior2, this.warrior1));
      }
    } else {
      this.swings.push(this.swing(this.warrior2, this.warrior1));
      if (this.warrior1.health > 0) {
        this.swings.push(this.swing(this.warrior1, this.warrior2));
      }
    }
  }


  swing(attacker, defender) {
    let damage = (Math.random() * 0.75 + 0.25) * attacker.dexterity * 200;
    if (Math.random() <= 0.1) damage *= 1.5;
    if (Math.random() <= 0.05) damage *= 3;

    let blocked = (Math.random() * defender.agility) > 0.27;

    if (!blocked) {
      defender.health -= damage;
    }

    let description = '**'+attacker.name+'** swings at **'+defender.name+'** for **'+Math.round(damage)+'** damage.';
    if (blocked) {
      description += ' **'+defender.name+' blocked**.';
    }
    if (!blocked) {
      description += ' '+defender.name+' has **'+Math.round(defender.health)+'** health left.';
    }

    return ({
      damage: damage,
      //landed: landed,
      blocked: blocked,
      description: description,
      attacker: attacker,
      defender: defender
    });
  }


  // saveToDb(battleresultId) {
  //   this.swings.forEach(swing => {
  //     let data = {
  //       damage: swing.damage,
  //       landed: swing.landed,
  //       dodged: swing.dodged,
  //       blocked: swing.blocked,
  //       description: swing.description,
  //       attackerId: swing.attacker._id,
  //       defenderId: swing.defender._id,
  //       attackerName: swing.attacker.name,
  //       defenderName: swing.defender.name,
  //       attackerUserId: swing.attacker.userId,
  //       defenderUserId: swing.defender.userId,
  //       createdAt: new Date(),
  //       battleresultId: battleresultId
  //     }
  //   });
  // }
}
