import { NextResponse } from "next/server";
import universe from "@/appdata/universe.json";
import suggestions from "@/appdata/suggestions.json";
import { getProspects, blobEnabled } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const prospects = await getProspects();
  return NextResponse.json(
    { universe, candidates: suggestions, prospects, writable: blobEnabled() },
    { headers: { "cache-control": "no-store" } },
  );
}
