"use client";

import Image from "next/image";
import { Braces } from "lucide-react";
import { useState } from "react";
import type { Skill } from "@/lib/types";

type Props = {
  skill: Skill;
  alt?: string;
  priority?: boolean;
  presentation?: "card" | "hero" | "avatar" | "tile";
};

function paletteFor(value: string) {
  let sum = 0;
  for (const char of value) sum = (sum + char.charCodeAt(0)) % 4;
  return sum;
}

export function SkillArtwork({ skill, alt = "", priority = false, presentation = "card" }: Props) {
  const [failed, setFailed] = useState(false);
  const source = skill.coverImageUrl || skill.imageUrl;
  const isUploadedCover = Boolean(skill.coverImageUrl);
  const bypassOptimizer = !isUploadedCover || source?.startsWith("blob:");

  if (failed || !source) {
    return (
      <div className={`skill-artwork skill-artwork--${presentation} generated-cover generated-cover--${paletteFor(skill.githubFullName)}`} role="img" aria-label={alt}>
        <Braces aria-hidden="true" />
        <span>{skill.categories[0] ?? "Skill"}</span>
        <strong>{skill.name}</strong>
        <small>{skill.owner}</small>
      </div>
    );
  }

  return (
    <div className={`skill-artwork skill-artwork--${presentation} ${isUploadedCover ? "skill-artwork--uploaded" : "skill-artwork--social"}`}>
      {presentation !== "avatar" ? <Image className="skill-artwork__backdrop" src={source} alt="" fill sizes="(max-width: 640px) 100vw, 480px" unoptimized={bypassOptimizer} aria-hidden="true" /> : null}
      <Image
        className="skill-artwork__image"
        src={source}
        alt={alt}
        fill
        priority={priority}
        sizes={presentation === "avatar" ? "64px" : "(max-width: 640px) 100vw, 480px"}
        unoptimized={bypassOptimizer}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
