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
function extractSeq(res) {
  const s = JSON.stringify(res || {});
  const m = s.match(/"([a-z_]*(?:seq|id))"\s*:\s*"?(\d+)"?/i);
  return m ? m[2] : null;
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
