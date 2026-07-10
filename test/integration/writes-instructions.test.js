"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 17: Listing-instruction writes --------------------------------------
// All records created by this file are marked "ZZ-APITEST-..." so any stray
// leftover is obviously ours. Two throwaway listings are created: lidA owns
// the instruction under test; lidB is the ShareListingInstruction target (a
// second self-created throwaway listing, never a pre-existing real one, per
// the safety brief). Every id is captured via extractSeq()/the raw response
// before any write depending on it is attempted; a null capture fails the
// test loudly instead of guessing.
//
// Param-format discoveries (live-verified against the lab, not guessed):
// - AddListingInstruction's declared OUT param in amcomapi.xml is `response`
//   (a VARCHAR2 "message"), not a literal `seqnum` field -- but live, the
//   client parses that response into `{ response: { seqnum: "<n>" } }`, so
//   extractSeq(add, "seqnum") finds it correctly with no guessing required.
// - ShareListingInstruction's target-listing param is literally named `lid`
//   in amcomapi.xml -- the SAME parameter name used for the owning listing
//   elsewhere in this instruction family. There is no separate `target_lid`
//   parameter. The pre-existing `SpokService#shareListingInstruction(seqnum,
//   targetLid)` wrapper in src/index.ts was sending `target_lid` (wrong wire
//   name -- confirmed against the XML and reproduced live before the fix);
//   corrected to send `lid`, dist rebuilt.
// - DeleteListingInstruction(seqnum, lid) unassigns the instruction from
//   ONLY the given lid, not globally: confirmed live -- after deleting from
//   lidA, GetListingInstructions(lidA) returns the clean business error "No
//   listing instructions found", while GetListingInstructions(lidB) still
//   shows the same instruction (the share to lidB is a separate assignment
//   row). DeletePerson on a listing that still holds a shared instruction
//   assignment succeeds live with no error (server-side cascade), so no
//   extra unshare step is required before the teardown DeletePerson(lidB)
//   call.

itLab("Listing instruction CRUD + share lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();

  try {
    // -- AddPerson (throwaway owning listing, "A") ----------------------------
    const addA = await svc.execute("AddPerson", { lname: "ZZ-APITEST-INSTR-A", fname: "Probe" });
    assert.ok(!addA.error, `AddPerson (A) failed: ${addA.error}`);
    const lidA = extractSeq(addA, "lid");
    assert.ok(lidA, "no lid returned for listing A; refusing to proceed with any write");
    reg.track("DeletePerson", { lid: lidA });

    // -- AddListingInstruction -------------------------------------------------
    const add = await svc.execute("AddListingInstruction", {
      lid: lidA,
      itext: "ZZ-APITEST-INSTR-TEXT",
    });
    assert.ok(!add.error, `AddListingInstruction failed: ${add.error}`);
    const seqnum = extractSeq(add, "seqnum");
    assert.ok(seqnum, "no seqnum returned; refusing to update/share/delete anything");
    reg.track("DeleteListingInstruction", { seqnum, lid: lidA });

    // -- Confirm via GetListingInstructions -------------------------------------
    const readAfterAdd = await svc.execute("GetListingInstructions", { lid: lidA });
    assert.ok(!readAfterAdd.error, `GetListingInstructions (A, after add) failed: ${readAfterAdd.error}`);
    assert.ok(
      JSON.stringify(readAfterAdd).includes(seqnum) &&
        JSON.stringify(readAfterAdd).includes("ZZ-APITEST-INSTR-TEXT"),
      "new instruction not found via GetListingInstructions"
    );

    // -- UpdateListingInstruction ------------------------------------------------
    const upd = await svc.execute("UpdateListingInstruction", {
      lid: lidA,
      seqnum,
      itext: "ZZ-APITEST-INSTR-TEXT-UPDATED",
    });
    assert.ok(!upd.error, `UpdateListingInstruction failed: ${upd.error}`);

    const readAfterUpdate = await svc.execute("GetListingInstructions", { lid: lidA });
    assert.ok(!readAfterUpdate.error, `GetListingInstructions (A, after update) failed: ${readAfterUpdate.error}`);
    assert.ok(
      JSON.stringify(readAfterUpdate).includes("ZZ-APITEST-INSTR-TEXT-UPDATED"),
      "updated instruction text not visible via GetListingInstructions"
    );

    // -- AddPerson (throwaway share-target listing, "B") ------------------------
    const addB = await svc.execute("AddPerson", { lname: "ZZ-APITEST-INSTR-B", fname: "Probe" });
    assert.ok(!addB.error, `AddPerson (B) failed: ${addB.error}`);
    const lidB = extractSeq(addB, "lid");
    assert.ok(lidB, "no lid returned for listing B; refusing to share to anything");
    reg.track("DeletePerson", { lid: lidB });

    // -- ShareListingInstruction (target param is `lid`, not `target_lid`) -----
    const share = await svc.execute("ShareListingInstruction", { seqnum, lid: lidB });
    assert.ok(!share.error, `ShareListingInstruction failed: ${share.error}`);

    // -- Confirm the share landed on lidB -----------------------------------------
    const readB = await svc.execute("GetListingInstructions", { lid: lidB });
    assert.ok(!readB.error, `GetListingInstructions (B, after share) failed: ${readB.error}`);
    assert.ok(
      JSON.stringify(readB).includes(seqnum) &&
        JSON.stringify(readB).includes("ZZ-APITEST-INSTR-TEXT-UPDATED"),
      "shared instruction not found via GetListingInstructions on the target listing"
    );

    // -- DeleteListingInstruction (final RPC under test; unassigns from lidA only)
    const del = await svc.execute("DeleteListingInstruction", { seqnum, lid: lidA });
    assert.ok(!del.error, `DeleteListingInstruction failed: ${del.error}`);
    // Already run explicitly above; the tracked registry entry is now a
    // harmless best-effort backstop only, so drop it to avoid a redundant
    // (though non-fatal) second call in teardown.
    reg.items = reg.items.filter((i) => i.method !== "DeleteListingInstruction");

    // Confirm the delete actually unassigned the instruction from lidA...
    const readAafterDelete = await svc.execute("GetListingInstructions", { lid: lidA });
    assert.ok(
      readAafterDelete.error,
      "instruction still resolves via GetListingInstructions(lidA) after DeleteListingInstruction"
    );

    // ...while the separate share assignment on lidB is untouched (per-lid
    // unassign semantics, confirmed live -- see file header).
    const readBafterDelete = await svc.execute("GetListingInstructions", { lid: lidB });
    assert.ok(!readBafterDelete.error, `GetListingInstructions (B, after delete-from-A) failed: ${readBafterDelete.error}`);
    assert.ok(
      JSON.stringify(readBafterDelete).includes(seqnum),
      "shared instruction unexpectedly removed from lidB by DeleteListingInstruction(lidA)"
    );
  } finally {
    // Deletes ONLY tracked ids, in LIFO order: DeletePerson(lidB) then
    // DeletePerson(lidA). The instruction assignment on lidA was already
    // explicitly deleted above (removed from the registry); DeletePerson
    // cascades away the remaining lidB share assignment (confirmed live --
    // no error). No pre-existing records are touched by this file.
    await reg.teardown(svc);
  }
});
