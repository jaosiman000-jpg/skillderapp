import { NextResponse } from "next/server";
import { z } from "zod";
import { allowsDemoMode, hasSupabaseConfig } from "@/lib/env";
import { fetchGitHubRepository, githubFullNameFromUrl, githubRepositoryToSkill, repositoryHasReadme } from "@/lib/skills/github";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SKILL_CATEGORIES, type Skill } from "@/lib/types";

export const runtime = "nodejs";

const MAX_COVER_BYTES = 3 * 1024 * 1024;
const SAFE_TEXT = /^[^<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+$/u;
const submissionSchema = z.object({
  creatorName: z.string().trim().min(2).max(40).regex(SAFE_TEXT),
  repositoryUrl: z.string().trim().url().max(200),
  category: z.enum(SKILL_CATEGORIES),
  messageMode: z.enum(["basic", "custom"]),
  customMessage: z.string().trim().max(500).optional(),
}).strict().superRefine((value, context) => {
  if (value.messageMode === "custom" && (!value.customMessage || value.customMessage.length < 20 || !SAFE_TEXT.test(value.customMessage))) {
    context.addIssue({ code: "custom", path: ["customMessage"], message: "Invalid custom message" });
  }
});

function detectImage(bytes: Uint8Array) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { extension: "png", contentType: "image/png" };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", contentType: "image/jpeg" };
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return { extension: "webp", contentType: "image/webp" };
  return null;
}

async function validateCover(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_COVER_BYTES) throw new Error("COVER_TOO_LARGE");
  const bytes = new Uint8Array(await value.arrayBuffer());
  const image = detectImage(bytes);
  if (!image) throw new Error("INVALID_COVER");
  return { bytes, ...image };
}

function rowFromSkill(skill: Skill, userId: string, creatorName: string, matchMessage: string, coverImageUrl: string | null) {
  return {
    github_full_name: skill.githubFullName,
    slug: skill.slug,
    name: skill.name,
    owner: skill.owner,
    description_pt: skill.description["pt-BR"],
    description_en: skill.description.en,
    repository_url: skill.repositoryUrl,
    image_url: skill.imageUrl,
    cover_image_url: coverImageUrl,
    install_command: skill.installCommand,
    ecosystems: skill.ecosystems,
    categories: skill.categories,
    license: skill.license,
    stars_total: skill.stars,
    stars_24h: skill.trend24h,
    forks_total: skill.forks,
    repo_updated_at: skill.updatedAt,
    verified: skill.verified,
    install_documented: skill.installDocumented,
    permissions_declared: skill.permissionsDeclared,
    is_community: true,
    submitted_by: userId,
    submitted_by_name: creatorName,
    match_message: matchMessage,
    active: true,
  };
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    const originUrl = new URL(origin);
    const requestHost = request.headers.get("host") ?? requestUrl.host;
    if (originUrl.host !== requestHost || originUrl.protocol !== requestUrl.protocol) {
      return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    }
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  const parsed = submissionSchema.safeParse({
    creatorName: formData.get("creatorName"),
    repositoryUrl: formData.get("repositoryUrl"),
    category: formData.get("category"),
    messageMode: formData.get("messageMode"),
    customMessage: formData.get("customMessage") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos obrigatórios." }, { status: 400 });

  const fullName = githubFullNameFromUrl(parsed.data.repositoryUrl);
  if (!fullName) return NextResponse.json({ error: "Use o link principal de um repositório público do GitHub." }, { status: 400 });

  let cover: Awaited<ReturnType<typeof validateCover>>;
  try {
    cover = await validateCover(formData.get("cover"));
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_COVER";
    return NextResponse.json({ error: code === "COVER_TOO_LARGE" ? "A capa deve ter no máximo 3 MB." : "Envie uma capa PNG, JPG ou WebP válida." }, { status: 400 });
  }

  const [repository, hasReadme] = await Promise.all([fetchGitHubRepository(fullName), repositoryHasReadme(fullName)]).catch(() => [null, false] as const);
  if (!repository || repository.archived || repository.fork) return NextResponse.json({ error: "O repositório precisa ser público, original e ativo." }, { status: 400 });
  if (!repository.description || !repository.license?.spdx_id || repository.license.spdx_id === "NOASSERTION" || !hasReadme) {
    return NextResponse.json({ error: "Para publicar, o repositório precisa ter descrição, README e licença identificada." }, { status: 400 });
  }

  const baseSkill = githubRepositoryToSkill(repository);
  const matchMessage = parsed.data.messageMode === "custom"
    ? parsed.data.customMessage!
    : `Oi! Eu sou ${parsed.data.creatorName}. Quero te apresentar ${baseSkill.name}. No repositório você encontra os detalhes, exemplos e a instalação recomendada.`;
  const communitySkill: Skill = {
    ...baseSkill,
    categories: [parsed.data.category],
    verified: true,
    installDocumented: true,
    community: true,
    submittedBy: parsed.data.creatorName,
    matchMessage,
  };

  const demo = requestUrl.searchParams.get("demo") === "1" && allowsDemoMode();
  if (demo && !hasSupabaseConfig()) return NextResponse.json({ skill: { ...communitySkill, id: `community-${crypto.randomUUID()}` } }, { status: 201 });
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Publicação ainda não configurada neste ambiente." }, { status: 503 });

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Entre na sua conta para publicar." }, { status: 401 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Publicação indisponível neste ambiente." }, { status: 503 });
  }

  const [dailySubmissions, duplicateRepository] = await Promise.all([
    admin.from("skills").select("id", { count: "exact", head: true }).eq("submitted_by", authData.user.id).gte("created_at", new Date(Date.now() - 86_400_000).toISOString()),
    admin.from("skills").select("id").eq("github_full_name", fullName).maybeSingle(),
  ]);
  if (dailySubmissions.error || duplicateRepository.error) {
    return NextResponse.json({ error: "Não foi possível validar esta publicação." }, { status: 500 });
  }
  if ((dailySubmissions.count ?? 0) >= 5) return NextResponse.json({ error: "Limite de cinco publicações por dia atingido." }, { status: 429 });
  if (duplicateRepository.data) return NextResponse.json({ error: "Este repositório já está no SKILLDER." }, { status: 409 });

  let coverImageUrl: string | null = null;
  let coverPath: string | null = null;
  if (cover) {
    coverPath = `${authData.user.id}/${crypto.randomUUID()}.${cover.extension}`;
    const { error: uploadError } = await admin.storage.from("skill-covers").upload(coverPath, cover.bytes, { contentType: cover.contentType, cacheControl: "31536000", upsert: false });
    if (uploadError) return NextResponse.json({ error: "Não foi possível salvar a capa." }, { status: 500 });
    coverImageUrl = admin.storage.from("skill-covers").getPublicUrl(coverPath).data.publicUrl;
  }

  const { data: inserted, error: insertError } = await admin.from("skills").insert(rowFromSkill(communitySkill, authData.user.id, parsed.data.creatorName, matchMessage, coverImageUrl)).select("id").single();
  if (insertError || !inserted) {
    if (coverPath) await admin.storage.from("skill-covers").remove([coverPath]);
    return NextResponse.json({ error: "Não foi possível publicar a skill." }, { status: 500 });
  }

  return NextResponse.json({ skill: { ...communitySkill, id: inserted.id, coverImageUrl } }, { status: 201 });
}
