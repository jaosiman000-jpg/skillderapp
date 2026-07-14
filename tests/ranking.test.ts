import { describe, expect, it } from "vitest";
import { matchesFilters, rankSkills } from "@/lib/skills/ranking";
import { DEFAULT_FILTERS, type Skill } from "@/lib/types";

const base: Skill = {
  id: "a",
  slug: "a",
  name: "A",
  owner: "owner",
  githubFullName: "owner/a",
  description: { "pt-BR": "Descrição", en: "Description" },
  repositoryUrl: "https://github.com/owner/a",
  imageUrl: "https://opengraph.githubassets.com/skillder/owner/a",
  installCommand: "npx skills add owner/a",
  ecosystems: ["Codex"],
  categories: ["Agentes"],
  license: "MIT",
  stars: 1000,
  forks: 100,
  likesCount: 12,
  trend24h: 20,
  updatedAt: new Date().toISOString(),
  verified: true,
  installDocumented: true,
  permissionsDeclared: false,
};

describe("skill ranking", () => {
  it("prioritizes recent growth over raw historical popularity", () => {
    const fast = { ...base, id: "fast", stars: 1000, trend24h: 300 };
    const famous = { ...base, id: "famous", stars: 100000, trend24h: 2 };
    expect(rankSkills([famous, fast])[0].id).toBe("fast");
  });

  it("applies the default quality and safety gates", () => {
    expect(matchesFilters(base, DEFAULT_FILTERS)).toBe(true);
    expect(matchesFilters({ ...base, license: null }, DEFAULT_FILTERS)).toBe(false);
    expect(matchesFilters({ ...base, verified: false }, DEFAULT_FILTERS)).toBe(false);
    expect(matchesFilters({ ...base, installDocumented: false }, DEFAULT_FILTERS)).toBe(false);
  });

  it("supports ecosystem and category filters", () => {
    const filters = { ...DEFAULT_FILTERS, ecosystems: ["Claude Code"], categories: ["Segurança"] };
    expect(matchesFilters(base, filters)).toBe(false);
    expect(matchesFilters({ ...base, ecosystems: ["Claude Code"], categories: ["Segurança"] }, filters)).toBe(true);
  });
});
