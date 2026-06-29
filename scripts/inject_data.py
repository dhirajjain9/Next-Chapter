#!/usr/bin/env python3
"""Rebuild the embedded dataset inside pipeline_app.html from the canonical CSVs.
Run after editing any of data/ch_universe.csv, data/candidates_new.csv, data/prospects.csv:
    python3 scripts/inject_data.py
Only the <script id="data"> JSON block is replaced; all hand-authored HTML/CSS/JS is kept."""
import csv, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "pipeline_app.html")


def rows(path):
    p = os.path.join(ROOT, path)
    if not os.path.exists(p):
        return []
    with open(p) as f:
        return list(csv.DictReader(f))


def build():
    universe = [{
        "n": r["brand"], "s": r["stage"], "p": r["ch_pillar"], "c": r["category"],
        "sc": r["sub_category"], "w": r["website"], "fin": r["financial_signal"],
        "rr": r["rejection_reason"], "cm": (r["comments"] or "")[:300],
    } for r in rows("data/ch_universe.csv")]

    def cand(r):
        return {
            "n": r["brand"], "p": r["ch_pillar"], "sc": r["sub_category"], "fo": r["founders"],
            "fund": r["funding_status"], "ind": r["independent_check"], "rev": r["revenue_fy_inr_cr"],
            "pat": r["pat_or_margin"], "on": r["online_presence"], "v": r["fit_verdict"],
            "conf": r["confidence"], "src": r["sources"], "ent": r["legal_entity"], "note": r["notes"],
        }

    candidates = [cand(r) for r in rows("data/candidates_new.csv")]
    prospects = []
    for r in rows("data/prospects.csv"):
        d = cand(r)
        d["st"] = r.get("status", "Prospect")
        d["ad"] = r.get("added", "")
        prospects.append(d)
    return {"universe": universe, "candidates": candidates, "prospects": prospects}


def main():
    data = build()
    js = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    assert "</script>" not in js.lower(), "data contains a script-closing token"
    html = open(APP, encoding="utf-8").read()
    new = re.sub(
        r'(<script id="data" type="application/json">).*?(</script>)',
        lambda m: m.group(1) + js + m.group(2),
        html, count=1, flags=re.S)
    assert new != html, "data block not found / unchanged"
    open(APP, "w", encoding="utf-8").write(new)
    print("Injected — universe %d, suggestions %d, prospects %d (%d KB)" % (
        len(data["universe"]), len(data["candidates"]), len(data["prospects"]), len(new) // 1024))


if __name__ == "__main__":
    main()
