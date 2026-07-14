import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (authError || !code) return NextResponse.redirect(new URL("/?auth=oauth-failed", url.origin));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/?auth=oauth-failed", url.origin));
  return NextResponse.redirect(new URL("/app", url.origin));
}
