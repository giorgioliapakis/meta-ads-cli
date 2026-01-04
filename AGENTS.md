# Meta Ads CLI - AI Agent Reference

This document provides a complete reference for AI agents using the meta-ads CLI.

## Overview

`meta-ads` is a CLI for managing Meta (Facebook/Instagram) Ads. All commands output JSON by default for easy parsing.

## API Alignment

This CLI aligns with the [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis):

| CLI Command | API Endpoint |
|-------------|--------------|
| `meta-ads accounts` | `/me/adaccounts`, `/{ad_account_id}` |
| `meta-ads campaigns` | `/{ad_account_id}/campaigns` |
| `meta-ads adsets` | `/{ad_account_id}/adsets` |
| `meta-ads ads` | `/{ad_account_id}/ads` |
| `meta-ads adcreatives` | `/{ad_account_id}/adcreatives` |
| `meta-ads adimages` | `/{ad_account_id}/adimages` |
| `meta-ads advideos` | `/{ad_account_id}/advideos` |
| `meta-ads insights` | `/{ad_account_id}/insights` |

**Flag to API Parameter Mapping:**

CLI flags use kebab-case, API parameters use snake_case:
| CLI Flag | API Parameter |
|----------|---------------|
| `--daily-budget` | `daily_budget` |
| `--lifetime-budget` | `lifetime_budget` |
| `--billing-event` | `billing_event` |
| `--optimization-goal` | `optimization_goal` |
| `--special-ad-categories` | `special_ad_categories` |
| `--date-preset` | `date_preset` |
| `--date-range` | `time_range` |

JSON output field names match API field names exactly (snake_case).

## Authentication

Before using any command, authenticate with a System User token:

```bash
meta-ads auth login --token <ACCESS_TOKEN>
```

Check auth status:
```bash
meta-ads auth status
```

## Configuration

Set default account (required for most operations):
```bash
meta-ads accounts list                    # Find your account ID
meta-ads accounts switch act_123456789    # Set as default
```

Or pass `--account act_123456789` to any command.

---

## Command Reference

### accounts

| Command | Description | Example |
|---------|-------------|---------|
| `accounts list` | List all accessible ad accounts | `meta-ads accounts list` |
| `accounts get <id>` | Get account details | `meta-ads accounts get act_123456789` |
| `accounts switch <id>` | Set default account | `meta-ads accounts switch act_123456789` |

### campaigns

| Command | Description | Example |
|---------|-------------|---------|
| `campaigns list` | List campaigns | `meta-ads campaigns list` |
| `campaigns list --status ACTIVE` | Filter by status | `meta-ads campaigns list --status ACTIVE` |
| `campaigns get <id>` | Get campaign details | `meta-ads campaigns get 120210123456789` |
| `campaigns create` | Create campaign | `meta-ads campaigns create --name "Test" --objective OUTCOME_AWARENESS` |
| `campaigns update <id>` | Update campaign | `meta-ads campaigns update 123 --name "New Name"` |
| `campaigns pause <id>` | Pause campaign | `meta-ads campaigns pause 120210123456789` |
| `campaigns activate <id>` | Activate campaign | `meta-ads campaigns activate 120210123456789` |

**Campaign Objectives:**
- `OUTCOME_AWARENESS` - Brand awareness
- `OUTCOME_ENGAGEMENT` - Post engagement
- `OUTCOME_LEADS` - Lead generation
- `OUTCOME_SALES` - Conversions/sales
- `OUTCOME_TRAFFIC` - Website traffic
- `OUTCOME_APP_PROMOTION` - App installs

### adsets

| Command | Description | Example |
|---------|-------------|---------|
| `adsets list` | List all ad sets | `meta-ads adsets list` |
| `adsets list --campaign <id>` | List ad sets in campaign | `meta-ads adsets list --campaign 123` |
| `adsets list --status ACTIVE` | Filter by status | `meta-ads adsets list --status ACTIVE` |
| `adsets get <id>` | Get ad set details | `meta-ads adsets get 120310123456789` |
| `adsets create` | Create ad set | See below |
| `adsets update <id>` | Update ad set | `meta-ads adsets update 123 --name "New Name"` |
| `adsets pause <id>` | Pause ad set | `meta-ads adsets pause 120310123456789` |
| `adsets activate <id>` | Activate ad set | `meta-ads adsets activate 120310123456789` |

**Create Ad Set Example:**
```bash
meta-ads adsets create \
  --campaign 120210123456789 \
  --name "US 25-45 Males" \
  --billing-event IMPRESSIONS \
  --optimization-goal REACH \
  --targeting '{"geo_locations":{"countries":["US"]},"age_min":25,"age_max":45,"genders":[1]}'
```

### ads

| Command | Description | Example |
|---------|-------------|---------|
| `ads list` | List all ads | `meta-ads ads list` |
| `ads list --adset <id>` | List ads in ad set | `meta-ads ads list --adset 123` |
| `ads list --campaign <id>` | List ads in campaign | `meta-ads ads list --campaign 123` |
| `ads list --status ACTIVE` | Filter by status | `meta-ads ads list --status ACTIVE` |
| `ads get <id>` | Get ad details | `meta-ads ads get 120410123456789` |
| `ads create` | Create ad | `meta-ads ads create --adset 123 --name "Ad 1" --creative-id 456` |
| `ads update <id>` | Update ad | `meta-ads ads update 123 --name "New Name"` |
| `ads pause <id>` | Pause ad | `meta-ads ads pause 120410123456789` |
| `ads activate <id>` | Activate ad | `meta-ads ads activate 120410123456789` |

### adcreatives

| Command | Description | Example |
|---------|-------------|---------|
| `adcreatives list` | List all ad creatives | `meta-ads adcreatives list` |
| `adcreatives get <id>` | Get ad creative details | `meta-ads adcreatives get 120510123456789` |
| `adcreatives create` | Create ad creative | See below |

**Create Ad Creative Examples:**
```bash
# Image creative
meta-ads adcreatives create \
  --name "Banner Ad" \
  --page-id 123456789 \
  --link https://example.com \
  --image-hash abc123def456 \
  --message "Check out our sale!" \
  --cta SHOP_NOW

# Video creative
meta-ads adcreatives create \
  --name "Video Ad" \
  --page-id 123456789 \
  --video-id 120510123456789 \
  --title "New Product Launch" \
  --message "Watch now" \
  --link https://example.com \
  --cta LEARN_MORE
```

**CTA Types:**
`LEARN_MORE`, `SHOP_NOW`, `SIGN_UP`, `SUBSCRIBE`, `WATCH_MORE`, `APPLY_NOW`, `BOOK_NOW`, `CONTACT_US`, `DOWNLOAD`, `GET_OFFER`, `GET_QUOTE`, `ORDER_NOW`

### adimages

| Command | Description | Example |
|---------|-------------|---------|
| `adimages list` | List uploaded ad images | `meta-ads adimages list` |
| `adimages upload <file>` | Upload image file | `meta-ads adimages upload ./banner.jpg --name "Q1 Banner"` |

**Upload Image:**
```bash
# Upload returns image hash for use in adcreatives
meta-ads adimages upload ./product.png --name "Product Shot"
# Response includes: hash, url, width, height
```

### advideos

| Command | Description | Example |
|---------|-------------|---------|
| `advideos list` | List uploaded ad videos | `meta-ads advideos list` |
| `advideos get <id>` | Get video details/status | `meta-ads advideos get 120510123456789` |
| `advideos upload` | Upload video | See below |

**Upload Video:**
```bash
# From local file
meta-ads advideos upload --file ./product-demo.mp4 --name "Product Demo"

# From URL
meta-ads advideos upload --url https://example.com/video.mp4 --name "Remote Video"
```

Note: Video processing may take time. Use `advideos get <id>` to check status.

### insights

| Command | Description | Example |
|---------|-------------|---------|
| `insights get` | Get performance metrics | See examples below |

**Insights Examples:**
```bash
# Last 7 days at campaign level
meta-ads insights get --level campaign --date-preset last_7d

# Custom date range at ad level
meta-ads insights get --level ad --date-range 2025-01-01:2025-01-31

# With breakdowns
meta-ads insights get --level adset --date-preset last_30d --breakdowns age,gender
```

**Date Presets:**
`today`, `yesterday`, `last_3d`, `last_7d`, `last_14d`, `last_28d`, `last_30d`, `last_90d`, `this_month`, `last_month`, `this_quarter`, `last_quarter`, `this_year`, `last_year`, `maximum`

**Levels:**
`account`, `campaign`, `adset`, `ad`

**Breakdowns:**
`age`, `gender`, `country`, `region`, `dma`, `impression_device`, `platform_position`, `publisher_platform`

### bulk

| Command | Description | Example |
|---------|-------------|---------|
| `bulk pause` | Pause multiple entities | `meta-ads bulk pause --type campaign --ids 123,456,789` |
| `bulk activate` | Activate multiple entities | `meta-ads bulk activate --type adset --ids 123,456` |
| `bulk export` | Export entities to file | `meta-ads bulk export --type campaigns --output-file out.json` |

**Entity Types:** `campaign`, `adset`, `ad` (for pause/activate) or `campaigns`, `adsets`, `ads` (for export)

---

## Global Flags

These flags work on all commands:

| Flag | Short | Description | Example |
|------|-------|-------------|---------|
| `--account` | `-a` | Override default account | `--account act_123` |
| `--output` | `-o` | Output format (json/table) | `--output table` |
| `--output-fields` | | Filter JSON output to specific fields | `--output-fields id,name,spend` |
| `--verbose` | `-v` | Enable debug output | `-v` |
| `--quiet` | `-q` | Suppress non-essential output | `-q` |

---

## Agent-Optimized Features

These features reduce context/token usage while providing decision-ready data.

### Insights Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--flatten` | Flat structure, extract primary conversion metrics | `--flatten` |
| `--compact` | Ultra-minimal: name, id, spend, results, cost_per_result | `--compact` |
| `--summary` | Aggregated totals with best/worst performers | `--summary` |
| `--sort-by <field>` | Sort results (cost metrics ascending, volume descending) | `--sort-by cost_per_result` |
| `--min-spend N` | Filter: only entities with spend >= N | `--min-spend 10` |
| `--min-impressions N` | Filter: only entities with impressions >= N | `--min-impressions 1000` |
| `--min-results N` | Filter: only entities with results >= N | `--min-results 1` |
| `--compare A:B` | Compare two periods, show change percentages | `--compare last_7d:last_14d` |

### Ads List with Insights

Fetch ads and their performance in one call:

```bash
meta-ads ads list --with-insights --date-preset last_7d --sort-by cost_per_result
```

### Auto-Pagination

Fetch all results automatically:

```bash
meta-ads campaigns list --all
meta-ads ads list --all
```

### Setting Thresholds by Account Scale

Thresholds are user-defined, not opinionated. Set `--min-spend` based on your account's scale:

| Monthly Spend | Suggested --min-spend | Rationale |
|---------------|----------------------|-----------|
| $1K/month | 5 | $5+ ads have meaningful data |
| $10K/month | 25 | Need more spend for statistical significance |
| $100K/month | 100 | Ignore anything under $100 |
| $1M/month | 500 | Only look at significant performers |

**Example - Small account ($1K/month):**
```bash
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 5
```

**Example - Large account ($100K/month):**
```bash
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 100 --min-results 5
```

### Quick Analysis Patterns

**Get summary with statistically meaningful best/worst:**
```bash
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 10
```

**Top performers only (compact, sorted, filtered):**
```bash
meta-ads insights get --level ad --date-preset last_7d --compact --sort-by cost_per_result --min-results 1
```

**Compare performance across periods:**
```bash
meta-ads insights get --level campaign --compare last_7d:last_14d
```

**Minimal output for large result sets:**
```bash
meta-ads ads list --with-insights --date-preset last_7d --output-fields name,spend,cost_per_result
```

### Compare Output Format

```json
{
  "current_period": { "start": "2025-01-01", "end": "2025-01-07" },
  "previous_period": { "start": "2024-12-25", "end": "2024-12-31" },
  "spend": { "current": 500, "previous": 450, "change_pct": 11.11 },
  "results": { "current": 50, "previous": 40, "change_pct": 25 },
  "cost_per_result": { "current": 10, "previous": 11.25, "change_pct": -11.11 },
  "trend": "improving"
}
```

`trend` values: `improving` (CPR down >10%), `declining` (CPR up >10%), `stable`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "account_id": "act_123456789",
    "timestamp": "2025-01-04T12:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "suggestion": "How to fix it"
    },
    "retry_after": 60
  }
}
```

### Common Error Codes
| Code | Meaning |
|------|---------|
| `AUTH_NOT_CONFIGURED` | No access token. Run `meta-ads auth login` |
| `AUTH_TOKEN_EXPIRED` | Token expired. Re-authenticate |
| `AUTH_TOKEN_INVALID` | Token is invalid |
| `RATE_LIMIT_EXCEEDED` | Too many requests. Wait and retry |
| `INVALID_ACCOUNT_ID` | Account ID format wrong or not accessible |
| `ENTITY_NOT_FOUND` | Campaign/adset/ad ID doesn't exist |

---

## Common Workflows

### Check campaign performance and pause underperformers
```bash
# Get insights for all campaigns
meta-ads insights get --level campaign --date-preset last_7d

# Pause specific campaigns
meta-ads campaigns pause 120210123456789
meta-ads campaigns pause 120210987654321

# Or bulk pause
meta-ads bulk pause --type campaign --ids 120210123456789,120210987654321
```

### Duplicate campaign structure
```bash
# Get existing campaign details
meta-ads campaigns get 120210123456789

# Create new campaign
meta-ads campaigns create --name "Q2 Copy" --objective OUTCOME_AWARENESS

# Get ad sets from original
meta-ads adsets list --campaign 120210123456789

# Create ad sets in new campaign
meta-ads adsets create --campaign <NEW_ID> --name "..." --billing-event IMPRESSIONS ...
```

### Export data for analysis

```bash
# Export all active campaigns
meta-ads bulk export --type campaigns --status ACTIVE --output-file campaigns.json

# Export performance data
meta-ads insights get --level ad --date-preset last_30d > insights.json
```

### Create a new ad with uploaded creative

```bash
# 1. Upload image (returns hash)
meta-ads adimages upload ./product.jpg --name "Product Image"
# Response: { "hash": "abc123def456", "url": "...", ... }

# 2. Create ad creative using the image hash
meta-ads adcreatives create \
  --name "Product Ad Creative" \
  --page-id 123456789 \
  --image-hash abc123def456 \
  --link https://example.com/product \
  --message "Check out our new product!" \
  --cta SHOP_NOW
# Response: { "id": "120510123456789", ... }

# 3. Create ad using the creative
meta-ads ads create \
  --adset 120310123456789 \
  --name "Product Ad" \
  --creative-id 120510123456789
```

### Create a video ad

```bash
# 1. Upload video (from file or URL)
meta-ads advideos upload --file ./demo.mp4 --name "Product Demo"
# Response: { "id": "120610123456789", ... }

# 2. Check video processing status
meta-ads advideos get 120610123456789
# Wait until status.video_status is "ready"

# 3. Create video creative
meta-ads adcreatives create \
  --name "Video Ad Creative" \
  --page-id 123456789 \
  --video-id 120610123456789 \
  --title "See It In Action" \
  --message "Watch our product demo" \
  --link https://example.com \
  --cta LEARN_MORE

# 4. Create ad with the creative
meta-ads ads create \
  --adset 120310123456789 \
  --name "Video Ad" \
  --creative-id <CREATIVE_ID>
```

---

## Environment Variables

For automation/scripting, use environment variables:

```bash
export META_ADS_ACCESS_TOKEN=EAAxxxxxxxxx
export META_ADS_ACCOUNT_ID=act_123456789

# Now commands work without --account flag
meta-ads campaigns list
```

---

## Status Values

Entities can have these statuses:
- `ACTIVE` - Running
- `PAUSED` - Paused by user
- `DELETED` - Deleted
- `ARCHIVED` - Archived

Filter with `--status`:
```bash
meta-ads campaigns list --status ACTIVE
meta-ads ads list --status PAUSED
```
