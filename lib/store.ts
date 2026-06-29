// Prospects persistence.
//
// The universe (1,000) and suggestions (74) are static, bundled JSON — read-only.
// Prospects are the only mutable data, so they live in Vercel Blob (a single
// JSON document). If BLOB_READ_WRITE_TOKEN isn't configured, we fall back to the
// bundled seed and writes are disabled — the app still renders, read-only.

import { put, list } from "@vercel/blob";
import seed from "../appdata/prospects.seed.json";
import type { Prospect } from "./types";

const BLOB_PATH = "data/prospects.json";

export function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function getProspects(): Promise<Prospect[]> {
  if (!blobEnabled()) return seed as Prospect[];
  try {
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
    if (!blobs.length) return seed as Prospect[];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return seed as Prospect[];
    return (await res.json()) as Prospect[];
  } catch {
    return seed as Prospect[];
  }
}

async function save(prospects: Prospect[]): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(prospects), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export async function addProspect(p: Prospect): Promise<Prospect[]> {
  const all = await getProspects();
  const i = all.findIndex((x) => x.n.toLowerCase() === p.n.toLowerCase());
  if (i >= 0) all[i] = p;
  else all.unshift(p);
  await save(all);
  return all;
}

// Triage: status -> "Moved-to-Pipeline" | "Rejected"; "remove" deletes the row.
export async function triageProspect(
  name: string,
  action: "accept" | "reject" | "remove",
): Promise<Prospect[]> {
  let all = await getProspects();
  if (action === "remove") {
    all = all.filter((x) => x.n.toLowerCase() !== name.toLowerCase());
  } else {
    all = all.map((x) =>
      x.n.toLowerCase() === name.toLowerCase()
        ? { ...x, st: action === "accept" ? "Moved-to-Pipeline" : "Rejected" }
        : x,
    );
  }
  await save(all);
  return all;
}
