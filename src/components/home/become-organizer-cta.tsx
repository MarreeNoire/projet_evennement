"use client";

import Link from "next/link";
import { ArrowRight, QrCode, Smartphone, Users } from "lucide-react";

export function BecomeOrganizerCTA() {
  return (
    <section aria-labelledby="cta-heading" className="border-border py-14 md:py-20 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-void-900 p-8 text-white shadow-xl sm:p-12 md:p-14">
          <div className="relative z-10 max-w-3xl">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display text-white">
              Vous organisez un événement ?
            </h2>

            <p className="mt-3 text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl">
              Publiez vos événements, gérez les billets et contrôlez les entrées depuis Event.
            </p>

            {/* 3 caractéristiques réelles */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#ffb28e]">
                  <Smartphone className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">Mobile Money & Cartes</h3>
                  <p className="mt-0.5 text-sm text-white/75">Les moyens disponibles sont affichés à la commande.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#ffb28e]">
                  <Users className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">Salons d&apos;échange</h3>
                  <p className="mt-0.5 text-sm text-white/75">Un salon rattaché à chaque événement.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#ffb28e]">
                  <QrCode className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">Contrôle à l&apos;entrée</h3>
                  <p className="mt-0.5 text-xs text-neutral-400">Scan des QR codes depuis votre smartphone.</p>
                </div>
              </div>
            </div>

            {/* Action principale */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/devenir-organisateur"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-solid px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-solid-hover"
              >
                <span>Publier un événement</span>
                <ArrowRight className="size-3.5" />
              </Link>

              <Link
                href="/aide/check-in"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white px-4 py-3 text-xs font-semibold transition-colors"
              >
                <span>Guide de contrôle d&apos;accès</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
