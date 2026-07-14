import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ skillId: z.string().uuid(), decision: z.enum(["like", "dislike"]) }).strict();

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("interactions").upsert(
    { user_id: data.user.id, skill_id: parsed.data.skillId, decision: parsed.data.decision },
    { onConflict: "user_id,skill_id" },
  );
  if (error) return NextResponse.json({ error: "Could not save interaction" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
