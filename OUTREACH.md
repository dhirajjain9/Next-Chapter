# Chapter Home — Enrichment & Outreach Playbook

How we go from a shortlisted name to a warm, well-prepared conversation with a
promoter. Two parts: **(1) enrich** (get financials + promoter details), then
**(2) reach out** with a narrative tuned to why deals usually die.

---

## 1. Enrichment — finding financials & promoter details (India)

For an Indian private limited company, financials are public via ROC filings.
Work top-down:

| Source | What you get | Cost |
|--------|--------------|------|
| **MCA21 (mca.gov.in)** | Legal entity, CIN, directors, charges, AOC-4 financials | Pay-per-doc |
| **Tofler / Zaubacorp / The Company Check** | Revenue, PAT, net worth, directors, year-on-year | Free tier + paid |
| **Tracxn / Crunchbase** | Funding status (confirms *bootstrapped*), investors | Paid / limited free |
| **LinkedIn** | Founder name, tenure, headcount band, reachability | Free |
| **Marketplace (Amazon/Flipkart brand store)** | SKU count, ratings, bestseller rank → scale proxy | Free |
| **GST / IEC / Import-export data** | Trade scale signal for manufacturers | Paid |

**Workflow per target (fill these CSV columns):**
1. Find the **legal entity** behind the brand (brand ≠ company; check website footer / Amazon seller name / trademark).
2. Pull **revenue + PAT** for the latest 1–2 FYs → `revenue_fy_inr_cr`, `pat_or_margin`.
3. Confirm **bootstrapped** (no funding rounds) → `filter_bootstrapped`.
4. Confirm **independent** (not a group company) → `filter_independent`.
5. Identify **promoter + contact** → `promoter_name`, `promoter_contact`.
6. Set/refresh `filter_profitable`, `priority`, `next_action`, `last_update`.

> **You can ask me to run this enrichment.** Give me a brand (or a batch from
> `To-Contact`) and I'll research entity, financials, funding, and promoter from
> public sources, cite them, and write the results back into the CSV. I will mark
> anything I can't verify as `unknown` rather than guess.

## 2. Why deals die — and the counter-narrative

From the current funnel, promoter-side rejections cluster on:

| Reason | Count | Counter-narrative for outreach |
|--------|:-----:|--------------------------------|
| Not interested in the model | 27 | Lead with founder upside: liquidity **+ continued upside** via the platform; they keep running the brand with our muscle behind it |
| Valuation | 25 | Anchor on profitable-business multiples + earn-out; show how platform scale lifts their brand's value |
| Not looking to sell | 9 | Plant the seed, stay in touch; position as partnership not exit |

CH-side rejections cluster on **low scale (23)**, **low profitability (18)**,
**product fit (12)** — i.e. tighten the gate *before* outreach so we don't burn
relationship capital on companies we'll later pass on.

## 3. Outreach sequence

1. **Warm intro > cold** where possible (mutual connection, industry contact).
2. **First touch** (email / LinkedIn / WhatsApp — log channel in `comments`):
   short, specific, complimentary about their product, soft on "partnership".
3. **No response** → 2 follow-ups spaced ~5–7 days, then park as `Reached-NoResponse`.
4. **Reply** → discovery call → move to `In-Conversation`, set `owner` + `next_action`.

### First-touch template (founder, partnership framing)

> Subject: Admirer of {Brand} — a conversation about what's next
>
> Hi {Founder}, I've followed {Brand}'s work in {sub-category} — {specific
> genuine detail}. I'm with **Chapter Home**, where we're building India's
> finest home & kitchen company by partnering with profitable, founder-built
> brands (we recently joined hands with Hokipo in furnishings). We're not a
> typical buyer: founders stay in the driver's seat and gain a platform —
> sourcing, marketplace ops, capital, distribution — to grow faster, alongside
> liquidity. Worth a 20-minute call to explore fit? — {Name}, {role}, Chapter Home

(Keep it human; customize the specific detail every time. The specificity is
what earns the reply.)

## 4. Channels available to this workspace
- **Gmail** (drafting outreach — I can draft into your drafts, never auto-send)
- **Google Calendar** (scheduling discovery calls)
- **Google Drive / Sheets** (mirroring the pipeline for the team)

Ask and I'll draft outreach into Gmail drafts or set up calendar holds — I will
not send anything externally without your explicit go-ahead.
