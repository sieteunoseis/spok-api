"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerAssignCommand(program) {
  const assign = program
    .command("assign")
    .description("Assign a resource via Spok SmartSuite API");

  assign
    .command("pager")
    .description("Assign a pager to a user")
    .requiredOption("--mid <mid>", "messaging ID")
    .requiredOption("--pager-id <pagerId>", "pager ID")
    .requiredOption("--display-order <order>", "display order")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AssignPager", {
          mid: opts.mid, pager_id: opts.pagerId, display_order: opts.displayOrder,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  assign
    .command("messaging-id <lid>")
    .description("Assign a messaging ID to a listing")
    .action(async (lid) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AssignMessagingId", { lid });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  assign
    .command("email")
    .description("Assign an email address to a user")
    .requiredOption("--mid <mid>", "messaging ID")
    .requiredOption("--email <email>", "email address")
    .requiredOption("--display-order <order>", "display order")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AddEmailAddress", {
          mid: opts.mid, email_address: opts.email, display_order: opts.displayOrder,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
