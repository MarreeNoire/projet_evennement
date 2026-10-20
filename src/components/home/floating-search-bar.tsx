"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Compass, MapPin, Search, X } from "lucide-react";

import { HOME_CATEGORIES } from "./home-data";
import type { PublishedEventView } from "@/types/database";

export type SearchSuggestion = Pick<
  PublishedEventView,
  "id" | "title" | "slug" | "city" | "category"
>;

interface FloatingSearchBarProps {
  cities?: string[];
  className?: string;
}

export function FloatingSearchBar({ cities = [], className = "" }: FloatingSearchBarProps) {
  const router = useRouter();
  const id = useId();
  const listId = `suggestions-${id}`;

  const [activeTab, setActiveTab] = useState<"where" | "when" | "what" | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedWhen, setSelectedWhen] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [textQuery, setTextQuery] = useState<string>("");

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Détecte le scroll pour ajuster l'élévation et l'effet glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ferme le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveTab(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche avec debounce pour les suggestions
  useEffect(() => {
    const term = textQuery.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data = (await res.json()) as SearchSuggestion[];
          setSuggestions(data);
        }
      } catch {
        // Ignorer les erreurs d'annulation
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [textQuery]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveTab(null);

    const params = new URLSearchParams();
    if (textQuery.trim()) params.set("q", textQuery.trim());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedWhen === "week") {
      const today = new Date().toISOString().split("T")[0] ?? "";
      const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0] ?? "";
      if (today) params.set("startDate", today);
      if (nextWeek) params.set("endDate", nextWeek);
    } else if (selectedWhen === "today") {
      const today = new Date().toISOString().split("T")[0] ?? "";
      if (today) {
        params.set("startDate", today);
        params.set("endDate", today);
      }
    }

    const qs = params.toString();
    router.push(`/explorer${qs ? `?${qs}` : ""}#resultats`);
  };

  const allCities = Array.from(new Set(cities.filter(Boolean)));

  const whenOptions = [
    { id: "", label: "Toutes dates" },
    { id: "today", label: "Aujourd'hui" },
    { id: "week", label: "Cette semaine" },
    { id: "weekend", label: "Ce week-end" },
  ];

  return (
    <div
      ref={containerRef}
      className={`floating-search-wrapper sticky top-3 z-40 mx-auto w-full max-w-4xl px-4 transition-all duration-300 ${
        isScrolled ? "scale-98" : ""
      } ${className}`}
    >
      {/* Barre flottante style Airbnb */}
      <div
        className={`floating-search-bar relative flex items-center justify-between rounded-full border border-black/8 dark:border-white/12 bg-white/90 dark:bg-[#16171B]/90 backdrop-blur-xl transition-all duration-300 ${
          activeTab
            ? "shadow-2xl ring-2 ring-amber-500/30"
            : "shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)]"
        }`}
      >
        {/* Segment 1: Où ? */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "where" ? null : "where")}
          className={`flex-1 rounded-full px-4 py-2.5 text-left transition-colors duration-150 ${
            activeTab === "where" ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Où ?
              </span>
              <span className="block truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
                {selectedCity || "Toutes les villes"}
              </span>
            </div>
          </div>
        </button>

        <span className="h-6 w-px bg-black/10 dark:bg-white/10" aria-hidden="true" />

        {/* Segment 2: Quand ? */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "when" ? null : "when")}
          className={`flex-1 rounded-full px-4 py-2.5 text-left transition-colors duration-150 ${
            activeTab === "when" ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-stone-500 dark:text-stone-400" />
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Quand ?
              </span>
              <span className="block truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
                {whenOptions.find((w) => w.id === selectedWhen)?.label || "Toutes dates"}
              </span>
            </div>
          </div>
        </button>

        <span className="hidden h-6 w-px bg-black/10 dark:bg-white/10 sm:block" aria-hidden="true" />

        {/* Segment 3: Envie / Catégorie */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "what" ? null : "what")}
          className={`hidden flex-1 rounded-full px-4 py-2.5 text-left transition-colors duration-150 sm:block ${
            activeTab === "what" ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass className="size-4 shrink-0 text-stone-500 dark:text-stone-400" />
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Envie ?
              </span>
              <span className="block truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
                {HOME_CATEGORIES.find((c) => c.slug === selectedCategory)?.label || "Toutes envies"}
              </span>
            </div>
          </div>
        </button>

        {/* Bouton de recherche */}
        <div className="p-1.5">
          <button
            type="button"
            onClick={() => handleSubmit()}
            aria-label="Lancer la recherche"
            className="flex size-10 items-center justify-center rounded-full bg-neutral-900 text-white transition-all duration-200 hover:scale-105 hover:bg-neutral-800 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400"
          >
            <Search className="size-4" />
          </button>
        </div>
      </div>

      {/* Mini-panneau dropdown contextuel fluide */}
      {activeTab && (
        <div className="absolute inset-x-4 top-full mt-2 overflow-hidden rounded-3xl border border-black/8 dark:border-white/12 bg-white/95 dark:bg-[#16171B]/95 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Onglet OÙ */}
          {activeTab === "where" && (
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Sélectionnez une destination
                </span>
                {selectedCity && (
                  <button
                    type="button"
                    onClick={() => setSelectedCity("")}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity("");
                    setActiveTab("when");
                  }}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-colors ${
                    selectedCity === ""
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
                      : "hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <MapPin className="size-3.5 shrink-0 opacity-60" />
                  <span>Toutes villes</span>
                </button>
                {allCities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedCity(c);
                      setActiveTab("when");
                    }}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-colors ${
                      selectedCity === c
                        ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <MapPin className="size-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Onglet QUAND */}
          {activeTab === "when" && (
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Moment de l&apos;événement
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {whenOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedWhen(opt.id);
                      setActiveTab("what");
                    }}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-colors ${
                      selectedWhen === opt.id
                        ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <Calendar className="size-3.5 shrink-0 opacity-60" />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Onglet ENVIE */}
          {activeTab === "what" && (
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Type d&apos;expérience
                </span>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  >
                    Toutes
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {HOME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      handleSubmit();
                    }}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-medium transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
                        : "hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span className="font-semibold">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Champ de recherche directe par mots-clés */}
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par mot-clé, salle ou artiste..."
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                className="w-full rounded-xl bg-black/[0.03] dark:bg-white/[0.05] py-2 pl-9 pr-8 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
              {textQuery && (
                <button
                  type="button"
                  onClick={() => setTextQuery("")}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions en direct */}
            {suggestions.length > 0 && (
              <ul id={listId} className="mt-2 divide-y divide-black/5 dark:divide-white/5 overflow-hidden rounded-xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#121316]">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/evenements/${s.slug}`)}
                      className="flex w-full items-center justify-between p-2.5 text-left text-xs transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                    >
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{s.title}</span>
                      <span className="text-[11px] text-neutral-400">{s.city}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
