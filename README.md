# Spok API Library & CLI

[![npm version](https://img.shields.io/npm/v/spok-api.svg)](https://www.npmjs.com/package/spok-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/spok-api.svg)](https://nodejs.org)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-orange?logo=buy-me-a-coffee)](https://buymeacoffee.com/automatebldrs)

A TypeScript library and CLI for Spok SmartSuite TCP API operations — on-call scheduling, paging, directory management, and more. Communicates directly with the Spok/Amcom server over the proprietary binary+XML TCP protocol.

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

## Library Usage

```javascript
const SpokService = require("spok-api");

const service = new SpokService({
  host: "spok.example.com",
  port: 9722,
  ssl: true,
  insecure: true, // skip TLS cert verification
  hostFailover: "spok-backup.example.com", // optional failover
});

// Get a listing by messaging ID
const listing = await service.getListingInfoByMid("12766");
console.log(listing);
// { method: "GetListingInfoByMid", data: { listing: { lid: "308787", name: "Worden, Jeremy", ... } } }

// Get SSO username
const sso = await service.getSSOUsername("12766");
console.log(sso.sso_username); // "wordenj"

// Get pager info
const pagers = await service.getPagerInfoByMid("12766");

// Send a page (write operation)
const result = await service.sendPage("12766", "Call ext 4-8311", "1");

// Generic execute for any Amcom method
const raw = await service.execute("GetListingInfo", { lid: "308787" });
```

### TypeScript

```typescript
import SpokService, { SpokServiceOptions, SpokResponse } from "spok-api";

const opts: SpokServiceOptions = {
  host: "spok.example.com",
  port: 9722,
  ssl: true,
};

const service = new SpokService(opts);
const result: SpokResponse = await service.getListingInfo("308787");
```

### Low-level API

For advanced use cases, the protocol internals are also exported:

```javascript
const { amcomRequest, buildRequestXml, parseResponseXml } = require("spok-api");

// Build raw XML
const xml = buildRequestXml("GetListingInfo", { lid: "308787" });

// Send a single request (no failover)
const response = await amcomRequest("spok.example.com", 9722, "GetListingInfo", { lid: "308787" }, true, true);
```

## CLI Usage

### Configure a server

```bash
spok-api config add prod --host spok.example.com --port 9722 --ssl --insecure --read-only
spok-api config add prod-failover --host spok-backup.example.com --port 9722 --ssl --insecure

# Set active server
spok-api config use prod

# List configured servers
spok-api config list
```

### Query data

```bash
# Listings
spok-api get listing 12766                          # by messaging ID
spok-api get listing-by-name "worden" --search-type C  # search by name (contains)
spok-api get listing-by-eid 108676                  # by employee ID
spok-api get listing-by-lid 308787                  # by listing ID

# Pagers & email
spok-api get pager 12766                            # pager IDs for a user
spok-api get pager-info 5032023097                  # full pager details
spok-api get email 12766                            # email address

# Directories
spok-api get directory 308787                       # directory tree
spok-api get directory-info 7056555                 # single directory entry

# On-call
spok-api get oncall-current 12766                   # current on-call assignment
spok-api get oncall-all 12766                       # all assignments

# Exceptions & coverage
spok-api get exception 12766
spok-api get coverage 12766
spok-api get final-covering 12766

# Reference data
spok-api get buildings
spok-api get org-codes
spok-api get phone-types
spok-api get titles
```

### Write operations

Write commands are blocked when `--read-only` is set or the server config has `readOnly: true`.

```bash
# Send a page
spok-api send-page 12766 "Please call ext 4-8311" --priority 1

# Change status
spok-api change-status 12766 2 "AVAILABLE AT OHSU"

# Add resources
spok-api add person --lname Smith --fname John --eid 12345
spok-api add pager --pid 5035551234 --cos LONG_RANGE --model USMO-T5
spok-api add email --mid 12766 --email user@example.com --display-order 1
spok-api add directory --lid 308787 --phnum 503-555-1234 --phtype OFFICE

# Assign resources
spok-api assign pager --mid 12766 --pager-id 5035551234 --display-order 101
spok-api assign messaging-id 308787

# Update resources
spok-api update person 308787 --fname Jonathan
spok-api update directory 7056555 --phnum 503-555-9999

# Delete resources
spok-api delete pager 5035551234
spok-api delete directory --lid 308787 --dirseq 7056555

# Set directory flags
spok-api set directory-enabled --dirseq 7056555 --module SC --flag T
spok-api set directory-published --dirseq 7056555 --module SC --flag T

# Data feed operations
spok-api datafeed add-person --unique-id 12345 --last-name Smith --source HR_FEED
spok-api datafeed update-person --old-id 12345 --new-id 12345 --source HR_FEED --new-last-name Jones
```

### Output formats

```bash
spok-api get listing 12766 --format json    # JSON output
spok-api get listing 12766 --format csv     # CSV output
spok-api get listing 12766 --format table   # ASCII table (default)
spok-api get listing 12766 --clean          # remove null/empty values
```

### Global options

| Option | Description |
|--------|-------------|
| `--format <type>` | Output format: `table`, `json`, `csv` |
| `--server <name>` | Use a specific named server |
| `--host <host>` | Override hostname |
| `--port <port>` | Override TCP port |
| `--ssl` | Use SSL/TLS |
| `--insecure` | Skip TLS certificate verification |
| `--read-only` | Block write operations |
| `--clean` | Remove null/empty values from output |
| `--debug` | Enable debug logging |

## Secret Server Integration

Server configs support [ss-cli](https://github.com/sieteunoseis/ss-cli) placeholders for secure credential management:

```bash
spok-api config add prod --host "<ss:1234:host>" --port 9722 --ssl
```

Placeholders like `<ss:1234:host>` are resolved at runtime by shelling out to `ss-cli`.

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
            "command": "echo 'Checking for write operations...' && echo $TOOL_INPUT | node -e \"const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const c=d.command||''; const writes=['send-page','change-status','add ','update ','delete ','assign ','set ','datafeed ']; if(writes.some(w=>c.includes('spok-api '+w)||c.includes('spok-api '+w))){process.exit(1)}\""
          }
        ]
      }
    ]
  }
}
```

## Available Methods

### SpokService Class Methods

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
| **Generic** | `execute(method, params)` — call any Amcom API method |

## Protocol Details

The Spok SmartSuite TCP API uses a proprietary binary+XML protocol:

- **12-byte header** (big-endian): API version (4 bytes) + reference ID (4 bytes) + body size (4 bytes)
- **XML body**: UTF-8 encoded `<procedureCall>` XML, padded to minimum 1000 bytes
- **Response**: Same header format, body contains `<procedureResult>` with `<success>` or `<failure>`

## Support

If you find this package helpful, consider supporting development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/automatebldrs)

## License

MIT
