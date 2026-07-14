"use client";

import { ArrowLeft, Bot, CheckCircle2, FileCheck2, Heart, ShieldCheck, Tag, X } from "lucide-react";
import type { Decision, Locale, Skill } from "@/lib/types";
import { copy } from "@/lib/i18n";
import { SkillArtwork } from "@/components/skill-artwork";

export function SkillProfile({ skill, locale, onBack, onDecision }: { skill: Skill; locale: Locale; onBack: () => void; onDecision: (decision: Decision) => void }) {
  const t = copy[locale];
  const sections = [
    {
      title: locale === "pt-BR" ? "Essencial" : "Essential",
      icon: FileCheck2,
      rows: [
        [locale === "pt-BR" ? "Repositório" : "Repository", "GitHub oficial"],
        [locale === "pt-BR" ? "Curtidas no SKILLDER" : "SKILLDER likes", (skill.likesCount ?? 0).toLocaleString(locale)],
        [locale === "pt-BR" ? "Atualizada" : "Updated", new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(skill.updatedAt))],
        [locale === "pt-BR" ? "Licença" : "License", skill.license ?? "—"],
      ],
    },
    { title: locale === "pt-BR" ? "Compatibilidade" : "Compatibility", icon: Bot, rows: skill.ecosystems.map((item) => [item, "✓"]) },
    {
      title: locale === "pt-BR" ? "Segurança" : "Security",
      icon: ShieldCheck,
      rows: [
        [locale === "pt-BR" ? "Metadados validados" : "Metadata validated", skill.verified ? "✓" : "—"],
        [locale === "pt-BR" ? "Instalação documentada" : "Install documented", skill.installDocumented ? "✓" : "—"],
        [locale === "pt-BR" ? "Permissões declaradas" : "Permissions declared", skill.permissionsDeclared ? "✓" : "—"],
      ],
    },
    { title: locale === "pt-BR" ? "Categorias" : "Categories", icon: Tag, rows: skill.categories.map((item) => [item, ""]) },
  ];

  return (
    <section className="profile-page">
      <header className="profile-header">
        <button type="button" onClick={onBack} aria-label="Voltar"><ArrowLeft /></button>
        <div className="profile-avatar"><SkillArtwork skill={skill} presentation="avatar" /></div>
        <div><strong>{skill.name}</strong><span><CheckCircle2 /> {skill.community ? t.community : t.verifiedSkill}</span></div>
      </header>
      <div className="profile-hero">
        <SkillArtwork skill={skill} alt={`Capa do repositório ${skill.githubFullName}`} presentation="hero" priority />
        <div className="media-progress"><span className="is-active" /><span /><span /><span /></div>
        <div><h1>{skill.name}</h1>{skill.community && skill.submittedBy ? <small>{locale === "pt-BR" ? "Enviada por" : "Submitted by"} {skill.submittedBy}</small> : null}<p>{skill.trend24h === null ? t.popular : `${t.trending} · +${skill.trend24h.toLocaleString()} ${t.stars}`}</p></div>
      </div>
      <div className="profile-sections">
        {sections.map(({ title, icon: Icon, rows }) => (
          <section className="profile-section" key={title}>
            <h2><Icon />{title}</h2>
            {rows.map(([label, value]) => <div className="profile-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </section>
        ))}
        <p className="safety-note"><ShieldCheck />{t.safety}</p>
      </div>
      <div className="profile-actions">
        <button className="decision decision--nope" type="button" onClick={() => onDecision("dislike")} aria-label="Descartar"><X /></button>
        <button className="decision decision--like" type="button" onClick={() => onDecision("like")} aria-label="Gostei"><Heart fill="currentColor" /></button>
      </div>
    </section>
  );
}
