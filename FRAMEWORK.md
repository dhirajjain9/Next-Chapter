# Chapter Home — Acquisition Pipeline Framework

How we source, qualify, and track acquisition targets for Chapter Home's
revenue roll-up across four pillars: **Kitchen**, **Soft Furnishings**,
**Decor & Home Improvement**, and **Small Appliances**.

Reference deal (the bar): **Hokipo** — ~₹83 Cr FY25 revenue, ~15–18% PBT margin,
bootstrapped, founder-led, independent. Onboarded.

---

## 1. The thesis in one line

Acquire **profitable, bootstrapped, founder-led, independent** home & kitchen
brands and compound them under one operating platform (shared sourcing,
marketplace ops, brand, working-capital, and distribution).

## 2. The four hard filters (gates — all must pass)

A company is only a *qualified target* if it passes **all four**. These are
binary gates, not scores. Fail one → it does not enter the funnel.

| # | Filter | Pass test | Where to verify |
|---|--------|-----------|-----------------|
| 1 | **Profitable** | Positive PAT; healthy/defensible margins (Hokipo-like PBT 12%+ is the aspiration, not the floor) | MCA/ROC filings, Tofler, Zaubacorp, founder P&L |
| 2 | **Bootstrapped** | No or negligible external VC/PE equity; founder-funded | Tracxn, Crunchbase, news, MCA shareholding |
| 3 | **Great founders** | Founder-led, still operating, willing to continue post-deal; clean reputation | LinkedIn, references, conversation |
| 4 | **Independent** | Not a subsidiary / brand of a conglomerate or large group | MCA group structure, brand ownership |

> Anything failing #2 or #4 is usually a hard *Screened-Out*. #1 and #3 often
> need a conversation to confirm, so a borderline company can still enter as
> *To-Contact* with the filter marked `?`.

## 3. The funnel (stages)

Single source of truth: **`data/ch_universe.csv`** (column `stage`).
`scripts/build_views.py` regenerates `PIPELINE.md` from it.

```
 SOURCED                                                          ┌─► On hold ─┐
 (Suggestions by Claude /                                         │            │
  ingested / self-researched)  ─►  Pipeline ─►  Reached out ─►  In conversation ─►  Onboarded
                                                                 │            │
                                                                 ├─► Rejected (CH) 
                                                                 └─► Rejected (Promoter)
```

| Stage | Meaning | Moves forward when |
|-------|---------|--------------------|
| **Sourced** | A new lead — a Claude suggestion (`data/candidates_new.csv`), an ingested dataset, or self-researched | Passes the 4 gates + worth pursuing → Pipeline |
| `To-Contact` → **Pipeline** | Shortlisted, outreach not yet done (blank statuses also count here) | First contact made → Reached out |
| `Reached-NoResponse` → **Reached out** | Outreach sent, awaiting reply | Reply received → In conversation |
| `In-Conversation` | Active two-way dialogue | LOI / onboard, on-hold, or rejection |
| `On-Hold` | Paused — revisit later | Resume → In conversation, or → Rejected |
| `Onboarded` | Acquired / integrated | — (success terminal) |
| `Rejected-CH` | We declined (see `rejection_reason`) | — |
| `Rejected-Promoter` | Promoter declined (see `rejection_reason`) | — |
| `Screened-Out` | Reviewed earlier, not shortlisted | — (re-qualify to re-enter) |

### Rejection taxonomy (use these exact values in `rejection_reason`)
- **CH-side:** `Product fit`, `Low profitability`, `Low scale`, `Founder fit/continuity`, `On hold`
- **Promoter-side:** `Valuation`, `Not interested in the model`, `Not looking to sell`

Tracking *why* deals die is how we sharpen sourcing. Today's split:
valuation (25) and "not interested in the model" (27) are the top promoter
killers — worth a tailored narrative for each (see `OUTREACH.md`).

## 4. Fit score (soft ranking, 0–100)

Once a company passes the 4 gates, rank it for prioritization. Suggested weights:

| Dimension | Weight | Notes |
|-----------|:------:|-------|
| Profitability quality (margin, consistency) | 25 | Higher PBT % = more roll-up accretive |
| Scale / revenue fit | 20 | Sweet spot ~₹25–150 Cr; too small = integration drag |
| Category strategic fit | 15 | Fills a pillar gap or deepens a strength |
| Founder willingness & continuity | 15 | Will they sell and stay/transition cleanly? |
| Online/marketplace strength | 15 | Amazon/Flipkart rank, own-site, brand equity |
| Clean cap table & structure | 10 | Bootstrapped + simple entity = faster close |

Store the score in `priority` (e.g. `A`/`B`/`C` or a number). Keep it cheap to
maintain — a rough A/B/C is fine until a company is `In-Conversation`.

## 5. Data dictionary (`data/ch_universe.csv`)

| Column | Description |
|--------|-------------|
| `sr_no` | Original serial from CH Universe sheet |
| `brand` | Brand / company name |
| `stage` | Funnel stage (see §3) |
| `category` | Original CH category |
| `ch_pillar` | One of the 4 strategic pillars (auto-mapped; review when needed) |
| `sub_category` | Product sub-category |
| `products` | Product description |
| `website` | URL or marketplace store |
| `source` | Where the lead came from |
| `financial_signal` | Raw revenue/PAT/margin snippet extracted from notes (unverified) |
| `filter_profitable` / `_bootstrapped` / `_founder_led` / `_independent` | `Y` / `N` / `?` against the 4 gates |
| `revenue_fy_inr_cr` | Verified latest revenue (₹ Cr) once known |
| `pat_or_margin` | PAT or margin once known |
| `promoter_name` | Founder / promoter |
| `promoter_contact` | Phone / email / LinkedIn |
| `valuation_note` | Any valuation expectation surfaced |
| `priority` | Fit ranking (A/B/C or score) |
| `owner` | CH team member driving it |
| `next_action` | The single next step |
| `last_update` | Date of last touch (YYYY-MM-DD) |
| `rejection_reason` | From taxonomy in §3 |
| `comments` | Free-text notes (original) |

## 6. Operating rhythm

1. **Source** → add new names to `data/ch_universe.csv` as `To-Contact` (after gate check). Net-new candidates land in `data/candidates_new.csv` first (see that file's header), then graduate in.
2. **Enrich** → before outreach, fill financials + promoter via MCA/Tofler (`OUTREACH.md` §1).
3. **Outreach** → log every touch; move to `Reached-NoResponse` / `In-Conversation`.
4. **Weekly review** → re-run `scripts/build_views.py`; review `In-Conversation` + top `To-Contact`; refresh `next_action` and `last_update`.
5. **Post-mortem** → on every rejection, set `rejection_reason`; review monthly for sourcing signal.
