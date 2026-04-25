/**
 * Plugin: Echo
 * Repeats whatever the user says
 *
 * Usage:
 *   - !echo <text> — bot replies with the same text
 */

const config = require('../config');

module.exports = {
    name: 'echo',
    aliases: ['say'],
    description: 'Repeat your message',
    usage: `${config.prefix}echo <text>`,
    category: 'General',
    ownerOnly: false,
    groupOnly: false,

    async handler(client, message, args) {
        if (args.length === 0) {
            return message.reply('Please provide text after the command.');
        }

        const text = args.join(' ');
        await client.sendMessage(message.from, text);
    },
};
