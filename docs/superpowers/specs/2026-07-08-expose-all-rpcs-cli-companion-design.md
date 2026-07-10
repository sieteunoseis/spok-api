# Design: Surface all new Amcom RPCs in CLI + Companion (finish PR #1)

**Date:** 2026-07-08
**Repos:** `spok-api` (library + CLI), `spok-companion` (Fastify API)
**Status:** Approved for planning

## Goal

PR #1 (`claude/open-rcps-docs-fkxcmb`) added ~100 typed `SpokService` RPC wrappers to
`spok-api/src/index.ts`, covering the procedures tracked in `docs/UNWRAPPED-RPCS.md`.
Those methods currently ship only in the library. This project surfaces **all** of them
through the two consumer surfaces — the `spok-api` CLI and the `spok-companion` API — then
releases the whole chain (npm publish + PR merge + companion dependency bump).

## Key architectural fact

Both consumer surfaces call `service.execute(method, params)` **directly**:

- CLI: `cli/utils/connection.js` → `callAmcom(opts, "Method", {params})` → `service.execute(...)`
- Companion: `src/routes/amcom-client.js` → `callAmcom("Method", {params})` → `service.execute(...)`

Neither consumes the typed wrapper methods. Therefore:

1. The **canonical source of truth** for what to wire is `spok-companion/docs/amcomapi.xml`
   (9,221 lines: every procedure's parameter `name`, `bindname`, `datatype`, `nullable`,
   and summary). CLI commands and companion routes map a path → `("MethodName", {params})`
   using param names straight from that XML.
2. Companion routes work **regardless of the installed `spok-api` version** — the dependency
   bump to `^1.2.0` is for hygiene/consistency, not a functional requirement.
3. The typed wrappers still matter for typed library consumers, so param bugs found during
   lab testing are fixed in `src/index.ts` **and** reflected in the CLI/route mappings.

## Layers & changes

| Layer | Repo / files | Change |
|---|---|---|
| Library wrappers | `spok-api/src/index.ts` | Fix param bugs found in lab testing (amends PR #1) |
| CLI commands | `spok-api/cli/commands/{get,add,update,delete,set,assign,send-page}.js` | Add subcommands, one per new RPC |
| Integration tests | `spok-api/test/integration/` (new) | Lab-gated CRUD/read suite |
| Companion routes | `spok-companion/src/routes/amcom-{read,write}.js` | Add Fastify routes w/ Swagger tags |

## Scope — full library/surface parity

Every wrapped RPC not already exposed, DataFeed bulk family excluded. Concretely (derived
from the `execute()` calls in `src/index.ts` vs. what each surface already exposes):

- **130 RPCs** missing from the CLI
- **123 RPCs** missing from the companion

Grouped to match existing CLI verbs and companion Swagger tags:

- **Reads** → CLI `get` + companion `GET`: `GetListingsByLastName`, `GetDirectoriesByUdf`,
  `GetAllDepartments`, `GetDepartmentHierarchy`, `GetAllAddresses`, `GetMessageGroups`,
  `GetPagerInfoByLid`, `GetRecordName{ByLid,ByMid,ByPid,OnlyByMid}`, listing-instruction
  reads, `GetStatusCodes`, paging metadata (`GetPagingInfo`/`GetPagerCoses`/`GetPagerModels`),
  `GetActiveNotifications`, event templates/activations, assignment XML dumps, and the
  small-result reads (email/phone/`GetStatuses*` family/`GetWorkHours`/notification/event/
  monitoring RPCs).
- **Writes** → CLI `add`/`update`/`delete`/`set`/`assign` + companion `POST`/`PATCH`/`DELETE`:
  person/listing/messaging-id/role, phone, email, pager, instruction, exception,
  personal-contact-device + AMC register, **org/address/specialty**, **on-call
  assign/group/role**, **work-hours**, **message-groups**, the events/step-template
  subsystem, and the `Send*`/`SubmitMessage` paging family.

## Lab verification protocol (full CRUD, self-created only)

Active lab config: `smstetstdb8.ohsu.edu:9722` (ssl, insecure) — confirmed reachable
2026-07-08 (`GetOrgCodes` returned live data).

**Hard safety rule: we only ever delete records we created in the same session.** Every
create captures its returned seqnum/id; deletes target only those captured ids. No
pre-existing lab data is modified or deleted.

Per category:
1. Sweep every **read** live to confirm param names against the server.
2. For **writes**: create → read-back to confirm → delete our own record.
3. Any param mismatch surfaced by the server's validation is fixed in `src/index.ts`,
   the CLI command, the companion route, and the integration test — all four kept in sync.

Carve-out:
- **No page/notification sending, ever.** The 5 paging methods — `SendMessage`,
  `SubmitMessage`, `SendGroupPage`, `SendPageWithAlert`, `SendToSmartAlert` — are wired into
  the CLI and companion from `amcomapi.xml` (correct param names, `tsc`/lint clean) but make
  **zero live lab calls** — any successful call could dispatch a real page. Their
  integration tests are `it.skip` with a comment noting they are intentionally never
  executed. No safe test recipient exists; do not add one.

Note: the PR did **not** wrap the event/step-template *write* subsystem
(`CreateBasicEventTemplate`, `AddStepTemplate*`, `ActivateEvent`, `InitiateRecipientResponse`,
`LogRecipientAnswer`, etc.), so those are out of scope here — no notification-triggering
write path exists in the target set. The only event-related methods in scope are reads
(`GetAllEventTemplates`, `GetEventTemplateDetail`, `GetEventActivations`,
`GetEventActivationDetail`, `GetEventTemplatePrivilege`) and notification/monitoring reads.

## Integration test suite (committed, lab-gated)

- Location: `spok-api/test/integration/`.
- **Gated by `SPOK_LAB=1`** (plus an active lab config); skipped by default so normal
  installs / CI never make live calls.
- Organized by category (reads, org, address, on-call, work-hours, message-groups,
  listings/devices, events). Each test documents the exact verified param shape per RPC
  and, for writes, runs the create→verify→delete-own lifecycle.
- Re-runnable against any lab server via config, turning this session's verification into a
  durable regression asset.

## Error handling

Follows existing conventions:
- CLI: `try/catch` → `printError`; Amcom errors surface `error` + `errorCode` (the parser
  fix in commit `12fefd8` already exposes server `<error errorSource>` messages).
- Companion: `callAmcom` maps unconfigured→503, transport/parse failure→502; route handlers
  return the raw Amcom result; Swagger schema per route.

## Delivery sequence (publish full chain)

1. Lab-verify reads + write CRUD; fix library wrapper param bugs in `src/index.ts`.
2. Commit lab-gated integration suite.
3. Commit CLI commands (same repo/branch as the wrapper fixes).
4. Merge PR #1, tag `v1.2.0` → GitHub Actions (release workflow, publish-on-tag) publishes
   to npm. Note: `package.json` is **already at 1.2.0** in the branch and is the single
   source of version (CLI reads `pkg.version`); npm currently has 1.1.2. No separate version
   constant to touch.
5. Commit `spok-companion` routes + bump its `spok-api` dependency `^1.0.1` → `^1.2.0`.
   (Functionally optional — routes call `execute` directly — but keeps the chain consistent.)

## Out of scope

- `DataFeed*` bulk-ingestion family (intentionally excluded per `UNWRAPPED-RPCS.md`).
- Live-firing real pages/notifications.
- Any change to the WCTP subsystem or existing already-wired RPCs.
