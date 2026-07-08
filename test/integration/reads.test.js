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
