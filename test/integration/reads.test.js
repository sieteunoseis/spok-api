const { test } = require("node:test");
const assert = require("node:assert");
const { lab, itLab } = require("./helpers.js");
itLab("lab GetOrgCodes smoke", async () => {
  const res = await lab().execute("GetOrgCodes");
  assert.ok(!res.error, `error: ${res.error}`);
});

// -- Task 1: Listings/directory/record reads --------------------------------
// Fixture: lid=322504, mid=54361 (person "Aaron, Ruby"); ssn "U00144823";
// udf3 "Coleman, Clifford A | colemanc@ohsu.edu" all discovered from
// `GetListingInfoByMid` on mid 54361. mid=16818 ("Adair, Melissa D") and
// pid "5035296668" discovered by scanning `GetListingsByName` "Ad" results
// for one with a registered pager, since 54361 has none.

itLab("GetListingsByLastName finds Aaron with BEGINS WITH", async () => {
  const svc = lab();
  const res = await svc.execute("GetListingsByLastName", { lname: "Aaron", search_type: "BEGINS WITH" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("54361"), "expected mid 54361 in results");
});

itLab("GetListingsBySsn returns the listing for a known ssn", async () => {
  const svc = lab();
  const res = await svc.execute("GetListingsBySsn", { ssn: "U00144823" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("322504"), "expected lid 322504 in results");
});

itLab("GetListingsByUdf finds listings sharing udf3 contact", async () => {
  const svc = lab();
  const res = await svc.execute("GetListingsByUdf", {
    udf_col: "3", udf: "Coleman, Clifford A | colemanc@ohsu.edu", mid_flag: "ALL",
  });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});

// GetDirectoriesByUdf: no directory-level UDF value could be discovered from
// any existing read. The listing udf1-3 values (used above) do not match any
// directory record ("No directory entries found" for all 6 columns tried
// against udf1/udf2/udf3 content and the directory's own dname/fpath/fid/bcode
// fields), and no RPC exposes a directory record's raw udf columns to seed a
// real query. Wiring is confirmed correct (server returns a clean business
// error, not a param/type error) but there's no known-good fixture to assert
// success against, per brief: mark skip rather than invent an id.
test.skip("GetDirectoriesByUdf: no directory-level UDF fixture available in lab data", () => {});

itLab("GetDirectoryTypes returns the directory type reference list", async () => {
  const svc = lab();
  const res = await svc.execute("GetDirectoryTypes");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});

itLab("GetRecordNameByLid returns a name for a known lid", async () => {
  const svc = lab();
  const res = await svc.execute("GetRecordNameByLid", { lid: "322504" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("Aaron"), "expected 'Aaron' in result");
});

itLab("GetRecordNameByMid returns a name for a mid with a pager", async () => {
  const svc = lab();
  const res = await svc.execute("GetRecordNameByMid", { mid: "16818" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("Adair"), "expected 'Adair' in result");
});

itLab("GetRecordNameByPid returns a name for a known pid", async () => {
  const svc = lab();
  const res = await svc.execute("GetRecordNameByPid", { pid: "5035296668" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("Adair"), "expected 'Adair' in result");
});

itLab("GetRecordNameOnlyByMid returns a name for a known mid", async () => {
  const svc = lab();
  const res = await svc.execute("GetRecordNameOnlyByMid", { mid: "54361" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("Aaron"), "expected 'Aaron' in result");
});

// -- Task 2: Pager/device reads ----------------------------------------------
// Fixture: lid=48218, mid=66755 (Zhang, An-Sheng), pager pid
// "15033290798@sms.smartmessagingsuite.com" — confirmed via
// `get pager-info-by-lid 48218`. dirseq values (5280927, 1831720, 2364099,
// 4504744) discovered from `get directory 48218`.

itLab("GetPagerInfoByLid returns pager info for a known lid", async () => {
  const svc = lab();
  const res = await svc.execute("GetPagerInfoByLid", { lid: "48218" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(
    JSON.stringify(res.data).includes("15033290798@sms.smartmessagingsuite.com"),
    "expected known pid in result"
  );
});

itLab("GetPagerCoses returns the pager carrier/COS reference list", async () => {
  const svc = lab();
  const res = await svc.execute("GetPagerCoses");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});

itLab("GetPagerModels returns the pager model reference list", async () => {
  const svc = lab();
  const res = await svc.execute("GetPagerModels");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});

itLab("GetPageRoutes returns the page routes reference list", async () => {
  const svc = lab();
  const res = await svc.execute("GetPageRoutes");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("SMS TEXT"), "expected 'SMS TEXT' route in result");
});

itLab("GetUnassignedContactDevices returns devices for a known lid + cltype", async () => {
  const svc = lab();
  const res = await svc.execute("GetUnassignedContactDevices", { lid: "48218", cltype: "ON HOURS" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("PAGER"), "expected a PAGER device in result");
});

// IsPagerByDirectorySeqnum: exhaustively searched — every listing returned by
// `GetListingsByName` "Ad"/BEGINS WITH/mid_flag ALL (120 listings) whose
// `GetPagerInfoByLid` succeeds (63 pager-holding lids) had its full directory
// tree walked (169 real dirseq values total) and each passed to
// IsPagerByDirectorySeqnum. Every single one returned the same clean business
// error ("The phone number is not defined as a pager."), never a param/type
// error — confirming the wrapper is wired correctly. But no directory record
// in this lab dataset is itself flagged as a pager (pagers live in a separate
// table not reachable via GetListingDirectories), so there is no known-good
// dirseq to assert a true/success result against. Per brief: skip rather than
// invent an id.
test.skip(
  "IsPagerByDirectorySeqnum: no dirseq in lab data is flagged as a pager (searched 169 real dirseqs across 63 pager-holding listings; server consistently returns a clean 'not a pager' business error)",
  () => {}
);

// IsPagerByListingId: prior session flagged this as possibly rejecting `lid`
// and demanding `phnum` instead. amcomapi.xml confirms BOTH `lid` (bindname 1)
// and `phnum` (bindname 2) are nullable="false" — the wrapper was missing
// `phnum` entirely. Fixed in src/index.ts (isPagerByListingId now takes
// lid + phnum and sends both), the CLI command (`is-pager-by-lid <lid>
// --phnum <phnum>`), and this test; dist rebuilt via `npm run build`.
// Live-verified the fix: calling with lid=48218 + a phnum that does NOT match
// any directory record for that lid returns "<code>25002</code>The specified
// directory does not exist or is not assigned to the specified listing." —
// but lid=48218 + phnum="503-494-7811" (an exact match of that lid's own
// GetListingDirectories phnum, dashes included) returns a DIFFERENT, cleaner
// business error: "The phone number is not defined as a pager." This proves
// the server accepts the lid+phnum pair and evaluates it correctly (no more
// missing-param error) — the wrapper is now correctly wired. As with
// IsPagerByDirectorySeqnum, no directory-recorded phone number in this lab
// dataset is itself a pager, so there is no known-good lid+phnum pair to
// assert a true/success result against.
test.skip(
  "IsPagerByListingId: fixed to require lid+phnum per amcomapi.xml (both nullable=false); confirmed live — lid=48218 phnum='503-494-7811' returns 'not defined as a pager' (clean business response, not a param error) but no lab fixture is itself a registered pager",
  () => {}
);

// -- Task 3: Email/phone reads -----------------------------------------------
// Fixture: mid=66755 / lid=48218 (Zhang, An-Sheng) — same fixture as Task 2.
// Phone numbers 503-494-7811 (DEPT), 503-494-5846 (LAB), 503-494-4253 (FAX)
// discovered via `get directory 48218`.

itLab("GetPhoneNumber returns phone numbers for a known mid", async () => {
  const svc = lab();
  const res = await svc.execute("GetPhoneNumber", { mid: "66755" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res).includes("503-494-7811"), "expected known phone number in result");
});

itLab("GetPhoneNumberByLid returns phone numbers for a known lid", async () => {
  const svc = lab();
  const res = await svc.execute("GetPhoneNumberByLid", { lid: "48218" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res).includes("503-494-7811"), "expected known phone number in result");
});

// GetAlternatePhone: no positive fixture exists — checked the existing
// fixtures (mid 54361, 16818, 66755) plus an exhaustive scan of 216 mids
// across the "El" and "Ya" GetListingsByName prefixes; none have an alternate
// phone configured in this lab dataset. Unlike the pager Is* checks below,
// this call still succeeds cleanly for a known mid — `res.error` is unset and
// the server returns the expected Oracle "no data found" business condition
// via `err_message`, proving the `mid` param is accepted and evaluated
// correctly (no wiring/param error). That is enough to confirm correct wiring
// without inventing a value.
itLab("GetAlternatePhone succeeds cleanly for a known mid (none configured in lab data)", async () => {
  const svc = lab();
  const res = await svc.execute("GetAlternatePhone", { mid: "66755" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.err_message !== undefined, "expected an err_message field in the response");
});

// IsPagerByPhone: tried the lab's one known registered pager device
// (pid 15033290798@sms.smartmessagingsuite.com, from Task 2's
// GetPagerInfoByLid on lid 48218) in 5 phone-number formats (raw digits,
// without the leading 1, dashed 503-329-0798, and both with/without the
// @domain suffix) — every variant returns "<code>25002</code> The phone
// number is not found in directory entries.", a clean business error (not a
// param/type error), consistent with Task 2's finding that this lab's pager
// device isn't exposed via any phnum-keyed lookup path. No known-good phnum
// exists in this lab dataset to assert a true/success result against.
test.skip(
  "IsPagerByPhone: no phnum in lab data resolves to the registered pager (tried 5 formats of known pager pid 15033290798@sms.smartmessagingsuite.com; server consistently returns 'not found in directory entries')",
  () => {}
);

// -- Task 4: Org/address/dept reads ------------------------------------------
// Fixture: lid=48218, mid=66755 (Zhang, An-Sheng) — same fixture as Task 2/3.
// dirseq=4415168 ("10D EPILEPSY MONITORING UNIT / OCTRI") discovered as a
// top-level department from `GetAllDepartments`; the lid-derived dirseqs from
// `get directory 48218` (5280927, etc.) are listing-level directory records,
// not department records, and return "No departments found" here.

itLab("GetAllAddresses returns the address list", async () => {
  const svc = lab();
  const res = await svc.execute("GetAllAddresses");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});

itLab("GetAddressTypes returns the address type reference list", async () => {
  const svc = lab();
  const res = await svc.execute("GetAddressTypes");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("MAIN"), "expected 'MAIN' address type in result");
});

itLab("GetAllDepartments returns the department list", async () => {
  const svc = lab();
  const res = await svc.execute("GetAllDepartments");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});

itLab("GetDepartmentHierarchy returns the tree for a known top-level dirseq", async () => {
  const svc = lab();
  const res = await svc.execute("GetDepartmentHierarchy", { dirseq: "4415168" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(
    JSON.stringify(res.data).includes("10D EPILEPSY MONITORING UNIT"),
    "expected known department name in result"
  );
});

itLab("GetEmailAddresses returns the email address for a known lid", async () => {
  const svc = lab();
  const res = await svc.execute("GetEmailAddresses", { lid: "48218" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("zhanga@ohsu.edu"), "expected known email in result");
});

itLab("GetEmailAddressByLid returns the email address for a known lid", async () => {
  const svc = lab();
  const res = await svc.execute("GetEmailAddressByLid", { lid: "48218" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(
    JSON.stringify(res).includes("zhanga@ohsu.edu"),
    "expected known email in result"
  );
});

// GetEmailAddressByOrder: amcomapi.xml defines the params as `lid` (bindname
// 1) + `dorder` (bindname 2) — NOT `mid` as the original src/index.ts wrapper
// assumed. Confirmed live: calling with `mid` returns a clean validation
// error ("request does not contain parameter lid"); switching to `lid`
// succeeds. Fixed in src/index.ts (getEmailAddressByOrder now takes
// lid + dorder), the CLI command (`email-by-order <lid> --dorder <dorder>`),
// and this test; dist rebuilt via `npm run build`. dorder=2 is the real
// display order for lid 48218's only email address (discovered via
// GetEmailAddresses above) — dorder=1 returns a clean "no email address"
// business error for this lid.
itLab("GetEmailAddressByOrder returns the email address for a known lid + dorder", async () => {
  const svc = lab();
  const res = await svc.execute("GetEmailAddressByOrder", { lid: "48218", dorder: "2" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("zhanga@ohsu.edu"), "expected known email in result");
});

// GetCallerEmailAddress: amcomapi.xml defines the param as `cid` (Caller ID)
// — NOT `mid` as the original src/index.ts wrapper assumed. Fixed in
// src/index.ts (getCallerEmailAddress now takes cid), the CLI command
// (`caller-email <cid>`), and this test; dist rebuilt via `npm run build`.
// Unlike GetEmailAddressByOrder, this procedure has no server-side param-name
// validation (bogus param names and no params at all return the identical
// clean "not found" response), so there's no error-message proof the rename
// mattered functionally — but amcomapi.xml is the canonical param source and
// must be followed verbatim regardless. No value in this lab dataset resolves
// to a caller id with an email on file (tried lid 48218, lid 322504, mid
// 54361 — all return the same clean business "not found"), so there's no
// known-good fixture to assert a positive match against; the response is
// clean (no param/validation error), confirming correct wiring.
itLab("GetCallerEmailAddress succeeds cleanly for a known id (none configured as a caller id in lab data)", async () => {
  const svc = lab();
  const res = await svc.execute("GetCallerEmailAddress", { cid: "48218" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.err_message !== undefined, "expected an err_message field in the response");
});

// -- Task 5: Status reads -----------------------------------------------------
// Fixture: lid=48218, mid=66755, eid=41969 (Zhang, An-Sheng) — same person as
// Task 2/3/4; scode "20" / stext "ENOTIFY ONLY - DO NOT PAGE" confirmed via
// `get listing-by-lid 48218 --format json`. udf2 "550-SM.CDBIO ADMIN"
// (department string) also from that same read. ssn "U00144823" and
// lid 322504 (Aaron, Ruby) reused from Task 1's fixture.

itLab("GetStatus returns the current status for a known mid", async () => {
  const svc = lab();
  const res = await svc.execute("GetStatus", { mid: "66755" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.strictEqual(res.status_code, "20", "expected status_code 20");
  assert.ok(
    String(res.status_text).includes("ENOTIFY ONLY"),
    "expected known status_text in result"
  );
});

itLab("GetStatusCodes returns the status code reference table", async () => {
  const svc = lab();
  const res = await svc.execute("GetStatusCodes");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});

itLab("GetIdStatus returns the current status for a known mid", async () => {
  const svc = lab();
  const res = await svc.execute("GetIdStatus", { mid: "66755" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.strictEqual(res.status_code, "20", "expected status_code 20");
});

itLab("GetStatusesByEid returns the status for a known eid", async () => {
  const svc = lab();
  const res = await svc.execute("GetStatusesByEid", { eid: "41969" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("48218"), "expected lid 48218 in results");
});

// GetStatusesByFeedId: amcomapi.xml defines the sole IN param as `fid`
// (bindname 1, nullable="false") — NOT `feed_id` as the original
// src/index.ts wrapper sent. Fixed in src/index.ts (getStatusesByFeedId now
// sends `fid`), the CLI command (`status-by-feed-id <fid>`), and this test;
// dist rebuilt via `npm run build`. Live-verified the fix: calling with no
// `fid` at all now returns "request does not contain parameter fid" (proves
// the server validates that exact param name); calling with any value
// (mid 66755, lid 48218, eid 41969, the listing's own fkey text, and a bogus
// string) all return the same clean business error, "No listing record was
// found that matches that Feed id." — confirming the wrapper is correctly
// wired. No RPC in amcomapi.xml exposes a listing's actual feed id as an
// output field (GetListingInfo returns `fkey`/`fdate`, the feed's *name* and
// *timestamp*, not a feed id), so there is no known-good fid to assert a
// positive match against.
test.skip(
  "GetStatusesByFeedId: fixed param name feed_id->fid per amcomapi.xml; confirmed live (missing-param and business-error responses both clean) but no RPC surfaces a real fid value to fixture against",
  () => {}
);

itLab("GetStatusesByLastName finds Zhang with BEGINS WITH", async () => {
  const svc = lab();
  const res = await svc.execute("GetStatusesByLastName", { lname: "Zhang", search_type: "BEGINS WITH" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("48218"), "expected lid 48218 in results");
});

// GetStatusesByLatestDate: amcomapi.xml types `date` as DATE, nullable="false".
// ISO (2026-07-01), slash, and DD-MON-YYYY forms all returned a clean
// server-side `errorSource="validation"` "the specified date format is
// invalid for date" — proving the `date` param name is right but the format
// is wrong. `DD-MON-YY HH24:MI:SS` (e.g. "01-JUL-26 00:00:00") is accepted:
// the server echoes it back in a business response. But every date tried
// across a 16-year span (01-JAN-10, 01-JAN-20, 01-JAN-21, 01-JAN-24,
// 01-JAN-25, 01-JUN-26, 07-JUL-26) returns the same clean business error,
// "No listing record was found that matches that date or higher" — this lab
// dataset has no listing with a status-change date recorded at all, so there
// is no known-good date to assert a positive match against.
test.skip(
  "GetStatusesByLatestDate: format DD-MON-YY HH24:MI:SS confirmed live (ISO/other formats rejected with a clean validation error); no listing in lab data has a status-change date recorded across a 2010-2026 span tried",
  () => {}
);

itLab("GetStatusesByName finds an exact match for a known name", async () => {
  const svc = lab();
  const res = await svc.execute("GetStatusesByName", { name: "Zhang, An-Sheng", search_type: "EXACT" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("48218"), "expected lid 48218 in results");
});

itLab("GetStatusesBySsn returns the status for a known ssn", async () => {
  const svc = lab();
  const res = await svc.execute("GetStatusesBySsn", { ssn: "U00144823" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("322504"), "expected lid 322504 in results");
});

itLab("GetStatusesByUdf finds listings sharing a udf2 department string", async () => {
  const svc = lab();
  const res = await svc.execute("GetStatusesByUdf", { udf_col: "2", udf: "550-SM.CDBIO ADMIN" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("48218"), "expected lid 48218 in results");
});

// -- Task 6: Instructions reads -----------------------------------------------
// Neither fixture lid (48218, 322504) has any listing instruction ("No
// listing instructions found" from GetListingInstructions on both). Scanned
// GetListingsByName "Ad" BEGINS WITH mid_flag ALL (120 lids) with
// GetListingInstructions on each; lid=187535 ("Adams, Joanna K PA", mid
// 12104) is the first hit, with a single INDIVIDUAL instruction,
// seqnum=149812, itext beginning "ACD 4649498". That real seqnum was then
// used to live-verify GetInstructionInfo (returns the same instruction) and
// GetSharedListingInstruction (returns the owning lid/mid/name for that
// seqnum) — no seqnum invented.

itLab("GetListingInstructions returns the instruction for a known lid", async () => {
  const svc = lab();
  const res = await svc.execute("GetListingInstructions", { lid: "187535" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("149812"), "expected known seqnum in result");
  assert.ok(JSON.stringify(res.data).includes("ACD 4649498"), "expected known itext in result");
});

itLab("GetInstructionInfo returns detail for a known seqnum", async () => {
  const svc = lab();
  const res = await svc.execute("GetInstructionInfo", { seqnum: "149812" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("ACD 4649498"), "expected known itext in result");
});

itLab("GetSharedListingInstruction returns the owning listing for a known seqnum", async () => {
  const svc = lab();
  const res = await svc.execute("GetSharedListingInstruction", { seqnum: "149812" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("187535"), "expected known lid 187535 in result");
  assert.ok(JSON.stringify(res.data).includes("Adams"), "expected known name 'Adams' in result");
});

// -- Task 7: On-call/assignment reads -----------------------------------------
// Fixture: on-call group ocmid=18753, name "MICU/MEDICAL INTENSIVE CARE UNIT ON
// CALL" (second probe group ocmid=11707, "ADULT PAIN SERVICE ON CALL"); person
// mid=54361 (Aaron)/66755 (Zhang); reqlid/lid=48218 (Zhang) reused from Task 2.
//
// Date format for GetIdsAssignments' start_date/end_date: ISO and bare
// DD-MON-YY were both rejected with a clean validation error ("the specified
// date format is invalid for start_date/end_date"); `DD-MON-YY HH24:MI:SS`
// (e.g. "01-JAN-25 00:00:00") is accepted — same format discovered for
// GetStatusesByLatestDate in Task 5.
//
// GetIdsAssignmentsXml: amcomapi.xml requires mid + ocastart + ocaend (all
// nullable="false") + tz (nullable="true") — the pre-existing src/index.ts
// wrapper only sent mid+tz, so calling it live returned a clean "request does
// not contain parameter ocastart/ocaend"-class validation failure. Fixed
// getIdsAssignmentsXml() to take (mid, ocastart, ocaend, tz) and rebuilt dist.
// GetIdsAssignments had the same shape of bug — the wrapper only sent `mid`,
// dropping the required start_date/end_date/timezone — fixed to take
// (mid, startDate, endDate, timezone) and send the exact `start_date`/
// `end_date`/`timezone` parameter names from amcomapi.xml.
//
// GetIdsAssignmentsXml / GetIdsCurrAssignXml / GetGroupsAssignmentsXml /
// GetGroupsCurrAssignXml all return their result via `xml_result`, and for
// this lab dataset every one of these fixtures (both on-call groups, both
// person mids) genuinely has zero on-call assignments configured. The server
// reports that as `<success><parameter name="retval">-1</parameter>
// <parameter name="xml_result"><error><code>25000</code><description>No
// assignments found.</description></error></parameter></success>` — a
// well-formed, expected business response (not a param/validation error),
// which the client's XML parser surfaces as `res.error`/`res.errorCode`. Per
// the task brief this is a valid, non-skip pass for the ocmid-keyed reads;
// live-testing showed the identical clean "No assignments found" (code 25000)
// response for the mid-keyed reads too, across both fixture groups and both
// fixture people and multiple tz formats/omission — confirming correct wiring
// rather than a param bug, so all four are asserted the same way below.

itLab("GetMessageGroups returns message groups visible to a known reqlid", async () => {
  const svc = lab();
  const res = await svc.execute("GetMessageGroups", { reqlid: "48218" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("NEONATAL CODE BLUE"), "expected a known group name in result");
});

itLab("GetOncallGroupRoles returns the on-call group role reference list", async () => {
  const svc = lab();
  const res = await svc.execute("GetOncallGroupRoles");
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("18747"), "expected a known ocmid in result");
});

itLab("GetIdsAssignments succeeds cleanly for a known mid (none configured in lab data)", async () => {
  const svc = lab();
  const res = await svc.execute("GetIdsAssignments", {
    mid: "54361", start_date: "01-JAN-25 00:00:00", end_date: "31-DEC-26 00:00:00", timezone: "America/Los_Angeles",
  });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.strictEqual(res.assignment_list, "", "expected an empty assignment_list for this mid");
});

itLab("GetIdsAssignmentsXml returns the known 'no assignments' business response for a known mid", async () => {
  const svc = lab();
  const res = await svc.execute("GetIdsAssignmentsXml", {
    mid: "54361", ocastart: "01-JAN-25 00:00:00", ocaend: "31-DEC-26 00:00:00", tz: "America/Los_Angeles",
  });
  assert.ok(res.error, "expected the known 'no assignments' business response");
  assert.ok(String(res.error).includes("No assignments found"), `unexpected error: ${res.error}`);
  assert.strictEqual(res.errorCode, "-1");
});

itLab("GetIdsCurrAssignXml returns the known 'no assignments' business response for a known mid", async () => {
  const svc = lab();
  const res = await svc.execute("GetIdsCurrAssignXml", { mid: "66755", tz: "America/Los_Angeles" });
  assert.ok(res.error, "expected the known 'no assignments' business response");
  assert.ok(String(res.error).includes("No assignments found"), `unexpected error: ${res.error}`);
  assert.strictEqual(res.errorCode, "-1");
});

itLab("GetGroupsAssignmentsXml returns the known 'no assignments' business response for a known ocmid", async () => {
  const svc = lab();
  const res = await svc.execute("GetGroupsAssignmentsXml", {
    ocmid: "18753", ocastart: "01-JAN-25 00:00:00", ocaend: "31-DEC-26 00:00:00", tz: "America/Los_Angeles",
  });
  assert.ok(res.error, "expected the known 'no assignments' business response");
  assert.ok(String(res.error).includes("No assignments found"), `unexpected error: ${res.error}`);
  assert.strictEqual(res.errorCode, "-1");
});

itLab("GetGroupsCurrAssignXml returns the known 'no assignments' business response for a known ocmid", async () => {
  const svc = lab();
  const res = await svc.execute("GetGroupsCurrAssignXml", { ocmid: "18753", tz: "America/Los_Angeles" });
  assert.ok(res.error, "expected the known 'no assignments' business response");
  assert.ok(String(res.error).includes("No assignments found"), `unexpected error: ${res.error}`);
  assert.strictEqual(res.errorCode, "-1");
});

itLab("GetCurrentAssignmentLids returns cleanly for a known on-call group name", async () => {
  const svc = lab();
  const res = await svc.execute("GetCurrentAssignmentLids", { name: "MICU/MEDICAL INTENSIVE CARE UNIT ON CALL" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
});

itLab("GetCurrentAssignmentWithExceptions returns cleanly for a known on-call group name", async () => {
  const svc = lab();
  const res = await svc.execute("GetCurrentAssignmentWithExceptions", { name: "MICU/MEDICAL INTENSIVE CARE UNIT ON CALL" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
});

// GetAssignedContactDevices: exhaustively searched — the brief's fixture
// lid=48218 returns a clean "No assigned contact device records were found"
// business error (code 25000) for both ON HOURS and OFF HOURS, despite
// Task 2 confirming that lid *does* have an unassigned PAGER device (i.e. it
// exists but isn't in "assigned" state). Also tried lid=322504 (Aaron) and
// lid=187535 (Adams) with both cltypes (same clean "not found" result), plus
// every lid (120) returned by `GetListingsByName "Ad" BEGINS WITH mid_flag
// ALL` against both cltypes (240 combinations) — every single call returned
// the same clean business error, never a param/type error (confirming correct
// wiring), and passing mid 16818 as `lid` correctly returns a *different*
// "No listing record was found" error, proving the server validates `lid`
// distinctly from `mid`. No lid in this lab dataset has an assigned contact
// device in either contact list type, so there is no known-good fixture to
// assert a positive match against. Per brief: skip rather than invent an id.
test.skip(
  "GetAssignedContactDevices: no lid in lab data has an assigned contact device in either cltype (searched 3 named fixture lids + 120 lids from a broad name scan, 246 combinations total; server consistently returns a clean 'no assigned contact device records' business error)",
  () => {}
);

// -- Task 8: Events/notifications reads ---------------------------------------
// Fixture discovery: amcomapi.xml does NOT use `etid`/`eaid` as the wire param
// names the task brief's shorthand implied — the real IN parameters are
// `reqlid`+`evid` (event template id) for template-scoped reads and
// `reqlid`+`evrseq` (event activation/request seqnum) for activation-scoped
// reads; `GetEventStatus` takes a bare `request_seqnum`; `GetNotificationStatus`
// takes a bare `stepseq`; `GetNotificationStepQueries` takes `rlid`+`stepseq`.
// src/index.ts's pre-existing wrappers for GetEventTemplateDetail,
// GetEventActivations, GetEventActivationDetail, GetEventTemplatePrivilege,
// GetEventStatus, GetNotificationStatus, GetNotificationStepQueries,
// GetActivationRecipientCount, and GetTemplateRecipientCount all sent the
// wrong (shorthand) param names/arity; fixed all nine to match amcomapi.xml
// verbatim and rebuilt dist. GetActiveNotifications, GetAllEventTemplates, and
// GetQueryTemplateInfo were already correct from a prior session.
//
// reqlid=48218 (the brief's starting fixture) has zero event templates
// ("No event templates were found...(48218)", code 25001) — a scan of all 120
// lids returned by `GetListingsByName "Ad" midflag ALL` (plus 48218 and the
// mid-shaped ids 54361/66755, which correctly error as "no listing record")
// found exactly 3 lids with real event templates: 13553 (3 templates),
// 297877, 263279. reqlid=13553 / evid=2471 ("CEI OR REQ Staffing Need Alert")
// is used below for every template-scoped read.
//
// GetEventActivations was run against all 3 template-owning reqlids, all 6
// grlids with ACTIVATOR/OWNER privilege on evid 2471 (182201, 111846, 185215,
// 89513, 216389, 88327), and reqlid=48218 — every one returned the same clean
// "No event request were found...that match the filtering requirements"
// business error (code 25000, GetEventActivations' own wiring is correct;
// there are simply no live event activations in this lab dataset). That is
// expected: activating an event sends notifications, and the global
// no-live-sends constraint means nothing in this environment has ever
// triggered one. Per the same precedent as GetIdsAssignmentsXml in Task 7, a
// clean "not found" business response for a real reqlid is a pass, not a
// skip.
//
// Because no event was ever activated, there is no real evrseq/eaid anywhere
// in the lab to chain into GetEventActivationDetail, GetEventStatus,
// GetNotificationStatus, GetNotificationStepQueries, or
// GetActivationRecipientCount — all five are skipped per the brief ("never
// invent an id"; confirmed with `GetEventActivations` returning zero rows for
// every candidate reqlid/grlid tried above, so no fixture evrseq exists to
// discover). GetQueryTemplateInfo is skipped too: no procedure in
// amcomapi.xml lists/exposes a qseq value, and none of the templates/steps
// discovered above reference one, so there is nothing to chain from.

itLab("GetAllEventTemplates returns real templates for a known reqlid", async () => {
  const svc = lab();
  const res = await svc.execute("GetAllEventTemplates", { reqlid: "13553" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("CEI OR REQ Staffing Need Alert"), "expected known evname in result");
});

itLab("GetActiveNotifications returns the known 'no active notification' business response for a known rlid", async () => {
  const svc = lab();
  const res = await svc.execute("GetActiveNotifications", { rlid: "48218" });
  assert.ok(res.error, "expected the known 'no active notification' business response");
  assert.ok(String(res.error).includes("No active notification found"), `unexpected error: ${res.error}`);
  assert.strictEqual(res.errorCode, "-1");
});

itLab("GetEventTemplateDetail returns detail for a known reqlid+evid", async () => {
  const svc = lab();
  const res = await svc.execute("GetEventTemplateDetail", { reqlid: "13553", evid: "2471" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("CEI OR REQ Staffing Need Alert Procedure 1"), "expected known procname in result");
});

itLab("GetEventTemplatePrivilege returns privileges for a known reqlid+evid", async () => {
  const svc = lab();
  const res = await svc.execute("GetEventTemplatePrivilege", { reqlid: "13553", evid: "2471" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(JSON.stringify(res.data).includes("\"grlid\":\"13553\""), "expected the owning grlid 13553 in result");
});

itLab("GetTemplateRecipientCount returns a count for a known reqlid+evid", async () => {
  const svc = lab();
  const res = await svc.execute("GetTemplateRecipientCount", { reqlid: "13553", evid: "2471" });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data && res.data.rcptcnt, "expected an rcptcnt in result");
});

itLab("GetEventActivations returns the known 'no event request' business response for a known reqlid", async () => {
  const svc = lab();
  const res = await svc.execute("GetEventActivations", { reqlid: "13553" });
  assert.ok(res.error, "expected the known 'no event request' business response");
  assert.ok(String(res.error).includes("No event request were found"), `unexpected error: ${res.error}`);
  assert.strictEqual(res.errorCode, "-1");
});

for (const [rpc, reason] of [
  ["GetEventActivationDetail", "needs a real evrseq from an activated event"],
  ["GetEventStatus", "needs a real request_seqnum (evrseq) from an activated event"],
  ["GetNotificationStatus", "needs a real stepseq from an activated event's notification procedure"],
  ["GetNotificationStepQueries", "needs a real stepseq from an activated event's notification procedure"],
  ["GetActivationRecipientCount", "needs a real evrseq from an activated event"],
  ["GetQueryTemplateInfo", "needs a real qseq; no procedure in amcomapi.xml lists/exposes one"],
]) {
  test.skip(
    `${rpc}: no live event has ever been activated in this lab dataset (GetEventActivations returned zero rows for every reqlid/grlid tried), so ${reason} does not exist to discover`,
    () => {}
  );
}
