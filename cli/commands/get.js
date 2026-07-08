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

  get
    .command("listing-by-lastname <lname>")
    .description("Search listings by last name")
    .requiredOption("--search-type <type>", "EXACT, BEGINS WITH, ENDS WITH, CONTAINS")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (lname, opts) => {
      try {
        const params = { lname, search_type: opts.searchType.toUpperCase() };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetListingsByLastName", params);
      } catch (err) { printError(err); }
    });

  get
    .command("listing-by-ssn <ssn>")
    .description("Get listings by Social Security Number")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (ssn, opts) => {
      try {
        const params = { ssn };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetListingsBySsn", params);
      } catch (err) { printError(err); }
    });

  get
    .command("listing-by-udf <udf>")
    .description("Get listings by user-defined field")
    .requiredOption("--udf-col <col>", "user-defined field column number (1-6)")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (udf, opts) => {
      try {
        const params = { udf_col: opts.udfCol, udf };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetListingsByUdf", params);
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

  get
    .command("pager-info-by-lid <lid>")
    .description("Get pager info by listing ID")
    .action(async (lid) => {
      try {
        await callAndPrint(program.opts(), "GetPagerInfoByLid", { lid });
      } catch (err) { printError(err); }
    });

  get
    .command("unassigned-contact-devices <lid>")
    .description("Get unassigned contact devices for a listing")
    .requiredOption("--cltype <cltype>", "contact list type: ON HOURS or OFF HOURS")
    .action(async (lid, opts) => {
      try {
        await callAndPrint(program.opts(), "GetUnassignedContactDevices", {
          lid, cltype: opts.cltype,
        });
      } catch (err) { printError(err); }
    });

  get
    .command("is-pager-by-dirseq <dirseq>")
    .description("Check whether a directory sequence number belongs to a pager")
    .action(async (dirseq) => {
      try {
        await callAndPrint(program.opts(), "IsPagerByDirectorySeqnum", { dirseq });
      } catch (err) { printError(err); }
    });

  get
    .command("is-pager-by-lid <lid>")
    .description("Check whether a listing ID + phone number combination belongs to a pager")
    .requiredOption("--phnum <phnum>", "phone number to check")
    .action(async (lid, opts) => {
      try {
        await callAndPrint(program.opts(), "IsPagerByListingId", { lid, phnum: opts.phnum });
      } catch (err) { printError(err); }
    });

  get
    .command("is-pager-by-phone <phnum>")
    .description("Check whether a phone number belongs to a pager")
    .action(async (phnum) => {
      try {
        await callAndPrint(program.opts(), "IsPagerByPhone", { phnum });
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
    .command("phone-number <mid>")
    .description("Get phone number(s) of a specified user")
    .option("--type <type>", "an optional specific phone number type to filter to")
    .action(async (mid, opts) => {
      try {
        const params = { mid };
        if (opts.type) params.phone_number_type = opts.type;
        await callAndPrint(program.opts(), "GetPhoneNumber", params);
      } catch (err) { printError(err); }
    });

  get
    .command("phone-number-by-lid <lid>")
    .description("Get phone number(s) of a specified user using listing_id")
    .option("--type <type>", "an optional specific phone number type to filter to")
    .action(async (lid, opts) => {
      try {
        const params = { lid };
        if (opts.type) params.phone_number_type = opts.type;
        await callAndPrint(program.opts(), "GetPhoneNumberByLid", params);
      } catch (err) { printError(err); }
    });

  get
    .command("alternate-phone <mid>")
    .description("Get an alternate phone number for a messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetAlternatePhone", { mid });
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

  get
    .command("directory-by-udf <udf>")
    .description("Get directories by user-defined field")
    .requiredOption("--udf-col <col>", "user-defined field column number (1-6)")
    .option("--search-type <type>", "EXACT, BEGINS WITH, ENDS WITH, CONTAINS")
    .option("--lid <lid>", "restrict search to a listing ID")
    .option("--phtype <type>", "phone type filter")
    .action(async (udf, opts) => {
      try {
        const params = { udf_col: opts.udfCol, udf };
        if (opts.searchType) params.search_type = opts.searchType.toUpperCase();
        if (opts.lid) params.lid = opts.lid;
        if (opts.phtype) params.phtype = opts.phtype;
        await callAndPrint(program.opts(), "GetDirectoriesByUdf", params);
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

  get
    .command("directory-types")
    .description("Get directory type reference list")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetDirectoryTypes");
      } catch (err) { printError(err); }
    });

  get
    .command("pager-coses")
    .description("Get pager carrier/COS list")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetPagerCoses");
      } catch (err) { printError(err); }
    });

  get
    .command("pager-models")
    .description("Get pager model list")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetPagerModels");
      } catch (err) { printError(err); }
    });

  get
    .command("page-routes")
    .description("Get page routes reference list")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetPageRoutes");
      } catch (err) { printError(err); }
    });

  // -- Org / address / department subcommands ---------------------------------

  get
    .command("addresses")
    .description("Get all addresses")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetAllAddresses");
      } catch (err) { printError(err); }
    });

  get
    .command("address-types")
    .description("Get address type reference list")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetAddressTypes");
      } catch (err) { printError(err); }
    });

  get
    .command("departments")
    .description("Get full department list")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetAllDepartments");
      } catch (err) { printError(err); }
    });

  get
    .command("department-hierarchy <dirseq>")
    .description("Get hierarchical department tree by directory sequence number")
    .action(async (dirseq) => {
      try {
        await callAndPrint(program.opts(), "GetDepartmentHierarchy", { dirseq });
      } catch (err) { printError(err); }
    });

  get
    .command("email-addresses <lid>")
    .description("Get all email addresses by listing ID")
    .action(async (lid) => {
      try {
        await callAndPrint(program.opts(), "GetEmailAddresses", { lid });
      } catch (err) { printError(err); }
    });

  get
    .command("email-by-lid <lid>")
    .description("Get email address(es) of a specified user using listing_id")
    .action(async (lid) => {
      try {
        await callAndPrint(program.opts(), "GetEmailAddressByLid", { lid });
      } catch (err) { printError(err); }
    });

  get
    .command("email-by-order <lid>")
    .description("Get email address by listing ID and display order")
    .requiredOption("--dorder <dorder>", "display order of the email address")
    .action(async (lid, opts) => {
      try {
        await callAndPrint(program.opts(), "GetEmailAddressByOrder", { lid, dorder: opts.dorder });
      } catch (err) { printError(err); }
    });

  get
    .command("caller-email <cid>")
    .description("Get email address(es) of a specified caller id")
    .action(async (cid) => {
      try {
        await callAndPrint(program.opts(), "GetCallerEmailAddress", { cid });
      } catch (err) { printError(err); }
    });

  // -- Record name subcommands -------------------------------------------------

  get
    .command("record-name-by-lid <lid>")
    .description("Get record name by listing ID")
    .action(async (lid) => {
      try {
        await callAndPrint(program.opts(), "GetRecordNameByLid", { lid });
      } catch (err) { printError(err); }
    });

  get
    .command("record-name-by-mid <mid>")
    .description("Get record name by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetRecordNameByMid", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("record-name-by-pid <pid>")
    .description("Get record name by pager ID")
    .action(async (pid) => {
      try {
        await callAndPrint(program.opts(), "GetRecordNameByPid", { pid });
      } catch (err) { printError(err); }
    });

  get
    .command("record-name-only-by-mid <mid>")
    .description("Get record name only by messaging ID (fastest name-only lookup)")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetRecordNameOnlyByMid", { mid });
      } catch (err) { printError(err); }
    });

  // -- Status subcommands -------------------------------------------------------

  get
    .command("status <mid>")
    .description("Get status of a messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetStatus", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("status-codes")
    .description("Get status code reference table")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetStatusCodes");
      } catch (err) { printError(err); }
    });

  get
    .command("id-status <mid>")
    .description("Get the status of a messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetIdStatus", { mid });
      } catch (err) { printError(err); }
    });

  get
    .command("status-by-eid <eid>")
    .description("Get statuses by employee ID")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (eid, opts) => {
      try {
        const params = { eid };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetStatusesByEid", params);
      } catch (err) { printError(err); }
    });

  get
    .command("status-by-feed-id <fid>")
    .description("Get statuses by feed ID")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (fid, opts) => {
      try {
        const params = { fid };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetStatusesByFeedId", params);
      } catch (err) { printError(err); }
    });

  get
    .command("status-by-lastname <lname>")
    .description("Get statuses by last name")
    .requiredOption("--search-type <type>", "EXACT, BEGINS WITH, ENDS WITH, CONTAINS")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (lname, opts) => {
      try {
        const params = { lname, search_type: opts.searchType.toUpperCase() };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetStatusesByLastName", params);
      } catch (err) { printError(err); }
    });

  get
    .command("status-by-latest-date <date>")
    .description("Get statuses updated on or after a date")
    .action(async (date) => {
      try {
        await callAndPrint(program.opts(), "GetStatusesByLatestDate", { date });
      } catch (err) { printError(err); }
    });

  get
    .command("status-by-name <name>")
    .description("Get statuses by name")
    .requiredOption("--search-type <type>", "EXACT, BEGINS WITH, ENDS WITH, CONTAINS")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (name, opts) => {
      try {
        const params = { name, search_type: opts.searchType.toUpperCase() };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetStatusesByName", params);
      } catch (err) { printError(err); }
    });

  get
    .command("status-by-ssn <ssn>")
    .description("Get statuses by Social Security Number")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (ssn, opts) => {
      try {
        const params = { ssn };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetStatusesBySsn", params);
      } catch (err) { printError(err); }
    });

  get
    .command("status-by-udf <udf>")
    .description("Get statuses by user-defined field")
    .requiredOption("--udf-col <col>", "user-defined field column number (1-6)")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (udf, opts) => {
      try {
        const params = { udf_col: opts.udfCol, udf };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetStatusesByUdf", params);
      } catch (err) { printError(err); }
    });
};
