"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";

import CircularCarousel from "./CircularCarousel";
import styles from "./home-carousel.module.css";

type CarouselEvent = {
  slug: string;
  title: string;
  coverUrl: string | null;
  categoryLabel: string;
  city: string;
};

const MIN_ITEMS = 6;
const FALLBACK_GLOW = "255, 90, 0";

/** Couleur dominante de l'affiche, utilisée pour la lueur du bouton (repli ambré si l'image est bloquée). */
function useDominantColor(coverUrl: string | null | undefined): string {
  const [rgb, setRgb] = useState(FALLBACK_GLOW);

  useEffect(() => {
    setRgb(FALLBACK_GLOW);
    if (!coverUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
          if (brightness > 40 && brightness < 220) {
            r += data[i]!;
            g += data[i + 1]!;
            b += data[i + 2]!;
            count++;
          }
        }
        if (count === 0) return;
        r /= count;
        g /= count;
        b /= count;
        const scale = Math.min(255 / Math.max(r, g, b, 1), 1.8);
        setRgb(
          `${Math.min(255, Math.round(r * scale))}, ${Math.min(255, Math.round(g * scale))}, ${Math.min(255, Math.round(b * scale))}`,
        );
      } catch {
        /* image non lisible (CORS) : on garde la couleur de repli */
      }
    };
    img.src = coverUrl;
  }, [coverUrl]);

  return rgb;
}

/** Hero de l'accueil : anneau 3D des affiches réelles des événements publiés. */
export function HomeCarousel({ events }: { events: CarouselEvent[] }) {
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const withCover = useMemo(
    () => events.filter((event): event is CarouselEvent & { coverUrl: string } => Boolean(event.coverUrl)),
    [events],
  );
  /* Avec peu d'affiches, on les répète pour que l'anneau reste complet. */
  const ringEvents = useMemo(() => {
    if (withCover.length === 0) return [];
    const repeats = Math.ceil(MIN_ITEMS / withCover.length);
    return Array.from({ length: Math.max(1, repeats) }, () => withCover).flat();
  }, [withCover]);
  const items = useMemo(
    () =>
      ringEvents.map((event) => ({
        src: event.coverUrl,
        alt: `Affiche de ${event.title}`,
        title: event.title,
        subtitle: `${event.categoryLabel} · ${event.city}`,
      })),
    [ringEvents],
  );

  const current = ringEvents[active] ?? ringEvents[0] ?? null;
  const glow = useDominantColor(current?.coverUrl);
  const hasRing = items.length > 0;

  return (
    <section
      className={styles.hero}
      aria-labelledby="hero-title"
      style={{ "--glow": glow } as React.CSSProperties}
    >
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          Billetterie et communauté
        </p>
        <h1 id="hero-title">
          Vos prochaines sorties, <em>en un tour.</em>
        </h1>
        <div className={styles.actions}>
          <Link
            href={hasRing && current ? `/evenements/${current.slug}` : "/explorer"}
            className={styles.cta}
          >
            {hasRing && current ? "Voir les billets" : "Explorer l'agenda"}
            <ArrowRight aria-hidden="true" />
          </Link>
          {hasRing ? (
            <Link href="/explorer" className={styles.ctaSecondary}>
              Explorer l'agenda
            </Link>
          ) : null}
        </div>
      </div>

      {hasRing ? (
        <div className={styles.stage}>
          <CircularCarousel
            items={items}
            preset="cylinder"
            intro="rise"
            cardWidth={compact ? 260 : 480}
            aspectRatio={compact ? 0.75 : 0.95}
            gap={compact ? 16 : 36}
            speed={compact ? 8 : 12}
            cornerRadius={14}
            fadeColor="#080605"
            parallax={compact ? 0 : 0.3}
            captions
            onChange={setActive}
            onItemClick={(_, index) => {
              const event = ringEvents[index];
              if (event) router.push(`/evenements/${event.slug}`);
            }}
          />
        </div>
      ) : null}

      <a href="#a-la-une" className={styles.scrollHint}>
        <ChevronDown aria-hidden="true" />
        <span>Défiler</span>
      </a>
    </section>
  );
}
