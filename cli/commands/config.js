"use strict";

const configUtil = require("../utils/config.js");
const { printResult, printError } = require("../utils/output.js");

module.exports = function registerConfigCommand(program) {
  const config = program
    .command("config")
    .description("Manage Spok server configuration");

  config
    .command("add <name>")
    .description("Add a named Spok server to config")
    .option("--host <host>", "Spok hostname")
    .option("--port <port>", "Spok TCP port", parseInt)
    .option("--ssl", "use SSL/TLS")
    .option("--insecure", "skip TLS certificate verification")
    .option("--host-failover <host>", "failover hostname")
    .option("--read-only", "mark this server as read-only")
    .action((name, opts, cmd) => {
      try {
        const globalOpts = cmd.optsWithGlobals();
        if (globalOpts.debug) {
          process.stderr.write(`[debug] opts: ${JSON.stringify(opts)}\n`);
          process.stderr.write(`[debug] globalOpts: ${JSON.stringify(globalOpts)}\n`);
        }
        const host = opts.host || globalOpts.host;
        const port = opts.port || globalOpts.port;
        if (!host) throw new Error("Missing required option: --host");
        if (!port) throw new Error("Missing required option: --port");

        const serverOpts = { host, port };
        if (opts.hostFailover) serverOpts.hostFailover = opts.hostFailover;
        if (opts.ssl || globalOpts.ssl) serverOpts.ssl = true;
        if (opts.insecure || globalOpts.insecure) serverOpts.insecure = true;
        if (opts.readOnly || globalOpts.readOnly) serverOpts.readOnly = true;

        configUtil.addServer(name, serverOpts);
        process.stdout.write(`Server "${name}" added successfully.\n`);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("use <name>")
    .description("Set a named server as the active server")
    .action((name) => {
      try {
        configUtil.useServer(name);
        process.stdout.write(`Server "${name}" is now the active server.\n`);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("list")
    .description("List all configured servers")
    .action(async () => {
      try {
        const { activeServer, servers } = configUtil.listServers();
        const rows = Object.entries(servers).map(([name, server]) => ({
          name,
          active: name === activeServer ? "\u2713" : "",
          host: server.host,
          port: server.port,
          ssl: server.ssl ? "yes" : "no",
          insecure: server.insecure ? "yes" : "no",
          readOnly: server.readOnly ? "yes" : "no",
          failover: server.hostFailover || "",
        }));
        const format = program.opts().format;
        await printResult(rows, format);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("show")
    .description("Show the active server configuration")
    .action(async () => {
      try {
        const serverName = program.opts().server;
        const server = configUtil.getActiveServer(serverName);
        if (!server) {
          printError(new Error("No active server configured. Run: spok-api config add"));
          return;
        }
        const format = program.opts().format;
        await printResult(server, format);
      } catch (err) {
        printError(err);
      }
    });

  config
    .command("remove <name>")
    .description("Remove a named server from config")
    .action((name) => {
      try {
        configUtil.removeServer(name);
        process.stdout.write(`Server "${name}" removed successfully.\n`);
      } catch (err) {
        printError(err);
      }
    });
};
