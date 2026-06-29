// Client engine for the pipeline UI. Runs after the markup mounts.
// Fetches data from /api/data, renders the funnel/tabs/cards, and drives the
// live-research → add-prospect → triage loop against the API.
/* eslint-disable @typescript-eslint/no-explicit-any */

type Dict = Record<string, any>;

const STAGES = [
  { k: "To-Contact", lbl: "Pipeline", cls: "s-tocontact", col: "var(--slate)" },
  { k: "Reached-NoResponse", lbl: "Not responding", cls: "s-reached", col: "#9aa29a" },
  { k: "In-Conversation", lbl: "In conversation", cls: "s-inconv", col: "var(--brass)" },
  { k: "On-Hold", lbl: "On hold", cls: "s-inconv", col: "#c89b54" },
  { k: "Rejected-CH", lbl: "CH rejected", cls: "s-rejected", col: "#b8786c" },
  { k: "Rejected-Promoter", lbl: "Promoter rejected", cls: "s-rejected", col: "var(--brick)" },
  { k: "Onboarded", lbl: "Onboarded", cls: "s-onboarded", col: "var(--accent)" },
  { k: "Screened-Out", lbl: "Screened out", cls: "s-screened", col: "#c2c6bd" },
];
const SMAP: Dict = {};
STAGES.forEach((s) => (SMAP[s.k] = s));
const STORDER: Dict = {};
STAGES.forEach((s, i) => (STORDER[s.k] = i));
const LIVE = ["To-Contact", "Reached-NoResponse", "In-Conversation", "On-Hold", "Onboarded"];

const PILLARS = [
  { k: "Kitchen", col: "#B0623B" },
  { k: "Soft Furnishings", col: "#1E5141" },
  { k: "Decor & Home Improvement", col: "#3E6B8B" },
  { k: "Small Appliances", col: "#B07D2B" },
  { k: "Other", col: "#8E8E8E" },
];
const PMAP: Dict = {};
PILLARS.forEach((p) => (PMAP[p.k] = p.col));
const pcol = (p: string) => PMAP[p] || "#8E8E8E";

function vClass(v: string) {
  v = (v || "").toLowerCase();
  if (v.indexOf("strong") > -1 && v.indexOf("weak") < 0) return { col: "var(--accent)" };
  if (v.indexOf("medium") > -1 && v.indexOf("weak") < 0) return { col: "var(--brass)" };
  return { col: "#9aa29a" };
}
const esc = (s: any) =>
  (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const $ = (id: string) => document.getElementById(id) as HTMLElement;

let UNI: any[] = [], CAND: any[] = [], PROS: any[] = [], WRITABLE = false;
let view = "universe", q = "", pillar: string | null = null, stage: string | null = null;
let shown = 0, results: any[] = [];
const PAGE = 60;
let stageCounts: Dict = {};

async function loadData() {
  const r = await fetch("/api/data", { cache: "no-store" });
  const d = await r.json();
  UNI = d.universe || [];
  CAND = d.candidates || [];
  PROS = d.prospects || [];
  WRITABLE = !!d.writable;
  UNI.forEach((x) => {
    if (!x.s || x.s === "Uncategorized") x.s = "To-Contact";
    if (/on.?hold/i.test(x.rr || "")) x.s = "On-Hold";
  });
  stageCounts = {};
  UNI.forEach((x) => (stageCounts[x.s] = (stageCounts[x.s] || 0) + 1));
}

function toast(msg: string) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function refreshHeaderCounts() {
  const live = LIVE.reduce((a, k) => a + (stageCounts[k] || 0), 0);
  $("m-total").textContent = UNI.length.toLocaleString("en-IN");
  $("m-live").textContent = String(live);
  const pipe = stageCounts["To-Contact"] || 0;
  $("t-uni").textContent = UNI.length.toLocaleString("en-IN") + " co.";
  $("t-pros").textContent = PROS.length + " co.";
  $("t-sp").textContent = CAND.length + pipe + " co.";
  $("t-pipe").textContent = pipe + " co.";
}

function buildFunnel() {
  const f = $("funnel");
  f.innerHTML = "";
  const mk = (num: number, lab: string, col: string, on: boolean, fn: () => void) => {
    const b = document.createElement("button");
    b.className = "stat" + (on ? " on" : "");
    b.style.borderColor = col;
    b.innerHTML = `<span class="num tnum">${num}</span><span class="lab">${lab}</span><span class="stripe" style="background:${col}"></span>`;
    b.addEventListener("click", fn);
    f.appendChild(b);
  };
  const scrollC = () => {
    const t = document.getElementById("tabs");
    if (t) window.scrollTo({ top: t.offsetTop - 70, behavior: "smooth" });
  };
  mk(CAND.length, "Suggestions", "var(--brass)", false, () => { setView("sugpipe"); scrollC(); });
  mk(PROS.length, "Prospects", "var(--slate)", false, () => { setView("prospects"); scrollC(); });
  STAGES.forEach((s) => {
    const n = stageCounts[s.k] || 0;
    if (!n) return;
    mk(n, s.lbl, s.col, s.k === "Onboarded", () => {
      if (s.k === "To-Contact") setView("pipeline");
      else { setView("universe"); stage = s.k; syncStageChips(); render(); }
      scrollC();
    });
  });
}

function buildPillars() {
  const el = $("pillars");
  el.innerHTML = "";
  const all = document.createElement("button");
  all.className = "chip";
  all.setAttribute("aria-pressed", String(pillar === null));
  all.textContent = "All categories";
  all.addEventListener("click", () => { pillar = null; buildPillars(); render(); });
  el.appendChild(all);
  const src =
    view === "universe" ? UNI
    : view === "prospects" ? PROS
    : view === "pipeline" ? UNI.filter((r) => r.s === "To-Contact")
    : CAND.concat(UNI.filter((r) => r.s === "To-Contact"));
  PILLARS.forEach((p) => {
    const n = src.filter((r: any) => r.p === p.k).length;
    if (!n) return;
    const c = document.createElement("button");
    c.className = "chip";
    c.setAttribute("aria-pressed", String(pillar === p.k));
    c.innerHTML = `<span class="pdot" style="background:${p.col}"></span>${esc(p.k)} ${n}`;
    c.addEventListener("click", () => { pillar = pillar === p.k ? null : p.k; buildPillars(); render(); });
    el.appendChild(c);
  });
}

function buildStageChips() {
  const el = $("stages");
  el.innerHTML = "";
  if (view !== "universe") { el.style.display = "none"; return; }
  el.style.display = "flex";
  const all = document.createElement("button");
  all.className = "chip";
  all.setAttribute("aria-pressed", String(stage === null));
  all.textContent = "All stages";
  all.addEventListener("click", () => { stage = null; syncStageChips(); render(); });
  el.appendChild(all);
  STAGES.forEach((s) => {
    const n = stageCounts[s.k] || 0;
    if (!n) return;
    const c = document.createElement("button");
    c.className = "chip";
    c.dataset.stage = s.k;
    c.setAttribute("aria-pressed", String(stage === s.k));
    c.innerHTML = `<span class="pdot" style="background:${s.col}"></span>${s.lbl} ${n}`;
    c.addEventListener("click", () => { stage = stage === s.k ? null : s.k; syncStageChips(); render(); });
    el.appendChild(c);
  });
}
function syncStageChips() {
  document.querySelectorAll("#stages .chip").forEach((c: any) => {
    c.setAttribute("aria-pressed", String(c.dataset.stage ? stage === c.dataset.stage : stage === null));
  });
}

function setView(v: string) {
  view = v; stage = null; shown = 0;
  document.querySelectorAll(".tab").forEach((t: any) =>
    t.setAttribute("aria-selected", String(t.dataset.view === v)),
  );
  buildPillars(); buildStageChips(); render();
}

function matchUni(r: any) {
  if (stage && r.s !== stage) return false;
  if (pillar && r.p !== pillar) return false;
  if (q) {
    const h = (r.n + " " + r.sc + " " + r.c + " " + (r.cm || "") + " " + (r.fin || "")).toLowerCase();
    if (h.indexOf(q) < 0) return false;
  }
  return true;
}
function matchCand(r: any) {
  if (pillar && r.p !== pillar) return false;
  if (q) {
    const h = (r.n + " " + r.sc + " " + (r.fo || "") + " " + (r.ent || "") + " " + (r.note || "") + " " + (r.fund || "")).toLowerCase();
    if (h.indexOf(q) < 0) return false;
  }
  return true;
}
const vrank = (v: string) => {
  v = (v || "").toLowerCase();
  if (v.indexOf("strong") > -1 && v.indexOf("weak") < 0) return 0;
  if (v.indexOf("medium") > -1 && v.indexOf("weak") < 0) return 1;
  return 2;
};

function compute() {
  const pipe = () => UNI.filter((r) => r.s === "To-Contact" && matchUni(r));
  if (view === "prospects") {
    results = PROS.filter(matchCand).slice()
      .sort((a, b) => vrank(a.v) - vrank(b.v) || a.n.localeCompare(b.n))
      .map((r) => ({ t: "p", r }));
  } else if (view === "sugpipe") {
    const c = CAND.filter(matchCand).slice()
      .sort((a, b) => vrank(a.v) - vrank(b.v) || a.n.localeCompare(b.n))
      .map((r) => ({ t: "c", r }));
    const p = pipe().sort((a, b) => a.n.localeCompare(b.n)).map((r) => ({ t: "u", r }));
    results = c.concat(p);
  } else if (view === "pipeline") {
    results = pipe().sort((a, b) => a.n.localeCompare(b.n)).map((r) => ({ t: "u", r }));
  } else {
    results = UNI.filter(matchUni).slice()
      .sort((a, b) => (STORDER[a.s] ?? 9) - (STORDER[b.s] ?? 9) || a.n.localeCompare(b.n))
      .map((r) => ({ t: "u", r }));
  }
}

let researching = false;
function render() {
  compute();
  $("count").textContent = results.length.toLocaleString("en-IN");
  $("count-lbl").textContent =
    view === "prospects" ? "prospects"
    : view === "sugpipe" ? "suggestions + pipeline"
    : view === "pipeline" ? "in pipeline"
    : results.length === 1 ? "company" : "companies";
  $("sortnote").textContent =
    view === "prospects" ? "awaiting team triage"
    : view === "sugpipe" ? "suggestions first, then pipeline"
    : view === "pipeline" ? "sorted by name" : "sorted by funnel stage";
  if (shown === 0) shown = Math.min(PAGE, results.length);
  shown = Math.min(shown, results.length) || Math.min(PAGE, results.length);
  const list = $("list"), more = $("more");
  list.innerHTML = "";
  if (!results.length) {
    let msg: string;
    if (q) {
      msg =
        `<div class="big">No match for &ldquo;${esc(q)}&rdquo;</div>` +
        `<div>Not in the universe, suggestions, or prospects yet.</div>` +
        `<div class="cta">🔎 Have Claude research <b>${esc(q)}</b> against the 4 hard filters and add it as a prospect.` +
        `<button id="research-btn"${researching ? " disabled" : ""}>${researching ? '<span class="spin"></span>Researching…' : "Research with Claude"}</button></div>`;
    } else if (view === "prospects") {
      msg = `<div class="big">No prospects yet</div><div>Search a company above. If it isn&rsquo;t tracked, research it — the ones you like land here, then the team moves them into Pipeline.</div>`;
    } else {
      msg = `<div class="big">No matches</div><div>Try clearing a filter.</div>`;
    }
    list.innerHTML = `<div class="empty">${msg}</div>`;
    more.style.display = "none";
    const rb = document.getElementById("research-btn");
    if (rb) rb.addEventListener("click", () => doResearch(q));
    return;
  }
  const frag = document.createDocumentFragment();
  results.slice(0, shown).forEach((w) =>
    frag.appendChild(w.t === "u" ? uniCard(w.r) : candCard(w.r, w.t)),
  );
  list.appendChild(frag);
  more.style.display = shown < results.length ? "block" : "none";
  more.textContent = `Show more (${results.length - shown} left)`;
}

function uniCard(r: any) {
  const s = SMAP[r.s] || SMAP["Screened-Out"];
  const b = document.createElement("button");
  b.className = "card";
  const sig = r.fin
    ? `<div class="sig"><span class="k">Signal:</span> ${esc(r.fin)}</div>`
    : r.rr ? `<div class="sig"><span class="k">Reason:</span> ${esc(r.rr)}</div>` : "";
  b.innerHTML =
    `<div class="top"><div class="nm">${esc(r.n)}</div><span class="pill ${s.cls}">${s.lbl}</span></div>` +
    `<div class="sub"><span class="pdot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pcol(r.p)}"></span>${esc(r.p)}${r.sc ? " · " + esc(r.sc) : ""}</div>${sig}`;
  b.addEventListener("click", () => openUni(r));
  return b;
}
function candCard(r: any, kind: string) {
  const v = vClass(r.v);
  const b = document.createElement("button");
  b.className = "card";
  const fin = r.rev && r.rev !== "unknown" ? "₹" + esc(r.rev) + " Cr rev" : "rev unknown";
  const tag = kind === "p" ? `<span class="tag" style="background:var(--slate-soft);color:#2c5675">${esc(r.st || "Prospect")}${r.ad ? " · " + esc(r.ad) : ""}</span> ` : "";
  b.innerHTML =
    `<div class="top"><div class="nm">${esc(r.n)}</div><span class="pill" style="background:${v.col};color:#fff">${esc(r.v || "—")}</span></div>` +
    `<div class="sub">${tag}<span class="pdot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pcol(r.p)}"></span>${esc(r.p)}${r.sc ? " · " + esc(r.sc) : ""}</div>` +
    `<div class="sig"><span class="k">Founders:</span> ${esc(r.fo || "—")}</div>` +
    `<div class="verdict"><span class="vd" style="background:${v.col}"></span>${esc(r.fund || "")} · <span style="color:var(--ink-3)">${fin}</span></div>`;
  b.addEventListener("click", () => openCand(r, kind));
  return b;
}

// ---- modal ----
function openSheet() { $("ov").classList.add("show"); document.body.style.overflow = "hidden"; $("sheet").scrollTop = 0; }
function closeSheet() { $("ov").classList.remove("show"); document.body.style.overflow = ""; }
const pill = (t: string, bg: string, fg: string) => `<span class="badge" style="background:${bg};color:${fg}">${esc(t)}</span>`;

function gate(label: string, val: string) {
  const v = (val || "").toLowerCase();
  let state = "?";
  if (/bootstrapp|profitab|independent|standalone|family/.test(v) && !/fund|vc|pe |conglom|group of|not |sub-brand/.test(v)) state = "ok";
  if (/funded|vc|conglom|fails|deadpool|listed|sub-brand|part of/.test(v)) state = "no";
  if (label === "Founder-led") state = val && val !== "—" && val.toLowerCase().indexOf("not") < 0 && val.toLowerCase() !== "unknown" ? "ok" : "?";
  if (label === "Profitable") state = val && val.toLowerCase().indexOf("unknown") < 0 && val !== "—" ? "ok" : "?";
  const col = state === "ok" ? "var(--accent)" : state === "no" ? "var(--brick)" : "var(--ink-3)";
  const ic = state === "ok" ? "✓" : state === "no" ? "✕" : "?";
  return `<span class="g"><span style="color:${col};font-weight:800">${ic}</span>${label}</span>`;
}
function srcsHTML(src: string) {
  if (!src) return "";
  const parts = src.split("|").map((x) => x.trim()).filter((u) => /^https?:/.test(u));
  if (!parts.length) return "";
  return `<div class="srcs">${parts
    .map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//, ""))}</a>`)
    .join("")}</div>`;
}

function openUni(r: any) {
  const s = SMAP[r.s] || SMAP["Screened-Out"];
  $("sh-kicker").textContent = r.p;
  $("sh-name").textContent = r.n;
  $("sh-pills").innerHTML = `<span class="badge ${s.cls}">${s.lbl}</span>` + pill(r.p, "var(--surface-2)", pcol(r.p));
  let kv = `<dl class="kv"><dt>Category</dt><dd>${esc(r.c || "—")}</dd><dt>Sub-cat</dt><dd>${esc(r.sc || "—")}</dd>`;
  if (r.fin) kv += `<dt>Financials</dt><dd>${esc(r.fin)}</dd>`;
  if (r.rr) kv += `<dt>Why parked</dt><dd>${esc(r.rr)}</dd>`;
  kv += `</dl>`;
  const note = r.cm ? `<div class="sh-note"><span class="lab">Notes from tracker</span>${esc(r.cm)}</div>` : "";
  const web = r.w && r.w !== "-" && /^https?:/.test(r.w)
    ? `<a class="visit" href="${esc(r.w)}" target="_blank" rel="noopener">Visit site / store ↗</a>` : "";
  $("sh-content").innerHTML = kv + note + web;
  openSheet();
}

function candDetail(r: any) {
  const v = vClass(r.v);
  $("sh-pills").innerHTML =
    `<span class="badge" style="background:${v.col};color:#fff">${esc(r.v || "—")}</span>` +
    pill(r.p, "var(--surface-2)", pcol(r.p)) +
    (r.conf ? pill("conf: " + r.conf, "var(--surface-2)", "var(--ink-2)") : "");
  const gates = `<div class="gate">${gate("Profitable", r.pat)}${gate("Bootstrapped", r.fund)}${gate("Founder-led", r.fo)}${gate("Independent", r.ind)}</div>`;
  let kv = `<dl class="kv">`;
  kv += `<dt>Sub-cat</dt><dd>${esc(r.sc || "—")}</dd>`;
  kv += `<dt>Founders</dt><dd>${esc(r.fo || "—")}</dd>`;
  kv += `<dt>Funding</dt><dd>${esc(r.fund || "—")}</dd>`;
  kv += `<dt>Independent</dt><dd>${esc(r.ind || "—")}</dd>`;
  kv += `<dt>Revenue</dt><dd${r.rev && r.rev !== "unknown" ? "" : ' class="muted"'}>${r.rev && r.rev !== "unknown" ? "₹" + esc(r.rev) + " Cr" : "unknown — pull MCA/Tofler"}</dd>`;
  kv += `<dt>Profit</dt><dd${r.pat && r.pat !== "unknown" ? "" : ' class="muted"'}>${esc(r.pat || "unknown")}</dd>`;
  kv += `<dt>Entity</dt><dd>${esc(r.ent || "—")}</dd>`;
  kv += `<dt>Online</dt><dd>${esc(r.on || "—")}</dd></dl>`;
  const note = r.note ? `<div class="sh-note"><span class="lab">Analyst note</span>${esc(r.note)}</div>` : "";
  return gates + kv + note + srcsHTML(r.src);
}

function openCand(r: any, kind: string) {
  $("sh-kicker").textContent = r.p + (kind === "p" ? " · prospect" : " · suggestion by Claude");
  $("sh-name").textContent = r.n;
  let extra = "";
  if (kind === "p" && WRITABLE) {
    extra =
      `<div class="triage">` +
      `<button class="acc" data-act="accept">Move to Pipeline</button>` +
      `<button class="rej" data-act="reject">Reject</button>` +
      `<button data-act="remove">Remove</button></div>`;
  }
  $("sh-content").innerHTML = candDetail(r) + extra;
  if (kind === "p" && WRITABLE) {
    $("sh-content").querySelectorAll(".triage button").forEach((b: any) =>
      b.addEventListener("click", () => triage(r.n, b.dataset.act)),
    );
  }
  openSheet();
}

// Result of a fresh research call: show profile + "Add as prospect"
function openResearch(r: any) {
  $("sh-kicker").textContent = r.p + " · researched just now";
  $("sh-name").textContent = r.n;
  const add = WRITABLE
    ? `<div class="triage"><button class="acc" id="add-prospect">＋ Add as prospect</button></div>`
    : `<div class="sh-note" style="margin-top:18px">Read-only — add a Vercel Blob store to enable saving prospects.</div>`;
  $("sh-content").innerHTML = candDetail(r) + add;
  const btn = document.getElementById("add-prospect");
  if (btn)
    btn.addEventListener("click", async () => {
      (btn as HTMLButtonElement).disabled = true;
      btn.innerHTML = '<span class="spin"></span>Adding…';
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect: r }),
      });
      if (res.ok) {
        await loadData();
        refreshHeaderCounts(); buildFunnel();
        closeSheet();
        ($("q") as HTMLInputElement).value = ""; q = "";
        ($("clr") as HTMLElement).style.display = "none";
        setView("prospects");
        toast(`Added ${r.n} to Prospects`);
      } else {
        const e = await res.json().catch(() => ({}));
        toast(e.error || "Could not save prospect");
        (btn as HTMLButtonElement).disabled = false;
        btn.textContent = "＋ Add as prospect";
      }
    });
  openSheet();
}

async function doResearch(company: string) {
  if (!company || researching) return;
  researching = true;
  render();
  try {
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ company }),
    });
    const data = await res.json();
    if (!res.ok || !data.profile) {
      toast(data.error || "Research failed");
      return;
    }
    openResearch(data.profile);
  } catch {
    toast("Research failed — try again");
  } finally {
    researching = false;
    render();
  }
}

async function triage(name: string, action: string) {
  const res = await fetch("/api/prospects", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, action }),
  });
  if (res.ok) {
    await loadData();
    refreshHeaderCounts(); buildFunnel(); render();
    closeSheet();
    toast(action === "accept" ? `${name} → Pipeline (add to tracker)` : action === "reject" ? `${name} rejected` : `${name} removed`);
  } else {
    toast("Action failed");
  }
}

export async function boot() {
  await loadData();
  $("m-date").textContent = "live";
  refreshHeaderCounts();
  buildFunnel();
  // tabs
  document.querySelectorAll(".tab").forEach((t: any) =>
    t.addEventListener("click", () => setView(t.dataset.view)),
  );
  // search
  const qEl = $("q") as HTMLInputElement, clr = $("clr");
  qEl.addEventListener("input", () => {
    q = qEl.value.trim().toLowerCase();
    clr.style.display = q ? "block" : "none";
    shown = 0;
    render();
  });
  clr.addEventListener("click", () => { qEl.value = ""; q = ""; clr.style.display = "none"; shown = 0; render(); qEl.focus(); });
  // modal close
  $("x").addEventListener("click", closeSheet);
  $("ov").addEventListener("click", (e) => { if (e.target === $("ov")) closeSheet(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("ov").classList.contains("show")) closeSheet(); });
  $("more").addEventListener("click", () => { shown = Math.min(shown + PAGE, results.length); render(); });
  buildPillars();
  buildStageChips();
  render();
}
