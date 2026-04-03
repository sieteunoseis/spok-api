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

### Global CLI install

```bash
npm install -g spok-api
```

Or run without installing:

```bash
npx spok-api --help
```

### AI Agent Skills

```bash
npx skills add sieteunoseis/spok-api
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

| Command | Description |
|---------|-------------|
| `get <subcommand>` | Query listings, pagers, email, directories, on-call, exceptions, coverage, reference data |
| `send-page <mid> <text>` | Send a page to a messaging ID |
| `change-status <mid> <code> <text>` | Change a listing's status |
| `add <subcommand>` | Add persons, pagers, email, directories, group members |
| `update <subcommand>` | Update persons, directories |
| `delete <subcommand>` | Delete pagers, directories |
| `assign <subcommand>` | Assign pagers, messaging IDs, email |
| `set <subcommand>` | Set directory flags (enabled, published, transfer-allowed) |
| `datafeed <subcommand>` | Data feed add/update person |
| `config <subcommand>` | Manage server configuration |

### Get subcommands

```bash
spok-api get listing <mid>              # listing by messaging ID
spok-api get listing-by-name <name>     # search by name (--search-type, --midflag)
spok-api get listing-by-eid <eid>       # listing by employee ID
spok-api get listing-by-lid <lid>       # listing by listing ID
spok-api get pager <mid>                # pager IDs for a user
spok-api get pager-info <pid>           # full pager details
spok-api get pager-by-mid <mid>         # pager info by messaging ID
spok-api get email <mid>                # email address
spok-api get sso <mid>                  # SSO username
spok-api get mid <ssoUsername>          # messaging ID by SSO username
spok-api get directory <lid>            # directory tree (--phtype filter)
spok-api get directory-info <dirseq>    # single directory entry
spok-api get group-members <grpnum>     # group members (--reqlid required)
spok-api get oncall-current <group_mid> # current on-call assignments
spok-api get oncall-all <group_mid>     # all on-call assignments
spok-api get oncall-by-id <mid>         # on-call by messaging ID
spok-api get exception <mid>            # current exception
spok-api get exceptions <mid>           # all exceptions
spok-api get coverage <mid>             # coverage path
spok-api get final-covering <mid>       # final covering ID
spok-api get final-person <mid>         # final covering person
spok-api get org-codes                  # all organization codes
spok-api get phone-types                # all phone types
spok-api get buildings                  # all buildings
spok-api get titles                     # all titles
```

### Write operations

Write commands are blocked when `--read-only` is set or the server config has `readOnly: true`.

```bash
spok-api send-page 12766 "Please call ext 4-8311" --priority 1
spok-api change-status 12766 2 "AVAILABLE AT OHSU"
spok-api add person --lname Smith --fname John --eid 12345
spok-api add pager --pid 5035551234 --cos LONG_RANGE --model USMO-T5
spok-api add email --mid 12766 --email user@example.com --display-order 1
spok-api assign pager --mid 12766 --pager-id 5035551234 --display-order 101
spok-api update person 308787 --fname Jonathan
spok-api delete pager 5035551234
spok-api set directory-enabled --dirseq 7056555 --module SC --flag T
spok-api datafeed add-person --unique-id 12345 --last-name Smith --source HR_FEED
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--format table\|json\|csv` | Output format (default: table) |
| `--server <name>` | Use a specific named server |
| `--host <host>` | Override hostname |
| `--port <port>` | Override TCP port |
| `--ssl` | Use SSL/TLS |
| `--insecure` | Skip TLS certificate verification |
| `--read-only` | Block write operations |
| `--clean` | Remove empty/null values from output |
| `--debug` | Enable debug logging |

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

const service = new SpokService({ host: "spok.example.com", port: 9722, ssl: true });
const result: SpokResponse = await service.getListingInfo("308787");
```

### Low-level API

```javascript
const { amcomRequest, buildRequestXml, parseResponseXml } = require("spok-api");

const xml = buildRequestXml("GetListingInfo", { lid: "308787" });
const response = await amcomRequest("spok.example.com", 9722, "GetListingInfo", { lid: "308787" }, true, true);
```

### Available Methods

| Category | Methods |
|----------|---------|
| **Listings** | `getListingInfo`, `getListingInfoByMid`, `getListingsByName`, `getListingsByEid`, `getListingsBySsn`, `getListingsByUdf` |
| **SSO/MID** | `getSSOUsername`, `getMessagingID`, `assignMessagingId` |
| **Pagers** | `getPagerId`, `getPagerInfo`, `getPagerInfoByMid`, `addPager`, `assignPager`, `deletePager` |
| **Email** | `getEmailAddress`, `addEmailAddress`, `addEmailAddressByLid` |
| **Directories** | `getListingDirectories`, `getDirectoryInfo`, `addListingDirectory`, `updateDirectory`, `deleteListingDirectory`, `setDirectoryEnabled`, `setDirectoryPublished`, `setDirectoryTransferAllowed` |
| **Persons** | `addPerson`, `updatePerson` |
| **Status/Paging** | `changeStatus`, `sendPage` |
| **Groups** | `getMessageGroupMembers`, `addOncallGroupMember`, `addStaticMessageGroupMember` |
| **On-call** | `getGroupsCurrentAssignments`, `getGroupsAssignments`, `getIdsCurrentAssignments`, `getIdsAssignments`, `getCurrentAssignmentWithExceptions`, `getCurrentAssignmentLids`, `getOncallGroupRoles`, `getGroupsCurrAssignXml`, `getGroupsAssignmentsXml` |
| **Exceptions** | `getCurrentException`, `getExceptions`, `getExceptionList` |
| **Coverage** | `getCoveragePath`, `getFinalCoveringId`, `getFinalCoveringPerson` |
| **Reference** | `getOrgCodes`, `getPhoneNumberTypes`, `getAllBuildings`, `getTitles` |
| **Data Feed** | `dataFeedAddPerson`, `dataFeedUpdatePerson` |
| **Generic** | `execute(method, params)` — call any SmartSuite API method |

## Hooks (Write Safety)

When using spok-api as a CLI tool managed by an AI agent (e.g. Claude Code), you can add a hook to require confirmation before write operations:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "intercept",
            "command": "echo 'Checking for write operations...' && echo $TOOL_INPUT | node -e \"const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const c=d.command||''; const writes=['send-page','change-status','add ','update ','delete ','assign ','set ','datafeed ']; if(writes.some(w=>c.includes('spok-api '+w))){process.exit(1)}\""
          }
        ]
      }
    ]
  }
}
```

## Field Reference

| Field | Name | What it is | Example |
|-------|------|-----------|---------|
| `lid` | Listing ID | Unique ID for a person record (primary key, auto-assigned on add) | `300001` |
| `mid` | Messaging ID | ID used for paging/on-call routing — a person can exist without one | `10001` |
| `eid` | Employee ID | HR employee number (external, from data feed) | `E00001` |
| `pid` | Pager ID | A specific pager device number or address | `5551234567` |
| `dirseq` | Directory Sequence | Unique ID for a directory entry (phone number, room, etc.) | `7000001` |
| `grpnum` | Group Number | Static message group number | `50` |
| `group_mid` | Group Messaging ID | Messaging ID assigned to an on-call group (same namespace as person MIDs) | `10050` |
| `ssoun` | SSO Username | Single sign-on username | `jsmith` |
| `scode` | Status Code | Numeric status code for a listing | `2` |
| `stext` | Status Text | Freeform status display text (not validated against scode) | `AVAILABLE` |
| `cos` | Class of Service | Pager routing/protocol class | `LONG_RANGE` |
| `cog` | Company/Organization Group | Top-level organization identifier | `ACME` |

## Common Error Messages

The Amcom API passes Oracle database errors through directly. Common ones you may encounter:

| Error | Meaning |
|-------|---------|
| `ORA-00001: unique constraint (ATMS.XPK_PAGER_ASSIGNMENT) violated` | Pager already assigned to someone |
| `ORA-00001: unique constraint (ATMS.XPK_PAGER) violated` | Pager ID already exists (on `add pager`) |
| `ORA-02291: integrity constraint violated - parent key not found` | Referenced record doesn't exist (e.g. assigning a pager that hasn't been added) |
| `ORA-02292: integrity constraint violated - child record found` | Can't delete — other records reference this one |
| `ORA-01400: cannot insert NULL` | A required field was missing |
| `Matching SSO Username was not found` | SSO lookup failed (Amcom-level, not Oracle) |
| `No exception records found` | No active exceptions — expected behavior, not an error |
| `No listing found` | No listing matches the search criteria |

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
