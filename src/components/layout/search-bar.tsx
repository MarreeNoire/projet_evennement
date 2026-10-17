"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

/* =============================================================================
   Barre de recherche avec suggestions en temps réel
   --------------------------------------------------------------------------
   - Au fil de la frappe, on appelle /api/search/suggest?q=... (route légère,
     max 5 suggestions, debounce 220 ms).
   - Entrée ou clic sur une suggestion → navigation vers /explorer?q=...
   - Escape → ferme la liste + vide le champ
   - Clic en dehors → ferme la liste
   - La navigation invalide le dernier debounce.

   Accessibilité :
   - role="combobox" sur l'input, aria-expanded, aria-controls, aria-activedescendant
   - role="listbox" sur la liste, role="option" sur chaque suggestion
   - Navigation clavier ↑ ↓ dans la liste
   ========================================================================== */

export type SearchSuggestion = Pick<PublishedEventView, "id" | "title" | "slug" | "city" | "category">;

export function SearchBar({ className }: { className?: string }) {
  const id = useId();
  const listId = `search-suggestions-${id}`;
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* Fetch suggestions avec debounce 220 ms */
  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as SearchSuggestion[];
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      } catch {
        /* annulé ou réseau, on ignore */
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  /* Ferme la liste si clic en dehors */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function navigate(term: string) {
    setOpen(false);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(`/explorer?q=${encodeURIComponent(term.trim())}#resultats`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") {
        setQuery("");
        setOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          const s = suggestions[activeIndex];
          setQuery(s.title);
          navigate(s.title);
        } else {
          navigate(query);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const activeOptionId =
    activeIndex >= 0 && suggestions[activeIndex]
      ? `${listId}-option-${activeIndex}`
      : undefined;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Search
          className="text-fg-subtle pointer-events-none absolute left-3.5 size-4 z-10"
          aria-hidden="true"
        />
        <label htmlFor={`${id}-input`} className="sr-only">
          Rechercher un événement
        </label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="search"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder="Rechercher un événement…"
          className={cn(
            "h-10 w-48 rounded-md border border-border bg-bg-muted pr-8 pl-9 text-sm",
            "placeholder:text-fg-subtle",
            "transition-[width,border-color,box-shadow] duration-200",
            "focus:w-64 focus:border-border-focus focus:bg-surface focus:outline-none focus:shadow-[0_0_0_2px_rgba(157,86,255,0.25)]",
            open && "w-64 border-border-focus bg-surface shadow-[0_0_0_2px_rgba(157,86,255,0.25)]",
          )}
        />
        {query.length > 0 ? (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 flex size-5 items-center justify-center rounded-full text-fg-subtle hover:text-fg"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown suggestions */}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions d'événements"
          className="absolute top-full left-0 z-50 mt-1.5 w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          {loading ? (
            <li className="flex items-center gap-2 px-4 py-3 text-xs text-fg-subtle">
              <span className="inline-block size-3 animate-spin rounded-full border-2 border-border border-t-primary" />
              Recherche en cours…
            </li>
          ) : null}
          {!loading &&
            suggestions.map((s, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={s.id}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Évite le blur de l'input
                    setQuery(s.title);
                    navigate(s.title);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 px-4 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-primary-subtle text-fg"
                      : "hover:bg-bg-muted",
                  )}
                >
                  <span className="font-semibold leading-snug">{s.title}</span>
                  <span className="text-xs text-fg-subtle">{s.city}</span>
                </li>
              );
            })}
          {!loading && suggestions.length > 0 ? (
            <li className="border-t border-border">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigate(query);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary-subtle"
              >
                <Search className="size-3.5" aria-hidden="true" />
                Voir tous les résultats pour « {query} »
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
