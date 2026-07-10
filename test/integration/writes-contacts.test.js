"use strict";
const assert = require("node:assert");
const { test } = require("node:test");
const { lab, itLab, extractSeq, CreatedRegistry } = require("./helpers.js");

// -- Task 16: Email/phone/pager writes ---------------------------------------
// All records created by this file are marked "ZZ-APITEST-..." so any stray
// leftover is obviously ours. Everything operates against a single throwaway
// listing created by AddPerson (lid captured via extractSeq before any other
// write is attempted). CreatedRegistry tracks DeletePerson immediately after
// AddPerson succeeds (LIFO backstop — runs last), and DeletePager is tracked
// immediately after AddPager succeeds (runs before DeletePerson on teardown,
// satisfying "children before parent"). Every id used elsewhere (emaddr,
// phone_number, pid) is a value this test chose and created itself — nothing
// is guessed from pre-existing data.
//
// Param-format / behavior discoveries (live-verified against the lab, not
// guessed):
//
// - **AddPhoneNumber's "directory context" (the persistence requirement flagged
//   by the prior session) is a messaging ID, not a directory/dirseq.** Per
//   amcomapi.xml, `AddPhoneNumber`'s key parameter is `mid` (Messaging ID),
//   *not* `lid` and *not* a `dirseq`/`phtype` pair as originally guessed in the
//   task brief — the brief's phrasing didn't match the canonical XML, so the
//   XML was followed per the "never guess" rule. Live-probed directly:
//   calling `AddPhoneNumber` with a `lid` value passed as `mid` (i.e. no
//   messaging ID ever assigned to the listing) returns a clean error
//   (`err_message: "The specified messaging id was not found."`) and a
//   subsequent `GetPhoneNumberByLid` confirms nothing persisted. Calling
//   `AssignMessagingId(lid)` first (to obtain a real, server-issued `mid`) and
//   then `AddPhoneNumber(mid, ...)` succeeds and *does* persist, confirmed via
//   `GetPhoneNumberByLid(lid)` returning the new number. So: the listing needs
//   an assigned messaging ID before `AddPhoneNumber` will persist — that's the
//   "directory context" the prior session was missing.
// - `DeleteListingDirectoryPhone(lid, phone_number, phone_type)` is the correct
//   delete pairing for `AddPhoneNumber` despite the differing key names/tables
//   implied by the RPC name — live-verified: a phone number added via
//   `AddPhoneNumber(mid, ...)` is found via `GetPhoneNumberByLid(lid)` and is
//   then successfully removed via `DeleteListingDirectoryPhone(lid,
//   phone_number, phone_type)`, confirmed gone by a follow-up
//   `GetPhoneNumberByLid(lid)` returning "not found". The pre-existing
//   `SpokService#deleteListingDirectoryPhone(lid, dirseq)` wrapper in
//   src/index.ts was wrong — amcomapi.xml has no `dirseq` parameter for this
//   RPC at all (`lid` required, `phone_number`/`phone_type` both
//   nullable="true"). Fixed to `deleteListingDirectoryPhone(lid, phoneNumber?,
//   phoneType?)` sending the correct param names; dist/ rebuilt.
// - `AssignPagerByLid(lid, pid, dorder)` also requires the listing to already
//   have a messaging ID assigned — live-probed without one first: fails with
//   `ORA-20123: Messaging ID is required in order to assign a pager.` The same
//   `AssignMessagingId(lid)` call used for the phone fixture satisfies this.
//   The pre-existing `SpokService#assignPagerByLid` wrapper in src/index.ts
//   sent `pager_id`/`display_order` — wrong param names; amcomapi.xml uses
//   `pid` (nullable="false") and `dorder` (nullable="true"). Fixed to send
//   `pid`/`dorder`; dist/ rebuilt.
// - A pager device (`pid`) is safely self-creatable for this test via the
//   already-wired `AddPager(pid, cos, model)` RPC — `pid` is a value this test
//   chooses (`ZZ-APITEST-PAGER-<timestamp>`), so no real device/cap-code is
//   touched. Valid `cos`/`model` values are discovered live via
//   `GetPagerCoses`/`GetPagerModels` (not guessed) — "AMC IPHONE" and
//   "MOBILE_PHONE" confirmed present and side-effect-free to use.
//   `DeletePager(pid)` live-verified to cascade-remove the listing's pager
//   assignment as well (a subsequent `GetPagerInfoByLid(lid)` returns "not
//   found"), so no separate unassign RPC is needed — matches the brief's
//   "never invent an id" guidance since amcomapi.xml has no
//   `UnassignPager`/`UnassignPagerByLid` RPC.
// - `phone_number_type` values are discovered live via `GetPhoneNumberTypes`
//   ("CELLULAR" confirmed present, no special dorder/remark constraints).
// - Response shape varies by procedure style in amcomapi.xml: RPCs defined
//   with a named `err_message` OUT parameter (e.g. `AddPhoneNumber`,
//   `GetPhoneNumberByLid`, `GetEmailAddressByLid`) report failure via a
//   non-empty top-level `err_message` string rather than the `.error` field;
//   RPCs defined with the `retval`/`xml_result` style (e.g.
//   `DeleteListingDirectoryPhone`, `AddEmailAddressByLid`,
//   `UpdateEmailAddressByLid`, `DeleteEmailAddressByLid`, `AddPager`,
//   `AssignPagerByLid`, `DeletePager`, `GetPagerInfoByLid`) report failure via
//   `.error`/`.errorCode`. Assertions below check the field that applies to
//   each call.

itLab("Contact (email/phone/pager) CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  let lid = null;
  let mid = null;
  const pid = `ZZ-APITEST-PAGER-${Date.now()}`;
  const phoneNumber = "5035550100";
  const phoneType = "CELLULAR";
  const emaddr1 = "zz-apitest-contact@example.invalid";
  const emaddr2 = "zz-apitest-contact-2@example.invalid";

  try {
    // -- AddPerson (throwaway listing) --------------------------------------
    const add = await svc.execute("AddPerson", {
      lname: "ZZ-APITEST-CONTACT", fname: "Probe",
    });
    assert.ok(!add.error, `AddPerson failed: ${add.error}`);
    lid = extractSeq(add, "lid");
    assert.ok(lid, "no lid returned; refusing to proceed with any write");
    // Track DeletePerson immediately so it still runs as a teardown backstop
    // (LIFO — runs last) even if a later step in this try{} throws.
    reg.track("DeletePerson", { lid });

    // -- AssignMessagingId (required "directory context" for both
    //    AddPhoneNumber and AssignPagerByLid — see file header) ------------
    const assignMid = await svc.execute("AssignMessagingId", { lid });
    assert.ok(!assignMid.error, `AssignMessagingId failed: ${assignMid.error}`);
    mid = extractSeq(assignMid, "mid");
    assert.ok(mid, "no mid returned by AssignMessagingId; refusing to proceed");

    // === Email ===============================================================

    // -- AddEmailAddressByLid (seed) -----------------------------------------
    const addEmail = await svc.execute("AddEmailAddressByLid", {
      lid, emaddr: emaddr1, dorder: "1",
    });
    assert.ok(!addEmail.error, `AddEmailAddressByLid failed: ${addEmail.error}`);
    reg.track("DeleteEmailAddressByLid", { lid, emaddr: emaddr1 });

    const emailRead1 = await svc.execute("GetEmailAddressByLid", { lid });
    assert.ok(!emailRead1.err_message, `GetEmailAddressByLid failed: ${emailRead1.err_message}`);
    assert.ok(
      String(emailRead1.email_address).includes(emaddr1),
      "seeded email not found via GetEmailAddressByLid"
    );

    // -- UpdateEmailAddressByLid ----------------------------------------------
    const updEmail = await svc.execute("UpdateEmailAddressByLid", {
      lid, old_emaddr: emaddr1, new_emaddr: emaddr2,
    });
    assert.ok(!updEmail.error, `UpdateEmailAddressByLid failed: ${updEmail.error}`);
    // Re-track the post-update address so the backstop targets the record
    // that actually exists now; the original tracked entry becomes a
    // harmless no-op (best-effort teardown swallows the "not found" error).
    reg.track("DeleteEmailAddressByLid", { lid, emaddr: emaddr2 });

    const emailRead2 = await svc.execute("GetEmailAddressByLid", { lid });
    assert.ok(!emailRead2.err_message, `GetEmailAddressByLid (post-update) failed: ${emailRead2.err_message}`);
    assert.ok(
      String(emailRead2.email_address).includes(emaddr2),
      "updated email not found via GetEmailAddressByLid"
    );

    // -- DeleteEmailAddressByLid (RPC under test) ----------------------------
    const delEmail = await svc.execute("DeleteEmailAddressByLid", { lid, emaddr: emaddr2 });
    assert.ok(!delEmail.error, `DeleteEmailAddressByLid failed: ${delEmail.error}`);

    const emailRead3 = await svc.execute("GetEmailAddressByLid", { lid });
    assert.ok(
      emailRead3.err_message,
      "email still resolves via GetEmailAddressByLid after DeleteEmailAddressByLid"
    );

    // === Phone ================================================================

    // -- AddPhoneNumber (RPC under test) ---------------------------------------
    const addPhone = await svc.execute("AddPhoneNumber", {
      mid, phone_number: phoneNumber, phone_number_type: phoneType,
      published_flag: "F", display_order: "1",
    });
    assert.ok(!addPhone.err_message, `AddPhoneNumber failed: ${addPhone.err_message}`);
    reg.track("DeleteListingDirectoryPhone", { lid, phone_number: phoneNumber, phone_type: phoneType });

    const phoneRead1 = await svc.execute("GetPhoneNumberByLid", { lid });
    assert.ok(!phoneRead1.err_message, `GetPhoneNumberByLid failed: ${phoneRead1.err_message}`);
    assert.ok(
      String(phoneRead1.phone_number).includes(phoneNumber),
      "new phone number not found via GetPhoneNumberByLid"
    );

    // -- DeleteListingDirectoryPhone (RPC under test) --------------------------
    const delPhone = await svc.execute("DeleteListingDirectoryPhone", {
      lid, phone_number: phoneNumber, phone_type: phoneType,
    });
    assert.ok(!delPhone.error, `DeleteListingDirectoryPhone failed: ${delPhone.error}`);

    const phoneRead2 = await svc.execute("GetPhoneNumberByLid", { lid });
    assert.ok(
      phoneRead2.err_message,
      "phone number still resolves via GetPhoneNumberByLid after DeleteListingDirectoryPhone"
    );

    // === Pager =================================================================

    // -- AddPager (throwaway device; pid/cos/model all self-chosen or
    //    live-discovered, never guessed) ----------------------------------------
    const addPager = await svc.execute("AddPager", { pid, cos: "AMC IPHONE", model: "MOBILE_PHONE" });
    assert.ok(!addPager.error, `AddPager failed: ${addPager.error}`);
    // Track immediately (before AssignPagerByLid) so on reverse it runs
    // before DeletePerson — children before parent.
    reg.track("DeletePager", { pid });

    // -- AssignPagerByLid (RPC under test) --------------------------------------
    const assignPager = await svc.execute("AssignPagerByLid", { lid, pid, dorder: "1" });
    assert.ok(!assignPager.error, `AssignPagerByLid failed: ${assignPager.error}`);

    const pagerRead1 = await svc.execute("GetPagerInfoByLid", { lid });
    assert.ok(!pagerRead1.error, `GetPagerInfoByLid failed: ${pagerRead1.error}`);
    assert.ok(
      JSON.stringify(pagerRead1).includes(pid),
      "assigned pager not found via GetPagerInfoByLid"
    );

    // -- UpdatePager (RPC under test) --------------------------------------------
    const updPager = await svc.execute("UpdatePager", { pid, remark: "ZZ-APITEST remark" });
    assert.ok(!updPager.error, `UpdatePager failed: ${updPager.error}`);

    const pagerInfo = await svc.execute("GetPagerInfo", { pid });
    assert.ok(!pagerInfo.error, `GetPagerInfo (post-update) failed: ${pagerInfo.error}`);
    assert.ok(
      JSON.stringify(pagerInfo).includes("ZZ-APITEST remark"),
      "updated remark not visible via GetPagerInfo after UpdatePager"
    );

    // -- DeletePager (cleans up device + cascades unassign from lid) -----------
    const delPager = await svc.execute("DeletePager", { pid });
    assert.ok(!delPager.error, `DeletePager failed: ${delPager.error}`);

    const pagerRead2 = await svc.execute("GetPagerInfoByLid", { lid });
    assert.ok(
      pagerRead2.error,
      "pager assignment still resolves via GetPagerInfoByLid after DeletePager"
    );

    // -- DeletePerson (final cleanup) --------------------------------------------
    const del = await svc.execute("DeletePerson", { lid });
    assert.ok(!del.error, `DeletePerson failed: ${del.error}`);

    const readAfterDelete = await svc.execute("GetListingInfo", { lid });
    assert.ok(
      readAfterDelete.error,
      "listing still resolves via GetListingInfo after DeletePerson"
    );
  } finally {
    // Backstop only: harmless best-effort no-ops for anything already
    // explicitly deleted above.
    await reg.teardown(svc);
  }
});
