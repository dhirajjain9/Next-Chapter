#!/usr/bin/env python3
"""Regenerate human-readable views (PIPELINE.md, pillar stats) from the canonical
data/ch_universe.csv. Run after editing the universe:  python3 scripts/build_views.py
This keeps the Markdown dashboards in sync with the single source of truth (the CSV)."""
import csv, os
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNIV = os.path.join(ROOT, "data", "ch_universe.csv")

STAGE_ORDER = ["Onboarded", "In-Conversation", "To-Contact", "Reached-NoResponse",
               "Rejected-Promoter", "Rejected-CH", "Screened-Out", "Uncategorized"]
LIVE_STAGES = ["Onboarded", "In-Conversation", "To-Contact", "Reached-NoResponse"]


def load():
    with open(UNIV) as f:
        return list(csv.DictReader(f))


def md_table(headers, rows):
    out = ["| " + " | ".join(headers) + " |",
           "| " + " | ".join("---" for _ in headers) + " |"]
    for r in rows:
        cells = [str(c).replace("|", "\\|").replace("\n", " ").strip()[:160] for c in r]
        out.append("| " + " | ".join(cells) + " |")
    return "\n".join(out)


def build_pipeline_md(rows):
    live = [r for r in rows if r["stage"] in LIVE_STAGES]
    by_stage = defaultdict(list)
    for r in live:
        by_stage[r["stage"]].append(r)

    parts = ["# Chapter Home — Live Acquisition Pipeline",
             "",
             "> Auto-generated from `data/ch_universe.csv` by `scripts/build_views.py`. "
             "Do not edit by hand — edit the CSV and re-run.",
             ""]
    # funnel summary
    counts = Counter(r["stage"] for r in rows)
    parts.append("## Funnel snapshot\n")
    parts.append(md_table(
        ["Stage", "Count"],
        [[s, counts.get(s, 0)] for s in STAGE_ORDER if counts.get(s, 0)]))
    parts.append("")

    for stage in LIVE_STAGES:
        items = sorted(by_stage.get(stage, []), key=lambda r: r["ch_pillar"] + r["brand"].lower())
        if not items:
            continue
        parts.append(f"## {stage}  ({len(items)})\n")
        parts.append(md_table(
            ["Brand", "Pillar", "Sub-category", "Financial signal", "Next action", "Website"],
            [[r["brand"], r["ch_pillar"], r["sub_category"],
              r["financial_signal"] or r["revenue_fy_inr_cr"], r["next_action"] or r["comments"],
              r["website"]] for r in items]))
        parts.append("")
    return "\n".join(parts)


def build_pillar_md(rows):
    parts = ["# Pillar & Category Coverage\n",
             "> Auto-generated from `data/ch_universe.csv`.\n"]
    # pillar x stage matrix
    pillars = sorted({r["ch_pillar"] for r in rows})
    parts.append("## Strategic pillar x stage\n")
    hdr = ["Pillar"] + [s for s in STAGE_ORDER if any(r["stage"] == s for r in rows)]
    matrix = []
    for p in pillars:
        prows = [r for r in rows if r["ch_pillar"] == p]
        c = Counter(r["stage"] for r in prows)
        matrix.append([p] + [c.get(s, 0) for s in hdr[1:]] )
    parts.append(md_table(hdr, matrix))
    parts.append("")
    return "\n".join(parts)


def main():
    rows = load()
    with open(os.path.join(ROOT, "PIPELINE.md"), "w") as f:
        f.write(build_pipeline_md(rows) + "\n")
    with open(os.path.join(ROOT, "docs", "pillar_coverage.md"), "w") as f:
        f.write(build_pillar_md(rows) + "\n")
    print(f"Built PIPELINE.md and docs/pillar_coverage.md from {len(rows)} companies.")


if __name__ == "__main__":
    main()
