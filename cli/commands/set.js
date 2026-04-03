"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerSetCommand(program) {
  const set = program
    .command("set")
    .description("Set directory flags via Spok SmartSuite API");

  set
    .command("directory-enabled")
    .description("Set directory enabled flag")
    .requiredOption("--dirseq <dirseq>", "directory sequence number")
    .requiredOption("--module <module>", "module code (e.g. SC)")
    .requiredOption("--flag <flag>", "enabled flag: T or F")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SetDirectoryEnabled", {
          dirseq: opts.dirseq, module: opts.module, eflag: opts.flag,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  set
    .command("directory-published")
    .description("Set directory published flag")
    .requiredOption("--dirseq <dirseq>", "directory sequence number")
    .requiredOption("--module <module>", "module code (e.g. SC)")
    .requiredOption("--flag <flag>", "published flag: T or F")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SetDirectoryPublished", {
          dirseq: opts.dirseq, module: opts.module, pflag: opts.flag,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  set
    .command("directory-transfer")
    .description("Set directory transfer-allowed flag")
    .requiredOption("--dirseq <dirseq>", "directory sequence number")
    .requiredOption("--module <module>", "module code (e.g. SC)")
    .requiredOption("--flag <flag>", "transfer-allowed flag: T or F")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SetDirectoryTransferAllowed", {
          dirseq: opts.dirseq, module: opts.module, taflag: opts.flag,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
