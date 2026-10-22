"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Ticket } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import type { PublishedEventView } from "@/types/database";
import { formatEventDate, formatEventPrice } from "./home-data";

import styles from "./hero-carousel-3d.module.css";

/* ============================================================================
   Carrousel héros 3D — transformations CSS (perspective / translate3d)
   --------------------------------------------------------------------------
   Technologie : CSS 3D uniquement, aucune dépendance WebGL — pas de perte de
   contexte GPU, coût mémoire minimal y compris sur téléphones modestes.

   Dimensionnement fluide : un ResizeObserver mesure la scène réelle ; largeur
   et hauteur de carte, rayon du carrousel, angle par carte et perspective
   sont recalculés et posés en variables CSS. Rien en pixels fixes : de
   320 px à 1920 px, aucune coupure ni débordement. La hauteur vient du CSS
   (clamp + boîte réelle), donc aucun saut de mise en page au montage.

   Mobile portrait  : carte centrale ≈ 78 % de la largeur, voisines visibles
   et inclinées (profondeur adoucie). Mobile paysage : la scène suit la boîte
   (100dvh-safe), recalcul à l'orientation. Tablette/desktop : plus de cartes
   visibles, rayon et profondeur plus marqués (jauges plafonnées).

   Gestes : Pointer Events, inertie + élastique + snap à la carte la plus
   proche, clic annulé après un glissement réel, `touch-action: pan-y` (le
   défilement vertical de la page n'est jamais bloqué, le geste système de
   retour n'est pas accaparé). À la souris : glisser, flèches ←/→,
   boutons précédent/suivant.

   Performance : une seule boucle rAF ; seuls transform/opacity/visibility
   sont écrits ; `will-change` uniquement pendant le glissement ;
   backface-visibility hidden ; cartes au-delà de ±60° retirées de la
   peinture (aucun filter/box-shadow animé). Pause automatique hors écran
   (IntersectionObserver) et onglet caché. Autoplay doux (6 s), suspendu
   par toute interaction et par prefers-reduced-motion.

   Accessibilité : région « carrousel », étiquettes « i sur n », live region
   polie, liens latéraux hors tabulation (aria-hidden + tabIndex -1),
   navigation clavier, focus visible. Repli : carrousel 2D en scroll-snap
   horizontal si mouvement réduit — mêmes cartes, mêmes données.
   ========================================================================== */

const AUTOPLAY_DELAY_MS = 6000;
const SNAP_EASE = 0.16;
const VELOCITY_DECAY = 0.94;
/** Au-delà de cet angle, la carte n'est plus peinte (perf mobile). */
const HIDE_ANGLE = 62;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function computeMetrics(width: number, height: number, count: number) {
  /* Part de largeur de la carte : dominante sur mobile, mosaïque au-dessus. */
  const share = width < 640 ? 0.78 : width < 1024 ? 0.46 : 0.3;
  const cardWidth = Math.min(430, Math.max(210, width * share));
  const cardHeight = Math.min(580, Math.max(cardWidth * 1.34, height * 0.8));
  /* Une tranche par événement réel (anneau continu, pas de fondu dans le vide). */
  const perCardRad = (Math.PI * 2) / Math.max(6, count);
  /* Rayon : cartes adjacentes alignées sur la corde, léger espacement. */
  const radius = (cardWidth / (2 * Math.sin(perCardRad / 2))) * 1.06;
  const perspective = Math.min(1750, Math.max(950, radius * 1.9));

  return {
    cardWidth,
    cardHeight,
    radius,
    perspective,
    perCardDeg: perCardRad * (180 / Math.PI),
  };
}

export function HeroCarousel3D({ events }: { events: PublishedEventView[] }) {
  const total = events.length;
  const visible = useMemo(() => events.slice(0, 24), [events]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const progressRef = useRef(0); /* progression continue, en cartes */
  const velocityRef = useRef(0); /* cartes par frame après relâchement */
  const targetRef = useRef<number | null>(null); /* snap en cours */
  const indexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  /* --- Mesure (avant la première peinture : zéro décalage de mise en page) - */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const apply = (width: number, height: number) => {
      const { cardWidth, cardHeight, radius, perspective, perCardDeg } = computeMetrics(
        width,
        height,
        Math.max(visible.length, 6),
      );
      stage.style.setProperty("--card-w", `${cardWidth.toFixed(1)}px`);
      stage.style.setProperty("--card-h", `${cardHeight.toFixed(1)}px`);
      stage.style.setProperty("--radius", `${radius.toFixed(1)}px`);
      stage.style.setProperty("--perspective", `${perspective.toFixed(1)}px`);
      stage.style.setProperty("--slice-deg", `${perCardDeg.toFixed(2)}`);
    };

    apply(stage.clientWidth, stage.clientHeight);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      apply(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [visible.length]);

  /* La préférence mouvement réduit est lue via useSyncExternalStore (haut). */

  /* --- Boucle rAF : inertie, élastique, autoplay, écriture des transforms -- */
  useEffect(() => {
    if (reducedMotion || total === 0) return;
    const stage = stageRef.current;
    if (!stage) return;

    let frame = 0;
    let visibleNow = true;
    let lastInteraction = performance.now();

    const renderFrame = () => {
      const progress = progressRef.current;
      const radius = parseFloat(stage.style.getPropertyValue("--radius")) || 600;
      const sliceDeg = parseFloat(stage.style.getPropertyValue("--slice-deg")) || 30;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        /* Angle face caméra, replié sur (-180°, 180°] pour l'anneau infini. */
        let angle = (i - progress) * sliceDeg;
        angle = ((angle + 540) % 360) - 180;
        const absolute = Math.abs(angle);

        if (absolute > HIDE_ANGLE) {
          card.style.visibility = "hidden";
          return;
        }

        const rad = (angle * Math.PI) / 180;
        const x = Math.sin(rad) * radius;
        const z = (Math.cos(rad) - 1) * radius;

        card.style.visibility = "visible";
        card.style.opacity = String(Math.max(0.4, 1 - absolute / 110));
        /* Aplaties, les cartes se trient en DOM : le z-index redonne la
           profondeur (la carte la plus frontale couvre ses voisines). */
        card.style.zIndex = String(1000 - Math.round(absolute * 10));
        card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${(-angle).toFixed(2)}deg)`;
      });
    };

    const tick = (now: number) => {
      const progress = progressRef.current;

      if (targetRef.current !== null) {
        const next = progress + (targetRef.current - progress) * SNAP_EASE;
        progressRef.current = next;
        if (Math.abs(targetRef.current - next) < 0.0012) {
          progressRef.current = targetRef.current;
          targetRef.current = null;
        }
      } else if (Math.abs(velocityRef.current) > 0.0009) {
        velocityRef.current *= VELOCITY_DECAY;
        progressRef.current = progress + velocityRef.current;
      } else if (Math.abs(progress - Math.round(progress)) > 0.0009) {
        progressRef.current = progress + (Math.round(progress) - progress) * SNAP_EASE;
      } else {
        progressRef.current = Math.round(progress);

        /* Autoplay discret après 6 s sans interaction ni présence du curseur. */
        if (document.visibilityState === "visible" && now - lastInteraction > AUTOPLAY_DELAY_MS) {
          lastInteraction = now;
          targetRef.current = Math.round(progress) + 1;
        }
      }

      const current = ((Math.round(progressRef.current) % total) + total) % total;
      if (current !== indexRef.current) {
        indexRef.current = current;
        setIndex(current);
      }

      renderFrame();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    /* Pause hors écran / onglet caché : aucun travail inutile. */
    const intersection = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first) return;
        if (!first.isIntersecting && visibleNow) {
          cancelAnimationFrame(frame);
          visibleNow = false;
        } else if (first.isIntersecting && !visibleNow) {
          visibleNow = true;
          lastInteraction = performance.now();
          frame = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.12 },
    );
    intersection.observe(stage);

    const onVisibility = () => {
      if (document.visibilityState === "hidden" && visibleNow) {
        cancelAnimationFrame(frame);
        visibleNow = false;
      } else if (document.visibilityState === "visible" && !visibleNow) {
        visibleNow = true;
        lastInteraction = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onHover = () => {
      lastInteraction = performance.now();
    };
    stage.addEventListener("pointerenter", onHover);
    stage.addEventListener("focusin", onHover);

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      stage.removeEventListener("pointerenter", onHover);
      stage.removeEventListener("focusin", onHover);
    };
  }, [reducedMotion, total]);

  /* --- Glisser : inertie et élastique, clic annulé après un vrai glissement - */
  useEffect(() => {
    if (reducedMotion || total === 0) return;
    const stage = stageRef.current;
    if (!stage) return;

    let activePointer: number | null = null;
    let lastX = 0;
    let lastMove = 0;
    let dragged = 0;

    const onPointerDown = (event: PointerEvent) => {
      activePointer = event.pointerId;
      lastX = event.clientX;
      lastMove = performance.now();
      dragged = 0;
      velocityRef.current = 0;
      targetRef.current = null;
      if (styles.dragging) stage.classList.add(styles.dragging);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (activePointer !== event.pointerId) return;
      const radius = parseFloat(stage.style.getPropertyValue("--radius")) || 600;
      const sliceRad =
        ((parseFloat(stage.style.getPropertyValue("--slice-deg")) || 30) * Math.PI) / 180;
      /* Arc parcouru par une carte sur l'anneau : rayon × angle. */
      const arcPerCard = radius * sliceRad;

      const dx = event.clientX - lastX;
      lastX = event.clientX;
      const now = performance.now();
      const dt = Math.max(8, now - lastMove);
      lastMove = now;

      dragged += Math.abs(dx);
      /* Le doigt empoigne l'anneau : la progression suit le pointeur. */
      const step = -dx / arcPerCard;
      progressRef.current += step;
      velocityRef.current = (step / dt) * 16.7;
    };

    const finishDrag = () => {
      if (activePointer === null) return;
      activePointer = null;
      if (styles.dragging) stage.classList.remove(styles.dragging);
      /* Sous 8 px, ce n'est pas un glissement : pas d'inertie. */
      if (dragged < 8) velocityRef.current = 0;
      velocityRef.current = Math.max(-3.4, Math.min(3.4, velocityRef.current));
    };

    /* Un clic qui suit un glissement réel ne doit pas naviguer. */
    const onClickCapture = (event: MouseEvent) => {
      if (dragged > 8) {
        dragged = 0;
        event.preventDefault();
        event.stopPropagation();
      }
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    stage.addEventListener("click", onClickCapture, true);
    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      stage.removeEventListener("click", onClickCapture, true);
    };
  }, [reducedMotion, total]);

  /* --- Navigation déclarative (boutons, clavier, cartes latérales) -------- */
  const goTo = useCallback(
    (direction: -1 | 1) => {
      if (!total) return;
      const base = targetRef.current ?? progressRef.current;
      targetRef.current = Math.round(base) + direction;
    },
    [total],
  );

  const moveToCard = (target: number) => {
    if (!total) return;
    const current = indexRef.current;
    const offset = ((target - current) % total + total) % total;
    const shortest = offset > Math.floor(total / 2) ? offset - total : offset;
    targetRef.current = Math.round(progressRef.current) + shortest;
  };

  /* --- Navigation clavier au niveau de la région ---------------------------- */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || total === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(-1);
      }
    };

    stage.addEventListener("keydown", onKeyDown);
    return () => stage.removeEventListener("keydown", onKeyDown);
  }, [total, goTo]);

  /* Repli 2D dès que le mouvement réduit est détecté (mêmes données). */
  if (reducedMotion) {
    return (
      <div
        data-hero-carousel="true"
        role="region"
        aria-roledescription="carrousel"
        aria-label="Carrousel des événements à venir"
        className={styles.carousel}
      >
        <HeroCarousel2D events={visible} />
        <p className={styles.caption}>
          <span>Carrousel simplifié — animations réduites.</span>
        </p>
      </div>
    );
  }

  if (total === 0) return <HeroEmpty />;

  const sliceDefaultDeg = Math.round((360 / Math.max(6, visible.length)) * 100) / 100;

  return (
    <div
      ref={stageRef}
      data-hero-carousel="true"
      role="region"
      aria-roledescription="carrousel"
      aria-label="Carrousel des événements à venir"
      tabIndex={-1}
      className={styles.carousel}
      style={{
        /* Première image cohérente AVANT le premier rAF : l'anneau de
           départ est calculé avec l'angle par carte (var CSS par défaut). */
        ["--slice-deg" as string]: `${sliceDefaultDeg}`,
      }}
    >
      <div className={styles.stage}>
        <div className={styles.ring}>
          {visible.map((event, i) => (
            <div
              className={styles.card}
              key={event.id}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              style={{
                /* Position initiale figée (progression 0), identique à la
                   formule de la boucle rAF : sin/cos CSS calc — aucune carte
                   superposée avant le premier rendu animé, même sans JS. */
                transform: `translate(-50%, -50%) translate3d(calc(sin(${(i * sliceDefaultDeg).toFixed(2)}deg) * var(--radius, 600px)), 0, calc((cos(${(i * sliceDefaultDeg).toFixed(2)}deg) - 1) * var(--radius, 600px))) rotateY(${(-i * sliceDefaultDeg).toFixed(2)}deg)`,
                opacity: Math.max(0.4, 1 - ((i * sliceDefaultDeg) % 110) / 110),
                visibility: i * sliceDefaultDeg > 62 ? "hidden" : undefined,
                zIndex: 1000 - Math.round((i * sliceDefaultDeg) * 10),
              }}
            >
              <HeroCard
                event={event}
                active={i === 0}
                index={i}
                total={total}
                onActivate={() => moveToCard(i)}
              />
            </div>
          ))}
        </div>
      </div>

      {total > 1 ? (
        <div className={styles.controls}>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Événement précédent"
            className={styles.controlButton}
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <span className={styles.counter}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <i aria-hidden="true" />
            {String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Événement suivant"
            className={styles.controlButton}
          >
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <p className={styles.caption} aria-live="polite">
        <span>{events[index]?.title ?? "La prochaine sortie commence ici."}</span>
        <span>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </p>
    </div>
  );
}

/* --------------------------------- carte ------------------------------------ */

function HeroCard({
  event,
  active,
  index,
  total,
  onActivate,
}: {
  event: PublishedEventView;
  active: boolean;
  index: number;
  total: number;
  onActivate?: () => void;
}) {
  const cover = event.cover_url ?? event.gallery?.[0] ?? null;
  const date = formatEventDate(event.start_at);

  return (
    <Link
      href={`/evenements/${event.slug}`}
      className={styles.cardLink}
      aria-label={`Ouvrir ${event.title} (${index + 1} sur ${total})`}
      aria-current={active ? "true" : undefined}
      tabIndex={active ? 0 : -1}
      onClick={
        active
          ? undefined
          : (click) => {
              click.preventDefault();
              onActivate?.();
            }
      }
    >
      <div className={styles.cover}>
        {cover ? (
          <PublicStorageImage
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 32vw, (min-width: 640px) 46vw, 78vw"
            quality={76}
            className={styles.coverImage}
            preload={active}
          />
        ) : (
          <div className={styles.posterFallback}>
            <span>{event.category}</span>
            <strong>{event.title}</strong>
            <i aria-hidden="true" />
          </div>
        )}
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.cardTop}>
          <span>{event.city}</span>
          <time dateTime={event.start_at}>{date.dayMonth}</time>
        </div>
        {active ? (
          <div className={styles.cardContent}>
            <p className={styles.cardType}>{event.category}</p>
            <h2>{event.title}</h2>
            <div className={styles.meta}>
              <span>
                <CalendarDays aria-hidden="true" />
                {date.fullBadge}
              </span>
              <span>
                <MapPin aria-hidden="true" />
                {event.venue_name || event.city}
              </span>
            </div>
            <div className={styles.cardBottom}>
              <span className={styles.price}>{formatEventPrice(event)}</span>
              <span className={styles.ticketAction}>
                Voir la sortie <Ticket aria-hidden="true" />
              </span>
            </div>
          </div>
        ) : (
          <p className={styles.cardTitleSide}>{event.title}</p>
        )}
      </div>
    </Link>
  );
}

/* --------------------------------- vite ------------------------------------- */

function HeroEmpty() {
  return (
    <div className={styles.empty}>
      <div aria-hidden="true" className={styles.emptyArt}>
        <span>EVENT</span>
        <i />
        <b>
          À bientôt <br /> sur la piste.
        </b>
      </div>
      <p>Les événements publiés apparaîtront ici.</p>
    </div>
  );
}

/* ------------------- repli 2D : scroll-snap horizontal ----------------------- */

function HeroCarousel2D({ events }: { events: PublishedEventView[] }) {
  return (
    <ul className={styles.plainTrack} tabIndex={0} aria-label="Événements à venir">
      {events.map((event, i) => (
        <li className={styles.plainCard} key={event.id}>
          <HeroCard event={event} active={true} index={i} total={events.length} />
        </li>
      ))}
    </ul>
  );
}
