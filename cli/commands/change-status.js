"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerChangeStatusCommand(program) {
  program
    .command("change-status <mid> <code> <text>")
    .description("Change a listing's status code and text")
    .action(async (mid, code, text) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "ChangeStatus", {
          mid, status_code: code, status_text: text,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("change-exception <mid> <type> <msg> <remark>")
    .description("Change (or create) an exception for a messaging ID")
    .option("--start-date <startDate>", "new exception start date")
    .option("--end-date <endDate>", "new exception end date")
    .option("--timezone <timezone>", "new exception timezone")
    .option(
      "--exception-seqnum <exceptionSeqnum>",
      "sequence number of an existing exception to update (omit to create a new one)"
    )
    .action(async (mid, type, msg, remark, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { mid, type, msg, remark };
        if (opts.startDate) params.start_date = opts.startDate;
        if (opts.endDate) params.end_date = opts.endDate;
        if (opts.timezone) params.timezone = opts.timezone;
        if (opts.exceptionSeqnum) params.exception_seqnum = opts.exceptionSeqnum;
        const result = await callAmcom(globalOpts, "ChangeException", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("swap-personal-contact-device <pdoseq> <dorder>")
    .description("Swap the display order of a personal contact device with whichever device currently holds that order")
    .action(async (pdoseq, dorder) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SwapPersonalContactDevice", { pdoseq, dorder });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("register-amc-device <mid> <pid> <email>")
    .description("Initiate registration of an AMC device to a listing (pid must already be assigned to the listing)")
    .action(async (mid, pid, email) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "RegisterAMCDevice", { mid, pid, email });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("unregister-amc-device <mid> <pid>")
    .description("Unregister an AMC device from a listing (pid must already be assigned to the listing)")
    .action(async (mid, pid) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "UnregisterAMCDevice", { mid, pid });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
