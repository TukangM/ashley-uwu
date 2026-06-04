/**
 * Ashley UwU — Chromium Path Resolver
 *
 * Automatically detects a system-installed Chromium/Chrome executable
 * on Linux (amd64 & arm64). On Windows the bundled Puppeteer Chrome is
 * used by default unless the user sets a manual override.
 *
 * When a path is found for the first time on Linux the value is written
 * back into config.js so subsequent starts skip the search.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");
const logger = require("./logger");

// Keywords the user explicitly requested
const BROWSER_KEYWORDS = ["chrome", "chromium", "ungoogled-chromium"];

// Well-known executable paths to probe on Linux (order = priority)
const LINUX_CANDIDATES = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/ungoogled-chromium",
  "/snap/bin/chromium",
  "/usr/lib/chromium/chromium",
  "/usr/lib/chromium-browser/chromium-browser",
];

/**
 * Check if a binary at `p` exists and is executable.
 */
function isExecutable(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Try `which <name>` for each browser keyword.
 * Returns the first hit or null.
 */
function searchViaWhich() {
  for (const keyword of BROWSER_KEYWORDS) {
    try {
      const result = execSync(`which ${keyword}`, { encoding: "utf8" }).trim();
      if (result && isExecutable(result)) {
        return result;
      }
    } catch {
      // `which` returns non-zero when not found — ignore
    }
  }
  return null;
}

/**
 * Probe well-known paths, then fall back to `which`.
 * Returns the absolute path or null.
 */
function findSystemChromium() {
  for (const candidate of LINUX_CANDIDATES) {
    if (isExecutable(candidate)) return candidate;
  }
  return searchViaWhich();
}

// ─── Config Writer ──────────────────────────────────────────

const CONFIG_PATH = path.join(__dirname, "..", "config.js");

/**
 * Write the discovered `execPath` into config.js.
 *
 * If `puppeteerExecutablePath` already has an uncommented line we
 * overwrite the value. Otherwise we append it after the authStrategy
 * block.
 *
 * A datetime comment is added only on the **first** write (i.e. when
 * the property was still commented out or absent).
 */
function writePathToConfig(execPath) {
  try {
    let content = fs.readFileSync(CONFIG_PATH, "utf8");

    const dateStamp = new Date().toISOString();
    const newLine = `    puppeteerExecutablePath: "${execPath}",`;

    // Pattern A – uncommented property already present (value update)
    const activeRe = /^(\s*)puppeteerExecutablePath:\s*".*",?/m;
    // Pattern B – commented-out property
    const commentedRe = /^(\s*)\/\/\s*puppeteerExecutablePath:.*$/m;

    if (activeRe.test(content)) {
      // Value exists but may be stale — update silently (no new date)
      content = content.replace(activeRe, newLine);
    } else if (commentedRe.test(content)) {
      // First time: uncomment and add datetime
      content = content.replace(
        commentedRe,
        `    // Auto-detected on ${dateStamp}\n${newLine}`,
      );
    } else {
      // Property not present at all — inject after authStrategy line
      const anchor = /^(\s*authStrategy:\s*".*",?)$/m;
      if (anchor.test(content)) {
        content = content.replace(
          anchor,
          `$1\n\n    // Auto-detected on ${dateStamp}\n${newLine}`,
        );
      } else {
        // Last resort: append before closing `};`
        content = content.replace(
          /};(\s*)$/,
          `\n    // Auto-detected on ${dateStamp}\n${newLine}\n};$1`,
        );
      }
    }

    fs.writeFileSync(CONFIG_PATH, content, "utf8");
    logger.success(`Saved puppeteerExecutablePath to config.js → ${execPath}`);
  } catch (err) {
    logger.warn("Could not write to config.js:", err.message);
    logger.warn("You can set puppeteerExecutablePath manually in config.js");
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Resolve the Chromium executable path to use.
 *
 * Flow:
 * 1. If config.puppeteerExecutablePath is set AND the file exists → use it.
 * 2. If the configured path is missing/invalid → re-search.
 * 3. On Linux: search system paths, write result to config.js.
 * 4. On Windows: return undefined (use Puppeteer bundled Chrome).
 * 5. On ARM/ARM64 Linux with no system Chrome: warn the user.
 *
 * @param {object} config  The loaded config object
 * @returns {string|undefined}
 */
function resolveChromiumPath(config) {
  const platform = os.platform();
  const arch = os.arch();

  // 1. User/auto-configured path exists and is valid
  if (config.puppeteerExecutablePath) {
    if (isExecutable(config.puppeteerExecutablePath)) {
      logger.info(
        `Chromium: using configured path → ${config.puppeteerExecutablePath}`,
      );
      return config.puppeteerExecutablePath;
    }
    // Path was set but is no longer valid — re-search
    logger.warn(
      `Configured puppeteerExecutablePath not found: ${config.puppeteerExecutablePath}`,
    );
    logger.info("Searching for a system Chromium/Chrome...");
  }

  // 2. Windows — use bundled Puppeteer Chrome (arm64ec handles itself)
  if (platform === "win32") {
    if (!config.puppeteerExecutablePath) {
      logger.info("Chromium: using Puppeteer bundled Chrome (Windows)");
    }
    return undefined;
  }

  // 3. Linux — auto-detect
  if (platform === "linux") {
    const found = findSystemChromium();

    if (found) {
      logger.success(`Chromium: detected system browser → ${found}`);
      writePathToConfig(found);

      // Hot-patch so the running config object stays in sync
      config.puppeteerExecutablePath = found;
      return found;
    }

    // Not found
    if (arch === "arm64" || arch === "arm") {
      logger.error(
        "No system Chromium/Chrome found on this ARM Linux system.",
      );
      logger.error(
        "Puppeteer's bundled Chrome does NOT support ARM64 properly.",
      );
      logger.error(
        "Please install Chromium:  sudo apt install chromium-browser",
      );
      logger.error(
        "Or set puppeteerExecutablePath in config.js to your browser path.",
      );
    } else {
      logger.warn(
        "No system Chromium/Chrome found — falling back to Puppeteer bundled Chrome.",
      );
    }
    return undefined;
  }

  // 4. Other platforms (macOS, etc.) — bundled
  logger.info("Chromium: using Puppeteer bundled Chrome");
  return undefined;
}

module.exports = { resolveChromiumPath };
