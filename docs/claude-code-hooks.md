# Claude Code Hooks for spok-api

[Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) let you enforce guardrails when AI agents use the CLI. The examples below block write operations so Claude can only read from Spok SmartSuite.

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

### How it works

1. The hook fires **before** every `Bash` tool call Claude makes
2. It extracts the command from the tool input JSON via `jq`
3. It checks if the command starts with `spok-api` followed by a write operation keyword
4. If matched, it returns a JSON block decision that prevents Claude from executing the command
5. Read operations (`get`, `config`) pass through without interference

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

### Alternative: Use the built-in `--read-only` flag

The CLI has a native `--read-only` flag that blocks write operations at the client level:

```bash
spok-api --read-only send-page 10001 "call ext 1234"
# Error: Write operations are not allowed in read-only mode
```

You can also set `--read-only` permanently for a server configuration:

```bash
spok-api config add production --host spok.example.com --port 9722 --ssl --read-only
```

To enforce `--read-only` on every command via a hook:

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
