# Expose All Amcom RPCs in CLI + Companion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface every wrapped Amcom RPC (130 missing from the CLI, 123 from the companion; DataFeed excluded) as CLI subcommands and companion HTTP routes, lab-verified, then release the chain (npm publish `spok-api` v1.2.0 + companion dependency bump).

**Architecture:** Both surfaces already call `service.execute("MethodName", {params})` directly through a thin `callAmcom` helper — they do **not** consume the typed wrappers. So each RPC is exposed by adding a small command/route that maps a path → `("MethodName", {params})`. The **canonical param source** is `spok-companion/docs/amcomapi.xml` (`<procedure name="X"><parameter name="..." bindname="..." datatype="..." nullable="...">`). Correctness is proven by a lab-gated integration suite that live-calls each read and runs create→read-back→delete-own lifecycles for each write.

**Tech Stack:** Node.js ≥18, Commander (CLI), Fastify + `@fastify/swagger` (companion), built-in `node:test` (integration tests), TypeScript (library wrappers, compiled to `dist/`).

## Global Constraints

- **No page/notification sends, ever.** The 5 paging methods (`SendMessage`, `SubmitMessage`, `SendGroupPage`, `SendPageWithAlert`, `SendToSmartAlert`) are wired but make **zero live lab calls**; their tests are `it.skip`. Do not add a test recipient.
- **Delete only self-created records.** Every write test captures the returned seqnum/id and deletes only that. Never modify or delete pre-existing lab data. If a create's id cannot be recovered, do **not** run its delete.
- **Params come from `amcomapi.xml`.** Never guess a param name. Use `<parameter name="...">` values verbatim (that is what goes on the wire). Respect `nullable="false"` as required.
- **Lab config:** active server `lab` → `smstetstdb8.ohsu.edu:9722` (ssl, insecure). Confirmed reachable 2026-07-08.
- **Integration tests are gated by `SPOK_LAB=1`** plus an active lab config; skipped otherwise so normal installs/CI make no live calls.
- **Writes in the CLI must call `enforceReadOnly(globalOpts)`** before executing (existing convention).
- **Version:** `spok-api/package.json` is already `1.2.0` (single source; CLI reads `pkg.version`). npm currently has `1.1.2`. Do not add a second version constant.
- **Library wrapper bugs:** when a lab call reveals a wrong param name, fix it in `src/index.ts` **and** the CLI command **and** the companion route **and** the test — all four in sync — then rebuild `dist` (`npm run build` or `tsc`).
- **Lint/build gate before any commit:** `npx tsc --noEmit` clean (pre-existing `moduleResolution` deprecation notice is allowed) and the built `dist/` regenerated when `src/` changes.

---

## File Structure

**spok-api:**
- `test/integration/helpers.js` (create) — build `SpokService` from active config; `SPOK_LAB` gate; `CreatedRegistry` (track + teardown self-created ids).
- `test/integration/reads.test.js` (create) — live read sweep, all read categories.
- `test/integration/writes-*.test.js` (create, one per write category) — CRUD lifecycles.
- `cli/commands/get.js`, `add.js`, `update.js`, `delete.js`, `set.js`, `assign.js`, `send-page.js` (modify) — new subcommands.
- `src/index.ts` (modify, only if lab testing finds a wrapper param bug) → rebuild `dist/`.
- `package.json` (modify) — add `test:integration` script.

**spok-companion:**
- `src/routes/amcom-read.js` (modify) — new `GET` routes.
- `src/routes/amcom-write.js` (modify) — new `POST`/`PATCH`/`DELETE` routes.
- `package.json` (modify) — bump `spok-api` `^1.0.1` → `^1.2.0`.

---

## Canonical Templates (referenced by every task — copy and adapt per RPC)

### T1 — CLI read subcommand (in the relevant `get` group)
```js
get
  .command("record-name-by-lid <lid>")           // kebab path; positional for the required key(s)
  .description("Get record name by listing ID")   // from amcomapi.xml <description>
  .action(async (lid) => {
    try {
      await callAndPrint(program.opts(), "GetRecordNameByLid", { lid });
    } catch (err) { printError(err); }
  });
```
For multi-param reads, use `.option("--foo <foo>", "...")` (or `.requiredOption` when `nullable="false"`) and build the params object with the **exact** `<parameter name>` keys.

### T2 — CLI write subcommand (add/update/delete/set/assign group)
```js
del
  .command("org <orgseq>")
  .description("Delete an organization by sequence number")
  .action(async (orgseq) => {
    const globalOpts = program.opts();
    try {
      enforceReadOnly(globalOpts);
      const result = await callAmcom(globalOpts, "DeleteOrg", { orgseq });
      const output = globalOpts.clean ? cleanObject(result) : result;
      await printResult(output, globalOpts.format);
    } catch (err) { printError(err); }
  });
```
Add-style commands with many fields: use `--opt` flags per `<parameter>`, `requiredOption` for `nullable="false"`.

### T3 — Companion read route (`amcom-read.js`)
```js
fastify.get(`${prefix}/record-name/by-lid/:lid`, S("Record Name", {
  summary: "Get record name by listing ID",
}), async (req) => callAmcom("GetRecordNameByLid", { lid: req.params.lid }));
```
Query-param reads: read from `req.query`; keep param keys identical to `<parameter name>`.

### T4 — Companion write route (`amcom-write.js`)
```js
fastify.post(`${prefix}/orgs`, S("Organization — Write", {
  summary: "Add an organization",
}), async (req) => callAmcom("AddOrg", buildParams(req.body)));

fastify.delete(`${prefix}/orgs/:orgseq`, S("Organization — Write", {
  summary: "Delete an organization",
}), async (req) => callAmcom("DeleteOrg", { orgseq: req.params.orgseq }));
```

### T5 — Integration read test (`node:test`)
```js
const { test } = require("node:test");
const assert = require("node:assert");
const { lab, itLab } = require("./helpers.js");   // itLab = test unless SPOK_LAB unset

itLab("GetRecordNameByLid returns a name for a known lid", async () => {
  const svc = lab();
  const res = await svc.execute("GetRecordNameByLid", { lid: KNOWN_LID });
  assert.ok(!res.error, `unexpected error: ${res.error}`);
  assert.ok(res.data, "no data returned");
});
```

### T6 — Integration write CRUD test (create → verify → delete-own)
```js
itLab("Org CRUD lifecycle (self-created only)", async () => {
  const svc = lab();
  const reg = new CreatedRegistry();
  try {
    const add = await svc.execute("AddOrg", { /* required params from amcomapi.xml */ });
    assert.ok(!add.error, `AddOrg failed: ${add.error}`);
    const orgseq = extractSeq(add, "orgseq");  // capture by EXACT field name (from amcomapi.xml)
    assert.ok(orgseq, "no orgseq returned; refusing to delete anything");
    reg.track("DeleteOrg", { orgseq });
    const read = await svc.execute("GetOrgCodes");   // confirm it exists
    assert.ok(JSON.stringify(read).includes(orgseq));
  } finally {
    await reg.teardown(svc);                    // deletes ONLY tracked ids
  }
});
```

---

## Phase 0 — Integration test harness (spok-api)

### Task 0: Lab-gated test harness + registry

**Files:**
- Create: `spok-api/test/integration/helpers.js`
- Modify: `spok-api/package.json` (add `"test:integration": "node --test test/integration/"`)
- Test: harness self-check in `spok-api/test/integration/reads.test.js` (created here with one smoke test)

**Interfaces:**
- Produces: `lab()` → `SpokService` from active config (throws if none); `itLab(name, fn)` → `node:test` `test` when `process.env.SPOK_LAB==="1"` else `test.skip`; `class CreatedRegistry { track(method, params); async teardown(svc) }`; `extractSeq(res, key)` → the value of the **exact** field `key` (searched recursively) or `null`. It takes an explicit key (never guesses) so a write test can only ever capture the id field it actually created — required for the delete-only-self-created safety guarantee.

- [ ] **Step 1: Write the failing smoke test**
```js
// test/integration/reads.test.js
const assert = require("node:assert");
const { lab, itLab } = require("./helpers.js");
itLab("lab GetOrgCodes smoke", async () => {
  const res = await lab().execute("GetOrgCodes");
  assert.ok(!res.error, `error: ${res.error}`);
});
```
- [ ] **Step 2: Run, verify it fails (module missing)**
Run: `cd spok-api && node --test test/integration/reads.test.js`
Expected: FAIL — `Cannot find module './helpers.js'`.
- [ ] **Step 3: Implement `helpers.js`**
```js
"use strict";
const { test } = require("node:test");
const SpokService = require("../../dist/index.js");
const { getActiveServer, resolveSsPlaceholders } = require("../../cli/utils/config.js");

let _svc;
function lab() {
  if (_svc) return _svc;
  const s = getActiveServer();
  if (!s) throw new Error("no active lab server configured");
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  _svc = new SpokService({ host: s.host, port: s.port, ssl: s.ssl, insecure: true });
  return _svc;
}
const LIVE = process.env.SPOK_LAB === "1";
const itLab = (name, fn) => (LIVE ? test(name, fn) : test.skip(name, fn));
function extractSeq(res) {
  const s = JSON.stringify(res || {});
  const m = s.match(/"([a-z_]*(?:seq|id))"\s*:\s*"?(\d+)"?/i);
  return m ? m[2] : null;
}
class CreatedRegistry {
  constructor() { this.items = []; }
  track(method, params) { this.items.push({ method, params }); }
  async teardown(svc) {
    for (const { method, params } of this.items.reverse()) {
      try { await svc.execute(method, params); } catch (_) { /* best-effort cleanup */ }
    }
  }
}
module.exports = { lab, itLab, extractSeq, CreatedRegistry };
```
Note: `resolveSsPlaceholders` is async; the lab config has no `<ss:>` placeholders (plain host/port), so sync `getActiveServer()` is sufficient. If a future lab uses placeholders, make `lab()` async and await it.
- [ ] **Step 4: Run gated (skipped) and live**
Run: `node --test test/integration/reads.test.js` → Expected: 1 skipped.
Run: `SPOK_LAB=1 node --test test/integration/reads.test.js` → Expected: 1 pass.
- [ ] **Step 5: Commit**
```bash
cd spok-api && git add test/integration/helpers.js test/integration/reads.test.js package.json
git commit -m "test: add lab-gated integration harness with self-created-only cleanup"
```

---

## Phase 1 — CLI reads (spok-api)

Each task below: for every RPC listed, (a) look up its `<procedure>` in `amcomapi.xml`, (b) add a `get` subcommand per **T1** using the exact `<parameter name>` keys and `<description>`, (c) add a live read assertion per **T5** to `reads.test.js` using a real id discovered from an existing read (e.g. an `lid`/`mid` from `get listing-by-name`), (d) run `SPOK_LAB=1 node --test test/integration/reads.test.js`, (e) if the server returns a param error, fix `src/index.ts` + the command + the test together and rebuild `dist`, (f) commit.

Every task ends: `npx tsc --noEmit` clean; `SPOK_LAB=1 node --test test/integration/reads.test.js` all target reads pass (or documented `it.skip` with server-side reason); commit `feat(cli): expose <category> reads`.

- [x] **Task 1 — Listings/directory/record reads (9):** `GetListingsByLastName`, `GetListingsBySsn`, `GetListingsByUdf`, `GetDirectoriesByUdf`, `GetDirectoryTypes`, `GetRecordNameByLid`, `GetRecordNameByMid`, `GetRecordNameByPid`, `GetRecordNameOnlyByMid`. (Note: `GetListingsByLastName` requires `search_type`; `GetDirectoriesByUdf` takes `udf_col`+`udf`+`search_type`.)
- [x] **Task 2 — Pager/device reads (7):** `GetPagerInfoByLid`, `GetPagerCoses`, `GetPagerModels`, `GetPageRoutes`, `GetUnassignedContactDevices` (`lid`+`cltype` ON/OFF HOURS), `IsPagerByDirectorySeqnum`, `IsPagerByListingId` (⚠ prior session: server may reject `lid` and demand `phnum` — confirm against XML and record the working signature).
- [x] **Task 3 — Email/phone reads (4):** `GetPhoneNumber`, `GetPhoneNumberByLid`, `GetAlternatePhone`, `IsPagerByPhone`.
- [x] **Task 4 — Org/address/dept reads (8):** `GetAllAddresses`, `GetAddressTypes`, `GetAllDepartments`, `GetDepartmentHierarchy` (`dirseq`), `GetEmailAddresses` (`lid`), `GetEmailAddressByLid`, `GetEmailAddressByOrder` (`mid`+`dorder`), `GetCallerEmailAddress`.
- [x] **Task 5 — Status reads (9):** `GetStatus`, `GetStatusCodes`, `GetIdStatus`, `GetStatusesByEid`, `GetStatusesByFeedId`, `GetStatusesByLastName` (`search_type`), `GetStatusesByLatestDate`, `GetStatusesByName` (`search_type`), `GetStatusesBySsn`, `GetStatusesByUdf`. (10 incl. `GetIdStatus` moved here from misc.)
- [x] **Task 6 — Instructions reads (3):** `GetListingInstructions` (`lid`), `GetInstructionInfo` (`seqnum`), `GetSharedListingInstruction` (`seqnum`).
- [x] **Task 7 — On-call/assignment reads (10):** `GetMessageGroups` (`reqlid`), `GetOncallGroupRoles`, `GetIdsAssignments`, `GetIdsAssignmentsXml` (`mid`+`tz`), `GetIdsCurrAssignXml`, `GetGroupsAssignmentsXml` (`ocmid`+`ocastart`+`ocaend`+`tz`), `GetGroupsCurrAssignXml` (`ocmid`+`tz`), `GetCurrentAssignmentLids`, `GetCurrentAssignmentWithExceptions`, `GetAssignedContactDevices` (`lid`+`cltype`).
- [x] **Task 8 — Events/notifications reads (7):** `GetActiveNotifications` (`rlid`), `GetAllEventTemplates` (`reqlid`), `GetEventTemplateDetail` (`etid`), `GetEventActivations` (`etid`), `GetEventActivationDetail` (`eaid`), `GetEventTemplatePrivilege` (`etid`+`lid`), `GetEventStatus` (`eaid`), `GetNotificationStatus` (`eaid`), `GetNotificationStepQueries` (`eaid`), `GetActivationRecipientCount` (`eaid`), `GetTemplateRecipientCount` (`etid`), `GetQueryTemplateInfo` (`reqlid`+`qseq`). (All CLOB/small reads; some may hit the 4 KB VARCHAR2 limit — record if so.)
- [x] **Task 9 — Monitoring reads (6):** `MonitorEventDetail`, `MonitorEventStatus`, `MonitorEventStatusSummary`, `MonitorProcStatusSummary`, `MonitorStepResponses`, `MonitorStepStatusSummary` (all take a params object; derive keys from XML).
- [x] **Task 10 — Misc/reference reads (4):** `GetPagingInfo` (`mid`), `GetProfileSpecialties` (`ir_fid`), `GetWorkHours` (`lid`), `GetExceptionList` (`mid`).

---

## Phase 2 — CLI writes (spok-api)

Each task: for every RPC, add the write subcommand per **T2** (with `enforceReadOnly`, exact `<parameter name>` keys, `requiredOption` for `nullable="false"`), and add a CRUD lifecycle test per **T6** to `test/integration/writes-<category>.test.js`. Use a throwaway self-created parent (e.g. a test org/listing) where a write needs an owner; capture every id; delete only what was created. Run `SPOK_LAB=1 node --test test/integration/writes-<category>.test.js`. Fix `src/index.ts`+command+test on any param error; rebuild `dist`. Commit `feat(cli): expose <category> writes`.

- [x] **Task 11 — Org/address/specialty (8):** `AddOrg`→capture `orgseq`→`UpdateOrg`→`DeleteOrg`; `AddAddress`→`UpdateAddress`→`DeleteAddress`; `IudOrg`; `IudProfileSpecialty`. (Self-contained — no external owner needed; best first write category.)
- [x] **Task 12 — On-call (9):** `AddOncallGroup`→`UpdateOncallGroup`→`DeleteOncallGroup`; `AddOncallAssignment`→`UpdateOncallAssignment`→`DeleteOncallAssignment`; `AddOncallGroupRole`→`DeleteOncallGroupRole`; `DeleteOncallGroupMember`.
- [x] **Task 13 — Work hours (4):** `AddWorkHour`→capture `phrseq`→`UpdateWorkHour`→`DeleteWorkHour` (`lid`+`phrseq`); `UnassignWorkHours`.
- [x] **Task 14 — Message groups (5):** `AddStaticMessageGroup`→capture `grpnum`→`UpdateMessageGroup`→`DeleteMessageGroup`; `UpdateStaticMessageGroupMember`/`DeleteStaticMessageGroupMember` against a self-created group.
- [x] **Task 15 — Listings/people (6):** `SetListingEnabled`, `UpdateMessagingId`, `AssignRole`, `AssignMessagePriorities`, `AssignGroupLimits`, `DeletePerson` — all against a self-created throwaway listing (create via existing `AddPerson`, capture `lid`, exercise, then `DeletePerson` it last).
- [x] **Task 16 — Email/phone/pager writes (6):** `AddPhoneNumber` (⚠ prior session: returned OK but did not persist without directory context — verify with a self-created directory and record the requirement), `DeleteListingDirectoryPhone`, `DeleteEmailAddressByLid`, `UpdateEmailAddressByLid` (`old_emaddr`+new), `AssignPagerByLid`, `UpdatePager` — against the throwaway listing from Task 15's fixture pattern.
- [x] **Task 17 — Instructions writes (4):** `AddListingInstruction`→capture `seqnum`→`UpdateListingInstruction`→`DeleteListingInstruction` (`seqnum`+`lid`); `ShareListingInstruction` (`seqnum`+target lid).
- [x] **Task 18 — Exceptions/devices (10):** `ChangeException`/`DeleteException` (no discoverable valid exception `type` anywhere in amcomapi.xml — live-probed 24 candidates, all rejected identically; wired + skipped like Task 15's `AssignRole`); `AddPersonalContactDevice`→capture `pdoseq`→`UpdatePersonalContactDevice`→`DeletePersonalContactDevice` (live CRUD, `lid`+`cltype`+`devtype`+`devid`, PHONE `devid` is a directory seqnum discovered via `GetUnassignedContactDevices`, not the raw number); `DeleteAllPersonalDeviceOptions`, `SwapPersonalContactDevice` (forward-move only — backward move hits a live server-side unique-constraint bug), `UnassignContactDevices` (both fixed from `mid` to the correct wire param `lid`), `RegisterAMCDevice`→`UnregisterAMCDevice` (wired, not live-invoked — real device/mailbox side effect) — against the throwaway listing.

---

## Phase 3 — Paging methods (NO live calls)

- [x] **Task 19 — Paging family, param-wired only (5):** `SendMessage`, `SubmitMessage`, `SendGroupPage`, `SendPageWithAlert`, `SendToSmartAlert`. Add CLI subcommands under `send-page.js`/`send-message` per **T2** using exact XML params. Add tests as `it.skip` with comment `// intentionally never executed — would dispatch a real page`. Verify only via `npx tsc --noEmit` + `--help` output. Commit `feat(cli): wire paging methods (no live send)`.

---

## Phase 4 — Library reconciliation + release (spok-api)

### Task 20: Reconcile wrapper fixes, update docs, verify build
**Files:** Modify `src/index.ts` (any remaining bug fixes), `docs/UNWRAPPED-RPCS.md` (mark wrapped), regenerate `dist/`.
- [x] **Step 1:** Ensure every param bug found in Phases 1–3 is fixed in `src/index.ts`; grep that CLI command params and `src/index.ts` `execute()` params agree per RPC. Audited all 175 wrapped RPCs (explicit + passthrough) against `amcomapi.xml`; only gaps found were the two known ones below — no other param-name mismatches.
- [x] **Step 2:** `npm run build` (or `npx tsc`); confirm `dist/index.js` regenerated.
- [x] **Step 3:** `npx tsc --noEmit` — clean (allow the known `moduleResolution` notice).
- [x] **Step 4:** `SPOK_LAB=1 node --test test/integration/**/*.test.js` — full suite green (paging skipped). 69 pass / 0 fail / 30 skipped with `--test-concurrency=1` (default concurrency races different write tests against each other on the shared live lab server — not a wrapper bug; see task-20 report).
- [x] **Step 5:** Commit `fix: reconcile RPC wrapper params with lab-verified CLI` + update `docs/UNWRAPPED-RPCS.md`.

### Task 21: Merge PR #1 and publish v1.2.0
- [ ] **Step 1:** Push branch `claude/open-rcps-docs-fkxcmb`; ensure PR #1 green.
- [ ] **Step 2:** Merge PR #1 to `main` (`gh pr merge 1 --squash` or per user preference).
- [ ] **Step 3:** On `main`, confirm `package.json` = `1.2.0`; `git tag v1.2.0 && git push origin v1.2.0`.
- [ ] **Step 4:** Watch the release workflow: `gh run watch` — confirm npm publish of `spok-api@1.2.0` (`npm view spok-api version` → `1.2.0`).

---

## Phase 5 — Companion routes (spok-companion)

Each task: for the category's RPCs **not already present** in `amcom-read.js`/`amcom-write.js` (grep first), add routes per **T3**/**T4** with a sensible REST path and Swagger `S(tag, {summary})`. Params keyed exactly as `<parameter name>`. After each category: `npm start` (or `node --watch src/server.js`), open `/docs` (Swagger UI), and smoke-call one read route per category via `curl` against the running server pointed at the lab (reads only; writes verified via Swagger schema render, no destructive calls beyond the self-created lifecycle already proven in Phase 2). Commit per category.

- [ ] **Task 22 — Companion reads:** all Phase-1 read RPCs missing from `amcom-read.js`, grouped under Swagger tags (Listings, Pagers, Email/Phone, Status, Reference Data, Instructions, On-Call, Events, Monitoring). Commit `feat: expose all read RPCs as HTTP routes`.
- [ ] **Task 23 — Companion writes:** all Phase-2 write RPCs missing from `amcom-write.js`, grouped under `<Domain> — Write` tags. Commit `feat: expose all write RPCs as HTTP routes`.
- [ ] **Task 24 — Companion paging (no live send):** `Send*`/`SubmitMessage` routes with Swagger docs; add a description noting no test harness fires them. Commit `feat: wire paging routes (no live send)`.
- [ ] **Task 25 — Dependency bump + verify:**
  - [ ] Bump `spok-companion/package.json` `spok-api` `^1.0.1` → `^1.2.0`; `npm install`.
  - [ ] `npm start`; confirm server boots and `/docs` renders all new routes.
  - [ ] Commit `chore: bump spok-api to ^1.2.0`.

---

## Self-Review notes

- **Spec coverage:** reads (Tasks 1–10) + writes (11–18) + paging carve-out (19) + tests (Task 0, per-task) + library reconcile (20) + publish chain (21) + companion parity + dep bump (22–25) → every spec section mapped.
- **Delete-only-self-created:** enforced structurally by `CreatedRegistry` + `extractSeq` guard ("no id → refuse delete") in **T6**.
- **No-send:** enforced by Task 19/24 `it.skip` and no `execute` of `Send*` in any live test.
- **Param source:** every task defers to `amcomapi.xml`; no param names transcribed speculatively into this plan (only known-tricky ones flagged with ⚠ from the prior session's findings).
