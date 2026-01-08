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
| `campaigns get <id> --include adsets` | Get campaign with ad sets | `meta-ads campaigns get 123 --include adsets` |
| `campaigns get <id> --include adsets,ads` | Get campaign with ad sets and ads | `meta-ads campaigns get 123 --include adsets,ads` |
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
| `adsets get <id> --include ads` | Get ad set with ads | `meta-ads adsets get 123 --include ads` |
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

### schema

| Command | Description | Example |
|---------|-------------|---------|
| `schema` | Show all available schema info | `meta-ads schema` |
| `schema fields` | Show available fields | `meta-ads schema fields --level ad` |
| `schema breakdowns` | Show available breakdowns | `meta-ads schema breakdowns` |
| `schema date-presets` | Show available date presets | `meta-ads schema date-presets` |
| `schema actions` | Show action types | `meta-ads schema actions` |
| `schema objectives` | Show campaign objectives | `meta-ads schema objectives` |
| `schema video-fields` | Show video-specific fields | `meta-ads schema video-fields` |
| `schema --enum-name <field>` | Get valid values for a field | `meta-ads schema --enum-name status` |

**Schema Types:** `all`, `fields`, `breakdowns`, `date-presets`, `actions`, `objectives`, `video-fields`

**Enum Discovery:**
```bash
# Get valid status values
meta-ads schema --enum-name status
# Returns: ACTIVE, PAUSED, DELETED, ARCHIVED

# Get valid objectives
meta-ads schema --enum-name objective
# Returns: OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, ...

# Get valid billing events
meta-ads schema --enum-name billing_event
# Returns: IMPRESSIONS, LINK_CLICKS, POST_ENGAGEMENT, ...
```

Available enum fields: `status`, `effective_status`, `objective`, `billing_event`, `optimization_goal`, `bid_strategy`, `call_to_action_type`, `special_ad_category`

---

## Global Flags

These flags work on all commands:

| Flag | Short | Description | Example |
|------|-------|-------------|---------|
| `--account` | `-a` | Override default account | `--account act_123` |
| `--output` | `-o` | Output format (json/table) | `--output table` |
| `--output-fields` | | Filter JSON output to specific fields | `--output-fields id,name,spend` |
| `--full` | | Include all available fields (default: minimal) | `--full` |
| `--no-meta` | | Raw data without success/meta wrapper | `--no-meta` |
| `--verbose` | `-v` | Enable debug output | `-v` |
| `--quiet` | `-q` | Suppress non-essential output | `-q` |

### Minimal vs Full Output

By default, commands return minimal fields (6-8 per entity) for agent efficiency. Use `--full` to get all available fields.

**Minimal (default):**
| Entity | Fields |
|--------|--------|
| Campaign | id, name, status, effective_status, objective, daily_budget |
| Ad Set | id, name, status, effective_status, campaign_id, daily_budget, optimization_goal |
| Ad | id, name, status, effective_status, adset_id, campaign_id |
| Creative | id, name, title, body, call_to_action_type |
| Account | id, name, account_status, currency, amount_spent |

**Full (with --full):**
| Entity | Additional Fields |
|--------|-------------------|
| Campaign | + created_time, updated_time, lifetime_budget, budget_remaining, start_time, stop_time, special_ad_categories |
| Ad Set | + created_time, updated_time, start_time, end_time, lifetime_budget, budget_remaining, billing_event, bid_strategy, bid_amount, targeting |
| Ad | + created_time, updated_time, creative, preview_shareable_link |
| Creative | + image_hash, image_url, video_id, thumbnail_url, object_story_spec |
| Account | + account_id, balance, spend_cap, business_name, business_city, business_country_code |

---

## Agent-Optimized Features

These features reduce context/token usage while providing decision-ready data.

### Insights Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--flatten` | Flat structure, extract primary conversion metrics | `--flatten` |
| `--compact` | Ultra-minimal: name, id, spend, results, cost_per_result | `--compact` |
| `--summary` | Aggregated totals with lowest/highest CPR | `--summary` |
| `--sort-by <field>` | Sort results (cost metrics ascending, volume descending) | `--sort-by cost_per_result` |
| `--top N` | Return only top N results (by sort metric or CPR) | `--top 5` |
| `--bottom N` | Return only bottom N results (by sort metric or CPR) | `--bottom 3` |
| `--min-spend N` | Filter: only entities with spend >= N | `--min-spend 10` |
| `--min-impressions N` | Filter: only entities with impressions >= N | `--min-impressions 1000` |
| `--min-results N` | Filter: only entities with results >= N | `--min-results 1` |
| `--active-only` | Filter: only show active entities | `--active-only` |
| `--result-type` | Filter by result type (lead, purchase, link_click) | `--result-type lead` |
| `--with-budget` | Add budget context (at campaign/adset level only) | `--with-budget` |
| `--include-delivery` | Add delivery status (delivery_status, learning_phase, delivery_issues) | `--include-delivery` |
| `--include-objective` | Add campaign objective and objective-specific metrics | `--include-objective` |
| `--include-hierarchy` | Add extended hierarchy context (campaign/adset status, optimization) | `--include-hierarchy` |
| `--include-all-actions` | Include summary of all action types (purchases, leads, etc.) | `--include-all-actions` |
| `--breakdowns-summary` | Summarize breakdowns: lowest/highest CPR per dimension (requires --breakdowns) | `--breakdowns-summary` |
| `--compare A:B` | Compare two periods (use `previous_Xd` for non-overlapping) | `--compare last_7d:previous_7d` |
| `--compare-entities` | Include per-entity deltas when using --compare | `--compare-entities` |
| `--video-metrics` | Include video metrics (hook_rate, hold_rate) for video ads | `--video-metrics` |
| `--extra-fields` | Additional API fields to request (comma-separated) | `--extra-fields video_p25_watched_actions` |
| `--raw-fields` | Output raw API response without flattening | `--raw-fields` |
| `--no-meta` | Output raw data without success/meta wrapper (reduces tokens) | `--no-meta` |

### Ads List with Insights

Fetch ads and their performance in one call:

```bash
meta-ads ads list --with-insights --date-preset last_7d --sort-by cost_per_result

# Include creative details for creative analysis
meta-ads ads list --with-insights --date-preset last_7d --include-creative
```

**Ads List Flags:**
| Flag | Description |
|------|-------------|
| `--with-insights` | Include performance metrics |
| `--date-preset` | Date preset for insights |
| `--sort-by` | Sort by metric (spend, results, cost_per_result) |
| `--min-spend` | Filter: minimum spend |
| `--min-results` | Filter: minimum results |
| `--include-creative` | Include creative details (headline, body, image/video URLs) |
| `--all` | Fetch all pages |

### Auto-Pagination

Fetch all results automatically:

```bash
meta-ads campaigns list --all
meta-ads adsets list --all
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

**Get summary with lowest/highest CPR:**
```bash
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 10
```

**Top 5 and bottom 3 performers (token efficient):**
```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --top 5 --bottom 3
```

**Compare performance across non-overlapping periods:**
```bash
meta-ads insights get --level campaign --compare last_7d:previous_7d
```

**Minimal output for large result sets:**
```bash
meta-ads ads list --with-insights --date-preset last_7d --output-fields name,spend,cost_per_result
```

**Active ads at campaign level with budget context:**
```bash
meta-ads insights get --level campaign --date-preset last_7d --flatten --active-only --with-budget
```

**Find delivery issues:**
```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --include-delivery --min-spend 5
```

**Lowest/highest CPR per demographic:**
```bash
meta-ads insights get --level ad --date-preset last_7d --breakdowns age,gender --breakdowns-summary
```

**Include campaign objective context:**
```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --include-objective
```

**Raw data without wrapper (reduces tokens):**
```bash
meta-ads insights get --level ad --date-preset last_7d --compact --no-meta
```

### Compare Output Format

Use `previous_Xd` for non-overlapping comparison (recommended):
```bash
# last_7d vs the 7 days before that (no overlap)
meta-ads insights get --level campaign --compare last_7d:previous_7d
```

Using `last_7d:last_14d` will warn about overlap since last_14d includes last_7d.

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

### Budget Context Output (--with-budget)

Adds budget data at the appropriate level (campaign or adset). Budget is NOT duplicated at ad level to reduce token usage.

```bash
# Budget at campaign level
meta-ads insights get --level campaign --date-preset last_7d --flatten --with-budget

# Budget at adset level
meta-ads insights get --level adset --date-preset last_7d --flatten --with-budget
```

```json
{
  "name": "Campaign Name",
  "id": "120210123456789",
  "spend": 98.32,
  "results": 22,
  "cost_per_result": 4.47,
  "daily_budget": 50,
  "budget_remaining": 40.32,
  "budget_pct_used": 19
}
```

### Delivery Status Output (--include-delivery)

Adds delivery/learning phase info:

```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --include-delivery
```

```json
{
  "ad_name": "Product Ad",
  "spend": 22.78,
  "delivery_status": "ACTIVE",
  "learning_phase": "LEARNING",
  "delivery_issues": ["Low budget may limit delivery"]
}
```

`learning_phase` values: `LEARNING`, `SUCCESS`, `FAIL` (only appears when in learning phase)

### Breakdowns Summary Output (--breakdowns-summary)

Summarizes breakdowns by lowest/highest CPR per dimension:

```bash
meta-ads insights get --level ad --date-preset last_7d --breakdowns age,gender --breakdowns-summary
```

```json
{
  "dimensions": [
    {
      "dimension": "age",
      "best": { "value": "45-54", "spend": 9.21, "results": 5, "cost_per_result": 1.84 },
      "worst": { "value": "65+", "spend": 7.72, "results": 1, "cost_per_result": 7.72 },
      "all_values": [...]
    },
    {
      "dimension": "gender",
      "best": { "value": "male", "spend": 30.75, "results": 11, "cost_per_result": 2.80 },
      "worst": { "value": "female", "spend": 9.74, "results": 1, "cost_per_result": 9.74 },
      "all_values": [...]
    }
  ],
  "totals": { "spend": 41.79, "results": 12, "cost_per_result": 3.48 }
}
```

### Campaign Objective Context (--include-objective)

Adds campaign objective and objective-specific metrics. Useful for understanding what conversion type the campaign is optimizing for:

```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --include-objective
```

```json
{
  "ad_name": "Product Ad",
  "campaign_id": "120210123456789",
  "campaign_objective": "OUTCOME_LEADS",
  "spend": 22.78,
  "results": 2,
  "result_type": "lead",
  "cost_per_result": 11.39,
  "objective_result_type": "lead",
  "objective_results": 2,
  "objective_cost_per_result": 11.39
}
```

This helps agents interpret metrics in context - a high CPR might be expected for a TOF awareness campaign vs a BOF conversion campaign.

### All Actions Summary (--include-all-actions)

Includes a summary of all action types found, useful for full-funnel analysis:

```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --include-all-actions
```

```json
{
  "ad_name": "Product Ad",
  "spend": 22.78,
  "results": 2,
  "result_type": "lead",
  "cost_per_result": 11.39,
  "actions_summary": {
    "leads": 2,
    "link_clicks": 15,
    "landing_page_views": 8
  }
}
```

### Funnel Metrics

Flatten output now includes funnel conversion rates:

```json
{
  "impressions": 2097,
  "clicks": 69,
  "click_rate": 3.29,
  "landing_page_views": 20,
  "lpv_rate": 28.99,
  "results": 22
}
```

- `click_rate`: clicks / impressions (same as CTR)
- `lpv_rate`: landing_page_views / clicks (percentage of clicks that reached landing page)

### Video Metrics (--video-metrics)

For video ad analysis, adds hook rate and hold rate metrics:

```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --video-metrics
```

```json
{
  "ad_name": "Video Ad",
  "impressions": 10000,
  "video_plays": 4520,
  "video_thruplays": 1288,
  "hook_rate": 45.2,
  "hold_rate": 28.5,
  "spend": 150.00
}
```

- `video_plays`: 3-second video views
- `video_thruplays`: ThruPlay completions (15s or full video)
- `hook_rate`: % of impressions that resulted in 3s view (thumb-stopper metric)
- `hold_rate`: % of 3s viewers that watched thruplay (content quality metric)

Video metrics are `null` for non-video ads.

### Extended Hierarchy Context (--include-hierarchy)

Adds parent entity context (campaign objectives, ad set optimization goals):

```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --include-hierarchy
```

```json
{
  "ad_name": "Product Ad",
  "adset_id": "120310123456789",
  "adset_name": "Lookalike 1%",
  "adset_optimization_goal": "CONVERSIONS",
  "adset_billing_event": "IMPRESSIONS",
  "adset_status": "ACTIVE",
  "campaign_id": "120210123456789",
  "campaign_name": "Summer Sale",
  "campaign_objective": "OUTCOME_SALES",
  "campaign_status": "ACTIVE",
  "spend": 22.78
}
```

Useful for understanding entity context without separate API calls.

### Per-Entity Comparison (--compare-entities)

When using `--compare`, add `--compare-entities` to get per-entity deltas:

```bash
meta-ads insights get --level ad --compare last_7d:previous_7d --compare-entities
```

```json
{
  "summary": {
    "current_period": { "start": "2025-01-01", "end": "2025-01-07" },
    "previous_period": { "start": "2024-12-25", "end": "2024-12-31" },
    "spend": { "current": 1500, "previous": 1200, "change_pct": 25 },
    "trend": "improving"
  },
  "entities": [
    {
      "id": "123456",
      "name": "Ad 1",
      "current": { "spend": 500, "results": 20, "cost_per_result": 25 },
      "previous": { "spend": 400, "results": 15, "cost_per_result": 26.67 },
      "delta": { "spend_pct": 25, "results_pct": 33.3, "cpr_pct": -6.3 }
    }
  ]
}
```

Negative `cpr_pct` is good (cost went down).

### Creative Context (--include-creative)

On ads list, include creative details for creative analysis:

```bash
meta-ads ads list --with-insights --date-preset last_7d --include-creative
```

```json
{
  "id": "120410123456789",
  "name": "Summer Sale Video",
  "status": "ACTIVE",
  "spend": 150.00,
  "results": 8,
  "cost_per_result": 18.75,
  "creative": {
    "id": "120510123456789",
    "type": "video",
    "headline": "50% Off Everything!",
    "body": "Shop our biggest sale of the year. Limited time only.",
    "cta_type": "SHOP_NOW",
    "video_id": "120610123456789",
    "thumbnail_url": "https://...",
    "link": "https://example.com/sale"
  }
}
```

Creative `type` can be: `image`, `video`, `carousel`, `unknown`

### Raw Field Access (--fields, --extra-fields, --raw-fields)

For advanced use cases, request specific API fields directly:

```bash
# Add extra fields to default output
meta-ads insights get --level ad --date-preset last_7d --flatten \
  --extra-fields video_p25_watched_actions,video_p50_watched_actions

# Request only specific fields (replace defaults)
meta-ads insights get --level ad --date-preset last_7d \
  --fields ad_id,ad_name,spend,actions --raw-fields

# Raw output bypasses flattening
meta-ads insights get --level ad --date-preset last_7d \
  --fields ad_id,spend,actions --raw-fields
```

`--raw-fields` outputs the API response directly without processing.

### Schema Discovery (meta-ads schema)

Discover available API fields, breakdowns, date presets, and action types:

```bash
# Show all schema info
meta-ads schema

# Show fields for a specific level
meta-ads schema fields --level ad

# Show available breakdowns
meta-ads schema breakdowns

# Show date presets
meta-ads schema date-presets

# Show action types
meta-ads schema actions

# Show campaign objectives
meta-ads schema objectives

# Show video-specific fields
meta-ads schema video-fields

# Compact output (names only)
meta-ads schema breakdowns --output compact
```

Example output for `meta-ads schema breakdowns`:
```json
{
  "breakdowns": {
    "available": [
      { "name": "age", "category": "demographics", "description": "Age ranges (18-24, 25-34, ...)" },
      { "name": "gender", "category": "demographics", "description": "Gender (male, female, unknown)" },
      { "name": "country", "category": "geography", "description": "Country code (US, GB, CA, etc.)" },
      { "name": "publisher_platform", "category": "placement", "description": "Platform: facebook, instagram, ..." }
    ],
    "usage": "Use --breakdowns age,gender to break down by multiple dimensions"
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "account_id": "act_123456789",
    "timestamp": "2025-01-04T12:00:00.000Z",
    "rate_limit": {
      "call_count": 28,
      "total_cputime": 15,
      "total_time": 12,
      "usage_pct": 28
    }
  }
}
```

The `rate_limit` object shows API usage. When `usage_pct` approaches 100, throttle requests.

### Mutation Response (pause/activate)
```json
{
  "success": true,
  "data": { "id": "123", "name": "My Campaign", "status": "PAUSED" },
  "action_taken": true,
  "reason": "status_changed",
  "meta": { ... }
}
```

- `action_taken: true` - Status was changed
- `action_taken: false` - Already in target state (no API call made)
- `reason`: `status_changed`, `already_paused`, `already_active`, `updated`

This enables idempotent operations - agents can safely retry without side effects.

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "retryable": true,
    "details": {
      "suggestion": "How to fix it"
    },
    "retry_after": 60
  }
}
```

The `retryable` field indicates if the error can be resolved by retrying.

### Common Error Codes
| Code | Retryable | Meaning |
|------|-----------|---------|
| `AUTH_NOT_CONFIGURED` | No | No access token. Run `meta-ads auth login` |
| `AUTH_TOKEN_EXPIRED` | No | Token expired. Re-authenticate |
| `AUTH_TOKEN_INVALID` | No | Token is invalid |
| `RATE_LIMIT_EXCEEDED` | Yes | Too many requests. Wait `retry_after` seconds |
| `NETWORK_ERROR` | Yes | Transient network issue |
| `TIMEOUT` | Yes | Request timed out |
| `INVALID_ACCOUNT_ID` | No | Account ID format wrong or not accessible |
| `ENTITY_NOT_FOUND` | No | Campaign/adset/ad ID doesn't exist |
| `PERMISSION_DENIED` | No | Insufficient permissions |
| `VALIDATION_ERROR` | No | Invalid parameters |

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
