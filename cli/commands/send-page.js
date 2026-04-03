"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerSendPageCommand(program) {
  program
    .command("send-page <mid> <text>")
    .description("Send a page to a messaging ID")
    .option("--priority <priority>", "page priority (default: 1)", "1")
    .action(async (mid, text, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SendPage", {
          mid, paged_text: text, priority: opts.priority,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
