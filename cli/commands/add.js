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
    .command("phone-number <mid>")
    .description("Add a phone number for a specified user (messaging ID)")
    .requiredOption("--phone-number <phoneNumber>", "phone number to add")
    .requiredOption("--phone-number-type <phoneNumberType>", "phone number type")
    .requiredOption("--published-flag <publishedFlag>", "T or F: whether the phone number is published")
    .requiredOption("--display-order <displayOrder>", "display order")
    .action(async (mid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AddPhoneNumber", {
          mid,
          phone_number: opts.phoneNumber,
          phone_number_type: opts.phoneNumberType,
          published_flag: opts.publishedFlag,
          display_order: opts.displayOrder,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("org")
    .description("Add a new organization")
    .requiredOption("--orgname <orgname>", "organization name")
    .requiredOption("--orgcode <orgcode>", "organization code")
    .option("--orgseq <orgseq>", "organization sequence (auto-assigned if omitted)")
    .option("--remark <remark>", "remark")
    .option("--parent <parent>", "parent organization sequence")
    .option("--chldrn <chldrn>", "children flag")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        const result = await callAmcom(globalOpts, "AddOrg", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("address")
    .description("Add a new address")
    .requiredOption("--addr1 <addr1>", "address line 1")
    .requiredOption("--city <city>", "city")
    .requiredOption("--state <state>", "state")
    .requiredOption("--pcode <pcode>", "postal code")
    .option("--bcode <bcode>", "building code")
    .option("--addtype <addtype>", "address type")
    .option("--addr2 <addr2>", "address line 2")
    .option("--addr3 <addr3>", "address line 3")
    .option("--addr4 <addr4>", "address line 4")
    .option("--country <country>", "country")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        const result = await callAmcom(globalOpts, "AddAddress", params);
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
    .command("oncall-group")
    .description("Add a new on-call group")
    .requiredOption("--oncall-mid <oncallMid>", "on-call group messaging ID (must be unused)")
    .option("--name <name>", "on-call group name")
    .option("--remark <remark>", "remark")
    .option("--group-parent-mid <groupParentMid>", "parent messaging ID of the on-call group")
    .option("--max-oncall-assignments <max>", "maximum number of concurrent assignments")
    .option("--timezone <timezone>", "timezone of the on-call group")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { oncall_mid: opts.oncallMid };
        if (opts.name) params.name = opts.name;
        if (opts.remark) params.remark = opts.remark;
        if (opts.groupParentMid) params.group_parent_mid = opts.groupParentMid;
        if (opts.maxOncallAssignments) params.max_oncall_assignments = opts.maxOncallAssignments;
        if (opts.timezone) params.timezone = opts.timezone;
        const result = await callAmcom(globalOpts, "AddOncallGroup", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("oncall-assignment")
    .description("Add an on-call assignment")
    .requiredOption("--group-mid <groupMid>", "on-call group messaging ID")
    .requiredOption("--mid <mid>", "listing messaging ID to assign")
    .requiredOption("--start-date <startDate>", "assignment start date (e.g. 01-JAN-25 00:00:00)")
    .requiredOption("--end-date <endDate>", "assignment end date (e.g. 31-DEC-26 00:00:00)")
    .option("--priority <priority>", "assignment priority")
    .option("--timezone <timezone>", "timezone of the assignment")
    .option("--remark <remark>", "remark")
    .option("--assignment-role <role>", "assignment role")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = {
          group_mid: opts.groupMid, mid: opts.mid,
          start_date: opts.startDate, end_date: opts.endDate,
        };
        if (opts.priority) params.priority = opts.priority;
        if (opts.timezone) params.timezone = opts.timezone;
        if (opts.remark) params.remark = opts.remark;
        if (opts.assignmentRole) params.assignment_role = opts.assignmentRole;
        const result = await callAmcom(globalOpts, "AddOncallAssignment", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("oncall-group-role")
    .description("Add a role to an on-call group")
    .requiredOption("--ocmid <ocmid>", "on-call group messaging ID")
    .requiredOption("--ocrole <ocrole>", "role name")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AddOncallGroupRole", {
          ocmid: opts.ocmid, ocrole: opts.ocrole,
        });
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("message-group")
    .description("Add a static message group")
    .requiredOption("--reqlid <reqlid>", "requesting listing ID")
    .option("--grpnum <grpnum>", "group number (optional per amcomapi.xml; omit to let the server assign one)")
    .requiredOption("--gname <gname>", "group name")
    .requiredOption("--acode <acode>", "alert code")
    .option("--mprior <mprior>", "message priority")
    .option("--remark <remark>", "remark")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { reqlid: opts.reqlid, gname: opts.gname, acode: opts.acode };
        if (opts.grpnum) params.grpnum = opts.grpnum;
        if (opts.mprior) params.mprior = opts.mprior;
        if (opts.remark) params.remark = opts.remark;
        const result = await callAmcom(globalOpts, "AddStaticMessageGroup", params);
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

  add
    .command("instruction")
    .description("Add a listing instruction and assign it to the specified user")
    .option("--mid <mid>", "messaging ID (mid or lid identifies the target)")
    .option("--lid <lid>", "listing ID (mid or lid identifies the target)")
    .option("--iname <iname>", "instruction name")
    .option("--itype <itype>", "instruction type")
    .requiredOption("--itext <itext>", "instruction text")
    .option("--sdate <sdate>", "start date")
    .option("--edate <edate>", "end date")
    .option("--iorder <iorder>", "instruction display order")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        const result = await callAmcom(globalOpts, "AddListingInstruction", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("instruction-share <seqnum> <lid>")
    .description("Share an existing listing instruction with another listing")
    .option("--mid <mid>", "messaging ID of the target (alternative to lid)")
    .option("--iorder <iorder>", "instruction display order")
    .action(async (seqnum, lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { seqnum, lid };
        if (opts.mid) params.mid = opts.mid;
        if (opts.iorder) params.iorder = opts.iorder;
        const result = await callAmcom(globalOpts, "ShareListingInstruction", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  add
    .command("work-hour")
    .description("Add a work hour entry to a listing")
    .requiredOption("--lid <lid>", "listing ID")
    .requiredOption("--cltype <cltype>", "contact list type (server requires ON HOURS)")
    .requiredOption("--stime <stime>", "start time (e.g. \"08:00 AM\")")
    .requiredOption("--etime <etime>", "end time (e.g. \"05:00 PM\")")
    .requiredOption("--wdays <wdays>", "work days (e.g. \"MON,TUE,WED\")")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const result = await callAmcom(globalOpts, "AddWorkHour", {
          lid: opts.lid, cltype: opts.cltype, stime: opts.stime, etime: opts.etime, wdays: opts.wdays,
        });
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
