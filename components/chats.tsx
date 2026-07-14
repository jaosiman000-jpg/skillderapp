"use client";

import { ArrowLeft, Check, Copy, ExternalLink, GitBranch, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { SkillArtwork } from "@/components/skill-artwork";
import { copy } from "@/lib/i18n";
import type { Locale, Skill } from "@/lib/types";

export function ChatList({ skills, locale, onOpen }: { skills: Skill[]; locale: Locale; onOpen: (skill: Skill) => void }) {
  const t = copy[locale];
  return (
    <section className="chat-list-page">
      <header className="page-header"><Brand /><h1>{t.chats}</h1></header>
      <h2>{locale === "pt-BR" ? "Seus matches" : "Your matches"}</h2>
      {skills.length ? (
        <div className="chat-list">
          {skills.map((skill, index) => (
            <button type="button" className="chat-row" key={skill.id} onClick={() => onOpen(skill)}>
              <span className="chat-avatar"><SkillArtwork skill={skill} presentation="avatar" /></span>
              <span><strong>{skill.name}</strong><small>{locale === "pt-BR" ? "Repositório e instalação disponíveis." : "Repository and install instructions available."}</small></span>
              {index === 0 ? <i aria-label="Não lida" /> : null}
            </button>
          ))}
        </div>
      ) : <div className="empty-state"><span>✦</span><p>{t.emptyChats}</p></div>}
    </section>
  );
}

export function ChatDetail({ skill, locale, onBack }: { skill: Skill; locale: Locale; onBack: () => void }) {
  const t = copy[locale];
  const [copied, setCopied] = useState(false);
  async function copyInstall() {
    await navigator.clipboard.writeText(skill.installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <section className="chat-detail-page">
      <header className="chat-header">
        <button type="button" onClick={onBack} aria-label="Voltar"><ArrowLeft /></button>
        <span className="chat-avatar chat-avatar--small"><SkillArtwork skill={skill} presentation="avatar" /></span>
        <span><strong>{skill.name}</strong><small><Check />{t.verifiedSkill}</small></span>
      </header>
      <div className="message-area">
        <article className="skill-message">
          <h1>{locale === "pt-BR" ? `Você deu match com ${skill.name}.` : `You matched with ${skill.name}.`}</h1>
          <p>{skill.matchMessage ?? (locale === "pt-BR" ? "Aqui está o repositório oficial e a forma recomendada de instalar." : "Here is the official repository and recommended install method.")}</p>
          <a className="source-link" href={skill.repositoryUrl} target="_blank" rel="noreferrer"><GitBranch /><span><strong>{t.officialGithub}</strong><small>{skill.githubFullName}</small></span><ExternalLink /></a>
          <div className="install-code"><code>{skill.installCommand}</code><button type="button" onClick={copyInstall} aria-label={t.copyCommand}>{copied ? <Check /> : <Copy />}</button></div>
          <div className="message-actions">
            <a href={skill.repositoryUrl} target="_blank" rel="noreferrer"><ExternalLink />{t.openGithub}</a>
            <button type="button" onClick={copyInstall}>{copied ? <Check /> : <Copy />}{copied ? t.copied : t.copyCommand}</button>
          </div>
        </article>
        <p className="safety-note"><ShieldCheck />{t.safety}</p>
      </div>
    </section>
  );
}
