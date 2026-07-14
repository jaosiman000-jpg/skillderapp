import type { DiscoveryFilters, Skill } from "@/lib/types";

export function freshnessDays(updatedAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(updatedAt).getTime()) / 86_400_000));
}

export function trendScore(skill: Pick<Skill, "stars" | "trend24h" | "updatedAt">) {
  const velocity = Math.log2(1 + Math.max(0, skill.trend24h ?? 0)) * 8;
  const popularity = Math.log10(10 + skill.stars) * 4;
  const freshness = Math.max(0, 14 - freshnessDays(skill.updatedAt)) * 0.6;
  return velocity + popularity + freshness;
}

export function matchesFilters(skill: Skill, filters: DiscoveryFilters) {
  if (!filters.includeNewVerified && skill.trend24h === null) return false;
  if ((skill.trend24h ?? 0) < filters.minTrend) return false;
  if (filters.verifiedOnly && !skill.verified) return false;
  if (filters.requireLicense && !skill.license) return false;
  if (filters.installDocumentedOnly && !skill.installDocumented) return false;
  if (freshnessDays(skill.updatedAt) > filters.maxAgeDays) return false;
  if (filters.ecosystems.length && !skill.ecosystems.some((item) => filters.ecosystems.includes(item))) return false;
  if (filters.categories.length && !skill.categories.some((item) => filters.categories.includes(item))) return false;
  return true;
}

export function rankSkills(skills: Skill[]) {
  return skills.toSorted((a, b) => trendScore(b) - trendScore(a));
}
