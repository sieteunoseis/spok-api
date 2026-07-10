"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerUpdateCommand(program) {
  const update = program
    .command("update")
    .description("Update a resource via Spok SmartSuite API");

  update
    .command("person <lid>")
    .description("Update an existing person listing")
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
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        params.lid = lid;
        const result = await callAmcom(globalOpts, "UpdatePerson", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("messaging-id <lid>")
    .description("Update (or clear) the messaging ID on a listing")
    .option("--mid <mid>", "new messaging ID (omit to clear)")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { lid };
        if (opts.mid !== undefined) params.mid = opts.mid;
        const result = await callAmcom(globalOpts, "UpdateMessagingId", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("email-by-lid <lid>")
    .description("Update an email address by listing ID")
    .requiredOption("--old-emaddr <oldEmaddr>", "current email address")
    .requiredOption("--new-emaddr <newEmaddr>", "new email address")
    .option("--dorder <dorder>", "display order")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { lid, old_emaddr: opts.oldEmaddr, new_emaddr: opts.newEmaddr };
        if (opts.dorder) params.dorder = opts.dorder;
        const result = await callAmcom(globalOpts, "UpdateEmailAddressByLid", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("pager <pid>")
    .description("Update pager properties")
    .option("--cos <cos>", "class of service")
    .option("--model <model>", "pager model")
    .option("--proute <proute>", "pager route")
    .option("--remark <remark>", "remark")
    .action(async (pid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        params.pid = pid;
        const result = await callAmcom(globalOpts, "UpdatePager", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("org <orgseq>")
    .description("Update an existing organization")
    .option("--orgname <orgname>", "organization name")
    .option("--orgcode <orgcode>", "organization code")
    .option("--remark <remark>", "remark")
    .option("--parent <parent>", "parent organization sequence")
    .option("--chldrn <chldrn>", "children flag")
    .action(async (orgseq, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        params.orgseq = orgseq;
        const result = await callAmcom(globalOpts, "UpdateOrg", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("address <addseq>")
    .description("Update an existing address")
    .option("--bcode <bcode>", "building code")
    .option("--addtype <addtype>", "address type")
    .option("--addr1 <addr1>", "address line 1")
    .option("--addr2 <addr2>", "address line 2")
    .option("--addr3 <addr3>", "address line 3")
    .option("--addr4 <addr4>", "address line 4")
    .option("--city <city>", "city")
    .option("--state <state>", "state")
    .option("--country <country>", "country")
    .option("--pcode <pcode>", "postal code")
    .action(async (addseq, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        params.addseq = addseq;
        const result = await callAmcom(globalOpts, "UpdateAddress", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("directory <dirseq>")
    .description("Update an existing directory entry")
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
    .action(async (dirseq, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = buildParams(opts);
        params.dirseq = dirseq;
        const result = await callAmcom(globalOpts, "UpdateDirectory", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
  update
    .command("oncall-group <oncallMid>")
    .description("Update an existing on-call group")
    .option("--name <name>", "on-call group name")
    .option("--remark <remark>", "remark")
    .option("--group-parent-mid <groupParentMid>", "parent messaging ID of the on-call group")
    .option("--max-oncall-assignments <max>", "maximum number of concurrent assignments")
    .option("--timezone <timezone>", "timezone of the on-call group")
    .action(async (oncallMid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { oncall_mid: oncallMid };
        if (opts.name) params.name = opts.name;
        if (opts.remark) params.remark = opts.remark;
        if (opts.groupParentMid) params.group_parent_mid = opts.groupParentMid;
        if (opts.maxOncallAssignments) params.max_oncall_assignments = opts.maxOncallAssignments;
        if (opts.timezone) params.timezone = opts.timezone;
        const result = await callAmcom(globalOpts, "UpdateOncallGroup", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("oncall-assignment <assignmentSeqnum>")
    .description("Update an existing on-call assignment")
    .option("--start-date <startDate>", "assignment start date (e.g. 01-JAN-25 00:00:00)")
    .option("--end-date <endDate>", "assignment end date (e.g. 31-DEC-26 00:00:00)")
    .option("--priority <priority>", "assignment priority")
    .option("--timezone <timezone>", "timezone of the assignment")
    .option("--remark <remark>", "remark")
    .option("--assignment-role <role>", "assignment role")
    .action(async (assignmentSeqnum, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { assignment_seqnum: assignmentSeqnum };
        if (opts.startDate) params.start_date = opts.startDate;
        if (opts.endDate) params.end_date = opts.endDate;
        if (opts.priority) params.priority = opts.priority;
        if (opts.timezone) params.timezone = opts.timezone;
        if (opts.remark) params.remark = opts.remark;
        if (opts.assignmentRole) params.assignment_role = opts.assignmentRole;
        const result = await callAmcom(globalOpts, "UpdateOncallAssignment", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("message-group <grpnum>")
    .description("Update an existing static message group")
    .requiredOption("--reqlid <reqlid>", "requesting listing ID")
    .option("--olid <olid>", "new owner listing ID")
    .option("--gname <gname>", "group name")
    .option("--acode <acode>", "alert code")
    .option("--mprior <mprior>", "message priority")
    .option("--remark <remark>", "remark")
    .action(async (grpnum, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { reqlid: opts.reqlid, grpnum };
        if (opts.olid) params.olid = opts.olid;
        if (opts.gname) params.gname = opts.gname;
        if (opts.acode) params.acode = opts.acode;
        if (opts.mprior) params.mprior = opts.mprior;
        if (opts.remark) params.remark = opts.remark;
        const result = await callAmcom(globalOpts, "UpdateMessageGroup", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("message-group-member <grpnum> <mbrLid>")
    .description("Update a member of a static message group")
    .requiredOption("--reqlid <reqlid>", "requesting listing ID")
    .option("--dorder <dorder>", "display order")
    .option("--remark <remark>", "remark")
    .action(async (grpnum, mbrLid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { reqlid: opts.reqlid, grpnum, mbr_lid: mbrLid };
        if (opts.dorder) params.dorder = opts.dorder;
        if (opts.remark) params.remark = opts.remark;
        const result = await callAmcom(globalOpts, "UpdateStaticMessageGroupMember", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  update
    .command("work-hour <lid>")
    .description("Update an existing work hour entry")
    .requiredOption("--phrseq <phrseq>", "work hour sequence number (from `get work-hours`)")
    .option("--cltype <cltype>", "contact list type")
    .option("--stime <stime>", "start time (e.g. \"08:00 AM\")")
    .option("--etime <etime>", "end time (e.g. \"05:00 PM\")")
    .option("--wdays <wdays>", "work days (e.g. \"MON,TUE,WED\")")
    .action(async (lid, opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);
        const params = { lid, phrseq: opts.phrseq };
        if (opts.cltype) params.cltype = opts.cltype;
        if (opts.stime) params.stime = opts.stime;
        if (opts.etime) params.etime = opts.etime;
        if (opts.wdays) params.wdays = opts.wdays;
        const result = await callAmcom(globalOpts, "UpdateWorkHour", params);
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
