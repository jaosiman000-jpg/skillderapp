import type { Skill } from "@/lib/types";
import { rankSkills } from "@/lib/skills/ranking";

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
  license: { spdx_id: string } | null;
  topics?: string[];
};

const QUERIES = ["topic:agent-skills", "topic:claude-skills", "topic:codex-skills", "agent-skills in:name"];
const GITHUB_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function headers(): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

function categories(repo: GitHubRepo) {
  const values = new Set<string>(["Agentes"]);
  const text = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
  if (text.includes("security")) values.add("Segurança");
  if (text.includes("design") || text.includes("frontend")) values.add("Design");
  if (text.includes("science") || text.includes("research")) values.add("Pesquisa");
  if (text.includes("context")) values.add("Contexto");
  if (text.includes("data")) values.add("Dados");
  return [...values].slice(0, 2);
}

export function githubRepositoryToSkill(repo: GitHubRepo): Skill {
  const license = repo.license?.spdx_id;
  const documented = Boolean(repo.description && repo.description.length >= 24);
  return {
    id: String(repo.id),
    slug: repo.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: repo.name.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    owner: repo.owner.login,
    githubFullName: repo.full_name,
    description: { "pt-BR": repo.description ?? repo.full_name, en: repo.description ?? repo.full_name },
    repositoryUrl: repo.html_url,
    imageUrl: `https://opengraph.githubassets.com/skillder/${repo.full_name}`,
    installCommand: `npx skills add ${repo.full_name}`,
    ecosystems: ["Codex", "Claude Code", "Cursor"],
    categories: categories(repo),
    license: license && license !== "NOASSERTION" ? license : null,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    likesCount: 0,
    trend24h: null,
    updatedAt: repo.pushed_at,
    verified: Boolean(license && license !== "NOASSERTION" && documented),
    installDocumented: documented,
    permissionsDeclared: false,
    community: false,
    submittedBy: null,
    matchMessage: null,
  };
}

export function githubFullNameFromUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.search || url.hash) return null;
    const parts = url.pathname.replace(/\.git$/, "").split("/").filter(Boolean);
    const fullName = parts.length === 2 ? `${parts[0]}/${parts[1]}` : null;
    return fullName && GITHUB_NAME.test(fullName) ? fullName : null;
  } catch {
    return null;
  }
}

export async function fetchGitHubRepository(fullName: string) {
  if (!GITHUB_NAME.test(fullName)) throw new Error("Invalid GitHub repository name");
  const path = fullName.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`https://api.github.com/repos/${path}`, {
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub repository failed with ${response.status}`);
  return (await response.json()) as GitHubRepo;
}

export async function repositoryHasReadme(fullName: string) {
  if (!GITHUB_NAME.test(fullName)) return false;
  const path = fullName.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`https://api.github.com/repos/${path}/readme`, {
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  return response.ok;
}

export async function fetchGitHubCatalog(): Promise<Skill[]> {
  const results = await Promise.all(
    QUERIES.map(async (query) => {
      const url = new URL("https://api.github.com/search/repositories");
      url.searchParams.set("q", query);
      url.searchParams.set("sort", "stars");
      url.searchParams.set("order", "desc");
      url.searchParams.set("per_page", "20");
      const response = await fetch(url, {
        headers: headers(),
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`GitHub catalog failed with ${response.status}`);
      return (await response.json()) as { items: GitHubRepo[] };
    }),
  );

  const unique = new Map<number, GitHubRepo>();
  for (const repo of results.flatMap((result) => result.items)) {
    if (!repo.archived && !repo.fork && repo.description) unique.set(repo.id, repo);
  }

  return rankSkills([...unique.values()].map(githubRepositoryToSkill).filter((skill) => skill.verified)).slice(0, 60);
}
