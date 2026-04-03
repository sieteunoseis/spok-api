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
