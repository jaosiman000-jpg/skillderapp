import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchGitHubCatalog } from "@/lib/skills/github";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const catalog = await fetchGitHubCatalog();
  const names = catalog.map((skill) => skill.githubFullName);
  const { data: previous, error: readError } = await admin.from("skills").select("id,github_full_name,stars_total").in("github_full_name", names);
  if (readError) return NextResponse.json({ error: "Catalog read failed" }, { status: 500 });
  const previousByName = new Map((previous ?? []).map((row) => [row.github_full_name, row]));

  const rows = catalog.map((skill) => ({
    github_full_name: skill.githubFullName,
    slug: skill.slug,
    name: skill.name,
    owner: skill.owner,
    description_pt: skill.description["pt-BR"],
    description_en: skill.description.en,
    repository_url: skill.repositoryUrl,
    image_url: skill.imageUrl,
    install_command: skill.installCommand,
    ecosystems: skill.ecosystems,
    categories: skill.categories,
    license: skill.license,
    stars_total: skill.stars,
    stars_24h: Math.max(0, skill.stars - (previousByName.get(skill.githubFullName)?.stars_total ?? skill.stars)),
    forks_total: skill.forks,
    repo_updated_at: skill.updatedAt,
    verified: skill.verified,
    install_documented: skill.installDocumented,
    permissions_declared: skill.permissionsDeclared,
    active: true,
  }));
  const { data: upserted, error: upsertError } = await admin.from("skills").upsert(rows, { onConflict: "github_full_name" }).select("id,stars_total");
  if (upsertError) return NextResponse.json({ error: "Catalog update failed" }, { status: 500 });

  const capturedOn = new Date().toISOString().slice(0, 10);
  const snapshots = (upserted ?? []).map((row) => ({ skill_id: row.id, captured_on: capturedOn, stars: row.stars_total }));
  if (snapshots.length) await admin.from("skill_snapshots").upsert(snapshots, { onConflict: "skill_id,captured_on" });
  return NextResponse.json({ updated: rows.length, capturedOn });
}
