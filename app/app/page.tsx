import { redirect } from "next/navigation";
import { SkillderApp } from "@/components/skillder-app";
import { allowsDemoMode, hasSupabaseConfig } from "@/lib/env";
import { getCatalog } from "@/lib/skills/catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const params = await searchParams;
  const demo = params.demo === "1" && allowsDemoMode();

  if (!demo) {
    if (!hasSupabaseConfig()) redirect("/");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/");
  }

  const catalog = await getCatalog();
  return <SkillderApp skills={catalog.skills} demo={demo} />;
}
