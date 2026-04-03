"use strict";

/**
 * Connection utility for the spok-api CLI.
 * Resolves connection config from CLI flags and/or server config,
 * then creates a SpokService instance.
 *
 * Pattern matches cisco-axl's createService() approach.
 */

const { getActiveServer, resolveSsPlaceholders } = require("./config.js");

/**
 * Resolve connection details from global opts + server config.
 * @param {Object} globalOpts - Commander global options.
 * @returns {Promise<{ host: string, port: number, ssl: boolean, insecure: boolean, hostFailover?: string, debug: boolean }>}
 */
async function resolveConfig(globalOpts) {
  let host = globalOpts.host;
  let port = globalOpts.port;
  let ssl = globalOpts.ssl || false;
  let insecure = globalOpts.insecure || false;
  let hostFailover = null;

  if (!host) {
    let server = getActiveServer(globalOpts.server);
    if (!server) throw new Error("No active server configured. Run: spok-api config add");
    server = await resolveSsPlaceholders(server);
    host = server.host;
    port = port || server.port;
    ssl = ssl || server.ssl || false;
    insecure = insecure || server.insecure || false;
    hostFailover = server.hostFailover || null;
  }

  if (!host) throw new Error("No host specified. Use --host or configure a server.");
  if (!port) throw new Error("No port specified. Use --port or configure a server.");

  return {
    host,
    port,
    ssl,
    insecure: insecure || globalOpts.insecure || false,
    hostFailover: hostFailover || undefined,
    debug: globalOpts.debug || false,
  };
}

/**
 * Create a SpokService instance from CLI flags.
 * @param {Object} globalOpts - Commander global options.
 * @returns {Promise<InstanceType<import('../../dist/index.js')>>}
 */
async function createService(globalOpts) {
  const config = await resolveConfig(globalOpts);

  // Handle --insecure flag
  if (config.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  const SpokService = require("../../dist/index.js");
  return new SpokService(config);
}

/**
 * Execute an Amcom API call via SpokService and return the result.
 * @param {Object} globalOpts - Commander global options.
 * @param {string} method - Amcom API method name.
 * @param {Object<string, string>} [params] - Method parameters.
 * @returns {Promise<Object>} The response data.
 */
async function callAmcom(globalOpts, method, params) {
  const service = await createService(globalOpts);
  const result = await service.execute(method, params);

  if (result.error) {
    throw new Error(`Amcom API error: ${result.error}${result.errorCode ? ` (code ${result.errorCode})` : ""}`);
  }

  // Prefer nested data if present; strip method key from output
  let output = result.data || result;
  if (output && output.method && typeof output === "object") {
    const { method: _, ...rest } = output;
    output = Object.keys(rest).length > 0 ? rest : output;
  }

  return output;
}

/**
 * Recursively remove null/empty string values from an object.
 * @param {Object} obj
 * @returns {Object}
 */
function cleanObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => (typeof item === "object" && item !== null ? cleanObject(item) : item));
  }
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined || val === "") continue;
    if (typeof val === "object") {
      cleaned[key] = cleanObject(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

module.exports = { resolveConfig, createService, callAmcom, cleanObject };
