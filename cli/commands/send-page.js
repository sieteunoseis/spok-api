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

  // ─── Paging family (Task 19) ──────────────────────────────────────────────
  // Params/order come verbatim from amcomapi.xml <procedure> entries. These
  // dispatch real pages/messages when run against a live server, so they are
  // NEVER exercised by tests here — see test/integration/writes-paging.test.js.

  program
    .command("send-message <mid> <message_text>")
    .description("Store a message for a messaging ID (does not queue a page)")
    .requiredOption(
      "--send-to-covering-id <flag>",
      "whether the message should be stored for the covering id or the original id"
    )
    .action(async (mid, messageText, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SendMessage", {
          mid, message_text: messageText, send_to_covering_id: opts.sendToCoveringId,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("submit-message <rmid> <paged_text>")
    .description("Submit a message/page from a requester to a subject messaging ID")
    .requiredOption("--priority <priority>", "page priority")
    .option("--smid <smid>", "subject messaging ID (optional per amcomapi.xml)")
    .action(async (rmid, pagedText, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { rmid, paged_text: pagedText, priority: opts.priority };
        if (opts.smid) params.smid = opts.smid;
        const result = await callAmcom(globalOpts, "SubmitMessage", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("send-group-page <group_id> <text>")
    .description("Send a page to a Message Group")
    .option("--priority <priority>", "page priority (default: 1)", "1")
    .action(async (groupId, text, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SendGroupPage", {
          group_id: groupId, paged_text: text, priority: opts.priority,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("send-page-with-alert <mid> <paged_text>")
    .description("Send a page with an alert to a messaging ID")
    .requiredOption("--priority <priority>", "page priority")
    .action(async (mid, pagedText, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SendPageWithAlert", {
          mid, paged_text: pagedText, priority: opts.priority,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  program
    .command("send-to-smart-alert <mt> <msg>")
    .description("Send a message to all current Smart Alert users")
    .action(async (mt, msg) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "SendToSmartAlert", { mt, msg });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
