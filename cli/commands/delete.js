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
    .command("person <lid>")
    .description("Delete a person listing by listing ID")
    .action(async (lid) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeletePerson", { lid });
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
    .command("phone-number <lid>")
    .description("Delete a phone number from a listing's directory phone list")
    .option("--phone-number <phoneNumber>", "phone number to match (optional)")
    .option("--phone-type <phoneType>", "phone type to match (optional)")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { lid };
        if (opts.phoneNumber) params.phone_number = opts.phoneNumber;
        if (opts.phoneType) params.phone_type = opts.phoneType;
        const result = await callAmcom(globalOpts, "DeleteListingDirectoryPhone", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("email-by-lid <lid>")
    .description("Delete an email address by listing ID")
    .requiredOption("--emaddr <emaddr>", "email address to delete")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteEmailAddressByLid", {
          lid, emaddr: opts.emaddr,
        });
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

  del
    .command("oncall-group <oncallMid>")
    .description("Delete an on-call group by messaging ID")
    .action(async (oncallMid) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteOncallGroup", { oncall_mid: oncallMid });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("oncall-assignment <assignmentSeqnum>")
    .description("Delete an on-call assignment by sequence number")
    .action(async (assignmentSeqnum) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteOncallAssignment", {
          assignment_seqnum: assignmentSeqnum,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("oncall-group-role")
    .description("Delete a role from an on-call group")
    .requiredOption("--ocmid <ocmid>", "on-call group messaging ID")
    .requiredOption("--ocrole <ocrole>", "role name")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteOncallGroupRole", {
          ocmid: opts.ocmid, ocrole: opts.ocrole,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("oncall-group-member")
    .description("Delete a member from an on-call group")
    .requiredOption("--oncall-mid <oncallMid>", "on-call group messaging ID")
    .requiredOption("--mid <mid>", "member messaging ID")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteOncallGroupMember", {
          oncall_mid: opts.oncallMid, mid: opts.mid,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("message-group <grpnum>")
    .description("Delete a static message group")
    .requiredOption("--reqlid <reqlid>", "requesting listing ID")
    .action(async (grpnum, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteMessageGroup", { reqlid: opts.reqlid, grpnum });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("message-group-member <grpnum> <mbrLid>")
    .description("Delete a member from a static message group")
    .requiredOption("--reqlid <reqlid>", "requesting listing ID")
    .action(async (grpnum, mbrLid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteStaticMessageGroupMember", {
          reqlid: opts.reqlid, grpnum, mbr_lid: mbrLid,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("instruction <seqnum>")
    .description("Delete a listing instruction assigned to the specified listing")
    .requiredOption("--lid <lid>", "listing ID the instruction is assigned to")
    .action(async (seqnum, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteListingInstruction", {
          seqnum, lid: opts.lid,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("work-hour <lid>")
    .description("Delete a single work hour entry by listing ID and sequence number")
    .requiredOption("--phrseq <phrseq>", "work hour sequence number (from `get work-hours`)")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "DeleteWorkHour", { lid, phrseq: opts.phrseq });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  del
    .command("work-hours <lid>")
    .description("Unassign (delete) all work hour entries from a listing")
    .action(async (lid) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "UnassignWorkHours", { lid });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
