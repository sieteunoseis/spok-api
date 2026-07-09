"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerDeleteCommand(program) {
  const del = program
    .command("delete")
    .description("Delete a resource via Spok SmartSuite API");

  del
    .command("pager <pid>")
    .description("Delete a pager by pager ID")
    .action(async (pid) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeletePager", { pid });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("org <orgseq>")
    .description("Delete an organization by sequence number")
    .action(async (orgseq) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteOrg", { orgseq });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("address <addseq>")
    .description("Delete an address by sequence number")
    .action(async (addseq) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteAddress", { addseq });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("directory")
    .description("Delete a listing directory entry")
    .requiredOption("--lid <lid>", "listing ID")
    .requiredOption("--dirseq <dirseq>", "directory sequence number")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteListingDirectory", {
          lid: opts.lid, dirseq: opts.dirseq,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
