"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 13: Work hours writes -----------------------------------------------
// Work hours are always owned by a listing (lid), so this test creates a
// throwaway person via AddPerson (server-assigned lid, captured via
// extractSeq — never guessed), does all work-hour CRUD against that lid, and
// tears the person down last. AssignMessagingId(lid) is called first only to
// give the throwaway listing a real mid (mirrors normal provisioning), and
// its returned mid is exercised implicitly but not required by any of the
// four target RPCs below.
//
// Param-format discoveries (live-verified against the lab, not guessed):
// - AddPerson's server-assigned lid comes back as `data.listing.lid`;
//   AssignMessagingId's mid comes back as `data.listing.mid`;
//   AddWorkHour's phrseq comes back as `data.workHour.phrseq` (singular);
//   GetWorkHours' read-back nests under `data.workHours` (plural).
// - AddWorkHour's `cltype` only accepts "ON HOURS" — passing "OFF HOURS"
//   fails server-side with error code 25005 ("This function requires that
//   the contact_list_type be set to ON HOURS."). UpdateWorkHour's `cltype`
//   is nullable and not exercised with a different value here for that
//   reason.
// - `stime`/`etime` use the "HH:MI AM/PM" format (e.g. "08:00 AM"); `wdays`
//   is a comma-separated list of 3-letter day codes (e.g. "MON,TUE,WED").
//   A work-hour's stime/etime must fall within a single calendar day
//   (etime > stime) — an overnight range like 06:00 PM-07:00 AM is rejected
//   server-side (ORA-20745).
// - UnassignWorkHours per amcomapi.xml takes only `lid` (nullable="false"),
//   NOT `mid` as a prior session had assumed — confirmed live: it deletes
//   every AddWorkHour record owned by that lid. The pre-existing
//   `SpokService#unassignWorkHours(mid)` wrapper in src/index.ts sent the
//   wrong wire param name and has been fixed to `unassignWorkHours(lid)` to
//   match.

itLab("Work hour CRUD lifecycle (self-created throwaway listing only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  let lid = null;

  try {
    // -- AddPerson (throwaway owner) -----------------------------------------
    const addPerson = await svc.execute("AddPerson", { lname: "ZZ-APITEST-WH" });
    assert.ok(!addPerson.error, `AddPerson failed: ${addPerson.error}`);
    lid = extractSeq(addPerson, "lid");
    assert.ok(lid, "no lid returned from AddPerson; refusing to do anything further");
    reg.track("DeletePerson", { lid });

    // -- AssignMessagingId (gives the throwaway listing a real mid) ---------
    const assignMid = await svc.execute("AssignMessagingId", { lid });
    assert.ok(!assignMid.error, `AssignMessagingId failed: ${assignMid.error}`);
    const mid = extractSeq(assignMid, "mid");
    assert.ok(mid, "no mid returned from AssignMessagingId; refusing to proceed");

    // -- AddWorkHour ----------------------------------------------------------
    const addWh = await svc.execute("AddWorkHour", {
      lid,
      cltype: "ON HOURS",
      stime: "08:00 AM",
      etime: "05:00 PM",
      wdays: "MON,TUE,WED",
    });
    assert.ok(!addWh.error, `AddWorkHour failed: ${addWh.error}`);
    const phrseq = extractSeq(addWh, "phrseq");
    assert.ok(phrseq, "no phrseq returned; refusing to delete anything");
    reg.track("DeleteWorkHour", { lid, phrseq });

    // -- GetWorkHours (confirm create) ----------------------------------------
    const readWh = await svc.execute("GetWorkHours", { lid });
    assert.ok(!readWh.error, `GetWorkHours failed: ${readWh.error}`);
    assert.ok(JSON.stringify(readWh).includes(phrseq), "new work hour not found via GetWorkHours");
    assert.ok(JSON.stringify(readWh).includes("08:00 AM"), "work hour stime not visible via GetWorkHours");

    // -- UpdateWorkHour ---------------------------------------------------------
    const updWh = await svc.execute("UpdateWorkHour", { lid, phrseq, stime: "09:00 AM" });
    assert.ok(!updWh.error, `UpdateWorkHour failed: ${updWh.error}`);

    const readWhAfterUpdate = await svc.execute("GetWorkHours", { lid });
    assert.ok(!readWhAfterUpdate.error, `GetWorkHours failed: ${readWhAfterUpdate.error}`);
    assert.ok(
      JSON.stringify(readWhAfterUpdate).includes("09:00 AM"),
      "updated work hour stime not visible via GetWorkHours"
    );

    // -- DeleteWorkHour -----------------------------------------------------
    const delWh = await svc.execute("DeleteWorkHour", { lid, phrseq });
    assert.ok(!delWh.error, `DeleteWorkHour failed: ${delWh.error}`);

    const readWhAfterDelete = await svc.execute("GetWorkHours", { lid });
    assert.ok(
      readWhAfterDelete.error && String(readWhAfterDelete.error).includes("No work hour records"),
      "work hour still present after DeleteWorkHour"
    );

    // DeleteWorkHour already removed the only tracked work hour above; drop
    // it from the registry so teardown doesn't attempt a second (harmless
    // but noisy) delete against an already-gone phrseq.
    reg.items = reg.items.filter((i) => i.method !== "DeleteWorkHour");

    // -- UnassignWorkHours (add a second work hour, then unassign all) ------
    const addWh2 = await svc.execute("AddWorkHour", {
      lid,
      cltype: "ON HOURS",
      stime: "06:00 AM",
      etime: "02:00 PM",
      wdays: "THU,FRI",
    });
    assert.ok(!addWh2.error, `AddWorkHour (2nd) failed: ${addWh2.error}`);
    const phrseq2 = extractSeq(addWh2, "phrseq");
    assert.ok(phrseq2, "no phrseq returned for 2nd work hour; refusing to unassign");

    const readWh2 = await svc.execute("GetWorkHours", { lid });
    assert.ok(
      JSON.stringify(readWh2).includes(phrseq2),
      "2nd work hour not found via GetWorkHours before unassign"
    );

    const unassign = await svc.execute("UnassignWorkHours", { lid });
    assert.ok(!unassign.error, `UnassignWorkHours failed: ${unassign.error}`);

    const readWhAfterUnassign = await svc.execute("GetWorkHours", { lid });
    assert.ok(
      readWhAfterUnassign.error && String(readWhAfterUnassign.error).includes("No work hour records"),
      "work hour still present after UnassignWorkHours"
    );
  } finally {
    await reg.teardown(svc); // deletes ONLY tracked ids: any surviving work hour, then the throwaway person
  }
});
