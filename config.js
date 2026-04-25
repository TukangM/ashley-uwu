/**
 * Ashley UwU — Bot Configuration
 */

module.exports = {
    // ─── Identity ────────────────────────────────────────
    botName: "Ashley UwU",
    botVersion: "1.0.1",

    // ─── Command Prefixes ────────────────────────────────
    prefix: ".",
    second_prefix: "!",

    // ─── Owner ───────────────────────────────────────────
    // Format: <country_code><number>@c.us
    ownerNumber: "1@c.us",

    // ─── Auth Strategy ───────────────────────────────────
    // Options: 'local' | 'remote' | 'none'
    //
    // local  - Session saved to disk (.wwebjs_auth/)
    // remote - Session saved to MongoDB (requires wwebjs-mongo + mongoose)
    // none   - No session persistence, QR scan on every restart
    authStrategy: "local",

    // Path override for LocalAuth session storage
    // authDataPath: '.wwebjs_auth',

    // MongoDB connection string for RemoteAuth
    // mongoUri: 'mongodb://localhost:27017/ashley-uwu',

    // How often RemoteAuth backs up the session (ms, min: 60000)
    backupSyncIntervalMs: 300000,

    // Max time to wait for session upload on shutdown (ms)
    // Increase this if you have slow upload speeds
    shutdownSaveTimeoutMs: 1200000,

    // ─── Cooldown ────────────────────────────────────────
    // Delay between commands per user (ms)
    cooldownMs: 3000,
};