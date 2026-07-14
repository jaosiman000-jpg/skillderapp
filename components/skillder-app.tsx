"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, SlidersHorizontal } from "lucide-react";
import { startTransition, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { BottomNav, type Tab } from "@/components/bottom-nav";
import { Brand } from "@/components/brand";
import { ChatDetail, ChatList } from "@/components/chats";
import { DiscoverySettings } from "@/components/discovery-settings";
import { Explore } from "@/components/explore";
import { MatchCelebration } from "@/components/match-celebration";
import { SkillCard } from "@/components/skill-card";
import { SkillProfile } from "@/components/skill-profile";
import { SubmitSkill } from "@/components/submit-skill";
import { copy } from "@/lib/i18n";
import { matchesFilters } from "@/lib/skills/ranking";
import { DEFAULT_FILTERS, type Decision, type DiscoveryFilters, type Locale, type Skill } from "@/lib/types";

type StoredState = {
  version: 1;
  locale: Locale;
  filters: DiscoveryFilters;
  likedIds: string[];
  dismissedIds: string[];
};

const STORAGE_KEY = "skillder-state-v1";
const STORAGE_EVENT = "skillder-state-change";
const defaultStoredState: StoredState = {
  version: 1,
  locale: "pt-BR",
  filters: DEFAULT_FILTERS,
  likedIds: [],
  dismissedIds: [],
};

function subscribeToStoredState(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function readStoredState() {
  return localStorage.getItem(STORAGE_KEY);
}

function parseStoredState(serialized: string | null): StoredState {
  if (!serialized) return defaultStoredState;
  try {
    const parsed = JSON.parse(serialized) as StoredState;
    return parsed.version === 1 ? parsed : defaultStoredState;
  } catch {
    return defaultStoredState;
  }
}

export function SkillderApp({ skills, demo }: { skills: Skill[]; demo: boolean }) {
  const [tab, setTab] = useState<Tab>("discover");
  const [catalogSkills, setCatalogSkills] = useState(skills);
  const serializedState = useSyncExternalStore(subscribeToStoredState, readStoredState, () => null);
  const storedState = useMemo(() => parseStoredState(serializedState), [serializedState]);
  const { locale, filters, likedIds, dismissedIds } = storedState;
  const [mediaIndex, setMediaIndex] = useState(0);
  const [profileSkill, setProfileSkill] = useState<Skill | null>(null);
  const [chatSkill, setChatSkill] = useState<Skill | null>(null);
  const [matchSkill, setMatchSkill] = useState<Skill | null>(null);
  const [exploreQuery, setExploreQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const t = copy[locale];

  function updateStoredState(patch: Partial<StoredState>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...storedState, ...patch }));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  const decided = useMemo(() => new Set([...likedIds, ...dismissedIds]), [dismissedIds, likedIds]);
  const queue = useMemo(() => catalogSkills.filter((skill) => !decided.has(skill.id) && matchesFilters(skill, filters)), [catalogSkills, decided, filters]);
  const currentSkill = queue[0] ?? null;
  const likedSkills = useMemo(() => likedIds.map((id) => catalogSkills.find((skill) => skill.id === id)).filter((skill): skill is Skill => Boolean(skill)), [catalogSkills, likedIds]);

  useEffect(() => {
    let active = true;
    async function refreshCatalog() {
      try {
        const response = await fetch("/api/catalog", { headers: { Accept: "application/json" } });
        if (!response.ok) return;
        const result = (await response.json()) as { skills?: Skill[] };
        if (!active || !result.skills?.length) return;
        startTransition(() => setCatalogSkills((current) => {
          const merged = new Map(current.map((skill) => [skill.id, skill]));
          result.skills!.forEach((skill) => merged.set(skill.id, skill));
          return [...merged.values()];
        }));
      } catch {
        // The initial server catalog remains available while the network is offline.
      }
    }
    const interval = window.setInterval(refreshCatalog, 300_000);
    window.addEventListener("focus", refreshCatalog);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshCatalog);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2300);
  }

  function decide(skill: Skill, decision: Decision) {
    setMediaIndex(0);
    setProfileSkill(null);
    if (decision === "like") {
      if (!likedIds.includes(skill.id)) setCatalogSkills((current) => current.map((item) => item.id === skill.id ? { ...item, likesCount: (item.likesCount ?? 0) + 1 } : item));
      updateStoredState({ likedIds: likedIds.includes(skill.id) ? likedIds : [...likedIds, skill.id] });
      setMatchSkill(skill);
    } else updateStoredState({ dismissedIds: dismissedIds.includes(skill.id) ? dismissedIds : [...dismissedIds, skill.id] });

    if (!demo) {
      void fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id, decision }),
      });
    }
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setChatSkill(null);
    setProfileSkill(null);
  }

  function published(skill: Skill) {
    setCatalogSkills((current) => [skill, ...current.filter((item) => item.id !== skill.id)]);
    setTab("discover");
    showToast(locale === "pt-BR" ? `${skill.name} foi publicada com o selo Comunidade.` : `${skill.name} was published with the Community badge.`);
  }

  if (profileSkill) return <SkillProfile skill={profileSkill} locale={locale} onBack={() => setProfileSkill(null)} onDecision={(decision) => decide(profileSkill, decision)} />;

  return (
    <main className="app-shell">
      {tab === "discover" ? (
        <>
          <header className="app-header">
            <Brand />
            <div>
              <button type="button" aria-label="Notificações" onClick={() => showToast(locale === "pt-BR" ? "Sem novas notificações." : "No new notifications.")}><Bell /></button>
              <button type="button" aria-label={t.filters} onClick={() => setTab("settings")}><SlidersHorizontal /></button>
            </div>
          </header>
          {currentSkill ? (
            <AnimatePresence mode="popLayout">
              <motion.div key={currentSkill.id} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <SkillCard skill={currentSkill} locale={locale} mediaIndex={mediaIndex} onMediaChange={setMediaIndex} onDecision={(decision) => decide(currentSkill, decision)} onOpenProfile={() => setProfileSkill(currentSkill)} />
              </motion.div>
            </AnimatePresence>
          ) : <div className="empty-feed"><span>✦</span><h1>{t.emptyFeed}</h1><p>{t.emptyFeedBody}</p></div>}
        </>
      ) : null}

      {tab === "chats" ? (chatSkill ? <ChatDetail skill={chatSkill} locale={locale} onBack={() => setChatSkill(null)} /> : <ChatList skills={likedSkills} locale={locale} onOpen={setChatSkill} />) : null}
      {tab === "explore" ? <Explore skills={catalogSkills} locale={locale} likedIds={likedIds} query={exploreQuery} onQuery={setExploreQuery} onOpen={setProfileSkill} /> : null}
      {tab === "publish" ? <SubmitSkill locale={locale} demo={demo} onPublished={published} /> : null}
      {tab === "settings" ? <DiscoverySettings filters={filters} locale={locale} onFilters={(next) => updateStoredState({ filters: next })} onLocale={(next) => updateStoredState({ locale: next })} onDone={() => setTab("discover")} /> : null}

      <BottomNav tab={tab} locale={locale} onChange={changeTab} />
      <AnimatePresence>{toast ? <motion.div className="toast" role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>{toast}</motion.div> : null}</AnimatePresence>
      <AnimatePresence>{matchSkill ? <MatchCelebration key={matchSkill.id} skill={matchSkill} locale={locale} onContinue={() => setMatchSkill(null)} onChat={() => { setMatchSkill(null); setChatSkill(matchSkill); setTab("chats"); }} /> : null}</AnimatePresence>
    </main>
  );
}
