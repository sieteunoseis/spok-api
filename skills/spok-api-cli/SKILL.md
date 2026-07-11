---
name: spok-api-cli
description: Use when managing Spok/Amcom paging systems via the spok-api CLI — on-call schedules, directory lookups, pager management, sending pages, person/listing management, and coverage/exception queries. Connects directly to the Spok SmartSuite TCP API.
license: MIT
metadata:
  author: sieteunoseis
  version: "1.2.1"
---

# Spok API CLI

A CLI and library for Spok SmartSuite TCP API operations — on-call scheduling, paging, directory management, and more.

The CLI wraps the Amcom Smart Suite TCP API comprehensively — around 190 subcommands across 10 top-level verbs (`get`, `add`, `update`, `delete`, `assign`, `set`, `datafeed`, `config`, plus standalone paging/status commands). This document covers representative examples grouped by domain. **The full authoritative command list is always `spok-api --help` and `spok-api <group> --help`** (e.g. `spok-api get --help`, `spok-api add --help`) — run these to see every subcommand and its exact flags before guessing.

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
| `group_mid` | Group Messaging ID | Messaging ID assigned to an on-call group (same namespace as person MIDs; also called `oncall_mid`/`ocmid` on group-role/member commands) | `10050` |
| `ssoun` | SSO Username | Single sign-on username | `jsmith` |
| `scode` | Status Code | Numeric status code for a listing | `2` |
| `stext` | Status Text | Freeform status display text (not validated against scode) | `AVAILABLE` |
| `orgseq` | Organization Sequence | Unique ID for an organization record | `100` |
| `addseq` | Address Sequence | Unique ID for an address record | `5001` |
| `phrseq` | Work Hour Sequence | Unique ID for a work-hour entry on a listing (from `get work-hours`) | `12` |
| `seqnum` | Instruction Sequence | Unique ID for a listing instruction | `4521` |
| `pdoseq` | Personal Contact Device Sequence | Unique ID for a personal contact device entry | `88` |
| `exseq` | Exception Sequence | Unique ID for an exception record (pairs with `mid` on `delete exception`) | `3` |
| `fid` | Feed ID / Facility ID | Two distinct meanings depending on command: the data-feed lookup key on `get listing-by-fid` / `status-by-feed-id`, OR the facility ID field on a person record via `add/update person --fid` | `F00123` |
| `evid` | Event Template ID | Unique ID for an event notification template | `77` |

## Common Workflows

### Lookup a person

```bash
spok-api get listing 12766                          # by messaging ID
spok-api get listing-by-name "Smith" --search-type CONTAINS  # search by name
spok-api get listing-by-eid E00001                  # by employee ID
spok-api get listing-by-lid 308787                  # by listing ID
spok-api get listing-by-lastname Smith --search-type CONTAINS  # last-name search
spok-api get listing-by-fid F00123                  # by data-feed ID
```

More variants exist (`listing-by-ssn`, `listing-by-udf`) — see `spok-api get --help`.

### Record name lookups (fast, name-only)

```bash
spok-api get record-name-by-lid 308787
spok-api get record-name-by-mid 12766
spok-api get record-name-by-pid 5551234567
spok-api get record-name-only-by-mid 12766          # fastest name-only lookup
```

### Get contact info

```bash
spok-api get email 12766                            # email address
spok-api get sso 12766                              # SSO username
spok-api get mid jsmith                             # messaging ID from SSO username
spok-api get pager 12766                            # pager IDs
spok-api get pager-info 5551234567                  # full pager details
spok-api get directory 308787                       # phone numbers / directory entries
spok-api get phone-number 12766                     # phone number(s) by messaging ID
spok-api get phone-number-by-lid 308787             # phone number(s) by listing ID
```

Pager/device reads also include `pager-by-mid`, `pager-info-by-lid`, `unassigned-contact-devices --cltype`, `assigned-contact-devices --cltype`, `is-pager-by-dirseq`, `is-pager-by-lid`, `is-pager-by-phone`. Email reads also include `email-addresses`, `email-by-lid`, `email-by-order`, `caller-email`. Run `spok-api get --help` for the complete set.

### Status family

```bash
spok-api get status 12766                           # status of a messaging ID
spok-api get status-codes                            # status code reference table
spok-api get status-by-eid E00001                    # statuses by employee ID
spok-api get status-by-lastname Smith --search-type CONTAINS
spok-api get status-by-latest-date 01-JUL-26          # statuses updated since a date
```

Other status lookups follow the same pattern as listing search (`status-by-feed-id`, `status-by-name`, `status-by-ssn`, `status-by-udf`, `id-status`) — see `spok-api get --help`.

### Organizations, addresses, departments

```bash
spok-api get org-codes                               # all organization codes
spok-api get addresses                               # all addresses
spok-api get address-types                           # address type reference list
spok-api get departments                             # full department list
spok-api get department-hierarchy 308787              # hierarchical dept tree by dirseq
```

### On-call assignments

```bash
spok-api get oncall-current 10050                   # current on-call for a group
spok-api get oncall-all 10050                       # all assignments for a group
spok-api get oncall-by-id 12766                     # on-call assignments for a person
spok-api get oncall-group-roles                     # on-call group roles reference
```

For date-ranged and XML views:

```bash
spok-api get id-assignments 12766 --start-date 01-JUL-26 --end-date 31-JUL-26 --timezone "America/Los_Angeles"
spok-api get id-assignments-xml 12766 --ocastart 01-JUL-26 --ocaend 31-JUL-26 --tz "America/Los_Angeles"
spok-api get id-curr-assign-xml 12766 --tz "America/Los_Angeles"
spok-api get group-assignments-xml 10050 --ocastart 01-JUL-26 --ocaend 31-JUL-26
spok-api get group-curr-assign-xml 10050
```

### Listing instructions

```bash
spok-api get listing-instructions 308787            # instructions on a listing
spok-api get instruction-info 4521                  # detail for a given instruction
spok-api get shared-listing-instruction 4521        # listings an instruction is shared with
```

### Events, notifications, and monitoring

```bash
spok-api get active-notifications 100               # active notifications visible to a listing
spok-api get event-templates 100                    # event templates visible to a listing
spok-api get event-template-detail 100 77            # template detail (reqlid, evid)
spok-api get event-activations 100 --ssflag S        # event activations
spok-api get event-status 55012                     # status of an activated event
spok-api get monitor-event-status --lid 100 --evrseq 55012
spok-api get monitor-step-responses --lid 100 --stepseq 9001
```

Related but less common: `event-activation-detail`, `event-template-privilege`, `notification-status`, `notification-step-queries`, `activation-recipient-count`, `template-recipient-count`, `query-template-info`, `monitor-event-detail`, `monitor-proc-status-summary`, `monitor-step-status-summary` — see `spok-api get --help`.

### Work hours

```bash
spok-api get work-hours 308787                       # work hours by listing ID
```

### Exceptions and coverage

```bash
spok-api get exception 12766                        # current exception
spok-api get exceptions 12766                        # all exceptions
spok-api get exception-list 12766                     # exception list by messaging ID
spok-api get coverage 12766                          # coverage path
spok-api get final-covering 12766                    # final covering messaging ID
spok-api get final-person 12766                      # final covering person details
```

### Group members

```bash
spok-api get group-members 50 --reqlid 100           # static message group members
spok-api get message-groups 100                      # message groups visible to a listing
```

### Reference data

```bash
spok-api get buildings                               # all buildings
spok-api get org-codes                               # organization codes
spok-api get phone-types                             # phone number types
spok-api get titles                                  # all titles
```

Also available: `directory-types`, `pager-coses`, `pager-models`, `page-routes`.

### Send a page

```bash
spok-api send-page 12766 "Please call ext 4-8311" --priority 1
```

### Paging family — DISPATCHES REAL PAGES/MESSAGES

`send-page` is joined by five more standalone paging/messaging commands. **All of these place real messages or pages on a live server** — confirm with the user before running any of them outside a lab:

```bash
spok-api send-message 12766 "FYI - shift change at 7pm" --send-to-covering-id F
spok-api submit-message 100 "Please call back" --priority 1 --smid 12766
spok-api send-group-page 50 "All hands meeting at 3pm" --priority 1
spok-api send-page-with-alert 12766 "URGENT: call back now" --priority 1
spok-api send-to-smart-alert ALERT "System maintenance tonight"
```

### Change status

```bash
spok-api change-status 12766 2 "AVAILABLE AT OHSU"
```

The status code is a numeric code, and the status text is freeform (not validated against the code).

### Exceptions (write)

```bash
spok-api change-exception 12766 VACATION "Out of office" "Back Monday" --start-date 01-JUL-26 --end-date 07-JUL-26
spok-api delete exception 12766 3                    # mid, exseq
```

`change-exception` creates a new exception, or updates an existing one if `--exception-seqnum` is passed.

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

### Organizations, addresses (CRUD)

```bash
spok-api add org --orgname "Cardiology" --orgcode CARD
spok-api update org 100 --orgname "Cardiology Dept"
spok-api delete org 100

spok-api add address --addr1 "3181 SW Sam Jackson Park Rd" --city Portland --state OR --pcode 97239
spok-api update address 5001 --city Portland --pcode 97239
spok-api delete address 5001
```

### On-call (groups, roles, assignments, members)

```bash
spok-api add oncall-group --oncall-mid 10099 --name "Cardiology On-Call"
spok-api add oncall-assignment --group-mid 10050 --mid 12766 --start-date "01-JAN-26 00:00:00" --end-date "31-DEC-26 00:00:00"
spok-api add oncall-group-role --ocmid 10050 --ocrole Backup
spok-api update oncall-assignment 55012 --end-date "01-FEB-26 00:00:00"
spok-api update oncall-group 10050 --name "Cardiology On-Call Team"
spok-api delete oncall-assignment 55012
spok-api delete oncall-group-role --ocmid 10050 --ocrole Backup
spok-api delete oncall-group-member --oncall-mid 10050 --mid 12766
spok-api delete oncall-group 10099
```

### Work hours (write)

```bash
spok-api add work-hour --lid 308787 --cltype "ON HOURS" --stime "08:00 AM" --etime "05:00 PM" --wdays "MON,TUE,WED"
spok-api update work-hour 308787 --phrseq 12 --etime "06:00 PM"
spok-api delete work-hour 308787 --phrseq 12
spok-api delete work-hours 308787                    # unassign all work hours
```

### Message groups (write)

```bash
spok-api add message-group --reqlid 100 --gname "Rapid Response" --acode 1
spok-api update message-group 50 --reqlid 100 --gname "Rapid Response Team"
spok-api update message-group-member 50 200 --reqlid 100 --dorder 2
spok-api delete message-group 50 --reqlid 100
spok-api delete message-group-member 50 200 --reqlid 100
```

### Listing instructions (write)

```bash
spok-api add instruction --lid 308787 --itext "Call answering service after hours"
spok-api add instruction-share 4521 308788           # share an instruction with another listing
spok-api update instruction 4521 --itext "Updated instructions"
spok-api delete instruction 4521 --lid 308787
```

### Personal contact devices

```bash
spok-api add personal-contact-device 308787 --cltype "ON HOURS" --devtype PAGER --devid 5551234567
spok-api update personal-contact-device 88 --dorder 2
spok-api swap-personal-contact-device 88 2           # swap display order with whoever holds it
spok-api delete personal-contact-device 88
spok-api delete personal-contact-devices 308787       # delete all device options for a listing
spok-api delete contact-devices 308787                # unassign all contact devices
```

### Listing / people writes

```bash
spok-api set listing-enabled 308787 --module "SMART CONSOLE" --flag T
spok-api assign role 308787 --role Physician
spok-api assign message-priorities 308787 --min-mprior 1 --max-mprior 5
spok-api assign group-limits 308787 --max-mgroups 10 --max-mgroup-mbrs 50
spok-api update messaging-id 308787 --mid 12766
spok-api delete person 308787
```

### Assign resources

```bash
spok-api assign pager --mid 12766 --pager-id 5551234567 --display-order 101
spok-api assign pager-by-lid 308787 --pid 5551234567
spok-api assign messaging-id 308787
spok-api assign email --mid 12766 --email user@example.com --display-order 1
```

### Update resources

```bash
spok-api update person 308787 --fname Jonathan --remark "Updated via API"
spok-api update directory 7056555 --phnum 555-999-0000 --title "Sr. Engineer"
spok-api update pager 5551234567 --cos SMTP
spok-api update email-by-lid 308787 --old-emaddr old@example.com --new-emaddr new@example.com
```

### Delete resources

```bash
spok-api delete pager 5551234567
spok-api delete directory --lid 308787 --dirseq 7056555
spok-api delete email-by-lid 308787 --emaddr old@example.com
spok-api delete phone-number 308787 --phone-number 555-123-4567
```

### AMC device registration

```bash
spok-api register-amc-device 12766 5551234567 user@example.com
spok-api unregister-amc-device 12766 5551234567
```

The pager (`pid`) must already be assigned to the listing before registering/unregistering.

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
spok-api datafeed org --source MEDICALL --org-code CARD --org-name Cardiology
spok-api datafeed specialty --unique-id EMP001 --source MEDICALL --specialty-code CARD --specialty Cardiology
```

Data feed requires three fields: UniqueID, LastName, and SourceSystem. Source system names must be pre-configured in the Spok admin (e.g. `MEDICALL`, `INTELLIDESK`). `datafeed org` and `datafeed specialty` are IUD (insert/update/delete) operations — pass `--delete-org-code` / `--delete-specialty-code` to remove instead of add/update.

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

Write commands are blocked when the `--read-only` flag is set or the active server config has `readOnly: true`. This covers every subcommand under `add`, `update`, `delete`, `assign`, `set`, and `datafeed`, plus the standalone write commands: `send-page`, `send-message`, `submit-message`, `send-group-page`, `send-page-with-alert`, `send-to-smart-alert`, `change-status`, `change-exception`, `swap-personal-contact-device`, `register-amc-device`, and `unregister-amc-device`.

The paging/messaging commands (`send-page` and its five siblings) dispatch real pages or messages against a live server — always confirm with the user before running any of them outside a lab/dev environment, in addition to the general caution to confirm before executing write operations against production servers.
