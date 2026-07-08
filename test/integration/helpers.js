"use strict";
const { test } = require("node:test");
const SpokService = require("../../dist/index.js");
const { getActiveServer, resolveSsPlaceholders } = require("../../cli/utils/config.js");

let _svc;
function lab() {
  if (_svc) return _svc;
  const s = getActiveServer();
  if (!s) throw new Error("no active lab server configured");
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  _svc = new SpokService({ host: s.host, port: s.port, ssl: s.ssl, insecure: true });
  return _svc;
}
const LIVE = process.env.SPOK_LAB === "1";
const itLab = (name, fn) => (LIVE ? test(name, fn) : test.skip(name, fn));
// Return the value of the exact field `key` found anywhere in the response
// (recursively), as a string, or null. Never guesses — callers pass the
// exact id/seq field name they created (from amcomapi.xml).
function extractSeq(res, key) {
  if (!key) return null;
  function walk(node) {
    if (node == null || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const el of node) { const v = walk(el); if (v != null) return v; }
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(node, key) &&
        node[key] != null && typeof node[key] !== "object") {
      return String(node[key]);
    }
    for (const k of Object.keys(node)) { const v = walk(node[k]); if (v != null) return v; }
    return null;
  }
  return walk(res);
}
class CreatedRegistry {
  constructor() { this.items = []; }
  track(method, params) { this.items.push({ method, params }); }
  async teardown(svc) {
    for (const { method, params } of this.items.reverse()) {
      try { await svc.execute(method, params); } catch (_) { /* best-effort cleanup */ }
    }
  }
}
module.exports = { lab, itLab, extractSeq, CreatedRegistry };
