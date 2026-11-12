"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { Filter, LoaderCircle, Search, X } from "lucide-react";

import { CATEGORIES, EVENT_SORTS } from "@/lib/constants";

import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

/* =============================================================================
   Filtres de l'explorer (version éditoriale)
   --------------------------------------------------------------------------
   Même logique d'URL que la version applicative : ?q=&categorie=&ville=&tri=
   &gratuit=1. Le rendu suit le langage public (filets, libellés capitales,
   puces carrées) et reste pilotable au clavier.
   ========================================================================== */

function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

function ExploreFiltersInner({
  cities,
  total,
  initialSearch,
  onNavigate,
}: {
  cities: string[];
  total: number;
  initialSearch: string;
  onNavigate: (href: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const current = new URLSearchParams(initialSearch);
  const [query, setQuery] = useState(current.get("q") ?? "");
  const [category, setCategory] = useState(current.get("categorie") ?? "");
  const [city, setCity] = useState(current.get("ville") ?? "");
  const [sort, setSort] = useState(current.get("tri") ?? "date_asc");
  const [freeOnly, setFreeOnly] = useState(current.get("gratuit") === "1");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mobileFiltersRef = useRef<HTMLDivElement>(null);
  const mobileFiltersButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!mobileFiltersRef.current?.contains(event.target as Node)) {
        setMobileFiltersOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileFiltersOpen(false);
      mobileFiltersButtonRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileFiltersOpen]);

  const activeFilterCount = [category, city, freeOnly, sort !== "date_asc"].filter(Boolean).length;
  const mobileFilterCount = [Boolean(city), sort !== "date_asc"].filter(Boolean).length;

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    setMobileFiltersOpen(false);
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
    setMobileFiltersOpen(false);
    setQuery("");
    setCategory("");
    setCity("");
    setSort("date_asc");
    setFreeOnly(false);
    startTransition(() => onNavigate("/explorer"));
  }

  const hasFilters = Boolean(query || category || city || freeOnly || sort !== "date_asc");

  return (
    <form
      onSubmit={apply}
      role="search"
      aria-label="Rechercher des événements"
      className={content.filters}
    >
      <div className={content.filterRow}>
        <div className={content.keywordRow}>
          <label className={shell.field} htmlFor="explorer-q">
            <span className={shell["field-label"]}>Mot-clé</span>
            <span className={content.inputWrap}>
              <Search className={content.inputIcon} aria-hidden="true" />
              <input
                id="explorer-q"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Concert, conférence, Abidjan…"
                className={`${shell.input} ${content.inputSearch}`}
                style={{ paddingLeft: 34 }}
              />
            </span>
          </label>

          <div className={content.mobileFilterControl} ref={mobileFiltersRef}>
            <button
              ref={mobileFiltersButtonRef}
              type="button"
              className={content.mobileFilterButton}
              aria-label={`Filtres de ville et de tri${mobileFilterCount ? ` (${mobileFilterCount} actif${mobileFilterCount > 1 ? "s" : ""})` : ""}`}
              aria-expanded={mobileFiltersOpen}
              aria-controls="explorer-mobile-filters"
              onClick={() => setMobileFiltersOpen((open) => !open)}
            >
              <Filter aria-hidden="true" />
              {mobileFilterCount ? (
                <span className={content.mobileFilterBadge} aria-hidden="true">
                  {mobileFilterCount}
                </span>
              ) : null}
            </button>

            {mobileFiltersOpen ? (
              <div
                id="explorer-mobile-filters"
                className={content.mobileFilterPanel}
                role="group"
                aria-label="Filtres de ville et de tri"
              >
                <label className={shell.field} htmlFor="explorer-city-mobile">
                  <span className={shell["field-label"]}>Ville</span>
                  <select
                    id="explorer-city-mobile"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className={shell.select}
                  >
                    <option value="">Toutes villes</option>
                    {cities.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={shell.field} htmlFor="explorer-sort-mobile">
                  <span className={shell["field-label"]}>Trier par</span>
                  <select
                    id="explorer-sort-mobile"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className={shell.select}
                  >
                    {EVENT_SORTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <label className={cx(shell.field, content.filterDesktopOnly)} htmlFor="explorer-city">
          <span className={shell["field-label"]}>Ville</span>
          <select
            id="explorer-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className={shell.select}
          >
            <option value="">Toutes villes</option>
            {cities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className={cx(shell.field, content.filterDesktopOnly)} htmlFor="explorer-sort">
          <span className={shell["field-label"]}>Trier par</span>
          <select
            id="explorer-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={shell.select}
          >
            {EVENT_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className={cx(shell.btn, shell["btn-primary"], shell["btn-sm"], content.submit)}
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle className={cx(shell.icon, content.spin)} aria-hidden="true" />
          ) : (
            <Search className={shell.icon} aria-hidden="true" />
          )}
          {pending ? "Recherche…" : "Rechercher"}
        </button>
      </div>

      <CategoryChoices category={category} setCategory={setCategory} />

      <label className={shell.check}>
        <input
          type="checkbox"
          checked={freeOnly}
          onChange={(event) => setFreeOnly(event.target.checked)}
        />
        Gratuits uniquement
      </label>

      <div className={content.filtersFoot}>
        <span className={content.filtersCount} role="status">
          {total} événement{total > 1 ? "s" : ""}
          {activeFilterCount > 0 ? " · filtres actifs" : ""}
        </span>
        {hasFilters ? (
          <button
            type="button"
            className={cx(shell.btn, shell["btn-outline"], shell["btn-sm"])}
            onClick={reset}
          >
            <X className={shell.icon} aria-hidden="true" />
            Réinitialiser
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CategoryChoices({
  category,
  setCategory,
}: {
  category: string;
  setCategory: (value: string) => void;
}) {
  return (
    <>
      {/* Puces sur grand écran : tout est visible d'un coup d'œil. */}
      <fieldset className={cx(content.chipSet, content.filterDesktopOnly)}>
        <legend className={shell["field-label"]} style={{ marginBottom: 8 }}>
          Type d’événement
        </legend>
        <div className={content.chips} role="group" aria-label="Filtrer par catégorie">
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => setCategory("")}
            className={content.chip}
          >
            Toutes
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item.slug}
              type="button"
              aria-pressed={category === item.slug}
              onClick={() => setCategory(item.slug)}
              className={content.chip}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Petit écran / PWA : un menu déroulant compact à la place des
          douze puces qui écrasaient la page. */}
      <fieldset className={cx(content.chipSet, content.filterMobileOnly)}>
        <label className={shell.field} htmlFor="explorer-category-mobile">
          <span className={shell["field-label"]}>Type d’événement</span>
          <select
            id="explorer-category-mobile"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={shell.select}
          >
            <option value="">Tous les types</option>
            {CATEGORIES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
    </>
  );
}

/* Point d'entrée : isole useSearchParams + navigation sous Suspense. */

export function ExploreFiltersBar({ cities, total }: { cities: string[]; total: number }) {
  return (
    <Suspense
      fallback={
        <div className={content.filters} aria-busy="true">
          <div className={content.skeleton} style={{ height: 46 }} />
        </div>
      }
    >
      <ExploreFiltersWithRouter cities={cities} total={total} />
    </Suspense>
  );
}

function ExploreFiltersWithRouter({ cities, total }: { cities: string[]; total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.toString();
  return (
    <ExploreFiltersInner
      key={search}
      cities={cities}
      total={total}
      initialSearch={search}
      onNavigate={(href) => router.push(href)}
    />
  );
}
