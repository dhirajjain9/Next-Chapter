import { NextRequest, NextResponse } from "next/server";
import { addProspect, triageProspect, getProspects, blobEnabled } from "@/lib/store";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ prospects: await getProspects() });
}

export async function POST(req: NextRequest) {
  if (!blobEnabled()) {
    return NextResponse.json(
      { error: "Persistence not configured — add a Vercel Blob store (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const p = body?.prospect as Prospect | undefined;
  if (!p?.n) return NextResponse.json({ error: "Missing prospect." }, { status: 400 });
  return NextResponse.json({ prospects: await addProspect({ ...p, st: p.st || "Prospect" }) });
}

export async function PATCH(req: NextRequest) {
  if (!blobEnabled()) {
    return NextResponse.json({ error: "Persistence not configured." }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const name = body?.name?.toString();
  const action = body?.action?.toString();
  if (!name || !["accept", "reject", "remove"].includes(action)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  return NextResponse.json({ prospects: await triageProspect(name, action) });
}
