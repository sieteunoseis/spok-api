---
name: spok-api-cli
description: Use when managing Spok/Amcom paging systems via the spok-api CLI — on-call schedules, directory lookups, pager management, sending pages, person/listing management, and coverage/exception queries. Connects directly to the Spok SmartSuite TCP API.
license: MIT
metadata:
  author: sieteunoseis
  version: "1.0.0"
---

# Spok API CLI

A CLI and library for Spok SmartSuite TCP API operations — on-call scheduling, paging, directory management, and more.

## Setup

The CLI must be available. Either:

```bash
# Option 1: Use npx (no install needed, works immediately)
npx spok-api --help

# Option 2: Install globally for faster repeated use
npm install -g spok-api
```

If using npx, prefix all commands with `npx`: `npx spok-api get listing 12766`
If installed globally, use directly: `spok-api get listing 12766`

### Configuration

Configure a Spok server:

```bash
spok-api config add <name> --host <hostname> --port <port> --ssl --insecure
```

Use `--insecure` for servers with self-signed or internal certificates. Use `--read-only` to block write operations.

```bash
spok-api config add prod --host spok.example.com --port 9722 --ssl --insecure --read-only
spok-api config add lab --host spok-lab.example.com --port 9722 --ssl --insecure
```

Switch between servers:

```bash
spok-api config use prod
spok-api config list
spok-api config show
```

Config stored at `~/.spok-api/config.json`. Supports [ss-cli](https://github.com/sieteunoseis/ss-cli) `<ss:ID:field>` placeholders for secure credential management.

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

## Common Workflows

### Lookup a person

```bash
spok-api get listing 12766                          # by messaging ID
spok-api get listing-by-name "Smith" --search-type CONTAINS  # search by name
spok-api get listing-by-eid E00001                  # by employee ID
spok-api get listing-by-lid 308787                  # by listing ID
```

### Get contact info

```bash
spok-api get email 12766                            # email address
spok-api get sso 12766                              # SSO username
spok-api get mid jsmith                             # messaging ID from SSO username
spok-api get pager 12766                            # pager IDs
spok-api get pager-info 5551234567                  # full pager details
spok-api get directory 308787                       # phone numbers / directory entries
```

### On-call assignments

```bash
spok-api get oncall-current 10050                   # current on-call for a group
spok-api get oncall-all 10050                       # all assignments for a group
spok-api get oncall-by-id 12766                     # on-call assignments for a person
```

### Exceptions and coverage

```bash
spok-api get exception 12766                        # current exception
spok-api get exceptions 12766                       # all exceptions
spok-api get coverage 12766                         # coverage path
spok-api get final-covering 12766                   # final covering messaging ID
spok-api get final-person 12766                     # final covering person details
```

### Reference data

```bash
spok-api get buildings                              # all buildings
spok-api get org-codes                              # organization codes
spok-api get phone-types                            # phone number types
spok-api get titles                                 # all titles
```

### Group members

```bash
spok-api get group-members 50 --reqlid 100          # static message group members
```

### Send a page

```bash
spok-api send-page 12766 "Please call ext 4-8311" --priority 1
```

### Change status

```bash
spok-api change-status 12766 2 "AVAILABLE AT OHSU"
```

The status code is a numeric code, and the status text is freeform (not validated against the code).

### Add resources

```bash
spok-api add person --lname Smith --fname John --eid E00001
spok-api add pager --pid 5551234567 --cos SMTP --model SMTP
spok-api add email --mid 12766 --email user@example.com --display-order 1
spok-api add email-by-lid --lid 308787 --email user@example.com
spok-api add directory --lid 308787 --phnum 555-123-4567 --phtype OFFICE --title Engineer
spok-api add oncall-member --oncall-mid 10050 --mid 12766
spok-api add group-member --reqlid 100 --grpnum 50 --mbr-lid 200
```

### Assign resources

```bash
spok-api assign pager --mid 12766 --pager-id 5551234567 --display-order 101
spok-api assign messaging-id 308787
spok-api assign email --mid 12766 --email user@example.com --display-order 1
```

### Update resources

```bash
spok-api update person 308787 --fname Jonathan --remark "Updated via API"
spok-api update directory 7056555 --phnum 555-999-0000 --title "Sr. Engineer"
```

### Delete resources

```bash
spok-api delete pager 5551234567
spok-api delete directory --lid 308787 --dirseq 7056555
```

### Set directory flags

```bash
spok-api set directory-enabled --dirseq 7056555 --module "SMART CONSOLE" --flag T
spok-api set directory-published --dirseq 7056555 --module "SMART CONSOLE" --flag T
spok-api set directory-transfer --dirseq 7056555 --module "SMART CONSOLE" --flag T
```

Module names must be the full name as stored in the database (e.g. `SMART CONSOLE`, `SMART WEB`, `SMART SPEECH`, `AMCOM MOBILE CONNECT`).

### Data feed operations

```bash
spok-api datafeed add-person --unique-id EMP001 --last-name Smith --source MEDICALL --employee-id E00001
spok-api datafeed update-person --old-id EMP001 --new-id EMP001 --source MEDICALL --new-last-name Jones
```

Data feed requires three fields: UniqueID, LastName, and SourceSystem. Source system names must be pre-configured in the Spok admin (e.g. `MEDICALL`, `INTELLIDESK`).

## Output Formats

Use `--format` to control output:

- `--format table` — human-readable tables (default)
- `--format json` — structured JSON for parsing
- `--format csv` — CSV for spreadsheet export

Use `--clean` to remove null/empty values from results.

**For AI agents:** Use `--format json` when you need to parse results programmatically.

## Response Behavior

**Read operations** (GET) return the full data payload from the Amcom API.

**Write operations** return a confirmation with no data payload:
- **Success:** `err_message` is empty, `data` is empty
- **Failure:** `err_message` contains the error (typically an Oracle database error)

All responses return HTTP 200 regardless of whether `err_message` is populated. Check `err_message` to determine success or failure.

## Common Errors

| Error | Meaning |
|-------|---------|
| `ORA-00001: unique constraint violated` | Record already exists (duplicate pager, assignment, etc.) |
| `ORA-02291: integrity constraint violated - parent key not found` | Referenced record doesn't exist |
| `ORA-02292: integrity constraint violated - child record found` | Can't delete — other records reference this one |
| `Matching SSO Username was not found` | SSO lookup failed |
| `No exception records found` | No active exceptions (expected, not an error) |
| `Invalid source system name` | Data feed source not configured in Spok admin |

## Global Flags

- `--format table|json|csv` — output format (default: table)
- `--server <name>` — use a specific named server
- `--host <host>` / `--port <port>` — override hostname/port
- `--ssl` — use SSL/TLS
- `--insecure` — skip TLS certificate verification
- `--read-only` — block write operations
- `--clean` — remove null/empty values from output
- `--debug` — enable debug logging (output to stderr)

## Write Safety

Write commands (`send-page`, `change-status`, `add`, `update`, `delete`, `assign`, `set`, `datafeed`) are blocked when:
- The `--read-only` flag is set
- The server config has `readOnly: true`

Always confirm with the user before executing write operations against production servers.
