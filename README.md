# meta-ads-cli

A command-line interface for managing Meta (Facebook/Instagram) Ads. Built for AI agents and automation, with structured JSON output, machine-parseable error codes, and token-efficient response modes.

> **Disclaimer:** This is an unofficial, community-maintained tool and is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. "Meta", "Facebook", and "Instagram" are trademarks of Meta Platforms, Inc.

## Installation

```bash
npm install -g meta-ads-cli
```

Or run directly with npx:
```bash
npx meta-ads-cli campaigns list
```

## Quick Start

```bash
# 1. Authenticate (get token from Meta Business Suite > System Users)
meta-ads auth login --token YOUR_ACCESS_TOKEN

# 2. Set default account
meta-ads accounts list
meta-ads accounts switch act_123456789

# 3. Use it
meta-ads campaigns list --status ACTIVE
meta-ads insights get --level campaign --date-preset last_7d
meta-ads campaigns pause 120210123456789
```

## Commands

| Group | Commands |
|-------|----------|
| `auth` | `login`, `status`, `logout` |
| `accounts` | `list`, `get`, `switch` |
| `campaigns` | `list`, `get`, `create`, `update`, `pause`, `activate` |
| `adsets` | `list`, `get`, `create`, `update`, `pause`, `activate` |
| `ads` | `list`, `get`, `create`, `update`, `pause`, `activate` |
| `adcreatives` | `list`, `get`, `create` |
| `adimages` | `list`, `upload` |
| `advideos` | `list`, `get`, `upload` |
| `insights` | `get` |
| `bulk` | `pause`, `activate`, `export` |
| `config` | `get`, `set`, `list` |
| `schema` | Fields, breakdowns, enums, commands discovery |

Run `meta-ads <command> --help` for flag details, or `meta-ads schema commands` for machine-parseable JSON.

## Output

All commands return JSON by default. Field names match the [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis) exactly.

```json
{
  "success": true,
  "data": [
    { "id": "120210123456789", "name": "Q1 Campaign", "status": "ACTIVE" }
  ],
  "meta": {
    "account_id": "act_123456789",
    "timestamp": "2025-01-04T12:00:00.000Z",
    "pagination": { "has_next": true, "cursor": "abc123" },
    "rate_limit": { "usage_pct": 28 }
  }
}
```

Table output is also available with `--output table`.

### Global Flags

| Flag | Description |
|------|-------------|
| `--output-fields id,name,spend` | Return only specific fields |
| `--full` | Include all available fields (default: minimal) |
| `--no-meta` | Raw data without the success/meta wrapper |
| `--count` | Return only the count of matching entities |
| `--output table` | Table format instead of JSON |
| `--quiet` | Suppress info messages |

### Controlling Output Size

```bash
# Minimal fields (default) - 6-8 fields per entity
meta-ads campaigns list

# Only the fields you need
meta-ads campaigns list --output-fields id,name,status

# Just the count
meta-ads campaigns list --status ACTIVE --count

# Raw data, no envelope
meta-ads campaigns list --no-meta

# All available fields
meta-ads campaigns list --full
```

## Insights

```bash
# Campaign performance
meta-ads insights get --level campaign --date-preset last_7d

# With breakdowns
meta-ads insights get --level ad --breakdowns age,gender --date-preset last_30d

# Token-efficient summary
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 10

# Top/bottom performers
meta-ads insights get --level ad --date-preset last_7d --flatten --top 5 --bottom 3

# Compare periods
meta-ads insights get --level campaign --compare last_7d:previous_7d

# Ads with insights in one call
meta-ads ads list --with-insights --date-preset last_7d --sort-by cost_per_result
```

## Error Handling

Errors return structured JSON with machine-parseable codes:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests to Meta API.",
    "retryable": true,
    "retry_after": 60,
    "details": { "suggestion": "Wait before retrying." }
  },
  "meta": { "rate_limit": { "usage_pct": 100 } }
}
```

Process exit codes indicate error category:

| Exit | Category |
|------|----------|
| 0 | Success |
| 1 | General/API error |
| 2 | Authentication |
| 3 | Rate limit |
| 4 | Validation |
| 5 | Not found |
| 6 | Network |
| 7 | Configuration |

## Schema Discovery

Agents can discover available fields, enums, and commands programmatically:

```bash
# Available fields for a level
meta-ads schema fields --level ad

# Valid enum values
meta-ads schema --enum-name status
# Returns: ["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"]

# All commands with their flags as JSON
meta-ads schema commands

# Flags for a specific command
meta-ads schema commands --command "campaigns list"
```

## Mutation Safety

Pause/activate operations are idempotent and report whether state changed:

```json
{
  "success": true,
  "data": { "id": "123", "status": "PAUSED" },
  "action_taken": false,
  "reason": "already_paused"
}
```

## Configuration

Priority (highest to lowest):

1. Command flags: `--account act_123`
2. Environment variables: `META_ADS_ACCOUNT_ID=act_123`
3. Config file: `~/.config/meta-ads/config.json`

### Environment Variables

```bash
META_ADS_ACCESS_TOKEN   # Access token
META_ADS_ACCOUNT_ID     # Default ad account
META_ADS_OUTPUT         # Output format (json/table)
META_ADS_API_VERSION    # API version (default: v22.0)
```

## Agent Integration

For AI agents (Claude Code, Cursor, etc.), see [AGENTS.md](AGENTS.md) for the complete reference with workflow examples, threshold guidelines, and all flag combinations.

## Development

```bash
git clone https://github.com/your-org/meta-ads-cli.git
cd meta-ads-cli
npm install
npm run build
./bin/run.js campaigns list
```

## License

MIT
