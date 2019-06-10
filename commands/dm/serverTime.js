export default function serverTime(db, discord, msg) {
  msg.author.send(new Date().toLocaleString());
}
