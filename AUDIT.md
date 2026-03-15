# Code Audit Report — meta-ads-cli

**Date:** 2026-03-15
**Scope:** Full codebase (51 TypeScript files, 9 library modules, 40 commands)

---

## Executive Summary

The codebase is well-structured with good separation of concerns, consistent use of TypeScript strict mode, and thoughtful agent-oriented API design. However, the audit revealed **zero test coverage**, several **security concerns**, significant **code duplication**, and **input validation gaps** that should be addressed before wider adoption.

---

## 1. Security Issues

### HIGH — Access Token Leaked in Debug Output
**File:** `src/lib/api/client.ts:114-115`

When `--verbose` is enabled, the full URL including the access token is printed:
```ts
console.error(`[debug] GET ${url.pathname}${url.search}`);
```
The token is set on `url.searchParams` at line 109, so `url.search` exposes it. This can leak into shell history, CI logs, or shared terminals.

**Fix:** Mask the token in debug output:
```ts
const debugUrl = new URL(url.toString());
debugUrl.searchParams.set('access_token', '***');
console.error(`[debug] GET ${debugUrl.pathname}${debugUrl.search}`);
```

### MEDIUM — Unguarded `JSON.parse()` on User Input
**Files:**
- `src/commands/adsets/create.ts:30` — `JSON.parse(flags.targeting)` with no try/catch
- `src/commands/adsets/update.ts:32` — same issue

Invalid JSON from the user causes an unhandled exception and a raw stack trace instead of a friendly error message.

**Fix:** Wrap in try/catch and throw a `CliError` with a helpful message.

### MEDIUM — No File Path Validation on Uploads
**Files:**
- `src/lib/api/client.ts:532` — `readFile(filePath)` on user-supplied path
- `src/lib/api/client.ts:606` — same for video uploads
- `src/commands/bulk/export.ts:39` — `writeFile` on user-supplied path

User-supplied paths are passed directly to `readFile()`/`writeFile()` without sanitization. While this is a CLI (the user already has shell access), validating that the file exists and is a regular file before attempting the upload would improve error messages.

### LOW — No `account_id` Format Validation
Account IDs should match the `act_\d+` pattern. Currently any string is accepted, leading to confusing API errors downstream.

---

## 2. Code Quality Issues

### HIGH — Zero Test Coverage
- `vitest` is configured as a dev dependency with `npm test` wired up
- **No test files exist** anywhere in the project
- 51 source files are completely untested

**Recommendation:** Prioritize tests for:
1. `src/lib/api/client.ts` — mock `fetch`, test pagination, rate limit parsing, error mapping
2. `src/lib/auth/token-manager.ts` — token validation logic
3. `src/lib/config/manager.ts` — config priority resolution
4. `src/lib/errors/handler.ts` — error classification
5. `src/lib/output/formatter.ts` — field filtering, table generation
6. Key commands: `insights get`, `ads list --with-insights`, `bulk pause/activate`

### HIGH — Massive `insights/get.ts` (900+ lines)
This single command file handles flattening, sorting, filtering, comparison periods, breakdowns, hierarchy enrichment, budget context, delivery status, and video metrics. It should be decomposed into:
- An insights processing/transformation module
- A comparison period helper
- A hierarchy enrichment helper

### MEDIUM — Nearly Identical Bulk Commands
`src/commands/bulk/pause.ts` and `src/commands/bulk/activate.ts` are ~95% identical (45 lines each), differing only in the target status string (`'PAUSED'` vs `'ACTIVE'`). Same pattern exists across `campaigns/pause.ts`+`activate.ts`, `adsets/pause.ts`+`activate.ts`, `ads/pause.ts`+`activate.ts`.

**Fix:** Extract a shared `updateStatus` helper or a base class that accepts the target status as a parameter.

### MEDIUM — Duplicate Constants
- `CTA_TYPES` array in `src/commands/adcreatives/create.ts:4-7` duplicates data already in `src/lib/schema-data.ts`
- `OBJECTIVES` in `src/commands/campaigns/create.ts` duplicates from `schema-data.ts`

**Fix:** Import from the single source of truth in `schema-data.ts`.

### MEDIUM — Inconsistent Error Output Patterns
- Some commands use `this.error()` (oclif built-in): `adcreatives/create.ts:33`, `advideos/upload.ts:23`
- Others use `createErrorResponse()` + formatter: `auth/login.ts:40-42`, `config/set.ts:32-34`
- `schema.ts` uses raw `console.log()` instead of the formatter

**Fix:** Standardize on a single error output pattern. The `createErrorResponse()` approach is better for structured JSON output consistency.

### MEDIUM — N+1 Query in `ads list --with-insights`
**File:** `src/commands/ads/list.ts:167-173`

After fetching ads, the command fetches insights at the account level and matches by `ad_id`. However, with `--all` and many ads, the insights call uses a fixed `limit` rather than matching the ads count, potentially missing insights for some ads. A more robust approach would be to fetch insights per page or use filtering.

### LOW — Swallowed Error in Rate Limit Parsing
**File:** `src/lib/api/client.ts:166-168`

The empty `catch {}` silently swallows any parse error. A debug-level log would help diagnose issues:
```ts
catch (e) {
  if (this.debug) console.error('[debug] Failed to parse rate limit header:', e);
}
```

### LOW — Inconsistent Flag Passing
- `accounts/list.ts:24` passes raw `flags` to `runWithAuth`
- All other commands use `this.toFlagValues(flags)`

---

## 3. Architecture & Design

### Missing CI Test Workflow
The only CI workflow (`publish.yml`) runs `npm ci && npm run build && npm publish`. There is no test step, and no workflow runs tests on PRs. Adding a test workflow is critical once tests exist.

### Unused Dependency
`facebook-nodejs-business-sdk` (`^22.0.0`) is listed in `package.json` but never imported anywhere in the codebase. The project uses direct `fetch()` calls to the Graph API instead.

**Fix:** Remove the unused dependency to reduce install size.

### Lock Files Are Gitignored
`.gitignore` excludes `package-lock.json`, `yarn.lock`, and `pnpm-lock.yaml`. This means:
- Builds are not reproducible (dependencies may resolve to different versions)
- `npm ci` will fail without a lock file (the publish workflow uses `npm ci`)

**Fix:** Commit a lock file and remove it from `.gitignore`.

### No Input Validation on Entity IDs
Campaign, ad set, and ad IDs are passed to API calls without any format validation. Invalid IDs produce confusing Meta API error messages. A simple numeric/format check before the API call would improve UX.

---

## 4. Testing & Documentation

### Tests: Non-Existent (Critical)
Zero test files. See recommendation above in Section 2.

### README: Good (9/10)
Accurate, complete command reference, good examples. Missing: troubleshooting section, rate-limit guidance.

### AGENTS.md: Excellent (10/10)
950+ lines of detailed AI agent documentation with examples, flag references, and workflow patterns.

### JSDoc: Sparse (3/10)
~55 JSDoc comment lines across 51 files. Library modules have some coverage, but commands have virtually none. Internal helper functions lack documentation.

### CONTRIBUTING.md: Missing
No contributor guide exists. Should include: development setup, branch conventions, testing requirements, how to add a new command.

---

## 5. Prioritized Recommendations

### Immediate (P0)
| # | Issue | Files |
|---|-------|-------|
| 1 | **Mask token in debug output** | `src/lib/api/client.ts:114-115` |
| 2 | **Add try/catch around JSON.parse** | `src/commands/adsets/create.ts:30`, `update.ts:32` |
| 3 | **Remove unused `facebook-nodejs-business-sdk`** | `package.json` |
| 4 | **Commit a lock file** | `.gitignore`, add `package-lock.json` |

### Short-Term (P1)
| # | Issue | Files |
|---|-------|-------|
| 5 | **Add unit tests for core libs** | `src/lib/**/*.ts` |
| 6 | **Refactor bulk pause/activate** into shared helper | `src/commands/bulk/` |
| 7 | **Deduplicate constants** (CTA_TYPES, OBJECTIVES) | `src/commands/adcreatives/create.ts`, `campaigns/create.ts` |
| 8 | **Standardize error output** across all commands | Multiple |
| 9 | **Add CI test workflow** | `.github/workflows/` |

### Medium-Term (P2)
| # | Issue | Files |
|---|-------|-------|
| 10 | **Decompose insights/get.ts** (~900 lines) | `src/commands/insights/get.ts` |
| 11 | **Add account_id format validation** | `src/lib/config/manager.ts` |
| 12 | **Add CONTRIBUTING.md** | Root |
| 13 | **Improve JSDoc coverage** on public APIs | `src/lib/**/*.ts` |
| 14 | **Add integration test suite** with mocked Meta API | `src/__tests__/` |

---

## Files Audited

All 51 TypeScript source files were read and analyzed:
- 40 command files across 11 command groups
- 9 library modules (api/client, auth/token-manager, config/manager, errors/handler, errors/codes, output/formatter, base-command, constants, schema-data)
- 2 type definition files (types/index.ts, types/facebook-sdk.d.ts)
- CI/CD, package.json, tsconfig.json, .gitignore
