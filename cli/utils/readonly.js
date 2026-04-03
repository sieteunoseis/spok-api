"use strict";

/**
 * Read-only enforcement utility.
 * Prevents write operations when --read-only is enabled or the server config has readOnly=true.
 */

const { getActiveServer } = require("./config.js");

/**
 * Check if the current context is read-only.
 * @param {Object} globalOpts - Commander global options.
 * @returns {boolean}
 */
function isReadOnly(globalOpts) {
  if (globalOpts.readOnly) return true;

  const server = getActiveServer(globalOpts.server);
  if (server && server.readOnly) return true;

  return false;
}

/**
 * Enforce read-only mode. Throws an error if read-only is active.
 * @param {Object} globalOpts - Commander global options.
 * @throws {Error} If read-only mode is enabled.
 */
function enforceReadOnly(globalOpts) {
  if (isReadOnly(globalOpts)) {
    throw new Error(
      "Write operation blocked: read-only mode is enabled. " +
        "Remove --read-only flag or set readOnly=false in server config."
    );
  }
}

module.exports = { isReadOnly, enforceReadOnly };
