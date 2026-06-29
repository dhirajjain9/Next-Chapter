// Static markup for the pipeline shell. Rendered once; the client script in
// client.ts wires it up and fills it from /api/data.
export const MARKUP = `
<header class="app">
  <div class="head-inner">
    <div class="brand"><div class="mark">The Next Chapter<span class="dot">.</span></div></div>
    <div class="meta"><div><b id="m-total">—</b> screened · <b id="m-live">—</b> live</div><div id="m-date">live</div></div>
  </div>
  <div class="funnel" id="funnel"></div>
</header>
<div class="wrap">
  <div class="tabs" id="tabs" role="tablist">
    <button class="tab" role="tab" data-view="universe" aria-selected="true">Full universe<span class="c" id="t-uni"></span></button>
    <button class="tab" role="tab" data-view="prospects" aria-selected="false">Prospects<span class="c" id="t-pros"></span></button>
    <button class="tab" role="tab" data-view="sugpipe" aria-selected="false">Suggestions + Pipeline<span class="c" id="t-sp"></span></button>
    <button class="tab" role="tab" data-view="pipeline" aria-selected="false">Just Pipeline<span class="c" id="t-pipe"></span></button>
  </div>
  <div class="controls">
    <div class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="q" type="search" placeholder="Search a company — or research a new one…" autocomplete="off" aria-label="Search">
      <button class="clr" id="clr" aria-label="Clear">×</button>
    </div>
    <div class="chips" id="pillars"></div>
    <div class="chips" id="stages"></div>
  </div>
  <div class="resbar"><div><b id="count">0</b> <span id="count-lbl">companies</span></div><div class="sortnote" id="sortnote"></div></div>
  <div class="list" id="list"></div>
  <button class="more" id="more" style="display:none">Show more</button>
  <div class="foot"><b>Hard filters:</b> profitable · bootstrapped · founder-led · independent. Search any company; if it isn't tracked, it's researched live and you add it as a <b>Prospect</b>. The team then moves prospects into Pipeline or rejects them. Reference deal: Hokipo.</div>
</div>
<div class="ov" id="ov" role="dialog" aria-modal="true" aria-labelledby="sh-name">
  <div class="sheet" id="sheet">
    <div class="sh-head"><span class="sh-grip"></span>
      <div style="min-width:0"><div id="sh-kicker" style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--brass)"></div><h2 id="sh-name"></h2></div>
      <button class="x" id="x" aria-label="Close">×</button>
    </div>
    <div class="sh-pills" id="sh-pills"></div>
    <div id="sh-content"></div>
  </div>
</div>
<div class="toast" id="toast"></div>
`;
