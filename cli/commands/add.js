"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerAddCommand(program) {
  const add = program
    .command("add")
    .description("Add a resource via Spok SmartSuite API");

  add
    .command("person")
    .description("Add a new person listing")
    .option("--lid <lid>", "listing ID (auto-assigned if omitted)")
    .option("--lname <lname>", "last name")
    .option("--fname <fname>", "first name")
    .option("--mname <mname>", "middle name")
    .option("--suffix <suffix>", "suffix")
    .option("--salut <salut>", "salutation")
    .option("--name <name>", "display name")
    .option("--pron <pron>", "pronunciation")
    .option("--swname <swname>", "switch name")
    .option("--mid <mid>", "messaging ID")
    .option("--remark <remark>", "remark")
    .option("--gender <gender>", "gender")
    .option("--eid <eid>", "employee ID")
    .option("--ssn <ssn>", "SSN")
    .option("--tz <tz>", "timezone")
    .option("--apswd <apswd>", "alpha password")
    .option("--npswd <npswd>", "numeric password")
    .option("--apa <apa>", "APA")
    .option("--afn <afn>", "AFN")
    .option("--cog <cog>", "COG")
    .option("--udf1 <udf1>", "user-defined field 1")
    .option("--udf2 <udf2>", "user-defined field 2")
    .option("--udf3 <udf3>", "user-defined field 3")
    .option("--udf4 <udf4>", "user-defined field 4")
    .option("--udf5 <udf5>", "user-defined field 5")
    .option("--udf6 <udf6>", "user-defined field 6")
    .option("--fid <fid>", "facility ID")
    .option("--aps <aps>", "APS")
    .option("--orgseq <orgseq>", "organization sequence")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        const result = await callAmcom(globalOpts, "AddPerson", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("pager")
    .description("Add a new pager")
    .requiredOption("--pid <pid>", "pager ID")
    .requiredOption("--cos <cos>", "class of service")
    .requiredOption("--model <model>", "pager model")
    .option("--proute <proute>", "pager route")
    .option("--remark <remark>", "remark")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        const result = await callAmcom(globalOpts, "AddPager", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("email")
    .description("Add email address by messaging ID")
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

  add
    .command("email-by-lid")
    .description("Add email address by listing ID")
    .requiredOption("--lid <lid>", "listing ID")
    .requiredOption("--email <email>", "email address")
    .option("--display-order <order>", "display order")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { lid: opts.lid, emaddr: opts.email };
        if (opts.displayOrder) params.dorder = opts.displayOrder;
        const result = await callAmcom(globalOpts, "AddEmailAddressByLid", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("directory")
    .description("Add a listing directory entry")
    .requiredOption("--lid <lid>", "listing ID")
    .option("--parent <parent>", "parent")
    .option("--phnum <phnum>", "phone number")
    .option("--phtype <phtype>", "phone type")
    .option("--title <title>", "title")
    .option("--bcode <bcode>", "building code")
    .option("--addseq <addseq>", "address sequence")
    .option("--dtype <dtype>", "directory type")
    .option("--udf1 <udf1>", "user-defined field 1")
    .option("--udf2 <udf2>", "user-defined field 2")
    .option("--udf3 <udf3>", "user-defined field 3")
    .option("--udf4 <udf4>", "user-defined field 4")
    .option("--udf5 <udf5>", "user-defined field 5")
    .option("--udf6 <udf6>", "user-defined field 6")
    .option("--remark <remark>", "remark")
    .option("--remark2 <remark2>", "remark 2")
    .option("--room <room>", "room")
    .option("--dorder <dorder>", "display order")
    .option("--sf1 <sf1>", "search field 1")
    .option("--sf2 <sf2>", "search field 2")
    .option("--sf3 <sf3>", "search field 3")
    .option("--sf4 <sf4>", "search field 4")
    .option("--sf5 <sf5>", "search field 5")
    .option("--sf6 <sf6>", "search field 6")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        const result = await callAmcom(globalOpts, "AddListingDirectory", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("oncall-member")
    .description("Add a member to an on-call group")
    .requiredOption("--oncall-mid <oncallMid>", "on-call group messaging ID")
    .requiredOption("--mid <mid>", "member messaging ID")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AddOncallGroupMember", {
          oncall_mid: opts.oncallMid, mid: opts.mid,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("group-member")
    .description("Add a member to a static message group")
    .requiredOption("--reqlid <reqlid>", "requesting listing ID")
    .requiredOption("--grpnum <grpnum>", "group number")
    .requiredOption("--mbr-lid <mbrLid>", "member listing ID")
    .option("--dorder <dorder>", "display order")
    .option("--remark <remark>", "remark")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = {
          reqlid: opts.reqlid, grpnum: opts.grpnum, mbr_lid: opts.mbrLid,
        };
        if (opts.dorder) params.dorder = opts.dorder;
        if (opts.remark) params.remark = opts.remark;
        const result = await callAmcom(globalOpts, "AddStaticMessageGroupMember", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};

function buildParams(opts) {
  const params = {};
  for (const [key, val] of Object.entries(opts)) {
    if (val !== undefined && typeof val !== "function") {
      params[key] = String(val);
    }
  }
  return params;
}
