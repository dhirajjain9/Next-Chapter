// Live company research with web search, assessed against Chapter Home's 4 hard
// filters. Provider-flexible: uses OpenAI when OPENAI_KEY is set, otherwise
// falls back to the Anthropic API when ANTHROPIC_API_KEY is set.

import type { Prospect } from "./types";

const PILLARS = [
  "Kitchen",
  "Soft Furnishings",
  "Decor & Home Improvement",
  "Small Appliances",
];

const SYSTEM = `You are a research analyst for Chapter Home, an Indian "house of brands" roll-up that acquires PROFITABLE, BOOTSTRAPPED, FOUNDER-LED, INDEPENDENT (not part of a conglomerate/group) Home & Kitchen businesses. They own Hokipo (furnishings).

Research the company the user names using web search. Disambiguate to the real Indian home/kitchen brand. Then assess it against the four hard filters. NEVER invent financials, founders, or an entity — if you cannot verify something, use "unknown".

When done researching, output ONLY a single JSON object (no prose, no markdown fences) with EXACTLY these keys:
{
 "n": brand name,
 "p": one of ${JSON.stringify(PILLARS)} (best-fit pillar; use "Other" if none fit),
 "sc": short sub-category / what they sell,
 "fo": founders/promoters (names) or "unknown",
 "fund": funding status — note if bootstrapped/unfunded vs funded (cite source briefly),
 "ind": independence — standalone, or part of a group (flag disqualifier),
 "rev": latest revenue in INR Cr if found, else "unknown",
 "pat": profit/margin signal if found, else "unknown",
 "on": online presence (own site / Amazon / Instagram scale),
 "v": fit verdict — one of "Strong" | "Medium-Strong" | "Medium" | "Medium-Weak" | "Weak",
 "conf": confidence note,
 "src": up to 3 source URLs separated by " | ",
 "ent": legal entity (CIN/LLPIN) or "unknown",
 "note": one-line analyst takeaway incl. the key risk/gap
}`;

const USER_PROMPT = (company: string) =>
  `Research this company and return the JSON profile: ${company}`;

function extractJson(text: string): Record<string, unknown> | null {
  // Find the last balanced {...} object in the text.
  const end = text.lastIndexOf("}");
  if (end < 0) return null;
  let depth = 0;
  for (let i = end; i >= 0; i--) {
    if (text[i] === "}") depth++;
    else if (text[i] === "{") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(i, end + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// --- OpenAI provider (Responses API + web_search tool) ---------------------
async function runOpenAI(company: string): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });
  const resp: any = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    instructions: SYSTEM,
    input: USER_PROMPT(company),
    tools: [{ type: "web_search" }],
  } as any);
  if (typeof resp.output_text === "string" && resp.output_text.trim()) {
    return resp.output_text;
  }
  // Fallback: concatenate any text fragments from the structured output.
  const parts: string[] = [];
  for (const item of resp.output ?? []) {
    for (const c of item.content ?? []) {
      if (typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("\n");
}

// --- Anthropic provider (web_search server tool) ---------------------------
async function runAnthropic(company: string): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const messages: any[] = [{ role: "user", content: USER_PROMPT(company) }];

  let text = "";
  // Server-tool loop: web search runs server-side; resume on pause_turn.
  // Tuned to finish inside Vercel Hobby's 60s function cap.
  for (let i = 0; i < 2; i++) {
    const params: any = {
      model: "claude-opus-4-8",
      max_tokens: 2500,
      system: SYSTEM,
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages,
    };
    const resp: any = await client.messages.create(params);
    text = (resp.content as any[])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    if (resp.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: resp.content });
      continue;
    }
    break;
  }
  return text;
}

export function researchProvider(): "openai" | "anthropic" | null {
  if (process.env.OPENAI_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export async function researchCompany(company: string): Promise<Prospect> {
  const provider = researchProvider();
  const text =
    provider === "openai"
      ? await runOpenAI(company)
      : provider === "anthropic"
        ? await runAnthropic(company)
        : "";

  const parsed = extractJson(text) || {};
  const s = (k: string, d = "unknown") =>
    typeof parsed[k] === "string" && (parsed[k] as string).trim()
      ? (parsed[k] as string).trim()
      : d;

  return {
    n: s("n", company),
    p: PILLARS.includes(s("p", "")) ? s("p") : "Other",
    sc: s("sc"),
    fo: s("fo"),
    fund: s("fund"),
    ind: s("ind"),
    rev: s("rev"),
    pat: s("pat"),
    on: s("on"),
    v: s("v", "Medium"),
    conf: s("conf"),
    src: s("src", ""),
    ent: s("ent"),
    note: s("note", ""),
    st: "Prospect",
    ad: new Date().toISOString().slice(0, 10),
  };
}
