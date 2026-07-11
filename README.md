# Spok API Library & CLI

[![npm version](https://img.shields.io/npm/v/spok-api.svg)](https://www.npmjs.com/package/spok-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/spok-api.svg)](https://nodejs.org)
[![Skills](https://img.shields.io/badge/skills.sh-spok--api-blue)](https://skills.sh/sieteunoseis/spok-api)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-orange?logo=buy-me-a-coffee)](https://buymeacoffee.com/automatebldrs)

A TypeScript library and CLI for Spok SmartSuite TCP API operations — on-call scheduling, paging, directory management, and more. Communicates directly with the Spok server over the proprietary binary+XML TCP protocol.

## Installation

```bash
npm install spok-api
```

### Global CLI + AI Agent Skills (one-liner)

```bash
npm install -g spok-api && npx skills add sieteunoseis/spok-api
```

### Global CLI install only

```bash
npm install -g spok-api
```

Or run without installing:

```bash
npx spok-api --help
```

## Requirements

If you are using self-signed or internal certificates on the Spok server you may need to disable TLS verification, or use the `--insecure` CLI flag.

## Quick Start

```bash
# Configure a server
spok-api config add prod --host spok.example.com --port 9722 --ssl --insecure --read-only

# Get a listing by messaging ID
spok-api get listing 12766

# Search by name
spok-api get listing-by-name "worden" --search-type C

# Get on-call assignments
spok-api get oncall-current 12766
```

## Configuration

```bash
spok-api config add <name> --host <host> --port <port> --ssl --insecure --read-only
spok-api config add <name> --host-failover <backup-host>   # optional failover
spok-api config use <name>       # switch active server
spok-api config list             # list all servers
spok-api config show             # show active server
spok-api config remove <name>    # remove a server
```

Auth precedence: CLI flags > config file.

Config stored at `~/.spok-api/config.json` (falls back to `~/.spok-cli/config.json`). Supports [ss-cli](https://github.com/sieteunoseis/ss-cli) `<ss:ID:field>` placeholders.

## CLI Commands

The CLI wraps the Amcom Smart Suite TCP API comprehensively — around 200 subcommands across 10 top-level verbs, covering reads and writes for listings, pagers, email, phone, directories, departments, addresses, organizations, on-call, work hours, message groups, instructions, status, exceptions, events/notifications, monitoring, and contact devices, plus live paging.

| Command                                                                                                                    | Description                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get <subcommand>`                                                                                                         | Read data — listings, pagers, email/phone, directories, on-call, exceptions/coverage, status, instructions, events/notifications, monitoring, reference data (~100 subcommands) |
| `add <subcommand>`                                                                                                         | Create records — persons, pagers, email, directories, orgs, addresses, on-call groups/members/roles, message groups, instructions, contact devices, work hours |
| `update <subcommand>`                                                                                                      | Update records — persons, pagers, orgs, addresses, directories, on-call groups/assignments, message groups, instructions, contact devices, work hours          |
| `delete <subcommand>`                                                                                                      | Delete records — pagers, persons, orgs, addresses, directories, on-call groups/assignments, message groups, instructions, work hours, contact devices, exceptions |
| `assign <subcommand>`                                                                                                      | Assign pagers, messaging IDs, email, roles, message priorities, group limits                                                                                    |
| `set <subcommand>`                                                                                                         | Set directory/listing flags (enabled, published, transfer-allowed)                                                                                              |
| `datafeed <subcommand>`                                                                                                    | HR data feed add/update for persons, orgs, specialties                                                                                                          |
| `config <subcommand>`                                                                                                      | Manage server configuration                                                                                                                                     |
| `send-page`, `send-message`, `submit-message`, `send-group-page`, `send-page-with-alert`, `send-to-smart-alert`           | Top-level paging/messaging commands (each takes its own positional args, not nested under a verb)                                                              |
| `change-status`, `change-exception`, `swap-personal-contact-device`, `register-amc-device`, `unregister-amc-device`       | Top-level status/exception/contact-device commands                                                                                                              |

`get`, `add`, `update`, `delete`, `assign`, `set`, `datafeed`, and `config` are verb groups — run e.g. `spok-api get --help` or `spok-api add --help` for their full subcommand list. The paging and status/exception commands above are standalone (run `spok-api --help` to see them all).

### Get subcommands

Representative examples by domain — run `spok-api get --help` for all ~100:

```bash
# Listings
spok-api get listing <mid>              # listing by messaging ID
spok-api get listing-by-name <name>     # search by name (--search-type, --midflag)
spok-api get listing-by-eid <eid>       # listing by employee ID
spok-api get listing-by-lid <lid>       # listing by listing ID

# Pagers & contact devices
spok-api get pager <mid>                # pager IDs for a user
spok-api get pager-info <pid>           # full pager details
spok-api get assigned-contact-devices <lid>
spok-api get unassigned-contact-devices <lid>

# Email / phone / SSO
spok-api get email <mid>                # email address
spok-api get phone-number <mid>         # phone number
spok-api get sso <mid>                  # SSO username
spok-api get mid <ssoUsername>          # messaging ID by SSO username

# Directories & departments
spok-api get directory <lid>            # directory tree (--phtype filter)
spok-api get directory-info <dirseq>    # single directory entry
spok-api get departments                # all departments
spok-api get department-hierarchy <dirseq>

# On-call, exceptions & coverage
spok-api get oncall-current <group_mid> # current on-call assignments
spok-api get oncall-all <group_mid>     # all on-call assignments
spok-api get exceptions <mid>           # all exceptions
spok-api get coverage <mid>             # coverage path
spok-api get final-covering <mid>       # final covering ID

# Status
spok-api get status <mid>               # current status
spok-api get status-codes               # all status codes

# Instructions, events & monitoring
spok-api get listing-instructions <lid>
spok-api get event-templates <reqlid>
spok-api get monitor-event-status-summary

# Reference data
spok-api get org-codes                  # all organization codes
spok-api get phone-types                # all phone types
spok-api get buildings                  # all buildings
spok-api get titles                     # all titles
spok-api get pager-models               # pager model catalog
```

### Write operations

Write commands are blocked when `--read-only` is set or the server config has `readOnly: true`. Representative examples — run `spok-api add --help`, `spok-api update --help`, `spok-api delete --help`, `spok-api assign --help`, `spok-api set --help` for the full list:

```bash
# Paging & status
spok-api send-page 12766 "Please call ext 4-8311" --priority 1
spok-api send-group-page 50 "Team meeting at 3pm" --priority 1
spok-api change-status 12766 2 "AVAILABLE AT OHSU"
spok-api change-exception 12766 1 "Out sick" "back tomorrow"

# Persons, pagers, email
spok-api add person --lname Smith --fname John --eid 12345
spok-api add pager --pid 5035551234 --cos LONG_RANGE --model USMO-T5
spok-api add email --mid 12766 --email user@example.com --display-order 1
spok-api update person 308787 --fname Jonathan
spok-api delete pager 5035551234

# Assignment
spok-api assign pager --mid 12766 --pager-id 5035551234 --display-order 101
spok-api assign messaging-id 308787

# Directories, orgs, addresses
spok-api add directory --lid 308787 --phnum 5035551234 --phtype OFFICE
spok-api update org 4001 --orgname "Cardiology"
spok-api add address --addr1 "3181 SW Sam Jackson Park Rd" --city Portland --state OR --pcode 97239
spok-api set directory-enabled --dirseq 7056555 --module SC --flag T

# On-call, message groups, work hours, instructions
spok-api add oncall-group --oncall-mid 18427 --name "Cardiology On-Call"
spok-api update oncall-assignment 55001 --start-date "01-JAN-27 00:00:00"
spok-api add message-group --reqlid 308787 --gname "IT Alerts" --acode 1
spok-api add work-hour --lid 308787 --cltype "ON HOURS" --stime "08:00 AM" --etime "05:00 PM" --wdays "MON,TUE,WED"
spok-api add instruction --lid 308787 --itext "Page for STAT only"
spok-api delete exception 12766 1

# Contact devices
spok-api add personal-contact-device 308787 --cltype "ON HOURS" --devtype PAGER --devid 5035551234
spok-api register-amc-device 12766 5035551234 user@example.com

# Data feed
spok-api datafeed add-person --unique-id 12345 --last-name Smith --source HR_FEED
```

## Testing

A lab-gated integration suite lives under `test/integration/` and runs against a real Spok server:

```bash
SPOK_LAB=1 node --test --test-concurrency=1 test/integration/**/*.test.js
```

- Without `SPOK_LAB=1`, live tests are skipped (safe to run in CI/normal dev).
- **Reads** are live-verified against the configured lab server.
- **Writes** follow a create → verify → delete-own pattern: each test creates a throwaway record, confirms it via a read, then deletes only the record it created — never touching existing data.
- **Paging** is fully wired (library method + CLI command + integration test), but the send-oriented RPCs (`SendMessage`, `SubmitMessage`, `SendGroupPage`, `SendPageWithAlert`, `SendToSmartAlert`) are `test.skip`'d and never auto-fired, per a standing "no live page/notification sends from automation" constraint.

## Global Flags

| Flag                        | Description                          |
| --------------------------- | ------------------------------------ |
| `--format table\|json\|csv` | Output format (default: table)       |
| `--server <name>`           | Use a specific named server          |
| `--host <host>`             | Override hostname                    |
| `--port <port>`             | Override TCP port                    |
| `--ssl`                     | Use SSL/TLS                          |
| `--insecure`                | Skip TLS certificate verification    |
| `--read-only`               | Block write operations               |
| `--clean`                   | Remove empty/null values from output |
| `--debug`                   | Enable debug logging                 |

## Library API

```javascript
const SpokService = require("spok-api");

const service = new SpokService({
  host: "spok.example.com",
  port: 9722,
  ssl: true,
  insecure: true,
  hostFailover: "spok-backup.example.com",
});

// Named methods
await service.getListingInfoByMid("12766");
await service.getSSOUsername("12766");
await service.getPagerInfoByMid("12766");
await service.sendPage("12766", "Call ext 4-8311", "1");

// Generic execute for any SmartSuite method
await service.execute("GetListingInfo", { lid: "308787" });
```

### TypeScript

```typescript
import SpokService, { SpokServiceOptions, SpokResponse } from "spok-api";

const service = new SpokService({
  host: "spok.example.com",
  port: 9722,
  ssl: true,
});
const result: SpokResponse = await service.getListingInfo("308787");
```

### Low-level API

```javascript
const { amcomRequest, buildRequestXml, parseResponseXml } = require("spok-api");

const xml = buildRequestXml("GetListingInfo", { lid: "308787" });
const response = await amcomRequest(
  "spok.example.com",
  9722,
  "GetListingInfo",
  { lid: "308787" },
  true,
  true,
);
```

### Available Methods

| Category          | Methods                                                                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Listings**      | `getListingInfo`, `getListingInfoByMid`, `getListingsByName`, `getListingsByEid`, `getListingsBySsn`, `getListingsByUdf`                                                                                                                             |
| **SSO/MID**       | `getSSOUsername`, `getMessagingID`, `assignMessagingId`                                                                                                                                                                                              |
| **Pagers**        | `getPagerId`, `getPagerInfo`, `getPagerInfoByMid`, `addPager`, `assignPager`, `deletePager`                                                                                                                                                          |
| **Email**         | `getEmailAddress`, `addEmailAddress`, `addEmailAddressByLid`                                                                                                                                                                                         |
| **Directories**   | `getListingDirectories`, `getDirectoryInfo`, `addListingDirectory`, `updateDirectory`, `deleteListingDirectory`, `setDirectoryEnabled`, `setDirectoryPublished`, `setDirectoryTransferAllowed`                                                       |
| **Persons**       | `addPerson`, `updatePerson`                                                                                                                                                                                                                          |
| **Status/Paging** | `changeStatus`, `sendPage`                                                                                                                                                                                                                           |
| **Groups**        | `getMessageGroupMembers`, `addOncallGroupMember`, `addStaticMessageGroupMember`                                                                                                                                                                      |
| **On-call**       | `getGroupsCurrentAssignments`, `getGroupsAssignments`, `getIdsCurrentAssignments`, `getIdsAssignments`, `getCurrentAssignmentWithExceptions`, `getCurrentAssignmentLids`, `getOncallGroupRoles`, `getGroupsCurrAssignXml`, `getGroupsAssignmentsXml` |
| **Exceptions**    | `getCurrentException`, `getExceptions`, `getExceptionList`                                                                                                                                                                                           |
| **Coverage**      | `getCoveragePath`, `getFinalCoveringId`, `getFinalCoveringPerson`                                                                                                                                                                                    |
| **Reference**     | `getOrgCodes`, `getPhoneNumberTypes`, `getAllBuildings`, `getTitles`                                                                                                                                                                                 |
| **Data Feed**     | `dataFeedAddPerson`, `dataFeedUpdatePerson`                                                                                                                                                                                                          |
| **Generic**       | `execute(method, params)` — call any SmartSuite API method                                                                                                                                                                                           |

## Hooks (Write Safety)

When using spok-api with an AI agent like [Claude Code](https://docs.anthropic.com/en/docs/claude-code/hooks), you should add a hook to block write operations and require explicit approval.

**Quick install** with [cc-hooks-install](https://github.com/sieteunoseis/cc-hooks-install):

```bash
npx cc-hooks-install add sieteunoseis/spok-api
```

Or **manually** add this to `~/.claude/settings.json` or `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | { read -r cmd; if echo \"$cmd\" | grep -qE '^(npx )?spok-api (send-page|change-status|add |update |delete |assign |set |datafeed )'; then echo '{\"decision\":\"block\",\"reason\":\"BLOCKED: spok-api write operation. Get explicit user approval.\"}'; fi; }"
          }
        ]
      }
    ]
  }
}
```

This blocks all write operations while allowing reads (`get`, `config`) to pass through:

| Blocked keywords | Operations                                                 |
| ---------------- | ---------------------------------------------------------- |
| `send-page`      | Send a live page                                           |
| `change-status`  | Change listing status                                      |
| `add`            | Create persons, pagers, emails, directories, group members |
| `update`         | Modify persons and directory entries                       |
| `delete`         | Remove pagers and directory entries                        |
| `assign`         | Assign pagers, messaging IDs, emails                       |
| `set`            | Change directory flags                                     |
| `datafeed`       | HR data feed add/update                                    |

See [docs/claude-code-hooks.md](docs/claude-code-hooks.md) for the full command-by-command reference, how the hook works, how to test it, and alternative approaches like `--read-only`.

## Field Reference

| Field       | Name                       | What it is                                                                | Example      |
| ----------- | -------------------------- | ------------------------------------------------------------------------- | ------------ |
| `lid`       | Listing ID                 | Unique ID for a person record (primary key, auto-assigned on add)         | `300001`     |
| `mid`       | Messaging ID               | ID used for paging/on-call routing — a person can exist without one       | `10001`      |
| `eid`       | Employee ID                | HR employee number (external, from data feed)                             | `E00001`     |
| `pid`       | Pager ID                   | A specific pager device number or address                                 | `5551234567` |
| `dirseq`    | Directory Sequence         | Unique ID for a directory entry (phone number, room, etc.)                | `7000001`    |
| `grpnum`    | Group Number               | Static message group number                                               | `50`         |
| `group_mid` | Group Messaging ID         | Messaging ID assigned to an on-call group (same namespace as person MIDs) | `10050`      |
| `ssoun`     | SSO Username               | Single sign-on username                                                   | `jsmith`     |
| `scode`     | Status Code                | Numeric status code for a listing                                         | `2`          |
| `stext`     | Status Text                | Freeform status display text (not validated against scode)                | `AVAILABLE`  |
| `cos`       | Class of Service           | Pager routing/protocol class                                              | `LONG_RANGE` |
| `cog`       | Company/Organization Group | Top-level organization identifier                                         | `ACME`       |

## Response Behavior

**Read operations** (GET) return the full data payload from the Amcom API.

**Write operations** (POST via CLI: `add`, `update`, `delete`, `assign`, `set`, `send-page`, `change-status`, `datafeed`) return a confirmation response with no data payload:

- **Success**: `err_message` is empty, `data` is empty — the operation completed
- **Failure**: `err_message` contains the error (typically an Oracle database error)

All responses return HTTP 200 regardless of whether `err_message` is populated. Check `err_message` to determine success or failure.

## Common Error Messages

The Amcom API passes Oracle database errors through directly. Common ones you may encounter:

| Error                                                               | Meaning                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ORA-00001: unique constraint (ATMS.XPK_PAGER_ASSIGNMENT) violated` | Pager already assigned to someone                                               |
| `ORA-00001: unique constraint (ATMS.XPK_PAGER) violated`            | Pager ID already exists (on `add pager`)                                        |
| `ORA-02291: integrity constraint violated - parent key not found`   | Referenced record doesn't exist (e.g. assigning a pager that hasn't been added) |
| `ORA-02292: integrity constraint violated - child record found`     | Can't delete — other records reference this one                                 |
| `ORA-01400: cannot insert NULL`                                     | A required field was missing                                                    |
| `Matching SSO Username was not found`                               | SSO lookup failed (Amcom-level, not Oracle)                                     |
| `No exception records found`                                        | No active exceptions — expected behavior, not an error                          |
| `No listing found`                                                  | No listing matches the search criteria                                          |

## Protocol Details

The Spok SmartSuite TCP API uses a proprietary binary+XML protocol:

- **12-byte header** (big-endian): API version (4 bytes) + reference ID (4 bytes) + body size (4 bytes)
- **XML body**: UTF-8 encoded `<procedureCall>` XML, padded to minimum 1000 bytes
- **Response**: Same header format, body contains `<procedureResult>` with `<success>` or `<failure>`

## Giving Back

If you found this helpful, consider:

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/automatebldrs)

## License

MIT
