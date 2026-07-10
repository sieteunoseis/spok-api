"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 15: Listings/people writes -----------------------------------------
// All records created by this file are marked "ZZ-APITEST-..." so any stray
// leftover is obviously ours. The lid is server-assigned by AddPerson and
// captured via extractSeq() before any other write is attempted; if that
// capture ever returns null the test fails loudly instead of guessing an id.
// DeletePerson is both the last RPC under test AND the teardown for the
// listing itself — CreatedRegistry tracks it immediately after AddPerson
// succeeds so it still runs (as a backstop) even if a step before the
// explicit DeletePerson call throws.
//
// Param-format discoveries (live-verified against the lab, not guessed):
// - `SetListingEnabled` has THREE required (`nullable="false"`) IN params —
//   `lid`, `module`, `eflag` — per amcomapi.xml. The pre-existing
//   `SpokService#setListingEnabled(lid, eflag)` wrapper in src/index.ts was
//   missing `module` entirely (a wire-level bug: the call would have sent
//   `undefined` for a required param). Fixed to
//   `setListingEnabled(lid, module, eflag)` sending all three; dist/
//   rebuilt. The CLI's `set listing-enabled <lid>` command was written
//   correctly from the start (both --module and --flag are requiredOption).
// - Valid `module` values are full product names stored in the DB (not
//   codes) — e.g. "SMART CONSOLE", confirmed live via
//   `SetListingEnabled(lid, "SMART CONSOLE", "T")` returning success (empty
//   `data`, no error). This matches the module name convention already
//   documented for SetDirectoryEnabled/Published/TransferAllowed in
//   skills/spok-api-cli/SKILL.md.
// - `UpdateMessagingId`'s `mid` is `nullable="true"`, but there is no RPC to
//   discover an unused mid to assign without guessing. Instead this test
//   calls the already-wired `AssignMessagingId(lid)` first, which lets the
//   server pick and return a fresh, guaranteed-unused mid for our own
//   throwaway lid (captured via extractSeq). `UpdateMessagingId(lid, mid)`
//   is then exercised by re-asserting that same server-issued mid — this
//   proves the RPC's wiring live without ever inventing a mid value or
//   risking a collision with a real listing. `GetListingInfoByMid(mid)` is
//   used as the read-back/guard, confirming the mid resolves back to our own
//   lid before UpdateMessagingId is called (mirroring the on-call mid guard
//   pattern from Task 12).
// - `AssignRole(lid, role)` requires a `role` value validated against a
//   server-side role table with NO discovery RPC anywhere in amcomapi.xml
//   (no `GetRoles`/`GetRoleCodes`/similar exists). Live-probed against our
//   own throwaway lid with several plausible values ("USER", "ADMIN", and an
//   obviously-bogus string) — all three return the identical, well-formed
//   business error `<code>25005</code><description>This function requires
//   that a valid role be passed as a parameter. <value> is not a valid
//   role.</description>`, proving the RPC's param wiring (`lid`/`role`) is
//   correct while confirming no guessable value is safe to assume. Per the
//   brief's "never invent" rule, this step is `it.skip`'d rather than
//   asserted against a fabricated role name.
// - `AssignMessagePriorities(lid, min_mprior, max_mprior)` and
//   `AssignGroupLimits(lid, max_mgroups, max_mgroup_mbrs)` both live-verified
//   as accepting `NUMBER` values with no further server-side validation
//   observed for small positive integers (1/5 and 5/10 respectively) —
//   both return success (empty `data`, no error) against the throwaway lid.

itLab("Person/listing CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  let lid = null;
  let mid = null;

  try {
    // -- AddPerson (throwaway listing) --------------------------------------
    const add = await svc.execute("AddPerson", {
      lname: "ZZ-APITEST-PERSON",
      fname: "Probe",
    });
    assert.ok(!add.error, `AddPerson failed: ${add.error}`);
    lid = extractSeq(add, "lid");
    assert.ok(lid, "no lid returned; refusing to proceed with any write");
    // Track DeletePerson immediately so it still runs as a teardown backstop
    // even if a later step in this try{} throws before the explicit
    // DeletePerson call below is reached.
    reg.track("DeletePerson", { lid });

    const readAfterAdd = await svc.execute("GetListingInfo", { lid });
    assert.ok(!readAfterAdd.error, `GetListingInfo failed: ${readAfterAdd.error}`);
    assert.ok(
      JSON.stringify(readAfterAdd).includes("ZZ-APITEST-PERSON"),
      "new listing not found via GetListingInfo"
    );

    // -- SetListingEnabled ---------------------------------------------------
    const setEnabled = await svc.execute("SetListingEnabled", {
      lid, module: "SMART CONSOLE", eflag: "T",
    });
    assert.ok(!setEnabled.error, `SetListingEnabled failed: ${setEnabled.error}`);

    // -- AssignMessagingId (to obtain a server-issued mid, never guessed) --
    const assignMid = await svc.execute("AssignMessagingId", { lid });
    assert.ok(!assignMid.error, `AssignMessagingId failed: ${assignMid.error}`);
    mid = extractSeq(assignMid, "mid");
    assert.ok(mid, "no mid returned by AssignMessagingId; refusing to guess one for UpdateMessagingId");

    // SAFETY guard: confirm the mid resolves back to our own throwaway lid
    // before using it as the UpdateMessagingId payload.
    const byMid = await svc.execute("GetListingInfoByMid", { mid });
    assert.ok(!byMid.error, `GetListingInfoByMid failed: ${byMid.error}`);
    assert.ok(
      JSON.stringify(byMid).includes(lid),
      `mid ${mid} did not resolve back to our own lid ${lid}; refusing to proceed`
    );

    // -- UpdateMessagingId (re-asserting our own server-issued mid) --------
    const updMid = await svc.execute("UpdateMessagingId", { lid, mid });
    assert.ok(!updMid.error, `UpdateMessagingId failed: ${updMid.error}`);

    // -- AssignMessagePriorities ---------------------------------------------
    const prio = await svc.execute("AssignMessagePriorities", {
      lid, min_mprior: "1", max_mprior: "5",
    });
    assert.ok(!prio.error, `AssignMessagePriorities failed: ${prio.error}`);

    // -- AssignGroupLimits -----------------------------------------------------
    const limits = await svc.execute("AssignGroupLimits", {
      lid, max_mgroups: "5", max_mgroup_mbrs: "10",
    });
    assert.ok(!limits.error, `AssignGroupLimits failed: ${limits.error}`);

    // -- Read-back: confirm the listing still resolves cleanly after all
    //    the writes above, before deleting it.
    const readAfterWrites = await svc.execute("GetListingInfo", { lid });
    assert.ok(!readAfterWrites.error, `GetListingInfo (post-writes) failed: ${readAfterWrites.error}`);
    assert.ok(
      JSON.stringify(readAfterWrites).includes(mid),
      "updated mid not visible via GetListingInfo after UpdateMessagingId"
    );

    // -- DeletePerson (final RPC under test, also the cleanup) --------------
    const del = await svc.execute("DeletePerson", { lid });
    assert.ok(!del.error, `DeletePerson failed: ${del.error}`);

    // Confirm the delete actually removed the listing.
    const readAfterDelete = await svc.execute("GetListingInfo", { lid });
    assert.ok(
      readAfterDelete.error,
      "listing still resolves via GetListingInfo after DeletePerson"
    );
  } finally {
    // Backstop only: if the explicit DeletePerson above already ran, this is
    // a harmless best-effort no-op (the listing is already gone).
    await reg.teardown(svc);
  }
});

// AssignRole(lid, role): live-probed against our own throwaway lid with
// "USER", "ADMIN", and a bogus string — every value returns the identical
// clean business error `<code>25005</code>...is not a valid role.`,
// confirming param wiring (lid/role both reach the server) but revealing no
// discoverable valid role anywhere in amcomapi.xml (no GetRoles/GetRoleCodes
// RPC exists). Per the brief's "never invent" rule, this is documented and
// skipped rather than asserted against a fabricated role name.
test.skip(
  "AssignRole: no valid role value discoverable in amcomapi.xml (no GetRoles/GetRoleCodes RPC exists); " +
    "live probe against a throwaway lid with \"USER\"/\"ADMIN\"/a bogus string all return the identical " +
    "clean business error `25005: <value> is not a valid role`, confirming correct param wiring without a guessable value",
  () => {}
);
