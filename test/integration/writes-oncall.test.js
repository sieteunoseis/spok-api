"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 12: On-call writes --------------------------------------------------
// All records created by this file are marked "ZZ-APITEST-..." so any stray
// leftover is obviously ours. Every create is verified successful (checking
// both `res.error` — a top-level protocol failure — AND `res.err_message`,
// since these procedures return retval/err_message OUT params inside the
// <success> branch even on a *business* failure; retval itself is stripped
// by the parser, so a non-empty err_message is the only success/failure
// signal for Add/Update/Delete on-call calls) before anything is tracked for
// deletion.
//
// Fixture mid: 999999 confirmed UNUSED before use via `get listing 999999`
// (returned "No listing record was found ...") and `get oncall-current
// 999999` (ORA-01403: no data found) — safe to use as our self-created
// on-call group's oncall_mid. Never reuse a pre-existing group's mid (e.g.
// ocmid 18753/18747/18177/18441/18715/99999, all seen in live reads/roles
// output, are real pre-existing lab records and are never touched here).
// Person mids reused from the task brief's fixture pairs: 54361 (Aaron,
// Ruby) for the assignment, 66755 (Zhang) for the group-member test.
//
// Param-format discoveries (live-verified against the lab, not guessed):
// - AddOncallAssignment's `assignment_role` is FK-constrained
//   (ATMS.XFK_ON_CALL_ROLE) to a role that must already exist on the group
//   via AddOncallGroupRole — so the role is created before the assignment
//   and deleted only after the assignment referencing it is gone.
// - AddOncallAssignment's `timezone` is FK-constrained
//   (ATMS.XFK_ONCALL_TIME_ZONE) to a short code (e.g. "PACIFIC"), not an
//   IANA zone string like "America/Los_Angeles" (which the *read* RPCs
//   GetIdsAssignments/GetGroupsCurrentAssignments accept fine — this
//   constraint is specific to the write path).
// - Date format is `DD-MON-YY HH24:MI:SS` (e.g. "01-JAN-25 00:00:00"),
//   matching the format already established for the Task 7 on-call reads.
// - GetGroupsAssignmentsXml (ocmid + ocastart + ocaend + tz) returns a rich
//   per-assignment record (remark, priority, ocrole, aseqnum) and is used
//   here as the read-back check after both AddOncallAssignment and
//   UpdateOncallAssignment.
//
// Teardown order (children before parent, satisfying the assignment→role FK
// too): member, then assignment, then role, then group. CreatedRegistry
// reverses tracked items at teardown time, so items are tracked in the
// opposite order (group, role, assignment, member) as each is created.

itLab("On-call group + assignment + role + member CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  const oncallMid = "999999";
  let groupCreated = false;
  let assignmentSeqnum = null;
  let roleCreated = false;

  try {
    // -- AddOncallGroup ---------------------------------------------------
    const addGroup = await svc.execute("AddOncallGroup", {
      name: "ZZ-APITEST-ONCALL",
      oncall_mid: oncallMid,
    });
    assert.ok(!addGroup.error, `AddOncallGroup failed: ${addGroup.error}`);
    assert.ok(!addGroup.err_message, `AddOncallGroup business error: ${addGroup.err_message}`);
    groupCreated = true;
    // oncall_mid is a caller-supplied key (nullable="false" IN param), not a
    // server-generated id, so there is nothing for extractSeq() to recover —
    // we already know the exact id because we chose it and just confirmed
    // the create succeeded above.
    reg.track("DeleteOncallGroup", { oncall_mid: oncallMid });

    const readGroup = await svc.execute("GetListingInfoByMid", { mid: oncallMid });
    assert.ok(!readGroup.error, `GetListingInfoByMid failed: ${readGroup.error}`);
    assert.ok(
      JSON.stringify(readGroup).includes("ZZ-APITEST-ONCALL"),
      "new on-call group not found via GetListingInfoByMid"
    );

    // -- UpdateOncallGroup --------------------------------------------------
    const updGroup = await svc.execute("UpdateOncallGroup", {
      oncall_mid: oncallMid,
      name: "ZZ-APITEST-ONCALL-UPDATED",
    });
    assert.ok(!updGroup.error, `UpdateOncallGroup failed: ${updGroup.error}`);
    assert.ok(!updGroup.err_message, `UpdateOncallGroup business error: ${updGroup.err_message}`);

    const readGroupAfterUpdate = await svc.execute("GetListingInfoByMid", { mid: oncallMid });
    assert.ok(
      JSON.stringify(readGroupAfterUpdate).includes("ZZ-APITEST-ONCALL-UPDATED"),
      "updated on-call group name not visible via GetListingInfoByMid"
    );

    // -- AddOncallGroupRole (needed before AddOncallAssignment can use it) --
    const addRole = await svc.execute("AddOncallGroupRole", {
      ocmid: oncallMid,
      ocrole: "ZZ-APITEST-ROLE",
    });
    assert.ok(!addRole.error, `AddOncallGroupRole failed: ${addRole.error}`);
    roleCreated = true;
    reg.track("DeleteOncallGroupRole", { ocmid: oncallMid, ocrole: "ZZ-APITEST-ROLE" });

    const readRoles = await svc.execute("GetOncallGroupRoles");
    assert.ok(!readRoles.error, `GetOncallGroupRoles failed: ${readRoles.error}`);
    assert.ok(
      JSON.stringify(readRoles).includes("ZZ-APITEST-ROLE"),
      "new role not found via GetOncallGroupRoles"
    );

    // -- AddOncallAssignment --------------------------------------------------
    const addAssignment = await svc.execute("AddOncallAssignment", {
      group_mid: oncallMid,
      mid: "54361",
      start_date: "01-JAN-25 00:00:00",
      end_date: "31-DEC-26 00:00:00",
      priority: "1",
      timezone: "PACIFIC",
      remark: "ZZ-APITEST",
      assignment_role: "ZZ-APITEST-ROLE",
    });
    assert.ok(!addAssignment.error, `AddOncallAssignment failed: ${addAssignment.error}`);
    assert.ok(!addAssignment.err_message, `AddOncallAssignment business error: ${addAssignment.err_message}`);
    assignmentSeqnum = extractSeq(addAssignment, "assignment_seqnum");
    assert.ok(assignmentSeqnum, "no assignment_seqnum returned; refusing to delete anything");
    reg.track("DeleteOncallAssignment", { assignment_seqnum: assignmentSeqnum });

    const readAssignment = await svc.execute("GetGroupsAssignmentsXml", {
      ocmid: oncallMid,
      ocastart: "01-JAN-25 00:00:00",
      ocaend: "31-DEC-26 00:00:00",
      tz: "PACIFIC",
    });
    assert.ok(!readAssignment.error, `GetGroupsAssignmentsXml failed: ${readAssignment.error}`);
    assert.ok(
      JSON.stringify(readAssignment).includes(assignmentSeqnum),
      "new assignment not found via GetGroupsAssignmentsXml"
    );

    // -- UpdateOncallAssignment ----------------------------------------------
    const updAssignment = await svc.execute("UpdateOncallAssignment", {
      assignment_seqnum: assignmentSeqnum,
      remark: "ZZ-APITEST-UPDATED",
      priority: "2",
    });
    assert.ok(!updAssignment.error, `UpdateOncallAssignment failed: ${updAssignment.error}`);
    assert.ok(!updAssignment.err_message, `UpdateOncallAssignment business error: ${updAssignment.err_message}`);

    const readAssignmentAfterUpdate = await svc.execute("GetGroupsAssignmentsXml", {
      ocmid: oncallMid,
      ocastart: "01-JAN-25 00:00:00",
      ocaend: "31-DEC-26 00:00:00",
      tz: "PACIFIC",
    });
    assert.ok(
      JSON.stringify(readAssignmentAfterUpdate).includes("ZZ-APITEST-UPDATED"),
      "updated assignment remark not visible via GetGroupsAssignmentsXml"
    );

    // -- AddOncallGroupMember / DeleteOncallGroupMember ----------------------
    // AddOncallGroupMember was wired in an earlier task; exercised here only
    // to set up DeleteOncallGroupMember (this task's target RPC). There is
    // no RPC in amcomapi.xml that lists on-call group members, so success is
    // verified by the absence of error/err_message on both calls rather than
    // a read-back.
    const addMember = await svc.execute("AddOncallGroupMember", { oncall_mid: oncallMid, mid: "66755" });
    assert.ok(!addMember.error, `AddOncallGroupMember failed: ${addMember.error}`);
    assert.ok(!addMember.err_message, `AddOncallGroupMember business error: ${addMember.err_message}`);
    reg.track("DeleteOncallGroupMember", { oncall_mid: oncallMid, mid: "66755" });
  } finally {
    await reg.teardown(svc); // deletes ONLY tracked ids, member→assignment→role→group order
  }

  // Confirm the delete-own steps actually removed everything (teardown already ran).
  if (assignmentSeqnum) {
    const readAfterDelete = await svc.execute("GetGroupsAssignmentsXml", {
      ocmid: oncallMid,
      ocastart: "01-JAN-25 00:00:00",
      ocaend: "31-DEC-26 00:00:00",
      tz: "PACIFIC",
    });
    assert.ok(
      readAfterDelete.error && String(readAfterDelete.error).includes("No assignments found"),
      "assignment still present after DeleteOncallAssignment teardown"
    );
  }
  if (roleCreated) {
    const readRolesAfterDelete = await svc.execute("GetOncallGroupRoles");
    assert.ok(
      !JSON.stringify(readRolesAfterDelete).includes("ZZ-APITEST-ROLE"),
      "role still present after DeleteOncallGroupRole teardown"
    );
  }
  if (groupCreated) {
    const readGroupAfterDelete = await svc.execute("GetListingInfoByMid", { mid: oncallMid });
    assert.ok(
      readGroupAfterDelete.error && String(readGroupAfterDelete.error).includes("No listing record"),
      "on-call group still present after DeleteOncallGroup teardown"
    );
  }
});
