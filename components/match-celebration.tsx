"use client";

import { motion, useReducedMotion } from "motion/react";
import { Heart, MessageCircle } from "lucide-react";
import { SkillArtwork } from "@/components/skill-artwork";
import type { Locale, Skill } from "@/lib/types";

export function MatchCelebration({ skill, locale, onChat, onContinue }: { skill: Skill; locale: Locale; onChat: () => void; onContinue: () => void }) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0.01 : 0.5;
  const isPortuguese = locale === "pt-BR";

  return (
    <motion.section
      className="match-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    >
      <motion.div className="match-celebration__content" initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration, ease: [0.16, 1, 0.3, 1] }}>
        <span className="match-celebration__kicker"><Heart fill="currentColor" /> SKILLDER</span>
        <h1 id="match-title">{isPortuguese ? "É um match!" : "It’s a match!"}</h1>
        <p>{isPortuguese ? `Você e ${skill.name} combinaram.` : `You and ${skill.name} matched.`}</p>
        <div className="match-celebration__artwork"><SkillArtwork skill={skill} alt={skill.name} presentation="avatar" /></div>
        <strong>{skill.name}</strong>
        {skill.community && skill.submittedBy ? <small>{isPortuguese ? "Enviada por" : "Submitted by"} {skill.submittedBy}</small> : null}
      </motion.div>
      <div className="match-celebration__actions">
        <button type="button" className="match-primary" onClick={onChat} autoFocus><MessageCircle />{isPortuguese ? "Ver mensagem" : "View message"}</button>
        <button type="button" className="match-secondary" onClick={onContinue}>{isPortuguese ? "Continuar descobrindo" : "Keep discovering"}</button>
      </div>
    </motion.section>
  );
}
