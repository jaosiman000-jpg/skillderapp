import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/skills/catalog";

export async function GET() {
  const catalog = await getCatalog();
  return NextResponse.json(catalog, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
