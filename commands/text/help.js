export default function help(db, discord, msg) {
  let m = '**Warrior Bot**\n';
  m += 'Recruit warriors.  Challenge other players.\n';
  m += '\n';
  m += 'Type **!commands** to see available commands.\n';
  msg.channel.send(m);
}
