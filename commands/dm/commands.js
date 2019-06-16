import _s from '../../settings.js';


export default function commands(db, discord, msg) {
  let m = '';
  m += '**!recruit <name>** - Recruit a new warrior.\n';
  m += '**!retire <name>** - Retire a warrior.\n';
  m += '**!buyRecruit** - Buy a recruit token for '+_s.buyRecruitCost+' gems.\n';
  m += '**!warriors** - View your warriors.\n';
  m += "**!warriors <player name>** - View another player's warriors.\n";
  m += "**!guildWarriors <page number>** - View your guild's warriors.  Page number is optional.\n";
  m += "**!battle <warrior name> -vs <warrior name>** - Put your warrior up against another warrior in the arena.\n";
  m += "**!battleResults <warrior name>** - View a warriors last 3 battles.\n";
  m += "**!predict <warrior name> -vs <warrior name>** - Predict who will win.\n";
  m += '\n';
  m += '**!help**\n';
  m += '**!serverTime**\n';
  m += "**!leaveGame** - Leave this guild's game.  This will delete your warriors and all your data.\n";
  msg.author.send(m);
}
