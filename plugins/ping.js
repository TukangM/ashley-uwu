/**
 * Plugin: Ping
 * Check if the bot is alive and measure response latency
 */

module.exports = {
  name: 'ping',
  aliases: ['p'],
  description: 'Check if the bot is alive and measure latency',
  usage: '!ping',
  category: 'General',
  ownerOnly: false,
  groupOnly: false,

  async handler(client, message, args) {
    const start = Date.now();
    await message.reply('Pong!');
    const latency = Date.now() - start;

    await client.sendMessage(message.from, `Response time: ${latency}ms`);
  },
};
