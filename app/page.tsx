import { redirect } from "next/navigation";
import { EntryExperience } from "@/components/entry-experience";
import { allowsDemoMode, hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const params = await searchParams;
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/app");
  }
  return <EntryExperience demoAllowed={allowsDemoMode()} authIssue={params.auth} />;
}
