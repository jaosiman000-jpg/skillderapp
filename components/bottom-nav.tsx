"use client";

import { Compass, LayoutGrid, MessageCircle, PlusCircle, Settings } from "lucide-react";
import { copy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type Tab = "discover" | "explore" | "publish" | "chats" | "settings";

export function BottomNav({ tab, locale, onChange }: { tab: Tab; locale: Locale; onChange: (tab: Tab) => void }) {
  const t = copy[locale];
  const items = [
    { id: "discover" as const, label: t.discover, Icon: Compass },
    { id: "explore" as const, label: t.explore, Icon: LayoutGrid },
    { id: "publish" as const, label: t.publish, Icon: PlusCircle },
    { id: "chats" as const, label: t.chats, Icon: MessageCircle },
    { id: "settings" as const, label: t.settings, Icon: Settings },
  ];
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {items.map(({ id, label, Icon }) => (
        <button key={id} type="button" className={tab === id ? "is-active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => onChange(id)}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
