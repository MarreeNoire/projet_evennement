"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { HOME_CATEGORIES, getCategoryCover } from "./home-data";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import type { PublishedEventView } from "@/types/database";

interface CategoryStripProps {
  events?: PublishedEventView[];
}

export function CategoryStrip({ events = [] }: CategoryStripProps) {
  return (
    <section aria-labelledby="categories-heading" className="py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <h2 id="categories-heading" className="text-fg font-display text-xl font-bold tracking-tight sm:text-2xl">
              Par catégorie
            </h2>
          </div>
          <Link
            href="/explorer"
            className="text-fg-muted hover:text-primary group inline-flex items-center gap-1 text-sm font-semibold transition-colors"
          >
            <span>Toutes les catégories</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Grille des 6 catégories avec affiches réelles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 md:gap-4">
          {HOME_CATEGORIES.map((cat) => {
            const realCover = getCategoryCover(cat.slug, events);
            return (
              <Link
                key={cat.slug}
                href={`/explorer?categorie=${cat.slug}#resultats`}
                className="group relative flex h-40 sm:h-48 flex-col justify-between overflow-hidden rounded-2xl border border-black/5 bg-primary-solid p-4 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10"
              >
                {/* Image d'un vrai événement publié dans cette catégorie */}
                {realCover ? (
                  <div className="absolute inset-0 z-0">
                    <PublicStorageImage
                      src={realCover}
                      alt={cat.label}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                      quality={75}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
                  </div>
                ) : (
                  <div className={`absolute inset-0 z-0 bg-gradient-to-br ${cat.color}`}>
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                )}

                {/* Repère de navigation */}
                <div className="relative z-10 flex items-center justify-between">
                  <span aria-hidden="true" />
                  <div className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-all duration-200 group-hover:bg-accent group-hover:text-fg-inverted">
                    <ArrowUpRight className="size-3" />
                  </div>
                </div>

                {/* La catégorie mène vers les annonces publiées correspondantes. */}
                <div className="relative z-10">
                  <h3 className="font-display text-base font-bold tracking-tight text-white transition-colors group-hover:text-accent sm:text-lg">
                    {cat.label}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/85">{cat.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
