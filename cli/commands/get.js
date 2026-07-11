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
    .command("listing-by-fid <fid>")
    .description("Get listings by data-feed ID")
    .option("--midflag <flag>", "WITH, WITHOUT, or ALL")
    .action(async (fid, opts) => {
      try {
        const params = { fid };
        if (opts.midflag) params.mid_flag = opts.midflag.toUpperCase();
        await callAndPrint(program.opts(), "GetListingsByFeedId", params);
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
    .command("assigned-contact-devices <lid>")
    .description("Get assigned contact devices for a listing")
    .requiredOption("--cltype <cltype>", "contact list type: ON HOURS or OFF HOURS")
    .action(async (lid, opts) => {
      try {
        await callAndPrint(program.opts(), "GetAssignedContactDevices", {
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

  get
    .command("message-groups <reqlid>")
    .description("Get message groups visible to a requesting listing")
    .action(async (reqlid) => {
      try {
        await callAndPrint(program.opts(), "GetMessageGroups", { reqlid });
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

  get
    .command("oncall-group-roles")
    .description("Get on-call group roles")
    .action(async () => {
      try {
        await callAndPrint(program.opts(), "GetOncallGroupRoles");
      } catch (err) { printError(err); }
    });

  get
    .command("id-assignments <mid>")
    .description("Get the on-call assignments for a messaging ID")
    .requiredOption("--start-date <start_date>", "date of the earliest assignment to retrieve")
    .requiredOption("--end-date <end_date>", "date of the latest assignment to retrieve")
    .requiredOption("--timezone <timezone>", "timezone of the assignments")
    .action(async (mid, opts) => {
      try {
        await callAndPrint(program.opts(), "GetIdsAssignments", {
          mid, start_date: opts.startDate, end_date: opts.endDate, timezone: opts.timezone,
        });
      } catch (err) { printError(err); }
    });

  get
    .command("id-assignments-xml <mid>")
    .description("Get on-call assignments for a messaging ID as XML")
    .requiredOption("--ocastart <ocastart>", "start of the date range")
    .requiredOption("--ocaend <ocaend>", "end of the date range")
    .option("--tz <tz>", "timezone")
    .action(async (mid, opts) => {
      try {
        const params = { mid, ocastart: opts.ocastart, ocaend: opts.ocaend };
        if (opts.tz) params.tz = opts.tz;
        await callAndPrint(program.opts(), "GetIdsAssignmentsXml", params);
      } catch (err) { printError(err); }
    });

  get
    .command("id-curr-assign-xml <mid>")
    .description("Get current on-call assignment for a messaging ID as XML")
    .option("--tz <tz>", "timezone")
    .action(async (mid, opts) => {
      try {
        const params = { mid };
        if (opts.tz) params.tz = opts.tz;
        await callAndPrint(program.opts(), "GetIdsCurrAssignXml", params);
      } catch (err) { printError(err); }
    });

  get
    .command("group-assignments-xml <ocmid>")
    .description("Get group assignments XML for a date range")
    .requiredOption("--ocastart <ocastart>", "start of the date range")
    .requiredOption("--ocaend <ocaend>", "end of the date range")
    .option("--tz <tz>", "timezone")
    .action(async (ocmid, opts) => {
      try {
        const params = { ocmid, ocastart: opts.ocastart, ocaend: opts.ocaend };
        if (opts.tz) params.tz = opts.tz;
        await callAndPrint(program.opts(), "GetGroupsAssignmentsXml", params);
      } catch (err) { printError(err); }
    });

  get
    .command("group-curr-assign-xml <ocmid>")
    .description("Get current group assignments as XML (with timezone)")
    .option("--tz <tz>", "timezone")
    .action(async (ocmid, opts) => {
      try {
        const params = { ocmid };
        if (opts.tz) params.tz = opts.tz;
        await callAndPrint(program.opts(), "GetGroupsCurrAssignXml", params);
      } catch (err) { printError(err); }
    });

  get
    .command("current-assignment-lids <name>")
    .description("Get current assignment listing IDs by group name")
    .action(async (name) => {
      try {
        await callAndPrint(program.opts(), "GetCurrentAssignmentLids", { name });
      } catch (err) { printError(err); }
    });

  get
    .command("current-assignment-with-exceptions <name>")
    .description("Get current on-call assignment with exceptions by group name")
    .action(async (name) => {
      try {
        await callAndPrint(program.opts(), "GetCurrentAssignmentWithExceptions", { name });
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

  // -- Instructions subcommands -------------------------------------------------

  get
    .command("listing-instructions <lid>")
    .description("Get instructions assigned to a given listing record")
    .action(async (lid) => {
      try {
        await callAndPrint(program.opts(), "GetListingInstructions", { lid });
      } catch (err) { printError(err); }
    });

  get
    .command("instruction-info <seqnum>")
    .description("Get detail information for a given instruction")
    .action(async (seqnum) => {
      try {
        await callAndPrint(program.opts(), "GetInstructionInfo", { seqnum });
      } catch (err) { printError(err); }
    });

  get
    .command("shared-listing-instruction <seqnum>")
    .description("Get listing record(s) assigned to given instruction")
    .action(async (seqnum) => {
      try {
        await callAndPrint(program.opts(), "GetSharedListingInstruction", { seqnum });
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

  // -- Events / notifications subcommands ---------------------------------------

  get
    .command("active-notifications <rlid>")
    .description("Get currently-active notifications visible to a requesting listing")
    .action(async (rlid) => {
      try {
        await callAndPrint(program.opts(), "GetActiveNotifications", { rlid });
      } catch (err) { printError(err); }
    });

  get
    .command("event-templates <reqlid>")
    .description("Get all event templates visible to a requesting listing")
    .action(async (reqlid) => {
      try {
        await callAndPrint(program.opts(), "GetAllEventTemplates", { reqlid });
      } catch (err) { printError(err); }
    });

  get
    .command("event-template-detail <reqlid> <evid>")
    .description("Get event template detail")
    .action(async (reqlid, evid) => {
      try {
        await callAndPrint(program.opts(), "GetEventTemplateDetail", { reqlid, evid });
      } catch (err) { printError(err); }
    });

  get
    .command("event-activations <reqlid>")
    .description("Get event activations visible to a requesting listing")
    .option("--ssflag <ssflag>", "start/stop flag filter")
    .option("--actdate <actdate>", "activation date filter")
    .action(async (reqlid, opts) => {
      try {
        const params = { reqlid };
        if (opts.ssflag) params.ssflag = opts.ssflag;
        if (opts.actdate) params.actdate = opts.actdate;
        await callAndPrint(program.opts(), "GetEventActivations", params);
      } catch (err) { printError(err); }
    });

  get
    .command("event-activation-detail <reqlid> <evrseq>")
    .description("Get event activation detail")
    .action(async (reqlid, evrseq) => {
      try {
        await callAndPrint(program.opts(), "GetEventActivationDetail", { reqlid, evrseq });
      } catch (err) { printError(err); }
    });

  get
    .command("event-template-privilege <reqlid> <evid>")
    .description("Get event template privilege")
    .action(async (reqlid, evid) => {
      try {
        await callAndPrint(program.opts(), "GetEventTemplatePrivilege", { reqlid, evid });
      } catch (err) { printError(err); }
    });

  get
    .command("event-status <request_seqnum>")
    .description("Get the current status of an activated event")
    .action(async (requestSeqnum) => {
      try {
        await callAndPrint(program.opts(), "GetEventStatus", { request_seqnum: requestSeqnum });
      } catch (err) { printError(err); }
    });

  get
    .command("notification-status <stepseq>")
    .description("Get the status of a notification step")
    .action(async (stepseq) => {
      try {
        await callAndPrint(program.opts(), "GetNotificationStatus", { stepseq });
      } catch (err) { printError(err); }
    });

  get
    .command("notification-step-queries <rlid> <stepseq>")
    .description("Get the queries run for a notification step")
    .action(async (rlid, stepseq) => {
      try {
        await callAndPrint(program.opts(), "GetNotificationStepQueries", { rlid, stepseq });
      } catch (err) { printError(err); }
    });

  get
    .command("activation-recipient-count <reqlid> <evrseq>")
    .description("Get recipient count for an event activation")
    .action(async (reqlid, evrseq) => {
      try {
        await callAndPrint(program.opts(), "GetActivationRecipientCount", { reqlid, evrseq });
      } catch (err) { printError(err); }
    });

  get
    .command("template-recipient-count <reqlid> <evid>")
    .description("Get recipient count for an event template")
    .action(async (reqlid, evid) => {
      try {
        await callAndPrint(program.opts(), "GetTemplateRecipientCount", { reqlid, evid });
      } catch (err) { printError(err); }
    });

  get
    .command("query-template-info <reqlid> <qseq>")
    .description("Get query template info")
    .action(async (reqlid, qseq) => {
      try {
        await callAndPrint(program.opts(), "GetQueryTemplateInfo", { reqlid, qseq });
      } catch (err) { printError(err); }
    });

  // -- Monitoring subcommands ---------------------------------------------------

  get
    .command("monitor-event-detail")
    .description("Get monitor detail for an event notification")
    .requiredOption("--lid <lid>", "requesting listing ID")
    .requiredOption("--evrseq <evrseq>", "event notification/activation sequence number")
    .action(async (opts) => {
      try {
        await callAndPrint(program.opts(), "MonitorEventDetail", { lid: opts.lid, evrseq: opts.evrseq });
      } catch (err) { printError(err); }
    });

  get
    .command("monitor-event-status")
    .description("Get monitor status for an event notification")
    .requiredOption("--lid <lid>", "requesting listing ID")
    .requiredOption("--evrseq <evrseq>", "event notification/activation sequence number")
    .action(async (opts) => {
      try {
        await callAndPrint(program.opts(), "MonitorEventStatus", { lid: opts.lid, evrseq: opts.evrseq });
      } catch (err) { printError(err); }
    });

  get
    .command("monitor-event-status-summary")
    .description("Get monitor status summary for an event notification")
    .requiredOption("--lid <lid>", "requesting listing ID")
    .requiredOption("--evrseq <evrseq>", "event notification/activation sequence number")
    .action(async (opts) => {
      try {
        await callAndPrint(program.opts(), "MonitorEventStatusSummary", { lid: opts.lid, evrseq: opts.evrseq });
      } catch (err) { printError(err); }
    });

  get
    .command("monitor-proc-status-summary")
    .description("Get monitor status summary for a notification procedure")
    .requiredOption("--lid <lid>", "requesting listing ID")
    .requiredOption("--procseq <procseq>", "notification procedure sequence number")
    .action(async (opts) => {
      try {
        await callAndPrint(program.opts(), "MonitorProcStatusSummary", { lid: opts.lid, procseq: opts.procseq });
      } catch (err) { printError(err); }
    });

  get
    .command("monitor-step-status-summary")
    .description("Get monitor status summary for a notification step")
    .requiredOption("--lid <lid>", "requesting listing ID")
    .requiredOption("--stepseq <stepseq>", "notification step sequence number")
    .action(async (opts) => {
      try {
        await callAndPrint(program.opts(), "MonitorStepStatusSummary", { lid: opts.lid, stepseq: opts.stepseq });
      } catch (err) { printError(err); }
    });

  get
    .command("monitor-step-responses")
    .description("Get monitor step responses for a notification step")
    .requiredOption("--lid <lid>", "requesting listing ID")
    .requiredOption("--stepseq <stepseq>", "notification step sequence number")
    .action(async (opts) => {
      try {
        await callAndPrint(program.opts(), "MonitorStepResponses", { lid: opts.lid, stepseq: opts.stepseq });
      } catch (err) { printError(err); }
    });

  // -- Misc/reference subcommands ----------------------------------------------

  get
    .command("paging-info")
    .description("Get paging info by name or messaging ID")
    .option("--mid <mid>", "messaging ID")
    .option("--lname <lname>", "last name")
    .option("--fname <fname>", "first name")
    .action(async (opts) => {
      try {
        const params = {};
        if (opts.mid) params.mid = opts.mid;
        if (opts.lname) params.lname = opts.lname;
        if (opts.fname) params.fname = opts.fname;
        await callAndPrint(program.opts(), "GetPagingInfo", params);
      } catch (err) { printError(err); }
    });

  get
    .command("profile-specialties <ir_fid>")
    .description("Get all specialties by feed id")
    .action(async (irFid) => {
      try {
        await callAndPrint(program.opts(), "GetProfileSpecialties", { ir_fid: irFid });
      } catch (err) { printError(err); }
    });

  get
    .command("work-hours <lid>")
    .description("Get work hours by listing ID")
    .action(async (lid) => {
      try {
        await callAndPrint(program.opts(), "GetWorkHours", { lid });
      } catch (err) { printError(err); }
    });

  get
    .command("exception-list <mid>")
    .description("Get exception list by messaging ID")
    .action(async (mid) => {
      try {
        await callAndPrint(program.opts(), "GetExceptionList", { mid });
      } catch (err) { printError(err); }
    });
};
