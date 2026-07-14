"use client";

import { ChevronDown } from "lucide-react";
import { copy } from "@/lib/i18n";
import { SKILL_CATEGORIES, type DiscoveryFilters, type Locale } from "@/lib/types";

const ECOSYSTEMS = ["Codex", "Claude Code", "Cursor"];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

function ChoiceDetails({ label, value, options, selected, onChange }: { label: string; value: string; options: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  return (
    <details className="settings-choice">
      <summary><span>{label}</span><strong>{value}</strong><ChevronDown /></summary>
      <div>{options.map((option) => <label key={option}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} />{option}</label>)}</div>
    </details>
  );
}

export function DiscoverySettings({ filters, locale, onFilters, onLocale, onDone }: { filters: DiscoveryFilters; locale: Locale; onFilters: (filters: DiscoveryFilters) => void; onLocale: (locale: Locale) => void; onDone: () => void }) {
  const t = copy[locale];
  const patch = (value: Partial<DiscoveryFilters>) => onFilters({ ...filters, ...value });
  return (
    <section className="settings-page">
      <header className="settings-header"><span /><h1>{t.filters}</h1><button type="button" onClick={onDone}>{t.done}</button></header>
      <div className="settings-group">
        <label className="range-control"><span>{locale === "pt-BR" ? "Tendência mínima" : "Minimum trend"}<strong>+{filters.minTrend} {t.stars}/24h</strong></span><input type="range" min="0" max="500" step="25" value={filters.minTrend} onChange={(event) => patch({ minTrend: Number(event.target.value) })} /><small>{locale === "pt-BR" ? "Mostre projetos com crescimento recente relevante." : "Show projects with meaningful recent growth."}</small></label>
        <Toggle checked={filters.includeNewVerified} onChange={(value) => patch({ includeNewVerified: value })} label={locale === "pt-BR" ? "Incluir novos projetos verificados" : "Include new verified projects"} />
        <ChoiceDetails label={locale === "pt-BR" ? "Ecossistemas" : "Ecosystems"} value={filters.ecosystems.length ? `${filters.ecosystems.length}` : locale === "pt-BR" ? "Todos" : "All"} options={ECOSYSTEMS} selected={filters.ecosystems} onChange={(ecosystems) => patch({ ecosystems })} />
        <ChoiceDetails label={locale === "pt-BR" ? "Categorias" : "Categories"} value={filters.categories.length ? `${filters.categories.length}` : locale === "pt-BR" ? "Selecionar" : "Select"} options={[...SKILL_CATEGORIES]} selected={filters.categories} onChange={(categories) => patch({ categories })} />
      </div>
      <div className="settings-band"><strong>{locale === "pt-BR" ? "QUALIDADE E SEGURANÇA" : "QUALITY AND SECURITY"}</strong><p>{locale === "pt-BR" ? "Estes filtros reduzem projetos sem documentação ou origem confiável." : "These filters reduce projects without documentation or a trustworthy source."}</p></div>
      <div className="settings-group">
        <Toggle checked={filters.verifiedOnly} onChange={(value) => patch({ verifiedOnly: value })} label={locale === "pt-BR" ? "Somente verificados" : "Verified only"} />
        <Toggle checked={filters.requireLicense} onChange={(value) => patch({ requireLicense: value })} label={locale === "pt-BR" ? "Exigir licença" : "Require a license"} />
        <Toggle checked={filters.installDocumentedOnly} onChange={(value) => patch({ installDocumentedOnly: value })} label={locale === "pt-BR" ? "Instalação documentada" : "Documented install"} />
        <label className="range-control range-control--compact"><span>{locale === "pt-BR" ? "Atualizados nos últimos" : "Updated within"}<strong>{filters.maxAgeDays} {locale === "pt-BR" ? "dias" : "days"}</strong></span><input type="range" min="30" max="365" step="30" value={filters.maxAgeDays} onChange={(event) => patch({ maxAgeDays: Number(event.target.value) })} /></label>
      </div>
      <div className="settings-band settings-band--language"><strong>{t.language}</strong><div><button className={locale === "pt-BR" ? "is-active" : ""} onClick={() => onLocale("pt-BR")} type="button">PT-BR</button><button className={locale === "en" ? "is-active" : ""} onClick={() => onLocale("en")} type="button">English</button></div></div>
    </section>
  );
}
