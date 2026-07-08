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
