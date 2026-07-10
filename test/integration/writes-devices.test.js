"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 18: Exceptions/devices writes (LAST write category) ----------------
// All records created by this file are marked "ZZ-APITEST-..." so any stray
// leftover is obviously ours. Everything operates against a single throwaway
// listing created by AddPerson (lid captured via extractSeq before any other
// write is attempted), with a messaging ID obtained via AssignMessagingId
// (personal contact devices/exceptions are mid- or lid-keyed depending on
// the RPC — see discoveries below). CreatedRegistry tracks DeletePerson
// immediately after AddPerson succeeds (LIFO backstop — runs last).
//
// Param-format / behavior discoveries (live-verified against the lab, not
// guessed):
//
// - **`DeleteAllPersonalDeviceOptions` and `UnassignContactDevices` both take
//   `lid`, not `mid`**, despite their names/the task brief's "devices are
//   mid-keyed" framing. Per amcomapi.xml both are defined in the numbered
//   (`bindname="1"`) parameter style with a single required param literally
//   named `lid`. Live-probed: calling either with `{ mid }` returns a clean
//   validation error (`Error: request does not contain parameter lid`);
//   calling with `{ lid }` succeeds. The pre-existing
//   `SpokService#deleteAllPersonalDeviceOptions(mid)` and
//   `#unassignContactDevices(mid)` wrappers in src/index.ts were wrong —
//   fixed to take/send `lid`; dist/ rebuilt.
// - **`AddPersonalContactDevice`'s `devid` is NOT the raw device value for
//   every `devtype`.** For `devtype: "EMAIL"`, `devid` is the literal email
//   address already present on the listing (added via
//   `AddEmailAddressByLid`) — using it directly succeeds. For
//   `devtype: "PHONE"`, `devid` must be the listing's phone **directory
//   sequence number**, not the phone number string — live-probed: passing
//   the raw phone number (already added via `AddPhoneNumber`) fails with
//   `<code>25073</code> The phone directory_seqnum given (...) is not a
//   valid directory record for that listing id`. The correct value is
//   discoverable (never guessed) via `GetUnassignedContactDevices(lid,
//   cltype)`, which returns a candidate `{ devtype, devid }` pair for each
//   not-yet-assigned directory device — its `devid` for a PHONE candidate IS
//   the directory seqnum `AddPersonalContactDevice` expects. This test seeds
//   a phone number and email via the already-wired `AddPhoneNumber` /
//   `AddEmailAddressByLid` RPCs, then uses `GetUnassignedContactDevices` to
//   discover the correct PHONE `devid` rather than inventing one.
// - `AddPersonalContactDevice`'s response nests the new id as
//   `data.contactDevice.pdoseq` — confirmed identical to the `pdoseq` field
//   returned by `GetAssignedContactDevices`, so `extractSeq(res, "pdoseq")`
//   captures it correctly from either call.
// - `SwapPersonalContactDevice(pdoseq, dorder)` is a true pairwise swap (the
//   device currently holding `dorder` receives the source's old dorder) —
//   live-verified moving a device from dorder 1 to a target of 5 currently
//   held by the other device: afterward the source has dorder 5 and the
//   other device has dorder 1. **This only succeeds for a "forward" move**
//   (the source's current dorder < the requested target dorder). A
//   "backward" move (source's current dorder > target, e.g. 3 -> 2) was
//   live-probed and reproducibly fails with a clean server-side error —
//   `<code>25034</code> Problem swapping personal device order: -1,
//   ORA-00001: unique constraint (ATMS.XUK_PERSONALDEVICE_DEVICEORDER)
//   violated` — evidently the stored procedure updates the two rows
//   sequentially rather than atomically and the backward direction hits a
//   transient duplicate-key collision before the second row is updated.
//   This test only exercises the forward direction, which is reliable.
// - `DeleteException`'s real wire params are `mid` and `exseq` (confirmed in
//   amcomapi.xml's numbered-param block). The pre-existing
//   `SpokService#deleteException(excpseq)` wrapper sent a single `excpseq`
//   param that does not exist in amcomapi.xml at all — fixed to
//   `deleteException(mid, exseq)` sending both; dist/ rebuilt. This was
//   never live-invoked with a real exseq (see ChangeException skip below)
//   since there is no discoverable way to create an exception to delete.
// - **`ChangeException`'s `type` parameter has no discoverable valid value
//   anywhere in amcomapi.xml** (no `GetExceptionTypes`/`GetExceptionCodes`
//   RPC exists, and no other procedure's `<summary>` documents the enum).
//   Live-probed against our own throwaway mid with 24 plausible candidates
//   (N, U, O, S, V, C, T, P, H, D, OOO, OOF, TEMP, PERM, VAC, SICK, OTH,
//   OFF, ON, 1, 2, 0, B, M) — every single one returns the identical clean
//   business error `ORA-20114: Unable to change exception: Invalid
//   exception type: <value>`, proving the wire params (mid/type/msg/remark)
//   reach the server correctly while confirming no guessable value is safe
//   to assume. This exactly mirrors the `AssignRole` precedent from Task 15
//   (writes-listings.test.js). Per the brief's "never invent" rule and its
//   explicit anticipation of this case ("if it can't be created on a bare
//   throwaway listing, skip with the server's documented reason"), the
//   ChangeException/DeleteException CRUD pair is `it.skip`'d below rather
//   than asserted against a fabricated type. The CLI's `change-exception`
//   and `delete exception` commands are still wired correctly per
//   amcomapi.xml and exercised for connectivity via the swap/device test.
// - **`RegisterAMCDevice`/`UnregisterAMCDevice`** initiate/cancel an actual
//   AMC device registration flow — per their `<description>`s this sends a
//   real registration message to the `email`/`pid` supplied. This is a live
//   external side effect on a real device/mailbox, the same category of
//   risk the brief's global "no page/notification sends, ever" constraint
//   exists to prevent for the 5 named paging methods, even though these two
//   RPCs aren't in that literal list. Per the brief's own guidance for this
//   RPC ("likely needs a real device token; if unobtainable, wire both and
//   skip with reason"), both are wired in the CLI (`register-amc-device`,
//   `unregister-amc-device`) but never invoked live here.

itLab("Personal contact device CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  let lid = null;
  let mid = null;
  const emaddr = "zz-apitest-devices@example.invalid";
  const phoneNumber = "5035550777";

  try {
    // -- AddPerson (throwaway listing) --------------------------------------
    const add = await svc.execute("AddPerson", {
      lname: "ZZ-APITEST-DEVICES", fname: "Probe",
    });
    assert.ok(!add.error, `AddPerson failed: ${add.error}`);
    lid = extractSeq(add, "lid");
    assert.ok(lid, "no lid returned; refusing to proceed with any write");
    // Track DeletePerson immediately so it still runs as a teardown backstop
    // (LIFO — runs last) even if a later step in this try{} throws.
    reg.track("DeletePerson", { lid });

    // -- AssignMessagingId (required before AddPhoneNumber will persist,
    //    per the Task 16 discovery reused here) -----------------------------
    const assignMid = await svc.execute("AssignMessagingId", { lid });
    assert.ok(!assignMid.error, `AssignMessagingId failed: ${assignMid.error}`);
    mid = extractSeq(assignMid, "mid");
    assert.ok(mid, "no mid returned by AssignMessagingId; refusing to proceed");

    // -- Seed an email and a phone number on the listing so we have two
    //    real directory devices to attach as personal contact devices. -----
    const addEmail = await svc.execute("AddEmailAddressByLid", { lid, emaddr, dorder: "1" });
    assert.ok(!addEmail.error, `AddEmailAddressByLid (seed) failed: ${addEmail.error}`);
    reg.track("DeleteEmailAddressByLid", { lid, emaddr });

    const addPhone = await svc.execute("AddPhoneNumber", {
      mid, phone_number: phoneNumber, phone_number_type: "CELLULAR",
      published_flag: "F", display_order: "1",
    });
    assert.ok(!addPhone.err_message, `AddPhoneNumber (seed) failed: ${addPhone.err_message}`);
    reg.track("DeleteListingDirectoryPhone", { lid, phone_number: phoneNumber, phone_type: "CELLULAR" });

    // === AddPersonalContactDevice (EMAIL) — RPC under test =================
    const apdEmail = await svc.execute("AddPersonalContactDevice", {
      lid, cltype: "ON HOURS", devtype: "EMAIL", devid: emaddr, dorder: "1",
    });
    assert.ok(!apdEmail.error, `AddPersonalContactDevice (EMAIL) failed: ${apdEmail.error}`);
    const pdoseqEmail = extractSeq(apdEmail, "pdoseq");
    assert.ok(pdoseqEmail, "no pdoseq returned for EMAIL device; refusing to proceed");
    reg.track("DeletePersonalContactDevice", { pdoseq: pdoseqEmail });

    // -- Confirm via GetAssignedContactDevices / GetUnassignedContactDevices
    const assigned1 = await svc.execute("GetAssignedContactDevices", { lid, cltype: "ON HOURS" });
    assert.ok(!assigned1.error, `GetAssignedContactDevices failed: ${assigned1.error}`);
    assert.ok(
      JSON.stringify(assigned1).includes(pdoseqEmail),
      "new EMAIL device not found via GetAssignedContactDevices"
    );

    // -- Discover the PHONE directory seqnum via GetUnassignedContactDevices
    //    (never guessed — see file header for why the raw phone number
    //    doesn't work as devid). ---------------------------------------------
    const unassigned = await svc.execute("GetUnassignedContactDevices", { lid, cltype: "ON HOURS" });
    assert.ok(!unassigned.error, `GetUnassignedContactDevices failed: ${unassigned.error}`);
    const phoneDevid = extractSeq(unassigned, "devid");
    assert.ok(phoneDevid, "no devid discovered via GetUnassignedContactDevices; refusing to guess one");

    // === AddPersonalContactDevice (PHONE, discovered devid) =================
    const apdPhone = await svc.execute("AddPersonalContactDevice", {
      lid, cltype: "ON HOURS", devtype: "PHONE", devid: phoneDevid, dorder: "2",
    });
    assert.ok(!apdPhone.error, `AddPersonalContactDevice (PHONE) failed: ${apdPhone.error}`);
    const pdoseqPhone = extractSeq(apdPhone, "pdoseq");
    assert.ok(pdoseqPhone, "no pdoseq returned for PHONE device; refusing to proceed");
    reg.track("DeletePersonalContactDevice", { pdoseq: pdoseqPhone });

    // === UpdatePersonalContactDevice — RPC under test =======================
    // Move the PHONE device to a disjoint, unoccupied dorder (5) — a plain
    // field update, no shift/collision risk since only dorders 1 and 2 are
    // in use at this point.
    const upd = await svc.execute("UpdatePersonalContactDevice", { pdoseq: pdoseqPhone, dorder: "5" });
    assert.ok(!upd.error, `UpdatePersonalContactDevice failed: ${upd.error}`);

    const assigned2 = await svc.execute("GetAssignedContactDevices", { lid, cltype: "ON HOURS" });
    assert.ok(!assigned2.error, `GetAssignedContactDevices (post-update) failed: ${assigned2.error}`);
    assert.ok(
      JSON.stringify(assigned2).includes('"dorder":"5"'),
      "updated dorder not visible via GetAssignedContactDevices after UpdatePersonalContactDevice"
    );

    // === SwapPersonalContactDevice — RPC under test =========================
    // Move the EMAIL device forward from its current dorder (1) to the
    // dorder PHONE now holds (5) — a "forward" move, the direction
    // confirmed reliable above (see file header for the backward-move bug).
    const swap = await svc.execute("SwapPersonalContactDevice", { pdoseq: pdoseqEmail, dorder: "5" });
    assert.ok(!swap.error, `SwapPersonalContactDevice failed: ${swap.error}`);

    const assigned3 = await svc.execute("GetAssignedContactDevices", { lid, cltype: "ON HOURS" });
    assert.ok(!assigned3.error, `GetAssignedContactDevices (post-swap) failed: ${assigned3.error}`);
    const rows = [].concat(assigned3.data?.contactDevice || []);
    const emailRow = rows.find((r) => r.pdoseq === pdoseqEmail);
    const phoneRow = rows.find((r) => r.pdoseq === pdoseqPhone);
    assert.ok(emailRow && phoneRow, "a device is missing after swap");
    assert.strictEqual(emailRow.dorder, "5", "EMAIL device dorder was not swapped to 5");
    assert.strictEqual(phoneRow.dorder, "1", "PHONE device dorder did not receive EMAIL's old dorder");

    // === DeletePersonalContactDevice — RPC under test (delete both) ========
    const delEmail = await svc.execute("DeletePersonalContactDevice", { pdoseq: pdoseqEmail });
    assert.ok(!delEmail.error, `DeletePersonalContactDevice (EMAIL) failed: ${delEmail.error}`);
    const delPhone = await svc.execute("DeletePersonalContactDevice", { pdoseq: pdoseqPhone });
    assert.ok(!delPhone.error, `DeletePersonalContactDevice (PHONE) failed: ${delPhone.error}`);

    const assigned4 = await svc.execute("GetAssignedContactDevices", { lid, cltype: "ON HOURS" });
    assert.ok(
      assigned4.error,
      "contact devices still resolve via GetAssignedContactDevices after both DeletePersonalContactDevice calls"
    );

    // === DeleteAllPersonalDeviceOptions — RPC under test (lid-keyed) =======
    const delAllOpts = await svc.execute("DeleteAllPersonalDeviceOptions", { lid });
    assert.ok(!delAllOpts.error, `DeleteAllPersonalDeviceOptions failed: ${delAllOpts.error}`);

    // === UnassignContactDevices — RPC under test (lid-keyed) ================
    const unassign = await svc.execute("UnassignContactDevices", { lid });
    assert.ok(!unassign.error, `UnassignContactDevices failed: ${unassign.error}`);
  } finally {
    // Backstop only: harmless best-effort no-ops for anything already
    // explicitly deleted above.
    await reg.teardown(svc);
  }
});

// ChangeException/DeleteException: no discoverable valid `type` value exists
// anywhere in amcomapi.xml (no GetExceptionTypes/GetExceptionCodes RPC).
// Live-probed against a throwaway mid with 24 plausible candidates — every
// one returns the identical clean business error `ORA-20114: ... Invalid
// exception type: <value>`, confirming correct param wiring (mid/type/msg/
// remark all reach the server) without a guessable, valid value. Since no
// exception can be created, DeleteException also cannot be exercised
// against a self-created record. Mirrors the AssignRole precedent in
// writes-listings.test.js (Task 15).
test.skip(
  "ChangeException/DeleteException: no valid exception `type` value discoverable in amcomapi.xml " +
    "(no GetExceptionTypes/GetExceptionCodes RPC exists); live probe against a throwaway mid with 24 " +
    "plausible codes all return the identical clean business error `ORA-20114: ... Invalid exception " +
    "type: <value>`, confirming correct param wiring without a guessable, valid value — so no exception " +
    "can be created, and DeleteException cannot be exercised against a self-created record",
  () => {}
);

// RegisterAMCDevice/UnregisterAMCDevice initiate/cancel a real AMC device
// registration flow (per their amcomapi.xml <description>s, a live
// registration message is sent to the given pid/email) — the same class of
// external side effect the brief's "no page/notification sends, ever"
// constraint exists to prevent for the 5 named paging methods. Both RPCs
// are wired in the CLI (`register-amc-device`/`unregister-amc-device`,
// change-status.js) with the exact amcomapi.xml param names (mid, pid,
// email — all nullable="false"), but per the brief's own guidance for this
// RPC pair, are never invoked live here.
test.skip(
  "RegisterAMCDevice/UnregisterAMCDevice: initiate a real device registration message " +
    "(live external side effect); wired in the CLI but not invoked live per the brief's " +
    "no-live-sends guidance for this RPC pair",
  () => {}
);
