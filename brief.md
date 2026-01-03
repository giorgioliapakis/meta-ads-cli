# Meta Ads CLI - Project Brief

## Overview

A command-line interface for interacting with Meta (Facebook/Instagram) Ads accounts. Designed primarily for use by AI agents and automation workflows, but equally useful for developers and marketers who prefer CLI over the web UI.

## Problem Statement

There is no official Meta Ads CLI. Current options for programmatic access:

1. **Meta Ads Manager** - Web UI, not automatable
2. **Marketing API directly** - Requires writing custom code for every operation
3. **Third-party tools** - Focused on reporting dashboards, not CLI access

AI coding agents (Claude Code, Cursor, Aider, etc.) are increasingly capable of managing complex workflows, but they need CLI tools to interact with external services. A Meta Ads CLI bridges this gap.

## Purpose

Enable programmatic management of Meta Ads accounts through a simple, predictable command-line interface with structured output that AI agents can parse and act upon.

## Target Users

1. **AI Agents** - Claude Code, Cursor, custom agents using LLMs to manage ad campaigns
2. **Developers** - Building automation scripts, CI/CD pipelines, or custom dashboards
3. **Marketers** - Power users who prefer terminal workflows over web UI
4. **Agencies** - Managing multiple client accounts programmatically

## Core Capabilities

### Account Management
- List and switch between ad accounts
- View account status and spending limits

### Campaign Operations
- List, create, update, pause/activate campaigns
- View campaign structure (campaign → ad sets → ads)

### Ad Set Operations
- List, create, update, pause/activate ad sets
- Configure targeting, budgets, placements, scheduling

### Ad Operations
- List, create, update, pause/activate ads
- Associate creatives with ads

### Creative Management
- Upload images and videos
- Download creatives (including video source files)
- List available creatives and their hashes

### Performance Insights
- Fetch metrics at campaign, ad set, or ad level
- Support for date presets and custom date ranges
- Breakdowns by age, gender, placement, device, etc.

### Bulk Operations
- Pause/activate multiple entities
- Export data for external analysis

## Design Principles

### AI-Agent-First
- JSON output by default (machine-readable)
- Predictable command structure
- Comprehensive error messages with actionable context
- Idempotent operations where possible

### Human-Friendly
- Table output option for readability
- Clear `--help` documentation
- Interactive prompts for complex operations (optional)

### Flexible Authentication
- Environment variables for CI/CD and agents
- Config file for persistent local setup
- Command flags for one-off overrides
- Named profiles for multi-account management

### Minimal Dependencies
- Easy to install
- Works across platforms (macOS, Linux, Windows)

## Output Format

Default to JSON for AI agent consumption:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "account_id": "act_123",
    "timestamp": "2025-01-04T12:00:00Z"
  }
}
```

Errors should also be structured:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry after 60 seconds.",
    "retry_after": 60
  }
}
```

## Configuration

Support three layers (in priority order):

1. **Command flags** - Highest priority, for one-off overrides
2. **Environment variables** - For CI/CD and containerized environments
3. **Config file** - For persistent local setup with named profiles

## Authentication

Meta Ads API uses access tokens with specific permissions. The CLI should:

- Guide users through token generation
- Validate token permissions on setup
- Support token refresh workflows
- Securely store tokens (config file with appropriate permissions)

Required permissions:
- `ads_management` - Create and modify ads
- `ads_read` - Read campaign data
- `pages_read_engagement` - Required for some creative operations

## Error Handling

Errors should be:

1. **Parseable** - Structured JSON with error codes
2. **Actionable** - Include what went wrong and how to fix it
3. **Debuggable** - Verbose mode for troubleshooting

Common error scenarios to handle gracefully:
- Rate limiting (include retry-after)
- Invalid/expired tokens
- Insufficient permissions
- Invalid entity IDs
- API deprecations

## Future Considerations

### MCP Server
Package as an MCP (Model Context Protocol) server so Claude and other AI assistants can use it as a native tool without shell execution.

### Google Ads CLI
A companion `google-ads-cli` following the same patterns. Consider extracting shared utilities (config management, output formatting, auth patterns) into a common library.

### Cross-Platform Reporting
Once both CLIs exist, a separate tool for unified reporting and comparison across Meta and Google Ads.

## Success Criteria

1. **Works out of the box** - Install, configure, run first command in under 5 minutes
2. **AI agents can use it effectively** - Structured output, predictable behavior
3. **Comprehensive coverage** - All common Meta Ads operations supported
4. **Well-documented** - Clear README, command help, and examples
5. **Actively maintained** - Tracks Meta API changes

## Open Source

MIT licensed. Accepting contributions. Clear contribution guidelines and code of conduct.

## Prior Art

- AWS CLI - Gold standard for cloud service CLIs
- GitHub CLI (`gh`) - Excellent UX patterns
- Stripe CLI - Good auth and output patterns
- Heroku CLI - Clean command structure

---

*This brief captures the intent and requirements. Implementation details (language, framework, package structure) are left to the implementer.*
