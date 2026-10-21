"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import type { PublishedEventView } from "@/types/database";

import { formatEventDate } from "./home-data";
import styles from "./arched-hero.module.css";

/* =============================================================================
   Hero « arche » — composition éditoriale, carrousel de sorties en éventail.
   --------------------------------------------------------------------------
   Les cartes sont les vraies sorties publiées. Le même carrousel est utilisé
   partout : sur desktop dans un espace de 1440 × 1010, sur tablette dans un
   espace de 900, sur téléphone dans un espace de 390. Seule la composition
   autour change.
   ========================================================================== */

const CARD_COUNT = 10;
const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 1010;
/** Haut de la bande du carrousel dans l’espace de desktop. */
const BAND_TOP = 420;
const IMAGE_SIZES = "(max-width: 1023px) 46vw, 19vw";

interface Geometry {
  width: number;
  height: number;
  cx: number;
  centerY: number;
  radius: number;
  pitch: number;
  span: number;
  baseW: number;
  growW: number;
  baseH: number;
  growH: number;
  cyDrop: number;
  push: number;
  speed: number;
  corner: number;
}

const DESKTOP: Geometry = {
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  cx: 720,
  centerY: 617,
  radius: 706,
  pitch: 196,
  span: 980,
  baseW: 170,
  growW: 48,
  baseH: 280,
  growH: 92,
  cyDrop: 12,
  push: 0.083,
  speed: 50,
  corner: 15,
};

/** Éventail mobile : trois cartes visibles, la centrale plein cadre. */
const MOBILE: Geometry = {
  width: 390,
  height: 330,
  cx: 195,
  centerY: 175,
  radius: 280,
  pitch: 185,
  span: 925,
  baseW: 166,
  growW: 34,
  baseH: 254,
  growH: 56,
  cyDrop: 2,
  push: 0.03,
  speed: 38,
  corner: 15,
};
const MOBILE_BAND = 340;

/** Même éventail, resserré pour les écrans courts (iPhone SE, paysage). */
const MOBILE_COMPACT: Geometry = {
  width: 390,
  height: 280,
  cx: 195,
  centerY: 148,
  radius: 240,
  pitch: 160,
  span: 800,
  baseW: 142,
  growW: 30,
  baseH: 214,
  growH: 46,
  cyDrop: 2,
  push: 0.03,
  speed: 34,
  corner: 13,
};
const MOBILE_COMPACT_BAND = 290;

/** Tablette : un éventail plus large, trois cartes de front. */
const TABLET: Geometry = {
  width: 900,
  height: 520,
  cx: 450,
  centerY: 260,
  radius: 820,
  pitch: 286,
  span: 1430,
  baseW: 262,
  growW: 38,
  baseH: 400,
  growH: 44,
  cyDrop: 8,
  push: 0.02,
  speed: 46,
  corner: 18,
};
const TABLET_BAND = 540;

const unit = (dx: number, dy: number): [number, number] => {
  const length = Math.hypot(dx, dy) || 1;
  return [dx / length, dy / length];
};

/** Trapèze aux coins arrondis, tracé en chemin SVG pour le clip-path. */
function roundedQuad(
  width: number,
  height: number,
  ylt: number,
  ylb: number,
  yrt: number,
  yrb: number,
  radius: number,
): string {
  const A: [number, number] = [0, ylt];
  const B: [number, number] = [width, yrt];
  const C: [number, number] = [width, yrb];
  const D: [number, number] = [0, ylb];

  const dAB = unit(B[0] - A[0], B[1] - A[1]);
  const dBC = unit(C[0] - B[0], C[1] - B[1]);
  const dCD = unit(D[0] - C[0], D[1] - C[1]);
  const dDA = unit(A[0] - D[0], A[1] - D[1]);

  const r = Math.min(radius, width / 2, height / 2);
  const at = (point: [number, number], direction: [number, number], distance: number): [number, number] => [
    point[0] + direction[0] * distance,
    point[1] + direction[1] * distance,
  ];
  const back = (direction: [number, number]): [number, number] => [-direction[0], -direction[1]];

  const a1 = at(A, dAB, r);
  const b1 = at(B, back(dAB), r);
  const b2 = at(B, dBC, r);
  const c1 = at(C, back(dBC), r);
  const c2 = at(C, dCD, r);
  const d1 = at(D, back(dCD), r);
  const d2 = at(D, dDA, r);
  const a2 = at(A, back(dDA), r);

  const f = (point: [number, number]) => `${point[0].toFixed(2)} ${point[1].toFixed(2)}`;

  return [
    `M ${f(a1)}`,
    `L ${f(b1)}`,
    `Q ${f(B)} ${f(b2)}`,
    `L ${f(c1)}`,
    `Q ${f(C)} ${f(c2)}`,
    `L ${f(d1)}`,
    `Q ${f(D)} ${f(d2)}`,
    `L ${f(a2)}`,
    `Q ${f(A)} ${f(a1)}`,
    "Z",
  ].join(" ");
}

function HeroCard({
  event,
  register,
  preload = false,
}: {
  event: PublishedEventView;
  register?: (el: HTMLAnchorElement | null) => void;
  preload?: boolean;
}) {
  const date = formatEventDate(event.start_at);
  const cover = event.cover_url || event.gallery?.[0];

  return (
    <Link
      ref={register}
      href={`/evenements/${event.slug}`}
      className={styles.card}
      draggable={false}
      aria-label={`${event.title} — ${date.fullBadge}, ${event.city}`}
    >
      {cover ? (
        <PublicStorageImage
          src={cover}
          alt=""
          fill
          sizes={IMAGE_SIZES}
          quality={75}
          preload={preload}
          className={styles.cover}
        />
      ) : (
        <span className={styles.cardFallback} aria-hidden="true">
          {event.category}
        </span>
      )}

      <span className={styles.cardScrim} aria-hidden="true" />

      <span className={styles.cardInfo}>
        <span className={styles.cardDate}>
          {date.weekday} {date.dayMonth}
        </span>
        <span className={styles.cardTitle}>{event.title}</span>
        <span className={styles.cardMeta}>
          {event.city}
          {event.venue_name ? ` · ${event.venue_name}` : ""}
        </span>
      </span>

      <span className={styles.focusRing} aria-hidden="true" />
    </Link>
  );
}

export function ArchedHero({
  events,
  weekCount,
}: {
  events: PublishedEventView[];
  weekCount: number;
}) {
  const cards = useMemo(() => {
    if (events.length === 0) return [];

    const list: PublishedEventView[] = [];
    for (let index = 0; index < CARD_COUNT; index += 1) {
      const event = events[index % events.length];
      if (event) list.push(event);
    }
    return list;
  }, [events]);

  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const badgeRef = useRef<HTMLParagraphElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const sublineRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const organizerRef = useRef<HTMLAnchorElement | null>(null);
  const noteBeRef = useRef<HTMLDivElement | null>(null);
  const noteCtaRef = useRef<HTMLDivElement | null>(null);
  const doodlesRef = useRef<SVGSVGElement | null>(null);
  const pausedRef = useRef(false);

  const badgeLabel =
    weekCount > 0
      ? `${weekCount} sortie${weekCount > 1 ? "s" : ""} cette semaine`
      : events.length > 0
        ? "Les prochaines sorties"
        : "L’agenda des sorties en Côte d’Ivoire";

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const carousel = carouselRef.current;
    const track = trackRef.current;
    if (!section || !stage || !carousel || !track) return;

    const cards = cardRefs.current.filter((card): card is HTMLAnchorElement => card !== null);
    if (cards.length === 0) return;

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const phoneQuery = window.matchMedia("(max-width: 599px)");
    const compactQuery = window.matchMedia("(max-height: 739px)");
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = reduceQuery.matches;
    let desktop = desktopQuery.matches;

    let cfg: Geometry = DESKTOP;
    let bandTop = BAND_TOP;
    let scroll = 0;
    let velocity = 0;
    let dragging = false;
    let captured = false;
    let pointerId: number | null = null;
    let lastX = 0;
    let lastT = 0;
    let downX = 0;
    let downY = 0;
    let moved = 0;

    /* ------------------------------------------------------------- layout */

    const layout = (el: HTMLElement, index: number) => {
      const base = (index - (CARD_COUNT - 1) / 2) * cfg.pitch;
      const period = cfg.span * 2;
      let t = base - scroll;
      t = (((t + cfg.span) % period) + period) % period - cfg.span;

      const x = cfg.cx + t * (1 + cfg.push * (t / cfg.radius) ** 2);

      /* Les cartes hors champ gardent la géométrie du bord : sans plafond,
         la courbure ferait exploser leur taille. */
      const d = Math.min(Math.abs(x - cfg.cx) / cfg.radius, 1.4);
      const w = cfg.baseW + cfg.growW * d * d;
      const cy = cfg.centerY - cfg.cyDrop * d * d;

      const ql = Math.min(Math.abs(x - w / 2 - cfg.cx) / cfg.radius, 1.4);
      const qr = Math.min(Math.abs(x + w / 2 - cfg.cx) / cfg.radius, 1.4);
      const hl = cfg.baseH + cfg.growH * ql ** 2.6;
      const hr = cfg.baseH + cfg.growH * qr ** 2.6;
      const h = Math.max(hl, hr);

      const ylt = (h - hl) / 2;
      const ylb = (h + hl) / 2;
      const yrt = (h - hr) / 2;
      const yrb = (h + hr) / 2;

      el.style.width = `${w.toFixed(2)}px`;
      el.style.height = `${h.toFixed(2)}px`;
      el.style.transform = `translate3d(${(x - w / 2).toFixed(2)}px, ${(cy - h / 2 - bandTop).toFixed(
        2,
      )}px, 0)`;
      el.style.clipPath = `path("${roundedQuad(w, h, ylt, ylb, yrt, yrb, cfg.corner)}")`;
    };

    const layoutAll = () => {
      cards.forEach(layout);
    };

    /* --------------------------------------------------------- mode / size */

    const applyMode = () => {
      const mobile = !desktop;
      const phone = mobile && phoneQuery.matches;
      const compact = phone && compactQuery.matches;
      cfg = desktop ? DESKTOP : phone ? (compact ? MOBILE_COMPACT : MOBILE) : TABLET;
      bandTop = desktop ? BAND_TOP : 0;

      track.style.width = `${cfg.width}px`;
      track.style.height = `${cfg.height}px`;

      if (mobile) {
        const k = carousel.clientWidth / cfg.width || 1;
        const band = compact ? MOBILE_COMPACT_BAND : phone ? MOBILE_BAND : TABLET_BAND;
        track.style.transform = `translateX(-50%) scale(${k})`;
        carousel.style.height = `${(band * k).toFixed(2)}px`;
        stage.style.removeProperty("--s");
      } else {
        track.style.transform = "translateX(-50%)";
        carousel.style.height = "";
        const s = Math.min(section.clientWidth / DESIGN_WIDTH, section.clientHeight / DESIGN_HEIGHT);
        stage.style.setProperty("--s", String(Math.max(0.25, s)));
      }

      layoutAll();
    };

    /* --------------------------------------------------------------- drag */

    const designPerPx = () => {
      const width = track.getBoundingClientRect().width || 1;
      return cfg.width / width;
    };

    const finishDrag = (event?: PointerEvent) => {
      if (!dragging) return;
      if (event && event.pointerId !== pointerId) return;

      const activePointer = pointerId;
      dragging = false;
      pointerId = null;
      delete carousel.dataset.dragging;

      if (captured) {
        captured = false;
        if (activePointer !== null) {
          try {
            carousel.releasePointerCapture(activePointer);
          } catch {
            /* capture déjà relâchée */
          }
        }
      }

      if (performance.now() - lastT > 90) velocity = 0;
      if (Math.abs(velocity) < 30) velocity = 0;
      velocity = Math.max(-6000, Math.min(6000, velocity));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      captured = false;
      pointerId = event.pointerId;
      velocity = 0;
      lastX = event.clientX;
      lastT = performance.now();
      downX = event.clientX;
      downY = event.clientY;
      moved = 0;
      carousel.dataset.dragging = "true";
      /* On capture le pointeur seulement au-delà du seuil de glissement :
         un simple clic doit continuer d’atteindre le lien de la carte. */
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const now = performance.now();
      const dt = Math.max((now - lastT) / 1000, 0.001);
      const dx = (event.clientX - lastX) * designPerPx();
      scroll -= dx;
      velocity = velocity * 0.65 + (-dx / dt) * 0.35;
      moved = Math.max(moved, Math.hypot(event.clientX - downX, event.clientY - downY));
      lastX = event.clientX;
      lastT = now;

      if (!captured && moved > 6) {
        try {
          carousel.setPointerCapture(event.pointerId);
          captured = true;
        } catch {
          /* le pointeur peut déjà être relâché */
        }
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      finishDrag(event);
    };

    const onLostCapture = () => {
      if (dragging) finishDrag();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (moved > 6) {
        event.preventDefault();
        event.stopPropagation();
        moved = 0;
      }
    };

    /* --------------------------------------------------------------- clock */

    const clock = document.documentElement.animate([{ opacity: 1 }, { opacity: 1 }], {
      duration: 1e9,
    });

    let previous = 0;
    let frameId = 0;

    const frame = () => {
      const now = Number(clock.currentTime ?? 0);
      let dt = (now - previous) / 1000;
      previous = now;

      if (!Number.isFinite(dt) || dt < 0) dt = 1 / 60;
      dt = Math.min(dt, 0.05);

      if (!dragging) {
        if (Math.abs(velocity) > 1) {
          scroll += velocity * dt;
          velocity *= 0.05 ** dt;
        } else {
          velocity = 0;
        }
        if (!reduce && !pausedRef.current) scroll += cfg.speed * dt;
      }

      if (scroll > 1e6 || scroll < -1e6) scroll %= cfg.span * 2;

      layoutAll();
      frameId = window.requestAnimationFrame(frame);
    };

    /* ------------------------------------------------------------ entrance */

    const entrance = () => {
      if (reduce) return;

      const easeOut = "cubic-bezier(.22,1,.36,1)";
      const spring = "cubic-bezier(.34,1.56,.64,1)";

      badgeRef.current?.animate(
        [
          { opacity: 0, transform: "scale(.9)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 520, delay: 90, easing: spring, fill: "both" },
      );

      lineRefs.current.forEach((line, index) => {
        line?.animate(
          [
            { opacity: 0, transform: "translateY(28px)", filter: "blur(12px)" },
            { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
          ],
          { duration: 900, delay: 160 + index * 110, easing: easeOut, fill: "both" },
        );
      });

      sublineRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 800, delay: 430, easing: easeOut, fill: "both" },
      );

      carousel.animate(
        [
          { opacity: 0, transform: "translateY(46px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 1100, delay: 560, easing: easeOut, fill: "both" },
      );

      ctaRef.current?.animate(
        [
          { opacity: 0, transform: "scale(.92)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 720, delay: 820, easing: spring, fill: "both" },
      );

      organizerRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 600, delay: 940, easing: easeOut, fill: "both" },
      );

      const paths = doodlesRef.current?.querySelectorAll<SVGPathElement>("path") ?? [];
      paths.forEach((path, index) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length} ${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.animate(
          [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
          {
            duration: 1000,
            delay: 900 + index * 150,
            easing: "cubic-bezier(.4,0,.2,1)",
            fill: "both",
          },
        );
      });

      [noteBeRef.current, noteCtaRef.current].forEach((note, index) => {
        note?.animate(
          [
            { opacity: 0, translate: "0 10px" },
            { opacity: 1, translate: "0 0" },
          ],
          { duration: 700, delay: 1250 + index * 120, easing: easeOut, fill: "both" },
        );
      });
    };

    /* -------------------------------------------------------------- startup */

    stage.dataset.ready = "true";
    applyMode();
    frameId = window.requestAnimationFrame(frame);
    if (desktop) entrance();

    const onReduce = () => {
      reduce = reduceQuery.matches;
    };

    const onResize = () => {
      window.requestAnimationFrame(applyMode);
    };

    const onBreakpoint = () => {
      const next = desktopQuery.matches;
      if (next === desktop) return;
      desktop = next;
      applyMode();
    };

    carousel.addEventListener("pointerdown", onPointerDown);
    carousel.addEventListener("pointermove", onPointerMove);
    carousel.addEventListener("pointerup", finishDrag);
    carousel.addEventListener("pointercancel", onPointerCancel);
    carousel.addEventListener("lostpointercapture", onLostCapture);
    carousel.addEventListener("click", onClickCapture, true);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("resize", onResize);
    desktopQuery.addEventListener("change", onBreakpoint);
    reduceQuery.addEventListener("change", onReduce);

    return () => {
      window.cancelAnimationFrame(frameId);
      clock.cancel();
      carousel.removeEventListener("pointerdown", onPointerDown);
      carousel.removeEventListener("pointermove", onPointerMove);
      carousel.removeEventListener("pointerup", finishDrag);
      carousel.removeEventListener("pointercancel", onPointerCancel);
      carousel.removeEventListener("lostpointercapture", onLostCapture);
      carousel.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("resize", onResize);
      desktopQuery.removeEventListener("change", onBreakpoint);
      reduceQuery.removeEventListener("change", onReduce);
      delete stage.dataset.ready;
    };
  }, [cards.length]);

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby="arched-hero-title">
      <div ref={stageRef} className={styles.stage}>
        <p ref={badgeRef} className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden="true" />
          {badgeLabel}
        </p>

        <h1 id="arched-hero-title" className={styles.headline}>
          <span
            ref={(el) => {
              lineRefs.current[0] = el;
            }}
            className={styles.line}
          >
            Les sorties qui animent
          </span>
          <span
            ref={(el) => {
              lineRefs.current[1] = el;
            }}
            className={`${styles.line} ${styles.lineAccent}`}
          >
            Abidjan &amp; la Côte d’Ivoire
          </span>
        </h1>

        <p ref={sublineRef} className={styles.subline}>
          Concerts, expos, ateliers, sport… Découvrez les sorties publiées près de chez vous, réservez
          votre place et rejoignez la communauté de chaque événement.
        </p>

        <p className={styles.sublineShort}>
          Concerts, expos, ateliers… les sorties à ne pas manquer près de chez vous.
        </p>

        {cards.length > 0 ? (
          <>
            <div ref={noteBeRef} className={styles.noteBe} aria-hidden="true">
              À ne pas
              <br />
              manquer
            </div>

            <svg
              ref={doodlesRef}
              className={styles.doodles}
              viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}
              fill="none"
              aria-hidden="true"
            >
              <path className={styles.soft} d="M266 333 L280 309 M288 337 L302 313" />
              <path d="M1294 168 C1348 262 1332 354 1252 402 C1212 426 1184 438 1160 446" />
              <path d="M1160 446 L1178 440 M1160 446 L1168 428" />
              <path d="M566 930 C590 922 606 908 620 890" />
              <path className={styles.soft} d="M620 890 L604 890 M620 890 L610 874" />
            </svg>

            <div
              ref={carouselRef}
              className={styles.carousel}
              role="group"
              aria-label="Carrousel des prochaines sorties"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") pausedRef.current = true;
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") pausedRef.current = false;
              }}
              onFocusCapture={() => {
                pausedRef.current = true;
              }}
              onBlurCapture={() => {
                pausedRef.current = false;
              }}
            >
              <div ref={trackRef} className={styles.track}>
                {cards.map((event, index) => (
                  <HeroCard
                    key={index}
                    event={event}
                    preload={index === 4}
                    register={(el) => {
                      cardRefs.current[index] = el;
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <p>Les sorties publiées apparaîtront ici.</p>
            <Link href="/devenir-organisateur">Publiez le premier événement</Link>
          </div>
        )}

        <div className={styles.ctaWrap}>
          <div ref={ctaRef} className={styles.cta}>
            <span className={styles.ctaRing} aria-hidden="true" />
            <Link className={styles.ctaButton} href="/explorer?sort=date_asc">
              Voir les sorties
            </Link>
          </div>
          <div ref={noteCtaRef} className={styles.noteCta} aria-hidden="true">
            Billet en poche
          </div>
        </div>

        <Link ref={organizerRef} className={styles.organizer} href="/devenir-organisateur">
          Vous organisez un événement&nbsp;? <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
