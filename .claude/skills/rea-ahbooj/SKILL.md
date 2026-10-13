---
name: rea-ahbooj
description: Reverse engineer a feature from another app (POS, loyalty, ordering, inventory, recipe-costing, review or social tools) with REA, then rebuild a version of it inside Ahbooj OS. Use when Hassan says "how does <app> do <feature>", "reverse engineer", "RE this app", "copy this feature", "I like how <app> does X", or hands over an APK, ASAR, Electron app, website or binary. Skip for reading Ahbooj's own source code.
metadata:
  upstream: morluto/rea reverse-engineer-anything v40 (MIT, see LICENSE-REA)
---

# REA for Ahbooj

Goal: see a feature in someone else's app → understand how it works from
evidence → build Ahbooj's own version in `ahbooj-os/` (Next.js) and
`database/` (Postgres/Supabase SQL). Learn the *design*, never copy their code,
assets or brand.

## 0. Check the tools are connected

REA tools (e.g. `open_binary`, `analyze_javascript_application`,
`list_browser_targets`) only exist after the MCP server is registered.
If they are missing, tell Hassan to run, on his own computer:

```bash
npx rea-agents setup        # pick "Claude Code", approve, then restart Claude Code
```

Terminal fallback without MCP: `npx -y rea-agents@latest <command> ... --json`.
For anything else that blocks, read
[connection-and-recovery.md](references/connection-and-recovery.md).

## 1. Pin the target and the question

Before calling anything, write down:
- **App + exact artifact** (APK path, ASAR, installed app, or the web page
  open in Hassan's own logged-in browser). Never pick an app for him.
- **The feature** in one sentence ("how Loyverse decides loyalty points per sale").
- **What Ahbooj needs from it** (a table, a page, a rule, an agent prompt).

## 2. Route to the right REA tool

| Target | First tool |
|---|---|
| Web app/back office open in Hassan's browser (Chrome started with `--remote-debugging-port=9222`) | `list_browser_targets` → capture the page |
| Android app (`.apk`) | `inspect_android_package` |
| Desktop app built on Electron (`.asar` / `resources/app`) | `analyze_javascript_application` with `"detail": "summary"` |
| Windows `.exe` / .NET app | `inspect_managed_artifact` or `open_binary` |
| A saved HAR file of the site's traffic | `inspect_web_network_capture` |
| An exported SQLite file from the app | `inspect_sqlite_database` |

Full routing table and rules: [upstream-skill.md](references/upstream-skill.md).
Deeper guides, read only the one you need:
[JavaScript/Electron](references/javascript-applications.md) ·
[Android](references/android-applications.md) ·
[browser runtime](references/runtime-observation.md) ·
[native](references/native-and-artifacts.md) ·
[evidence](references/evidence-workflows.md).

## 3. Investigate summary-first

Start with the overview, then trace one feature with
`trace_application_feature` once you have a seed (a screen name, a string like
"Points", an API path). Don't rerun identical calls; drill in with
`inspect_analysis_view` on the returned evidence ID.

Every finding is one of: **Observed** (cite Evidence ID), **Inferred**, or
**Unknown**. Static analysis never proves something ran.

## 4. Translate into an Ahbooj build spec

Write `docs/re/<app>-<feature>.md` in this repo with:

1. **What it does**: the behaviour in plain language, with Evidence IDs.
2. **Data model**: their entities/fields → proposed Ahbooj tables/columns.
   Check existing schema first (`database/*.sql`, `database/migrations/`)
   and extend rather than duplicate (products, inventory, customers, orders,
   promotions, reviews already exist).
3. **Rules/logic**: formulas, thresholds, edge cases.
4. **Screens**: which `ahbooj-os/src/app/<section>` page it belongs in
   (orders, inventory, recipes, production, crm, finance, marketing, agents).
5. **Ahbooj twist**: what to do *better* or differently for a Trinidad
   small-batch dessert brand (TTD pricing, WhatsApp-first customers, small team).
6. **Unknowns** to test.

Then, only if Hassan says build it: write a migration in `database/migrations/`
and the Next.js code. Read `ahbooj-os/AGENTS.md` first (this Next.js has
breaking changes).

## Guardrails

- Only analyse apps and accounts Hassan legitimately has. Observation is
  passive: no bypassing paywalls, licence checks or logins, no pulling other
  people's customer data, no harvesting API keys.
- Rebuild ideas, not code. Don't reuse their source, images, copy or names.
- Close native sessions with `close_binary` when done.
