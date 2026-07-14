"use client";

import { GitBranch, ImagePlus, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { SKILL_CATEGORIES, type Locale, type Skill } from "@/lib/types";

export function SubmitSkill({ locale, demo, onPublished }: { locale: Locale; demo: boolean; onPublished: (skill: Skill) => void }) {
  const isPortuguese = locale === "pt-BR";
  const [messageMode, setMessageMode] = useState<"basic" | "custom">("basic");
  const [creatorName, setCreatorName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/skills/submissions${demo ? "?demo=1" : ""}`, { method: "POST", body: formData });
      const result = (await response.json().catch(() => null)) as { skill?: Skill; error?: string } | null;
      if (!response.ok || !result?.skill) throw new Error(result?.error ?? (isPortuguese ? "Não foi possível publicar." : "Could not publish."));
      const cover = formData.get("cover");
      const skill = cover instanceof File && cover.size ? { ...result.skill, coverImageUrl: URL.createObjectURL(cover) } : result.skill;
      onPublished(skill);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : isPortuguese ? "Não foi possível publicar." : "Could not publish.");
    } finally {
      setPending(false);
    }
  }

  const basicPreview = isPortuguese
    ? `Oi! Eu sou ${creatorName.trim() || "seu nome"}. Quero te apresentar esta skill. No repositório você encontra os detalhes, exemplos e a instalação recomendada.`
    : `Hi! I’m ${creatorName.trim() || "your name"}. I want to introduce this skill. The repository contains details, examples, and the recommended installation.`;

  return (
    <section className="submit-page">
      <header className="page-header"><Brand /><h1>{isPortuguese ? "Publicar skill" : "Publish a skill"}</h1><p>{isPortuguese ? "Apresente seu trabalho para outros vibecoders." : "Introduce your work to other vibecoders."}</p></header>
      <form className="submit-form" onSubmit={submit}>
        <fieldset>
          <legend><GitBranch />{isPortuguese ? "Repositório" : "Repository"}</legend>
          <label>{isPortuguese ? "Seu nome" : "Your name"}<input name="creatorName" value={creatorName} onChange={(event) => setCreatorName(event.target.value)} required minLength={2} maxLength={40} autoComplete="name" placeholder={isPortuguese ? "Como você quer aparecer" : "How you want to appear"} /></label>
          <label>{isPortuguese ? "Link do GitHub" : "GitHub link"}<input name="repositoryUrl" type="url" inputMode="url" required maxLength={200} placeholder="https://github.com/usuario/repositorio" /></label>
          <label>{isPortuguese ? "Categoria" : "Category"}<select name="category" required defaultValue=""><option value="" disabled>{isPortuguese ? "Selecione uma categoria" : "Select a category"}</option>{SKILL_CATEGORIES.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
        </fieldset>

        <fieldset>
          <legend><ImagePlus />{isPortuguese ? "Capa" : "Cover"}</legend>
          <label className="file-control"><span>{isPortuguese ? "Imagem opcional" : "Optional image"}<small>PNG, JPG ou WebP · máximo 3 MB</small></span><input name="cover" type="file" accept="image/png,image/jpeg,image/webp" /></label>
          <p className="field-help">{isPortuguese ? "Sem capa, usaremos a imagem social do GitHub e um card visual de segurança caso ela falhe." : "Without a cover, we use GitHub’s social image and a visual safety fallback if it fails."}</p>
        </fieldset>

        <fieldset>
          <legend><MessageCircle />{isPortuguese ? "Mensagem do match" : "Match message"}</legend>
          <div className="message-mode" role="radiogroup" aria-label={isPortuguese ? "Tipo de mensagem" : "Message type"}>
            <label><input type="radio" name="messageMode" value="basic" checked={messageMode === "basic"} onChange={() => setMessageMode("basic")} />{isPortuguese ? "Mensagem básica" : "Basic message"}</label>
            <label><input type="radio" name="messageMode" value="custom" checked={messageMode === "custom"} onChange={() => setMessageMode("custom")} />{isPortuguese ? "Personalizada" : "Custom"}</label>
          </div>
          {messageMode === "basic" ? <div className="message-preview">{basicPreview}</div> : <label>{isPortuguese ? "Sua mensagem" : "Your message"}<textarea name="customMessage" value={customMessage} onChange={(event) => setCustomMessage(event.target.value)} required minLength={20} maxLength={500} rows={6} placeholder={isPortuguese ? "Conte o que sua skill faz, para quem ela serve e inclua seu Instagram se quiser." : "Explain what your skill does, who it helps, and include your Instagram if you want."} /><small>{customMessage.length}/500</small></label>}
        </fieldset>

        <p className="submission-safety"><ShieldCheck />{isPortuguese ? "Publicamos apenas repositórios públicos, ativos, com README, descrição e licença identificada. A mensagem é exibida como texto, sem executar HTML." : "We only publish public, active repositories with a README, description, and identified license. Messages are displayed as text and never execute HTML."}</p>
        {error ? <p className="submission-error" role="alert">{error}</p> : null}
        <button className="submit-skill-button" type="submit" disabled={pending}>{pending ? (isPortuguese ? "Validando GitHub…" : "Validating GitHub…") : (isPortuguese ? "Publicar no SKILLDER" : "Publish on SKILLDER")}</button>
      </form>
    </section>
  );
}
