export type Locale = "pt-BR" | "en";
export type Decision = "like" | "dislike";

export type Skill = {
  id: string;
  slug: string;
  name: string;
  owner: string;
  githubFullName: string;
  description: Record<Locale, string>;
  repositoryUrl: string;
  imageUrl: string;
  coverImageUrl?: string | null;
  installCommand: string;
  ecosystems: string[];
  categories: string[];
  license: string | null;
  stars: number;
  forks: number;
  likesCount: number;
  trend24h: number | null;
  updatedAt: string;
  verified: boolean;
  installDocumented: boolean;
  permissionsDeclared: boolean;
  community?: boolean;
  submittedBy?: string | null;
  matchMessage?: string | null;
};

export const SKILL_CATEGORIES = ["Agentes", "Engenharia", "Segurança", "Design", "Pesquisa", "Dados", "Contexto", "Produtividade"] as const;

export type DiscoveryFilters = {
  minTrend: number;
  includeNewVerified: boolean;
  ecosystems: string[];
  categories: string[];
  verifiedOnly: boolean;
  requireLicense: boolean;
  installDocumentedOnly: boolean;
  maxAgeDays: number;
};

export const DEFAULT_FILTERS: DiscoveryFilters = {
  minTrend: 0,
  includeNewVerified: true,
  ecosystems: [],
  categories: [],
  verifiedOnly: true,
  requireLicense: true,
  installDocumentedOnly: true,
  maxAgeDays: 90,
};
