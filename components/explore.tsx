"use client";

import { Heart, Search, Star, TrendingUp, X } from "lucide-react";
import { useMemo } from "react";
import { Brand } from "@/components/brand";
import { SkillArtwork } from "@/components/skill-artwork";
import { trendScore } from "@/lib/skills/ranking";
import { SKILL_CATEGORIES, type Locale, type Skill } from "@/lib/types";

function searchableText(skill: Skill, locale: Locale) {
  return [skill.name, skill.owner, skill.githubFullName, skill.submittedBy, ...skill.categories, skill.description[locale]]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase(locale);
}

function ExploreCard({ skill, locale, liked, onOpen }: { skill: Skill; locale: Locale; liked: boolean; onOpen: () => void }) {
  const likes = Math.max(Number.isFinite(skill.likesCount) ? skill.likesCount : 0, liked ? 1 : 0);
  return (
    <button className="explore-card" type="button" onClick={onOpen} aria-label={`${locale === "pt-BR" ? "Abrir" : "Open"} ${skill.name}`}>
      <SkillArtwork skill={skill} alt="" presentation="tile" />
      <span className="explore-card__shade" aria-hidden="true" />
      <span className="explore-card__copy">
        {skill.community ? <small className="community-badge">{locale === "pt-BR" ? "Comunidade" : "Community"}</small> : null}
        <strong>{skill.name}</strong>
        <small>{skill.submittedBy ? `${locale === "pt-BR" ? "por" : "by"} ${skill.submittedBy}` : skill.githubFullName}</small>
        <span className="explore-card__metrics"><span><Heart fill="currentColor" />{likes.toLocaleString(locale)}</span><span><Star fill="currentColor" />{skill.stars.toLocaleString(locale)}</span></span>
      </span>
    </button>
  );
}

function Carousel({ title, icon: Icon, skills, locale, likedIds, onOpen }: { title: string; icon?: typeof TrendingUp; skills: Skill[]; locale: Locale; likedIds: string[]; onOpen: (skill: Skill) => void }) {
  if (!skills.length) return null;
  return (
    <section className="explore-section">
      <h2>{Icon ? <Icon /> : null}{title}</h2>
      <div className="explore-carousel">
        {skills.map((skill) => <ExploreCard key={skill.id} skill={skill} locale={locale} liked={likedIds.includes(skill.id)} onOpen={() => onOpen(skill)} />)}
      </div>
    </section>
  );
}

export function Explore({ skills, locale, likedIds, query, onQuery, onOpen }: { skills: Skill[]; locale: Locale; likedIds: string[]; query: string; onQuery: (query: string) => void; onOpen: (skill: Skill) => void }) {
  const normalizedQuery = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(locale);
  const searchResults = useMemo(() => normalizedQuery ? skills.filter((skill) => searchableText(skill, locale).includes(normalizedQuery)) : [], [locale, normalizedQuery, skills]);
  const trending = useMemo(() => [...skills].sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 10), [skills]);
  const mostLiked = useMemo(() => [...skills].sort((a, b) => b.likesCount - a.likesCount || b.stars - a.stars).slice(0, 10), [skills]);
  const categoryRows = useMemo(() => SKILL_CATEGORIES.map((category) => ({ category, skills: skills.filter((skill) => skill.categories.includes(category)).slice(0, 10) })).filter((row) => row.skills.length), [skills]);
  const isPortuguese = locale === "pt-BR";

  return (
    <section className="explore-page">
      <header className="explore-header">
        <Brand />
        <h1>{isPortuguese ? "Explorar" : "Explore"}</h1>
        <label className="explore-search"><Search aria-hidden="true" /><input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder={isPortuguese ? "Buscar usuário, skill ou repositório" : "Search user, skill, or repository"} aria-label={isPortuguese ? "Buscar no SKILLDER" : "Search SKILLDER"} />{query ? <button type="button" onClick={() => onQuery("")} aria-label={isPortuguese ? "Limpar busca" : "Clear search"}><X /></button> : null}</label>
      </header>

      {normalizedQuery ? (
        searchResults.length ? <Carousel title={`${isPortuguese ? "Resultados para" : "Results for"} “${query.trim()}”`} skills={searchResults} locale={locale} likedIds={likedIds} onOpen={onOpen} /> : <div className="explore-empty"><Search /><h2>{isPortuguese ? "Nada encontrado" : "No results"}</h2><p>{isPortuguese ? "Tente o nome da skill, usuário ou repositório." : "Try a skill, user, or repository name."}</p></div>
      ) : (
        <>
          <Carousel title={isPortuguese ? "Em alta agora" : "Trending now"} icon={TrendingUp} skills={trending} locale={locale} likedIds={likedIds} onOpen={onOpen} />
          <Carousel title={isPortuguese ? "Mais curtidas no SKILLDER" : "Most liked on SKILLDER"} icon={Heart} skills={mostLiked} locale={locale} likedIds={likedIds} onOpen={onOpen} />
          {categoryRows.map(({ category, skills: categorySkills }) => <Carousel key={category} title={category} skills={categorySkills} locale={locale} likedIds={likedIds} onOpen={onOpen} />)}
        </>
      )}
    </section>
  );
}
