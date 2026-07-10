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
    .command("pager-by-lid <lid>")
    .description("Assign a pager to a listing by listing ID")
    .requiredOption("--pid <pid>", "pager ID")
    .option("--dorder <dorder>", "display order")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { lid, pid: opts.pid };
        if (opts.dorder) params.dorder = opts.dorder;
        const result = await callAmcom(globalOpts, "AssignPagerByLid", params);
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

  assign
    .command("role <lid>")
    .description("Assign a role to a listing")
    .requiredOption("--role <role>", "role name")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AssignRole", { lid, role: opts.role });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  assign
    .command("message-priorities <lid>")
    .description("Assign the min/max message priority range to a listing")
    .requiredOption("--min-mprior <minMprior>", "minimum message priority")
    .requiredOption("--max-mprior <maxMprior>", "maximum message priority")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AssignMessagePriorities", {
          lid, min_mprior: opts.minMprior, max_mprior: opts.maxMprior,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  assign
    .command("group-limits <lid>")
    .description("Assign message-group limits to a listing")
    .requiredOption("--max-mgroups <maxMgroups>", "maximum number of message groups")
    .requiredOption("--max-mgroup-mbrs <maxMgroupMbrs>", "maximum number of members per message group")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AssignGroupLimits", {
          lid, max_mgroups: opts.maxMgroups, max_mgroup_mbrs: opts.maxMgroupMbrs,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
