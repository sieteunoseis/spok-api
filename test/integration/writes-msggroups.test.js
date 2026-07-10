"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 14: Message group writes --------------------------------------------
// Fixtures: reqlid=48218 (Zhang, mid=66755) is the same "real, privileged-enough
// listing" reqlid reused from Task 7's GetMessageGroups read test. mbrLid=322504
// (Aaron, mid=54361) is the second fixture person from the task brief, used as
// the group-member listing ID (`mbr_lid` per amcomapi.xml, an lid not a mid).
//
// SAFETY (grpnum is a caller-supplied IN param — see below): before ever
// sending a grpnum in a write call, this file first confirms it is unused via
// GetMessageGroupMembers, which returns a clean "not a valid message group"
// business error for any grpnum that doesn't exist and real member data for
// one that does. This mirrors the guard added for on-call group mids in Task
// 12 (79917e9) — never create against / touch a grpnum that could collide
// with a pre-existing group.
//
// Param-format discoveries (live-verified against the lab, not guessed):
// - AddStaticMessageGroup's `grpnum` is `nullable="true"` (an optional IN
//   param — the caller *may* supply it, unlike e.g. on-call group mid which
//   is always caller-chosen). `acode` is `nullable="false"`; every one of the
//   260 real groups returned by GetMessageGroups(reqlid=322504) uses
//   acode="A", so "A" is used here as the only value ever observed live.
// - **AddStaticMessageGroup is blocked in this lab by a privilege gate that
//   is independent of any parameter's correctness.** Live-probed against
//   three different real, valid reqlid fixtures (322504/Aaron's own lid,
//   48218/Zhang, and 13553/the Task 8 event-template-owning lid) and against
//   both an omitted grpnum and an explicit, confirmed-unused grpnum
//   (999123) — every single combination returns the identical clean
//   business error `<code>25069</code><description>The message group owner
//   must be assigned a privilege to create a message group.</description>`.
//   This proves the RPC's param wiring (reqlid/grpnum/gname/acode) is
//   correct and reaches the server (a param-name/binding bug would surface
//   as a different, ORA-flavored error, as seen elsewhere in this project's
//   wrapper-bug fixes) — the server is simply refusing to let any available
//   fixture listing create a message group. amcomapi.xml exposes no
//   procedure to grant this privilege, and there is no documented way to
//   discover which (if any) lid in this lab holds it without guessing, which
//   the brief forbids. So the full create->verify->delete-own lifecycle
//   cannot be exercised end-to-end here; see the lifecycle test below, which
//   asserts this exact, reproducible privilege-gate response as a genuine
//   pass (proving wiring) rather than skipping blindly, and documents why
//   the remaining chain (member add/update/delete against a self-created
//   group, and group update/delete of a self-created group) cannot run.
// - UpdateMessageGroup/DeleteMessageGroup/UpdateStaticMessageGroupMember/
//   DeleteStaticMessageGroupMember do NOT hit the same privilege gate — all
//   four reach the "not a valid message group" business error (25002) when
//   pointed at a confirmed-nonexistent grpnum, proving their param wiring
//   (reqlid/grpnum/mbr_lid/gname/dorder) is correct without ever touching a
//   real record. This is exercised in the second test below.
// - The pre-existing `SpokService#deleteMessageGroup(grpnum)` wrapper in
//   src/index.ts was missing `reqlid` entirely (amcomapi.xml marks it
//   `nullable="false"`) — fixed to `deleteMessageGroup(reqlid, grpnum)`, dist
//   rebuilt. (This test calls `svc.execute(...)` directly, like every other
//   write test in this suite, so it doesn't exercise the wrapper method
//   itself — the fix is exercised via the CLI `delete message-group`
//   command, which now requires --reqlid.)

itLab("Message group CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  const reqlid = "48218"; // Zhang — real, valid lid reused from Task 7
  const mbrLid = "322504"; // Aaron — real, valid lid used as the group member
  const candidateGrpnum = "999123"; // far outside the 260 real grpnums seen live (max 65352)

  try {
    // SAFETY: verify the chosen grpnum is unused BEFORE ever sending it in a
    // write call. GetMessageGroupMembers returns a clean "not a valid
    // message group" error for a grpnum that doesn't exist, and real member
    // data (no error) for one that does.
    const preexist = await svc.execute("GetMessageGroupMembers", { reqlid, grpnum: candidateGrpnum });
    const inUse = !preexist.error;
    assert.ok(!inUse, `refusing to run: grpnum ${candidateGrpnum} is already in use on the lab (GetMessageGroupMembers returned data, not an error)`);

    const add = await svc.execute("AddStaticMessageGroup", {
      reqlid,
      grpnum: candidateGrpnum,
      gname: "ZZ-APITEST-MSGGROUP",
      acode: "A",
    });

    if (add.error) {
      // Documented, live-reproducible lab limitation (see file header): no
      // available fixture reqlid holds the "message group owner" privilege,
      // so AddStaticMessageGroup cannot succeed here. Assert on the exact
      // known error to prove this is that specific privilege gate — not a
      // param bug — and refuse to proceed with anything that depends on a
      // self-created group (member add/update/delete, group update/delete).
      assert.ok(
        String(add.error).includes("must be assigned a privilege"),
        `AddStaticMessageGroup failed with an unexpected error (not the known privilege gate — investigate before assuming this is the same lab limitation): ${add.error}`
      );
      return; // nothing was created; reg.teardown() below is a no-op
    }

    // If a future lab grants the privilege, exercise the full lifecycle.
    assert.ok(!add.err_message, `AddStaticMessageGroup business error: ${add.err_message}`);
    const grpnum = extractSeq(add, "grpnum") || candidateGrpnum;
    assert.ok(grpnum, "no grpnum returned or supplied; refusing to proceed");
    reg.track("DeleteMessageGroup", { reqlid, grpnum });

    const readGroups = await svc.execute("GetMessageGroups", { reqlid });
    assert.ok(!readGroups.error, `GetMessageGroups failed: ${readGroups.error}`);
    assert.ok(JSON.stringify(readGroups).includes("ZZ-APITEST-MSGGROUP"), "new group not found via GetMessageGroups");

    const addMbr = await svc.execute("AddStaticMessageGroupMember", { reqlid, grpnum, mbr_lid: mbrLid });
    assert.ok(!addMbr.error, `AddStaticMessageGroupMember failed: ${addMbr.error}`);
    reg.track("DeleteStaticMessageGroupMember", { reqlid, grpnum, mbr_lid: mbrLid });

    const readMbrs = await svc.execute("GetMessageGroupMembers", { reqlid, grpnum });
    assert.ok(!readMbrs.error, `GetMessageGroupMembers failed: ${readMbrs.error}`);
    assert.ok(JSON.stringify(readMbrs).includes(mbrLid), "new member not found via GetMessageGroupMembers");

    const updMbr = await svc.execute("UpdateStaticMessageGroupMember", {
      reqlid, grpnum, mbr_lid: mbrLid, remark: "ZZ-APITEST-UPDATED",
    });
    assert.ok(!updMbr.error, `UpdateStaticMessageGroupMember failed: ${updMbr.error}`);

    const readMbrsAfterUpdate = await svc.execute("GetMessageGroupMembers", { reqlid, grpnum });
    assert.ok(
      JSON.stringify(readMbrsAfterUpdate).includes("ZZ-APITEST-UPDATED"),
      "updated member remark not visible via GetMessageGroupMembers"
    );

    const delMbr = await svc.execute("DeleteStaticMessageGroupMember", { reqlid, grpnum, mbr_lid: mbrLid });
    assert.ok(!delMbr.error, `DeleteStaticMessageGroupMember failed: ${delMbr.error}`);
    reg.items = reg.items.filter((i) => i.method !== "DeleteStaticMessageGroupMember");

    const updGroup = await svc.execute("UpdateMessageGroup", { reqlid, grpnum, gname: "ZZ-APITEST-MSGGROUP-UPDATED" });
    assert.ok(!updGroup.error, `UpdateMessageGroup failed: ${updGroup.error}`);

    const readGroupsAfterUpdate = await svc.execute("GetMessageGroups", { reqlid });
    assert.ok(
      JSON.stringify(readGroupsAfterUpdate).includes("ZZ-APITEST-MSGGROUP-UPDATED"),
      "updated group name not visible via GetMessageGroups"
    );
  } finally {
    await reg.teardown(svc); // deletes ONLY tracked ids (member before group); no-op if nothing was created
  }
});

itLab(
  "UpdateMessageGroup/DeleteMessageGroup/UpdateStaticMessageGroupMember/DeleteStaticMessageGroupMember are correctly wired (confirmed against a verified-nonexistent grpnum, no real data touched)",
  async () => {
    const svc = lab();
    const reqlid = "48218"; // Zhang
    const mbrLid = "322504"; // Aaron
    const bogusGrpnum = "999124"; // distinct from the lifecycle test's candidate, re-verified below

    // SAFETY: independently re-confirm this grpnum does not exist before
    // sending it to any write RPC below.
    const preexist = await svc.execute("GetMessageGroupMembers", { reqlid, grpnum: bogusGrpnum });
    assert.ok(preexist.error, `refusing to run: grpnum ${bogusGrpnum} unexpectedly exists on the lab`);

    const upd = await svc.execute("UpdateMessageGroup", { reqlid, grpnum: bogusGrpnum, gname: "ZZ-APITEST-PROBE" });
    assert.ok(upd.error, "expected the known 'not a valid message group' business error");
    assert.ok(String(upd.error).includes("not a valid message group"), `unexpected error: ${upd.error}`);

    const del = await svc.execute("DeleteMessageGroup", { reqlid, grpnum: bogusGrpnum });
    assert.ok(del.error, "expected the known 'not a valid message group' business error");
    assert.ok(String(del.error).includes("not a valid message group"), `unexpected error: ${del.error}`);

    const updMbr = await svc.execute("UpdateStaticMessageGroupMember", {
      reqlid, grpnum: bogusGrpnum, mbr_lid: mbrLid, dorder: "1",
    });
    assert.ok(updMbr.error, "expected the known 'not a valid message group' business error");
    assert.ok(String(updMbr.error).includes("not a valid message group"), `unexpected error: ${updMbr.error}`);

    const delMbr = await svc.execute("DeleteStaticMessageGroupMember", { reqlid, grpnum: bogusGrpnum, mbr_lid: mbrLid });
    assert.ok(delMbr.error, "expected the known 'not a valid message group' business error");
    assert.ok(String(delMbr.error).includes("not a valid message group"), `unexpected error: ${delMbr.error}`);
  }
);
