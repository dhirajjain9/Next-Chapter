# Next Chapter — Chapter Home Acquisition Pipeline

The system of record for companies Chapter Home is hunting, researching, and
pursuing to grow assets under management. Chapter Home is a revenue roll-up
building India's finest Home & Kitchen company across four pillars —
**Kitchen, Soft Furnishings, Decor & Home Improvement, Small Appliances** — by
acquiring **profitable, bootstrapped, founder-led, independent** businesses
(reference deal: **Hokipo**, furnishings).

## What's here

| Path | What it is |
|------|------------|
| **`data/ch_universe.csv`** | Canonical, normalized universe of 1,000 screened companies (cleaned stages, pillars, enrichment columns). Single source of truth. |
| **`data/live_pipeline.csv`** | The actionable subset (To-Contact / Reached / In-Conversation / Onboarded). |
| **`data/candidates_new.csv`** | 74 **net-new** acquisition candidates researched from public sources and de-duped against the universe. Staging area before they graduate into the universe. |
| **`data/prospects.csv`** | **Prospects** holding bay — ad-hoc companies you search + ask Claude to research, pending team triage into Pipeline. |
| **`FRAMEWORK.md`** | The methodology: 4 hard filters, funnel stages, fit-score rubric, rejection taxonomy, data dictionary, operating rhythm. |
| **`OUTREACH.md`** | Enrichment + outreach playbook: where to pull financials/promoter details (MCA/Tofler), why deals die, first-touch template. |
| **`PIPELINE.md`** | Auto-generated live pipeline view (run `scripts/build_views.py`). |
| **`pipeline_app.html`** | Interactive, mobile-friendly pipeline dashboard (hosted as an Artifact). |
| **`docs/pillar_coverage.md`** | Pillar × stage coverage matrix. |
| **`scripts/build_views.py`** | Regenerates the Markdown views from the canonical CSV. |

## The funnel today

1,000 screened · 185 reached out · 131 spoken to · **1 onboarded (Hokipo)**.
Live: 7 in-conversation, ~40 to-contact, 14 reached/no-response.

## The Prospects loop (daily add)

1. **Search** a company. If it's not in the universe / suggestions / prospects, the app prompts you to ask Claude.
2. Ask Claude to **research** it → you get basic details against the 4 hard filters.
3. **Like it?** Claude appends it to `data/prospects.csv` and rebuilds the app (`python3 scripts/inject_data.py`).
4. **Team triage** (end of day): accepted → moved into `data/ch_universe.csv` as `To-Contact` and **flushed** from prospects; rejected → dropped.

## How to add new pipeline

1. Drop new names into **`data/candidates_new.csv`** (one row per company; columns
   are self-describing: brand, pillar, sub-category, founders, funding, independence,
   revenue, online presence, fit verdict, confidence, sources, entity, notes).
2. Once a candidate passes the 4 hard filters and is worth contacting, move it into
   **`data/ch_universe.csv`** with `stage = To-Contact`.
3. Run `python3 scripts/build_views.py` to refresh `PIPELINE.md`.
4. Mirror to the team Google Sheet (kept in sync with these CSVs).

> **Ask for help any time** with (a) enriching a target's financials/promoter
> details from public registries, (b) researching more net-new candidates in a
> pillar, or (c) drafting outreach. See `OUTREACH.md`.

## Pillars (auto-mapped from category)

Kitchen 277 · Decor & Home Improvement 286 · Soft Furnishings 227 · Small Appliances 202.
