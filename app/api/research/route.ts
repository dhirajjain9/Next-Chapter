import { NextRequest, NextResponse } from "next/server";
import { researchCompany } from "@/lib/research";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Hobby cap; research route is tuned to fit

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }
  let company = "";
  try {
    company = (await req.json())?.company?.toString().trim() ?? "";
  } catch {
    /* ignore */
  }
  if (!company) {
    return NextResponse.json({ error: "Provide a company name." }, { status: 400 });
  }
  try {
    const profile = await researchCompany(company);
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Research failed." },
      { status: 500 },
    );
  }
}
