"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { ArrowUp, Check, Code2, Copy, GitFork, Heart, ShieldCheck, Star, X } from "lucide-react";
import { copy } from "@/lib/i18n";
import { SkillArtwork } from "@/components/skill-artwork";
import type { Decision, Locale, Skill } from "@/lib/types";

type Props = {
  skill: Skill;
  locale: Locale;
  mediaIndex: number;
  onMediaChange: (index: number) => void;
  onDecision: (decision: Decision) => void;
  onOpenProfile: () => void;
};

export function SkillCard({ skill, locale, mediaIndex, onMediaChange, onDecision, onOpenProfile }: Props) {
  const t = copy[locale];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-8, 0, 8]);
  const likeOpacity = useTransform(x, [40, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -40], [1, 0]);
  const trendLabel = skill.trend24h === null ? t.popular : `${t.trending} · +${skill.trend24h.toLocaleString()} ${t.stars}`;

  const changeMedia = (delta: number) => onMediaChange(Math.max(0, Math.min(3, mediaIndex + delta)));

  return (
    <section className="discovery-stage" aria-label={skill.name}>
      <motion.article
        className="skill-card"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.72}
        onDragEnd={(_, info) => {
          if (info.offset.x > 120) onDecision("like");
          else if (info.offset.x < -120) onDecision("dislike");
          else animate(x, 0, { type: "spring", stiffness: 420, damping: 34 });
        }}
      >
        <div className="media-progress" aria-label={`Mídia ${mediaIndex + 1} de 4`}>
          {[0, 1, 2, 3].map((index) => <span className={index === mediaIndex ? "is-active" : ""} key={index} />)}
        </div>

        {mediaIndex === 0 ? (
          <SkillArtwork skill={skill} alt={`Capa do repositório ${skill.githubFullName}`} priority />
        ) : null}
        {mediaIndex === 1 ? (
          <div className="skill-media-panel skill-media-panel--stats">
            <Star /><strong>{skill.stars.toLocaleString()}</strong><span>{t.stars}</span>
            <GitFork /><strong>{skill.forks.toLocaleString()}</strong><span>forks</span>
            <ShieldCheck /><strong>{skill.license ?? "—"}</strong><span>licença</span>
          </div>
        ) : null}
        {mediaIndex === 2 ? (
          <div className="skill-media-panel skill-media-panel--compatibility">
            <ShieldCheck />
            <h2>Compatibilidade</h2>
            {skill.ecosystems.map((item) => <p key={item}><Check />{item}</p>)}
          </div>
        ) : null}
        {mediaIndex === 3 ? (
          <div className="skill-media-panel skill-media-panel--install">
            <Code2 />
            <h2>{t.installTitle}</h2>
            <code>{skill.installCommand}</code>
            <span><Copy />{t.copyCommand}</span>
          </div>
        ) : null}

        <button className="media-tap media-tap--left" type="button" aria-label="Mídia anterior" onClick={() => changeMedia(-1)} />
        <button className="media-tap media-tap--right" type="button" aria-label="Próxima mídia" onClick={() => changeMedia(1)} />
        <motion.div className="swipe-stamp swipe-stamp--like" style={{ opacity: likeOpacity }}>LIKE</motion.div>
        <motion.div className="swipe-stamp swipe-stamp--nope" style={{ opacity: nopeOpacity }}>NOPE</motion.div>

        {mediaIndex === 0 ? (
          <div className="skill-card__copy">
            {skill.community ? <span className="community-badge">{t.community}</span> : null}
            <h1>{skill.name}</h1>
            {skill.community && skill.submittedBy ? <small className="skill-card__author">{locale === "pt-BR" ? "Enviada por" : "Submitted by"} {skill.submittedBy}</small> : null}
            <p className="skill-card__trend">{trendLabel}</p>
            <p>{skill.description[locale]}</p>
          </div>
        ) : null}
        <button className="profile-arrow" type="button" onClick={onOpenProfile} aria-label={`Abrir perfil de ${skill.name}`}><ArrowUp /></button>
      </motion.article>

      <div className="decision-actions" aria-label="Decidir">
        <button className="decision decision--nope" type="button" onClick={() => onDecision("dislike")} aria-label="Descartar"><X /></button>
        <button className="decision decision--like" type="button" onClick={() => onDecision("like")} aria-label="Gostei"><Heart fill="currentColor" /></button>
      </div>
    </section>
  );
}
