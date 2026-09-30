"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Spinner } from "@/components/ui/skeleton";
import { CATEGORIES, EVENT_SORTS } from "@/lib/constants";

/* Barre de recherche + filtres de l'explorer : met à jour l'URL (?q=&categorie=…). */

function ExploreFiltersInner({
  cities,
  total,
  onNavigate,
}: {
  cities: string[];
  total: number;
  onNavigate: (href: string) => void;
}) {
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("categorie") ?? "");
  const [city, setCity] = useState(params.get("ville") ?? "");
  const [sort, setSort] = useState(params.get("tri") ?? "date_asc");
  const [freeOnly, setFreeOnly] = useState(params.get("gratuit") === "1");
  const search = params.toString();

  useEffect(() => {
    const current = new URLSearchParams(search);
    setQuery(current.get("q") ?? "");
    setCategory(current.get("categorie") ?? "");
    setCity(current.get("ville") ?? "");
    setSort(current.get("tri") ?? "date_asc");
    setFreeOnly(current.get("gratuit") === "1");
  }, [search]);

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (category) next.set("categorie", category);
    if (city) next.set("ville", city);
    if (sort && sort !== "date_asc") next.set("tri", sort);
    if (freeOnly) next.set("gratuit", "1");
    const serialized = next.toString();
    startTransition(() => onNavigate(serialized ? `/explorer?${serialized}` : "/explorer"));
  }

  function reset() {
    setQuery("");
    setCategory("");
    setCity("");
    setSort("date_asc");
    setFreeOnly(false);
    startTransition(() => onNavigate("/explorer"));
  }

  return (
    <form
      onSubmit={apply}
      role="search"
      aria-label="Rechercher des événements"
      className="border-border-strong bg-surface flex flex-col gap-4 border p-3 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="sm:col-span-2 xl:col-span-1">
          <label htmlFor="explorer-q" className="text-fg-muted mb-1.5 block text-xs font-semibold">
            Mot-clé
          </label>
          <Input
            id="explorer-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Concert, conférence, Abidjan…"
          />
        </div>
        <div>
          <label
            htmlFor="explorer-cat"
            className="text-fg-muted mb-1.5 block text-xs font-semibold"
          >
            Catégorie
          </label>
          <Select id="explorer-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="explorer-city"
            className="text-fg-muted mb-1.5 block text-xs font-semibold"
          >
            Ville
          </label>
          <Select id="explorer-city" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Toutes villes</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="explorer-sort"
            className="text-fg-muted mb-1.5 block text-xs font-semibold"
          >
            Trier par
          </label>
          <Select id="explorer-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {EVENT_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-fg-muted flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
            className="size-4 accent-[var(--color-primary-solid)]"
          />
          Gratuits uniquement
        </label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-fg-subtle text-xs" role="status">
            {total} événement{total > 1 ? "s" : ""}
          </span>
          {(query ||
            category ||
            city ||
            freeOnly ||
            sort !== "date_asc") && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Réinitialiser
            </Button>
          )}
          <Button type="submit" size="sm" loading={pending} loadingLabel="Recherche…">
            Rechercher
          </Button>
        </div>
      </div>
    </form>
  );
}

/* Point d'entrée : isole useSearchParams + navigation sous Suspense (build statique). */

export function ExploreFiltersBar({ cities, total }: { cities: string[]; total: number }) {
  return (
    <Suspense fallback={<Spinner label="Chargement des filtres…" />}>
      <ExploreFiltersWithRouter cities={cities} total={total} />
    </Suspense>
  );
}

function ExploreFiltersWithRouter({ cities, total }: { cities: string[]; total: number }) {
  const router = useRouter();
  return (
    <ExploreFiltersInner cities={cities} total={total} onNavigate={(href) => router.push(href)} />
  );
}
