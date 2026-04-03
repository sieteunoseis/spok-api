"use strict";

/**
 * Config utility for the spok-api CLI.
 * Manages multi-server configuration stored at ~/.spok-api/config.json.
 * Falls back to ~/.spok-cli/config.json for backward compatibility.
 * Supports Secret Server (<ss:ID:field>) placeholder resolution via ss-cli.
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFile } = require("node:child_process");

// -- Constants ----------------------------------------------------------------

/** Regex matching a Secret Server placeholder: <ss:ID:field> */
const SS_PLACEHOLDER_RE = /<ss:\d+:[^>]+>/;

// -- Path helpers -------------------------------------------------------------

/**
 * Returns the config directory path.
 * Precedence: SPOK_API_CONFIG_DIR > SPOK_AMCOM_CONFIG_DIR > ~/.spok-api > ~/.spok-cli (fallback)
 * @returns {string}
 */
function getConfigDir() {
  if (process.env.SPOK_API_CONFIG_DIR) return process.env.SPOK_API_CONFIG_DIR;
  if (process.env.SPOK_AMCOM_CONFIG_DIR) return process.env.SPOK_AMCOM_CONFIG_DIR;

  const newDir = path.join(os.homedir(), ".spok-api");
  const oldDir = path.join(os.homedir(), ".spok-cli");

  // Use new dir if it exists, otherwise fall back to old dir if it exists
  if (fs.existsSync(path.join(newDir, "config.json"))) return newDir;
  if (fs.existsSync(path.join(oldDir, "config.json"))) return oldDir;

  // Default to new dir for fresh installs
  return newDir;
}

/**
 * Returns the full path to the config file.
 * @returns {string}
 */
function getConfigPath() {
  return path.join(getConfigDir(), "config.json");
}

// -- Core I/O -----------------------------------------------------------------

/**
 * Loads the config from disk.
 * Returns a default empty config if the file does not exist.
 * @returns {{ activeServer: string|null, servers: Object }}
 */
function loadConfig() {
  const cfgPath = getConfigPath();
  if (!fs.existsSync(cfgPath)) {
    return { activeServer: null, servers: {} };
  }
  try {
    const raw = fs.readFileSync(cfgPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to load config from ${cfgPath}: ${err.message}`);
  }
}

/**
 * Writes the config to disk with 0600 permissions.
 * Creates the config directory if it does not exist.
 * @param {{ activeServer: string|null, servers: Object }} config
 */
function saveConfig(config) {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const cfgPath = getConfigPath();
  const json = JSON.stringify(config, null, 2);
  fs.writeFileSync(cfgPath, json, { mode: 0o600, encoding: "utf8" });
}

// -- Server management --------------------------------------------------------

/**
 * Adds a named server to the config.
 * The first server added automatically becomes the active server.
 * @param {string} name - Server name.
 * @param {{ host: string, port: number, ssl?: boolean, readOnly?: boolean, hostFailover?: string }} opts
 */
function addServer(name, opts) {
  const config = loadConfig();

  const entry = { host: opts.host, port: opts.port };
  if (opts.hostFailover) entry.hostFailover = opts.hostFailover;
  if (opts.ssl !== undefined) entry.ssl = opts.ssl;
  if (opts.insecure !== undefined) entry.insecure = opts.insecure;
  if (opts.readOnly !== undefined) entry.readOnly = opts.readOnly;

  config.servers[name] = entry;

  // First server becomes active automatically
  if (config.activeServer === null || Object.keys(config.servers).length === 1) {
    config.activeServer = name;
  }

  saveConfig(config);
  return config;
}

/**
 * Switches the active server to the named server.
 * @param {string} name - Server name.
 */
function useServer(name) {
  const config = loadConfig();
  if (!config.servers[name]) {
    throw new Error(`Server "${name}" not found`);
  }
  config.activeServer = name;
  saveConfig(config);
  return config;
}

/**
 * Removes a named server from the config.
 * If the removed server was active, switches to the next available server (or null).
 * @param {string} name - Server name.
 */
function removeServer(name) {
  const config = loadConfig();
  if (!config.servers[name]) {
    throw new Error(`Server "${name}" not found`);
  }

  const wasActive = config.activeServer === name;
  delete config.servers[name];

  if (wasActive) {
    const remaining = Object.keys(config.servers);
    config.activeServer = remaining.length > 0 ? remaining[0] : null;
  }

  saveConfig(config);
  return config;
}

/**
 * Returns the active server config (with a `name` field added).
 * If serverName is provided, returns that specific server instead.
 * Returns null if no server is found.
 * @param {string} [serverName] - Optional specific server name.
 * @returns {{ name: string, host: string, port: number, ssl?: boolean, readOnly?: boolean, hostFailover?: string }|null}
 */
function getActiveServer(serverName) {
  const config = loadConfig();

  if (serverName) {
    const server = config.servers[serverName];
    if (!server) return null;
    return { name: serverName, ...server };
  }

  const activeName = config.activeServer;
  if (!activeName || !config.servers[activeName]) {
    return null;
  }

  return { name: activeName, ...config.servers[activeName] };
}

/**
 * Returns the full server list and active server name.
 * @returns {{ activeServer: string|null, servers: Object }}
 */
function listServers() {
  return loadConfig();
}

// -- Secret Server placeholder detection & resolution -------------------------

/**
 * Returns true if any string value in the object matches a Secret Server placeholder.
 * @param {Object} obj
 * @returns {boolean}
 */
function hasSsPlaceholders(obj) {
  for (const value of Object.values(obj)) {
    if (typeof value === "string" && SS_PLACEHOLDER_RE.test(value)) {
      return true;
    }
    if (value !== null && typeof value === "object") {
      if (hasSsPlaceholders(value)) return true;
    }
  }
  return false;
}

/**
 * Resolves all Secret Server placeholders in an object by shelling out to ss-cli.
 * @param {Object} obj
 * @returns {Promise<Object>}
 */
async function resolveSsPlaceholders(obj) {
  if (!hasSsPlaceholders(obj)) {
    return obj;
  }

  const resolved = { ...obj };

  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") {
      const match = value.match(/<ss:(\d+):([^>]+)>/);
      if (match) {
        const [, id, field] = match;
        resolved[key] = await resolveSsValue(id, field);
      }
    } else if (value !== null && typeof value === "object") {
      resolved[key] = await resolveSsPlaceholders(value);
    }
  }

  return resolved;
}

/**
 * Shells out to ss-cli to retrieve a single Secret Server field value.
 * @param {string} id - Secret ID.
 * @param {string} field - Field name.
 * @returns {Promise<string>}
 */
function resolveSsValue(id, field) {
  return new Promise((resolve, reject) => {
    execFile("ss-cli", ["get", id, "--format", "json"], (err, stdout, stderr) => {
      if (err) {
        if (err.code === "ENOENT" || (stderr && /not found/i.test(stderr))) {
          return reject(
            new Error(
              "ss-cli is not installed or not in PATH. " +
                "Please install ss-cli to resolve Secret Server placeholders. " +
                `Original error: ${err.message}`
            )
          );
        }
        return reject(new Error(`ss-cli failed for secret ${id}: ${err.message}`));
      }

      try {
        const data = JSON.parse(stdout);
        const fieldLower = field.toLowerCase();

        // First: check top-level keys (simple key-value secrets)
        const foundKey = Object.keys(data).find(
          (k) => k.toLowerCase() === fieldLower
        );
        if (foundKey !== undefined) {
          return resolve(data[foundKey]);
        }

        // Second: check items array (Secret Server template secrets)
        if (Array.isArray(data.items)) {
          const item = data.items.find(
            (i) =>
              (i.slug && i.slug.toLowerCase() === fieldLower) ||
              (i.fieldName && i.fieldName.toLowerCase() === fieldLower)
          );
          if (item) {
            return resolve(item.itemValue);
          }
        }

        return reject(new Error(`Field "${field}" not found in secret ${id}`));
      } catch (parseErr) {
        reject(new Error(`Failed to parse ss-cli output for secret ${id}: ${parseErr.message}`));
      }
    });
  });
}

// -- Exports ------------------------------------------------------------------

module.exports = {
  loadConfig,
  saveConfig,
  addServer,
  useServer,
  removeServer,
  getActiveServer,
  listServers,
  hasSsPlaceholders,
  resolveSsPlaceholders,
};
