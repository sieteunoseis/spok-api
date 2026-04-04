# Claude Code Hooks for spok-api

## Why Use Hooks?

spok-api manages a production paging system — sending pages, changing on-call status, adding/removing pagers, and modifying person records in Spok SmartSuite. When an AI agent like Claude Code has access to the CLI, a single misunderstood instruction could send a page to an on-call group or delete a pager assignment.

[Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) are guardrails that run **before** Claude executes a tool. They inspect the command and can block it before it ever reaches the Spok server. This gives you a read-only AI assistant that can query on-call schedules, look up listings, and check coverage paths — without the risk of accidental writes.

## Quick Install

Install the write-safety hook with one command using [cc-hooks-install](https://github.com/sieteunoseis/cc-hooks-install):

```bash
npx cc-hooks-install add sieteunoseis/spok-api
```

This fetches the hook definitions from this repo, shows an interactive prompt to select which hooks to install, and merges them into your `~/.claude/settings.json`.

If you prefer to install manually, see the [Block Write Operations](#block-write-operations) section below.

## How Claude Code Hooks Work

Hooks are configured in your Claude Code `settings.json` file. When Claude is about to run a Bash command, the `PreToolUse` hook fires first:

1. Claude decides to run a command (e.g., `spok-api add pager --pid 5551234 ...`)
2. The hook receives the command as JSON on stdin: `{"tool_name": "Bash", "tool_input": {"command": "spok-api add pager ..."}}`
3. The hook extracts and inspects the command
4. If it matches a write operation, the hook outputs a block decision — Claude sees the block message and does **not** execute the command
5. If no match, the hook exits silently and Claude proceeds normally

## Block Write Operations

Add this to your `~/.claude/settings.json` (global) or `.claude/settings.json` (project-level) under `hooks.PreToolUse`:

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

### Breaking down the command

```bash
jq -r '.tool_input.command'
# Extracts the command string from the JSON payload on stdin

| { read -r cmd;
# Pipes it into a block and reads into a variable

if echo "$cmd" | grep -qE '^(npx )?spok-api (send-page|change-status|add |update |delete |assign |set |datafeed )';
# Checks if the command starts with spok-api (or npx spok-api)
# followed by any write operation keyword
# The trailing space after each keyword prevents false positives
# (e.g., "get" won't match "get-something")

then echo '{"decision":"block","reason":"BLOCKED: spok-api write operation. Get explicit user approval."}';
# Returns a JSON object that tells Claude to stop — the reason
# is displayed so Claude (and you) can see why it was blocked

fi; }
```

### What it blocks

| Command                                                                       | Blocked | Why                          |
| ----------------------------------------------------------------------------- | ------- | ---------------------------- |
| `spok-api get listing 10001`                                                  | No      | Read operation               |
| `spok-api get oncall-current 10050`                                           | No      | Read operation               |
| `spok-api get pager-info 5551234`                                             | No      | Read operation               |
| `spok-api get org-codes`                                                      | No      | Reference data lookup        |
| `spok-api config list`                                                        | No      | Local config management      |
| `spok-api send-page 10001 "call ext 1234"`                                    | **Yes** | Sends a live page            |
| `spok-api change-status 10001 2 "AVAILABLE"`                                  | **Yes** | Changes listing status       |
| `spok-api add person --lname Smith --fname John`                              | **Yes** | Creates a person record      |
| `spok-api add pager --pid 5551234 --cos LONG_RANGE --model USMO-T5`           | **Yes** | Creates a pager              |
| `spok-api add email --mid 10001 --email j@example.com --display-order 1`      | **Yes** | Adds an email address        |
| `spok-api add directory --lid 300001 --phnum 5551234`                         | **Yes** | Adds a directory entry       |
| `spok-api add oncall-member --oncall-mid 10050 --mid 10001`                   | **Yes** | Adds on-call group member    |
| `spok-api add group-member --reqlid 300001 --grpnum 50 --mbr-lid 300002`      | **Yes** | Adds static group member     |
| `spok-api update person 300001 --fname Jane`                                  | **Yes** | Modifies a person record     |
| `spok-api update directory 7000001 --phnum 5559999`                           | **Yes** | Modifies a directory entry   |
| `spok-api delete pager 5551234`                                               | **Yes** | Deletes a pager              |
| `spok-api delete directory --lid 300001 --dirseq 7000001`                     | **Yes** | Deletes a directory entry    |
| `spok-api assign pager --mid 10001 --pager-id 5551234 --display-order 1`      | **Yes** | Assigns pager to user        |
| `spok-api assign messaging-id 300001`                                         | **Yes** | Assigns a messaging ID       |
| `spok-api assign email --mid 10001 --email j@example.com --display-order 1`   | **Yes** | Assigns email to user        |
| `spok-api set directory-enabled --dirseq 7000001 --module WEB --flag T`       | **Yes** | Changes directory flag       |
| `spok-api set directory-published --dirseq 7000001 --module WEB --flag T`     | **Yes** | Changes directory flag       |
| `spok-api set directory-transfer --dirseq 7000001 --module WEB --flag T`      | **Yes** | Changes directory flag       |
| `spok-api datafeed add-person --unique-id U001 --last-name Smith --source HR` | **Yes** | Creates person via data feed |
| `spok-api datafeed update-person --old-id U001 --new-id U001 --source HR`     | **Yes** | Updates person via data feed |

### Write operation keywords

The hook matches these keywords after `spok-api`:

| Keyword         | Operations                                                 |
| --------------- | ---------------------------------------------------------- |
| `send-page`     | Send a page to a messaging ID                              |
| `change-status` | Change a listing's status code and text                    |
| `add`           | Create persons, pagers, emails, directories, group members |
| `update`        | Modify existing persons and directory entries              |
| `delete`        | Remove pagers and directory entries                        |
| `assign`        | Assign pagers, messaging IDs, and emails to users          |
| `set`           | Change directory flags (enabled, published, transfer)      |
| `datafeed`      | HR data feed operations (add/update persons)               |

## Testing the Hook

You can verify the hook works without Claude Code by piping simulated input:

**Test a write operation (should block):**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"spok-api add pager --pid 5035551234 --cos LONG_RANGE --model USMO-T5"}}' \
  | jq -r '.tool_input.command' \
  | { read -r cmd; if echo "$cmd" | grep -qE '^(npx )?spok-api (send-page|change-status|add |update |delete |assign |set |datafeed )'; then echo '{"decision":"block","reason":"BLOCKED: spok-api write operation. Get explicit user approval."}'; fi; }

# Expected output:
# {"decision":"block","reason":"BLOCKED: spok-api write operation. Get explicit user approval."}
```

**Test a read operation (should pass through silently):**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"spok-api get listing 10001"}}' \
  | jq -r '.tool_input.command' \
  | { read -r cmd; if echo "$cmd" | grep -qE '^(npx )?spok-api (send-page|change-status|add |update |delete |assign |set |datafeed )'; then echo '{"decision":"block","reason":"BLOCKED: spok-api write operation. Get explicit user approval."}'; fi; }

# Expected output: (none — no output means the command is allowed)
```

**Test with npx prefix (should also block):**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"npx spok-api send-page 10001 \"call ext 1234\""}}' \
  | jq -r '.tool_input.command' \
  | { read -r cmd; if echo "$cmd" | grep -qE '^(npx )?spok-api (send-page|change-status|add |update |delete |assign |set |datafeed )'; then echo '{"decision":"block","reason":"BLOCKED: spok-api write operation. Get explicit user approval."}'; fi; }

# Expected output:
# {"decision":"block","reason":"BLOCKED: spok-api write operation. Get explicit user approval."}
```

## Alternative: Use the built-in `--read-only` flag

The CLI has a native `--read-only` flag that blocks write operations at the client level before they reach the Spok server:

```bash
spok-api --read-only send-page 10001 "call ext 1234"
# Error: Write operations are not allowed in read-only mode
```

You can set `--read-only` permanently for a server configuration:

```bash
spok-api config add production --host spok.example.com --port 9722 --ssl --read-only
```

To enforce `--read-only` on every command via a hook (rejects any `spok-api` call that doesn't include the flag):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | { read -r cmd; if echo \"$cmd\" | grep -qE '^(npx )?spok-api ' && ! echo \"$cmd\" | grep -q '\\-\\-read-only'; then echo '{\"decision\":\"block\",\"reason\":\"BLOCKED: spok-api must be run with --read-only. Retry with the flag.\"}'; fi; }"
          }
        ]
      }
    ]
  }
}
```

### Hook vs `--read-only`: When to use which

| Approach                    | Blocks at                                      | Works without Spok connection | Visible to Claude                            |
| --------------------------- | ---------------------------------------------- | ----------------------------- | -------------------------------------------- |
| **PreToolUse hook**         | Claude Code level — command never runs         | Yes                           | Yes — sees block reason, can explain to user |
| **`--read-only` flag**      | CLI level — command runs but write is rejected | No — CLI still connects       | Yes — sees error output                      |
| **`--read-only` in config** | CLI level — permanent per server               | No                            | Yes                                          |

For maximum safety, use both: the hook prevents Claude from even attempting writes, and `--read-only` in your server config acts as a second layer if a command somehow gets through.

## Combining with Other CLI Hooks

If you use multiple CLI tools with Claude Code, you can combine hooks in a single `PreToolUse` entry. Here's an example that guards spok-api alongside other tools:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | { read -r cmd; if echo \"$cmd\" | grep -qE '^(npx )?spok-api (send-page|change-status|add |update |delete |assign |set |datafeed )'; then echo '{\"decision\":\"block\",\"reason\":\"BLOCKED: spok-api write operation. Get explicit user approval.\"}'; elif echo \"$cmd\" | grep -qE '^(npx )?cisco-axl (add|update|remove|execute|sql update)'; then echo '{\"decision\":\"block\",\"reason\":\"BLOCKED: cisco-axl write operation.\"}'; fi; }"
          }
        ]
      }
    ]
  }
}
```

Each `elif` branch adds another CLI tool to guard. The pattern is always the same: match the command prefix, check for write keywords, and return a block decision.
