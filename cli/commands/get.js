"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");

async function callAndPrint(globalOpts, method, params) {
  let output = await callAmcom(globalOpts, method, params);
  if (globalOpts.clean && output && typeof output === "object") {
    output = cleanObject(output);
  }
  await printResult(output, globalOpts.format);
}

module.exports = function registerGetCommand(program) {
  const get = program
    .command("get")
    .description("Get data from Spok SmartSuite API");

  // -- Listing subcommands ----------------------------------------------------

  get
    .command("listing <mid>")
    .description("Get listing info by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetListingInfoByMid", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("listing-by-name <name>")
    .description("Search listings by name")
    .option("--search-type <type>", "BEGINS WITH, CONTAINS, EXACT, ENDS WITH", "BEGINS WITH")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL", "WITHOUT")
    .action(async (name, opts) => {
      try {
        await callAndPrint(program.opts(), "GetListingsByName", {
          name, search_type: opts.searchType.toUpperCase(), mid_flag: opts.midflag.toUpperCase(),
        });
      } catch (err) { printError(err); }
    });

  get
    .command("listing-by-eid <eid>")
    .description("Get listings by employee ID")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL", "WITHOUT")
    .action(async (eid, opts) => {
      try {
        await callAndPrint(program.opts(), "GetListingsByEid", { eid, mid_flag: opts.midflag.toUpperCase() });
      } catch (err) { printError(err); }
    });

  get
    .command("listing-by-lid <lid>")
    .description("Get listing info by listing ID")
    .action(async (lid) => {
      try {
        await callAndPrint(program.opts(), "GetListingInfo", { lid });
      } catch (err) { printError(err); }
    });

  // -- Pager subcommands ------------------------------------------------------

  get
    .command("pager <mid>")
    .description("Get pager ID by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetPagerId", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("pager-info <pid>")
    .description("Get pager info by pager ID")
    .action(async (pid) => {
      try {
        await callAndPrint(program.opts(), "GetPagerInfo", { pid });
      } catch (err) { printError(err); }
    });

  get
    .command("pager-by-mid <mid>")
    .description("Get pager info by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetPagerInfoByMID", { mid });
      } catch (err) { printError(err); }
    });

  // -- Email / SSO / MID subcommands ------------------------------------------

  get
    .command("email <mid>")
    .description("Get email address by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetEmailAddress", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("sso <mid>")
    .description("Get SSO username by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetSSOUsername", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("mid <ssoUsername>")
    .description("Get messaging ID by SSO username")
    .action(async (ssoUsername) => {
      try {
        await callAndPrint(program.opts(), "GetMessagingID", { sso_username: ssoUsername });
      } catch (err) { printError(err); }
    });

  // -- Directory subcommands --------------------------------------------------

  get
    .command("directory <lid>")
    .description("Get listing directories by listing ID")
    .option("--phtype <type>", "phone type filter")
    .action(async (lid, opts) => {
      try {
        const params = { lid };
        if (opts.phtype) params.phtype = opts.phtype;
        await callAndPrint(program.opts(), "GetListingDirectories", params);
      } catch (err) { printError(err); }
    });

  get
    .command("directory-info <dirseq>")
    .description("Get directory info by directory sequence number")
    .action(async (dirseq) => {
      try {
        await callAndPrint(program.opts(), "GetDirectoryInfo", { dirseq });
      } catch (err) { printError(err); }
    });

  // -- Group subcommands ------------------------------------------------------

  get
    .command("group-members <grpnum>")
    .description("Get message group members")
    .requiredOption("--reqlid <lid>", "requesting listing ID")
    .action(async (grpnum, opts) => {
      try {
        await callAndPrint(program.opts(), "GetMessageGroupMembers", {
          reqlid: opts.reqlid, grpnum,
        });
      } catch (err) { printError(err); }
    });

  // -- On-call subcommands ----------------------------------------------------

  get
    .command("oncall-current <group_mid>")
    .description("Get current on-call assignments by group")
    .action(async (groupMid) => {
      try {
        await callAndPrint(program.opts(), "GetGroupsCurrentAssignments", { group_mid: groupMid });
      } catch (err) { printError(err); }
    });

  get
    .command("oncall-all <group_mid>")
    .description("Get all on-call assignments by group")
    .action(async (groupMid) => {
      try {
        await callAndPrint(program.opts(), "GetGroupsAssignments", { group_mid: groupMid });
      } catch (err) { printError(err); }
    });

  get
    .command("oncall-by-id <mid>")
    .description("Get current on-call assignments by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetIdsCurrentAssignments", { mid });
      } catch (err) { printError(err); }
    });

  // -- Exception & coverage subcommands ---------------------------------------

  get
    .command("exception <mid>")
    .description("Get current exception by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetCurrentException", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("exceptions <mid>")
    .description("Get all exceptions by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetExceptions", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("coverage <mid>")
    .description("Get coverage path by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetCoveragePath", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("final-covering <mid>")
    .description("Get final covering ID by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetFinalCoveringId", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("final-person <mid>")
    .description("Get final covering person by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetFinalCoveringPerson", { mid });
      } catch (err) { printError(err); }
    });

  // -- Reference data subcommands ---------------------------------------------

  get
    .command("org-codes")
    .description("Get all organization codes")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetOrgCodes");
      } catch (err) { printError(err); }
    });

  get
    .command("phone-types")
    .description("Get all phone number types")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetPhoneNumberTypes");
      } catch (err) { printError(err); }
    });

  get
    .command("buildings")
    .description("Get all buildings")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetAllBuildings");
      } catch (err) { printError(err); }
    });

  get
    .command("titles")
    .description("Get all titles")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetTitles");
      } catch (err) { printError(err); }
    });
};
