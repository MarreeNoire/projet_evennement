import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { HeroCarousel3D } from "./hero-carousel-3d";
import type { PublishedEventView } from "@/types/database";
import styles from "./community-hero.module.css";

export function CommunityHero({ events }: { events: PublishedEventView[] }) {
  return (
    <section className={styles.section} aria-labelledby="community-hero-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 id="community-hero-title">
            Tu rejoins Event, tu rejoins une <em>communauté</em>
          </h1>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/explorer">
              Trouver ma prochaine sortie <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link className={styles.secondary} href="/inscription">
              Rejoindre la communauté
            </Link>
          </div>
          <p className={styles.note}>Concerts · maquis · culture · nouvelles rencontres</p>
        </div>

        <HeroCarousel3D events={events} />
      </div>
    </section>
  );
}
