# Meta Ads CLI

CLI for managing Meta (Facebook/Instagram) Ads. Aligns with the [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis).

## Full Documentation

See `AGENTS.md` for complete command reference with all flags and examples.

## Quick Reference

```bash
# Auth
meta-ads auth login --token <TOKEN>
meta-ads auth status

# Set default account
meta-ads accounts list
meta-ads accounts switch act_123456789

# Campaigns (matches /campaigns endpoint)
meta-ads campaigns list
meta-ads campaigns list --status ACTIVE
meta-ads campaigns get <campaign_id>
meta-ads campaigns pause <campaign_id>
meta-ads campaigns activate <campaign_id>

# Ad Sets (matches /adsets endpoint)
meta-ads adsets list
meta-ads adsets list --campaign <campaign_id>
meta-ads adsets get <adset_id>

# Ads (matches /ads endpoint)
meta-ads ads list
meta-ads ads list --adset <adset_id>
meta-ads ads get <ad_id>

# Ad Creatives (matches /adcreatives endpoint)
meta-ads adcreatives list
meta-ads adcreatives get <creative_id>

# Insights (matches /insights endpoint)
meta-ads insights get --level campaign --date-preset last_7d
meta-ads insights get --level ad --breakdowns age,gender

# Bulk operations
meta-ads bulk pause --type campaign --ids 123,456
meta-ads bulk export --type campaigns --output-file out.json
```

## Output Format

All commands return JSON. Field names match the Meta Marketing API exactly (snake_case).

```json
{
  "success": true,
  "data": { "id": "123", "name": "...", "status": "ACTIVE", ... },
  "meta": { "account_id": "act_123", "timestamp": "..." }
}
```

Errors include actionable suggestions:
```json
{
  "success": false,
  "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "...", "retry_after": 60 }
}
```

## Flag Naming

CLI uses kebab-case flags, which map to API snake_case parameters:
- `--daily-budget` → `daily_budget`
- `--billing-event` → `billing_event`
- `--date-preset` → `date_preset`

## Agent-Optimized Commands

Reduce context/tokens while getting decision-ready data:

```bash
# Summary with meaningful thresholds (set --min-spend based on account scale)
meta-ads insights get --level ad --date-preset last_7d --summary --min-spend 10

# Top performers only
meta-ads insights get --level ad --date-preset last_7d --compact --sort-by cost_per_result --min-results 1

# Compare periods
meta-ads insights get --level campaign --compare last_7d:last_14d

# Ads with insights in one call
meta-ads ads list --with-insights --date-preset last_7d --sort-by cost_per_result

# Filter output fields
meta-ads ads list --with-insights --output-fields name,spend,cost_per_result

# Fetch all (auto-paginate)
meta-ads campaigns list --all
```

See `AGENTS.md` for threshold guidelines by account scale.
