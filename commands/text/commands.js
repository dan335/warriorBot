export default function commands(db, discord, msg) {
  let m = '';
  m += '**!help**\n';
  m += '**!joinGame** - Join the game.  WarriorBot will send you a direct message.\n';
  m += "**!warriors <page number>** - View your guild's warriors.  Page number optional.\n";
  m += "**!players <page number>** - View players.  Page number is optional.\n";
  m += "**!rip** - Top warriors who have passed away.\n";
  m += "**!guilds <page number>** - View Discord guilds.  Page number is optional.\n";
  m += '**!attacks** - View attacks.\n';
  m += '**!setResultChannel <channel name>** - Set the channel WarriorBot uses to report battle results.\n';
  msg.channel.send(m);
}
