# meta-ads-cli

A command-line interface for managing Meta (Facebook/Instagram) Ads accounts. Designed for AI agents and automation workflows, with structured JSON output by default.

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

### 1. Get an Access Token

1. Go to [Meta Business Suite](https://business.facebook.com/) > Business Settings
2. Navigate to **Users** > **System Users**
3. Create or select a System User
4. Generate a token with `ads_management` and `ads_read` permissions

### 2. Authenticate

```bash
meta-ads auth login --token YOUR_ACCESS_TOKEN
```

### 3. Set Default Account

```bash
meta-ads accounts list
meta-ads accounts switch act_123456789
```

### 4. Start Using

```bash
# List campaigns
meta-ads campaigns list

# Get campaign details
meta-ads campaigns get 120210123456789

# Pause a campaign
meta-ads campaigns pause 120210123456789

# Get performance metrics
meta-ads insights get --level campaign --date-preset last_7d
```

## Commands

### Authentication

```bash
meta-ads auth login              # Interactive token input
meta-ads auth login --token XXX  # Direct token input
meta-ads auth status             # Check authentication status
meta-ads auth logout             # Remove stored token
```

### Configuration

```bash
meta-ads config set account_id act_123456789
meta-ads config set output_format table
meta-ads config get account_id
meta-ads config list
```

### Accounts

```bash
meta-ads accounts list
meta-ads accounts get act_123456789
meta-ads accounts switch act_123456789
```

### Campaigns

```bash
meta-ads campaigns list
meta-ads campaigns list --status ACTIVE
meta-ads campaigns list --output table
meta-ads campaigns get 120210123456789
meta-ads campaigns create --name "Q1 Brand" --objective OUTCOME_AWARENESS
meta-ads campaigns update 120210123456789 --name "Updated Name"
meta-ads campaigns pause 120210123456789
meta-ads campaigns activate 120210123456789
```

### Ad Sets

```bash
meta-ads adsets list
meta-ads adsets list --campaign 120210123456789
meta-ads adsets get 120310123456789
meta-ads adsets pause 120310123456789
meta-ads adsets activate 120310123456789
```

### Ads

```bash
meta-ads ads list
meta-ads ads list --adset 120310123456789
meta-ads ads get 120410123456789
meta-ads ads pause 120410123456789
meta-ads ads activate 120410123456789
```

### Ad Creatives

```bash
meta-ads adcreatives list
meta-ads adcreatives get 120510123456789
```

### Insights

```bash
meta-ads insights get --level campaign --date-preset last_7d
meta-ads insights get --level ad --date-range 2025-01-01:2025-01-31
meta-ads insights get --level adset --breakdowns age,gender
```

### Bulk Operations

```bash
meta-ads bulk pause --type campaign --ids 123,456,789
meta-ads bulk activate --type adset --ids 123,456
meta-ads bulk export --type campaigns --status ACTIVE --output-file campaigns.json
```

## Output Formats

### JSON (default)

```bash
meta-ads campaigns list
```

```json
{
  "success": true,
  "data": [
    {
      "id": "120210123456789",
      "name": "Q1 Brand Campaign",
      "status": "ACTIVE",
      "objective": "OUTCOME_AWARENESS"
    }
  ],
  "meta": {
    "account_id": "act_123456789",
    "timestamp": "2025-01-04T12:00:00.000Z"
  }
}
```

### Table

```bash
meta-ads campaigns list --output table
```

```
┌────────────────────┬─────────────────────┬────────┬─────────────────────┐
│ ID                 │ Name                │ Status │ Objective           │
├────────────────────┼─────────────────────┼────────┼─────────────────────┤
│ 120210123456789    │ Q1 Brand Campaign   │ ACTIVE │ OUTCOME_AWARENESS   │
└────────────────────┴─────────────────────┴────────┴─────────────────────┘
```

## Configuration

Configuration priority (highest to lowest):

1. **Command flags**: `--account act_123`
2. **Environment variables**: `META_ADS_ACCOUNT_ID=act_123`
3. **Config file**: `~/.config/meta-ads/config.json`

### Environment Variables

```bash
META_ADS_ACCESS_TOKEN   # Access token
META_ADS_ACCOUNT_ID     # Default ad account
META_ADS_OUTPUT         # Output format (json/table)
META_ADS_VERBOSE        # Enable verbose output (true/false)
META_ADS_API_VERSION    # API version (default: v22.0)
```

### Global Flags

```
-a, --account   Ad account ID
-o, --output    Output format (json/table)
-v, --verbose   Enable verbose output
-q, --quiet     Suppress non-essential output
```

## Error Handling

Errors are returned as structured JSON:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests to Meta API.",
    "details": {
      "suggestion": "Wait before retrying. Check the retry_after value."
    },
    "retry_after": 60
  }
}
```

## Use with AI Agents

This CLI is designed to be used by AI agents like Claude Code. The structured JSON output makes it easy to parse and act upon:

```bash
# Get active campaigns as JSON for parsing
meta-ads campaigns list --status ACTIVE

# Pause campaigns programmatically
meta-ads campaigns pause 120210123456789

# Get performance data for analysis
meta-ads insights get --level campaign --date-preset last_30d
```

## Development

```bash
# Clone the repository
git clone https://github.com/your-org/meta-ads-cli.git
cd meta-ads-cli

# Install dependencies
npm install

# Build
npm run build

# Run locally
./bin/run.js campaigns list
```

## License

MIT
