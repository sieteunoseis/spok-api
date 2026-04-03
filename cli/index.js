"use strict";

const { Command } = require("commander");
const pkg = require("../package.json");

// Suppress Node.js TLS warning when --insecure is used
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (typeof warning === "string" && warning.includes("NODE_TLS_REJECT_UNAUTHORIZED")) return;
  originalEmitWarning.call(process, warning, ...args);
};

try {
  const updateNotifier = require("update-notifier").default || require("update-notifier");
  updateNotifier({ pkg }).notify();
} catch {}

const program = new Command();

program
  .name("spok-api")
  .description("CLI for Spok SmartSuite TCP API operations")
  .version(pkg.version)
  .option("--format <type>", "output format: table, json, csv", "table")
  .option("--server <name>", "use a specific named server")
  .option("--host <host>", "Spok hostname (overrides config)")
  .option("--port <port>", "Spok TCP port (overrides config)", parseInt)
  .option("--ssl", "use SSL/TLS for connection")
  .option("--insecure", "skip TLS certificate verification")
  .option("--read-only", "restrict to read-only operations")
  .option("--clean", "remove empty/null values from results")
  .option("--debug", "enable debug logging");

// Register commands
require("./commands/config.js")(program);
require("./commands/get.js")(program);
require("./commands/send-page.js")(program);
require("./commands/change-status.js")(program);
require("./commands/add.js")(program);
require("./commands/update.js")(program);
require("./commands/delete.js")(program);
require("./commands/assign.js")(program);
require("./commands/set.js")(program);
require("./commands/datafeed.js")(program);

program.parse();
