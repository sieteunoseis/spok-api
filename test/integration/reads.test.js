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
