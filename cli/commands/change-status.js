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
};
