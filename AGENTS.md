# Meta Ads CLI - Agent Reference

CLI for managing Meta (Facebook/Instagram) Ads. JSON output by default, minimal fields for token efficiency, machine-parseable errors.

## Setup

```bash
meta-ads auth login --token <ACCESS_TOKEN>
meta-ads accounts list
meta-ads accounts switch act_123456789
```

Or pass `--account act_123456789` to any command. Environment variables `META_ADS_ACCESS_TOKEN` and `META_ADS_ACCOUNT_ID` also work.

## Discovery

Use the CLI itself to discover commands, flags, fields, and valid enum values — don't memorize this doc.

```bash
meta-ads schema commands                           # All commands + flags as JSON
meta-ads schema commands --command "campaigns list" # Flags for one command
meta-ads schema fields --level ad                  # Available API fields
meta-ads schema --enum-name status                 # Valid values for any enum
meta-ads schema breakdowns                         # Available breakdown dimensions
meta-ads <command> --help                          # Flag details for any command
```

## Controlling Output Size

Output is the main cost for agents. The CLI defaults to minimal fields (6-8 per entity) and offers several knobs to reduce tokens further:

```bash
# Only the fields you need
meta-ads campaigns list --output-fields id,name,status

# Just the count
meta-ads campaigns list --status ACTIVE --count

# Raw data, no success/meta wrapper
meta-ads campaigns list --no-meta

# All fields when you need full context
meta-ads campaigns list --full
```

For insights, there are additional modes that dramatically reduce output:

```bash
# Ultra-minimal: just name, id, spend, results, cost_per_result
meta-ads insights get --level ad --date-preset last_7d --compact

# Aggregated summary with best/worst performers
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 10

# Only top/bottom N
meta-ads insights get --level ad --date-preset last_7d --flatten --top 5 --bottom 3
```

## Analysis Patterns

These recipes cover the most common agent workflows. Combine flags freely — run `meta-ads insights get --help` for the full list.

**Performance check:**
```bash
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 10
```

**Ads + metrics in one call (avoids a second insights request):**
```bash
meta-ads ads list --with-insights --date-preset last_7d --sort-by cost_per_result
```

**Period comparison:**
```bash
meta-ads insights get --level campaign --compare last_7d:previous_7d
```
Returns `trend` (`improving`/`declining`/`stable`) and `change_pct` per metric. Add `--compare-entities` for per-entity deltas.

**Demographic breakdown summary:**
```bash
meta-ads insights get --level ad --date-preset last_7d --breakdowns age,gender --breakdowns-summary
```
Returns best/worst CPR per dimension without the full breakdown table.

**Budget + delivery context:**
```bash
meta-ads insights get --level campaign --date-preset last_7d --flatten --with-budget --include-delivery
```

**Video creative analysis:**
```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --video-metrics
```
Adds `hook_rate` (3s view %) and `hold_rate` (thruplay %).

**Full hierarchy context (avoids separate API calls):**
```bash
meta-ads insights get --level ad --date-preset last_7d --flatten --include-hierarchy
```

**Threshold guidance:** Set `--min-spend` based on account scale — $5 for small accounts ($1K/mo), $100 for large ($100K/mo).

## Pagination

List commands include pagination metadata in responses:

```json
"meta": { "pagination": { "has_next": true, "cursor": "abc123" } }
```

Pass `--after <cursor>` for the next page, or use `--all` to auto-paginate (fetches everything, no pagination metadata needed).

## Mutations

Pause/activate are idempotent. The response tells you whether state actually changed:

```json
{ "action_taken": false, "reason": "already_paused" }
```

Bulk operations: `meta-ads bulk pause --type campaign --ids 123,456,789`

## Creating Ads

The flow is: upload media, create creative, create ad.

```bash
# Image: upload -> get hash -> create creative -> create ad
meta-ads adimages upload ./product.jpg --name "Shot"
meta-ads adcreatives create --name "Ad" --page-id 123 --image-hash <hash> --link https://... --cta SHOP_NOW
meta-ads ads create --adset <adset_id> --name "Ad" --creative-id <creative_id>

# Video: upload (--wait polls until ready) -> create creative -> create ad
meta-ads advideos upload --file ./demo.mp4 --name "Demo" --wait
```

## Error Handling

Errors return structured JSON with machine-parseable codes, retryability, and suggestions:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retryable": true,
    "retry_after": 60,
    "details": { "suggestion": "Wait before retrying." }
  },
  "meta": { "rate_limit": { "usage_pct": 100 } }
}
```

**Exit codes** indicate error category (check `$?`):

| Exit | Meaning |
|------|---------|
| 0 | Success |
| 1 | General/API error |
| 2 | Auth (need to login or refresh token) |
| 3 | Rate limit (wait and retry) |
| 4 | Validation (bad input) |
| 5 | Not found |
| 6 | Network (transient, retry) |
| 7 | Config |

**Rate limit info** is included in `meta.rate_limit.usage_pct` on both success and error responses. Throttle when approaching 100.

## Key Conventions

- CLI flags use **kebab-case** (`--daily-budget`), API/output fields use **snake_case** (`daily_budget`)
- All data goes to **stdout** (JSON), all messages go to **stderr** — safe to pipe
- `--quiet` suppresses stderr info messages, `--verbose` adds debug output to stderr
