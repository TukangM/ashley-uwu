# Plugin Development Guide

## Plugin Structure

Every plugin is a single `.js` file inside the `plugins/` folder.

### Template

```js
/**
 * Plugin: YourPluginName
 * Short description of what this plugin does
 *
 * Usage:
 *   - !command — what it does
 *   - !command <args> — what it does with arguments
 */

const config = require('../config');

// ═══════════════════════════════════════════════════════
//  CONFIGURATION — Edit values below to customize
// ═══════════════════════════════════════════════════════
let someVariable = config.botName;
let anotherVariable = 'default value';
// ═══════════════════════════════════════════════════════

module.exports = {
    name: 'yourcommand',
    aliases: ['yc', 'shortcut'],
    description: 'Short description of the command',
    usage: `${config.prefix}yourcommand <args>`,
    category: 'General',
    ownerOnly: false,
    groupOnly: false,

    async handler(client, message, args) {
        // Your logic here
        await message.reply('Hello!');
    },
};
```

---

## Rules

### 1. Config Variables at the Top

If your plugin has customizable values, place them at the top of the file (after imports), inside the `═══` border block.

- **Default:** `let name = config.botName;` (references config)
- **Custom:** `let name = 'My Custom Name';` (hardcoded string)

Users can edit these values without understanding the rest of the code.

### 2. Required Fields

| Field         | Type           | Required | Description                          |
|---------------|----------------|----------|--------------------------------------|
| `name`        | string         | Yes      | Command name (lowercase)             |
| `handler`     | async function | Yes      | `handler(client, message, args)`     |
| `aliases`     | string[]       | No       | Alternative command names            |
| `description` | string         | No       | Short description for help menu      |
| `usage`       | string         | No       | Usage example                        |
| `category`    | string         | No       | Category for grouping                |
| `ownerOnly`   | boolean        | No       | Restrict to bot owner only           |
| `groupOnly`   | boolean        | No       | Restrict to group chats only         |

### 3. File Naming

| Filename            | Status                          |
|---------------------|---------------------------------|
| `ping.js`           | **Active** — plugin is loaded   |
| `ping.unload.js`    | **Disabled** — plugin is skipped|

Rename `plugin.js` to `plugin.unload.js` to disable it without deleting.
Rename it back to re-enable.

### 4. Hot-Reload

The bot watches the `plugins/` folder for changes:

- **Edit a file** — plugin reloads automatically
- **Add a new file** — plugin loads instantly
- **Delete a file** — plugin unloads
- **Rename to `.unload.js`** — plugin disabled
- **Rename back to `.js`** — plugin re-enabled

No bot restart needed.

### 5. Cooldown

Every command has a per-user cooldown configured in `config.js` via `cooldownMs`.
Users who send commands too quickly receive a wait message.

---

## Examples

### Simple Command

```js
/**
 * Plugin: Ping
 * Check if the bot is alive
 */

module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'Check if the bot is alive',
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
```

### Command with Config Variables

```js
/**
 * Plugin: Sticker
 * Convert images to stickers
 */

const config = require('../config');

// ═══════════════════════════════════════════════════════
//  CONFIGURATION — Edit values below to customize
// ═══════════════════════════════════════════════════════
let stickerAuthor = config.botName;
let stickerName   = config.botName;
// ═══════════════════════════════════════════════════════

module.exports = {
    name: 'sticker',
    aliases: ['s'],
    description: 'Convert image to sticker',
    category: 'Media',
    ownerOnly: false,
    groupOnly: false,

    async handler(client, message, args) {
        // ... use stickerAuthor and stickerName variables
    },
};
```

### Owner-Only Command

```js
module.exports = {
    name: 'restart',
    ownerOnly: true,

    async handler(client, message, args) {
        await message.reply('Restarting...');
        process.exit(0);
    },
};
```

### Group-Only Command

```js
module.exports = {
    name: 'tagall',
    groupOnly: true,

    async handler(client, message, args) {
        const chat = await message.getChat();
        const mentions = chat.participants.map(p => p.id._serialized);
        // ...
    },
};
```
