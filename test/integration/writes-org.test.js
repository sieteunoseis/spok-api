"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 11: Org/address/specialty writes -----------------------------------
// All records created by this file are marked "ZZ-APITEST-..." so any stray
// leftover is obviously ours. Every create captures its returned id via
// extractSeq() before any delete is attempted; if extractSeq() ever returns
// null the test fails loudly instead of guessing an id to delete.

itLab("Org CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  let orgseq = null;
  try {
    const orgcode = `ZZAPITEST${Date.now()}`;
    const add = await svc.execute("AddOrg", {
      orgname: "ZZ-APITEST-ORG",
      orgcode,
    });
    assert.ok(!add.error, `AddOrg failed: ${add.error}`);
    orgseq = extractSeq(add, "orgseq");
    assert.ok(orgseq, "no orgseq returned; refusing to delete anything");
    reg.track("DeleteOrg", { orgseq });

    const read = await svc.execute("GetOrgCodes");
    assert.ok(!read.error, `GetOrgCodes failed: ${read.error}`);
    assert.ok(JSON.stringify(read).includes(orgseq), "new org not found via GetOrgCodes");

    const upd = await svc.execute("UpdateOrg", { orgseq, orgname: "ZZ-APITEST-ORG-UPDATED" });
    assert.ok(!upd.error, `UpdateOrg failed: ${upd.error}`);

    const readAfterUpdate = await svc.execute("GetOrgCodes");
    assert.ok(
      JSON.stringify(readAfterUpdate).includes("ZZ-APITEST-ORG-UPDATED"),
      "updated org name not visible via GetOrgCodes"
    );
  } finally {
    await reg.teardown(svc);
  }

  // Confirm the delete-own step actually removed it (teardown already ran).
  if (orgseq) {
    const readAfterDelete = await svc.execute("GetOrgCodes");
    assert.ok(!readAfterDelete.error, `GetOrgCodes failed: ${readAfterDelete.error}`);
    assert.ok(
      !JSON.stringify(readAfterDelete).includes(orgseq),
      "org still present after DeleteOrg teardown"
    );
  }
});

itLab("Address CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  let addseq = null;
  try {
    const add = await svc.execute("AddAddress", {
      addr1: "123 ZZ-APITEST St",
      city: "Portland",
      state: "OR",
      pcode: "97201",
    });
    assert.ok(!add.error, `AddAddress failed: ${add.error}`);
    addseq = extractSeq(add, "addseq");
    assert.ok(addseq, "no addseq returned; refusing to delete anything");
    reg.track("DeleteAddress", { addseq });

    const read = await svc.execute("GetAllAddresses");
    assert.ok(!read.error, `GetAllAddresses failed: ${read.error}`);
    assert.ok(JSON.stringify(read).includes(addseq), "new address not found via GetAllAddresses");

    const upd = await svc.execute("UpdateAddress", { addseq, addr1: "456 ZZ-APITEST-UPDATED Ave" });
    assert.ok(!upd.error, `UpdateAddress failed: ${upd.error}`);

    const readAfterUpdate = await svc.execute("GetAllAddresses");
    assert.ok(
      JSON.stringify(readAfterUpdate).includes("ZZ-APITEST-UPDATED"),
      "updated address line 1 not visible via GetAllAddresses"
    );
  } finally {
    await reg.teardown(svc);
  }

  if (addseq) {
    const readAfterDelete = await svc.execute("GetAllAddresses");
    assert.ok(!readAfterDelete.error, `GetAllAddresses failed: ${readAfterDelete.error}`);
    assert.ok(
      !JSON.stringify(readAfterDelete).includes(addseq),
      "address still present after DeleteAddress teardown"
    );
  }
});

// IudOrg / IudProfileSpecialty (datafeed_api_pkg.iud_org / iud_profile_specialty):
// both require a `SourceSystem` value that is pre-registered/whitelisted on
// the Amcom server; there is no RPC in amcomapi.xml that lists valid source
// system names. Every attempt below returns a clean business error —
// `Invalid source system name [<value>]` — for a wide set of plausible
// values (HR, TEST, OHSU, SPOK, API, DATAFEED, WEB, MANUAL, ADMIN), confirming
// the CLI wiring (param names/order) is correct but that the server rejects
// the call before performing any write. Per the "never invent" rule, we do
// not guess a real value. IudProfileSpecialty additionally requires a
// `UniqueID` identifying an *existing* profile (datafeed feed id) to attach a
// specialty to — not a value we can safely fabricate on a shared lab DB.
// `datafeed org` / `datafeed specialty` CLI commands are wired and ready;
// exercising them live requires an OHSU-provided SourceSystem value.
test.skip(
  "IudOrg insert/delete: no valid SourceSystem discoverable in amcomapi.xml or lab docs " +
    "(server returns 'Invalid source system name' for every plausible value tried)",
  () => {}
);
test.skip(
  "IudProfileSpecialty insert/delete: same undiscoverable SourceSystem requirement as IudOrg, " +
    "plus needs an existing profile UniqueID (feed id) we cannot safely fabricate",
  () => {}
);
