import type { Skill } from "@/lib/types";
import { hasSupabaseConfig } from "@/lib/env";
import { fetchGitHubCatalog } from "@/lib/skills/github";
import { rankSkills } from "@/lib/skills/ranking";
import { seedSkills } from "@/lib/skills/seed";
import { createClient } from "@/lib/supabase/server";

type SkillRow = {
  id: string;
  slug: string;
  name: string;
  owner: string;
  github_full_name: string;
  description_pt: string;
  description_en: string;
  repository_url: string;
  image_url: string;
  cover_image_url: string | null;
  install_command: string;
  ecosystems: string[];
  categories: string[];
  license: string | null;
  stars_total: number;
  forks_total: number;
  likes_count: number;
  stars_24h: number | null;
  repo_updated_at: string;
  verified: boolean;
  install_documented: boolean;
  permissions_declared: boolean;
  is_community: boolean;
  submitted_by_name: string | null;
  match_message: string | null;
};

function fromRow(row: SkillRow): Skill {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    owner: row.owner,
    githubFullName: row.github_full_name,
    description: { "pt-BR": row.description_pt, en: row.description_en },
    repositoryUrl: row.repository_url,
    imageUrl: row.image_url,
    coverImageUrl: row.cover_image_url,
    installCommand: row.install_command,
    ecosystems: row.ecosystems,
    categories: row.categories,
    license: row.license,
    stars: row.stars_total,
    forks: row.forks_total,
    likesCount: row.likes_count,
    trend24h: row.stars_24h,
    updatedAt: row.repo_updated_at,
    verified: row.verified,
    installDocumented: row.install_documented,
    permissionsDeclared: row.permissions_declared,
    community: row.is_community,
    submittedBy: row.submitted_by_name,
    matchMessage: row.match_message,
  };
}

export async function getCatalog(): Promise<{ skills: Skill[]; source: "github" | "demo" }> {
  if (hasSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from("skills").select("id,slug,name,owner,github_full_name,description_pt,description_en,repository_url,image_url,cover_image_url,install_command,ecosystems,categories,license,stars_total,forks_total,likes_count,stars_24h,repo_updated_at,verified,install_documented,permissions_declared,is_community,submitted_by_name,match_message").eq("active", true).order("stars_24h", { ascending: false }).limit(100);
      if (error) throw error;
      if (data?.length) return { skills: rankSkills(data.map((row) => fromRow(row as SkillRow))), source: "github" };
    } catch (error) {
      console.warn("Supabase catalog unavailable; trying GitHub.", error);
    }
  }
  try {
    const skills = await fetchGitHubCatalog();
    if (skills.length) return { skills, source: "github" };
  } catch (error) {
    console.warn("GitHub catalog unavailable; using the local development catalog.", error);
  }
  return { skills: rankSkills(seedSkills), source: "demo" };
}
