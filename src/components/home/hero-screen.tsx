"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";

import styles from "./hero-cover.module.css";

/* =============================================================================
   Mur d'affiches courbé (three.js + GSAP)
   ---------------------------------------------------------------------------
   Réplique la mécanique du hero de DG Cinema avec la bibliothèque du projet :
   les affiches sont des plans texturés posés sur un cylindre (l'écran se
   courbe vers les bords), le cylindre tourne en continu (GSAP ticker), et la
   caméra répond légèrement au pointeur.

   Les textures passent par l'optimiseur Next (`/_next/image`) : same-origin,
   donc chargées sans souci CORS, et recadrées en « cover » via les UV pour
   remplir exactement chaque vignette (aucune bande vide).
   ========================================================================== */

export interface HeroScreenPoster {
  id: string;
  src: string;
}

/** Proxied, same-origin URL so three.js can fetch the texture without CORS. */
function textureUrl(src: string) {
  /* w=384 : une des tailles autorisées par l'optimiseur du projet. */
  return `/_next/image?url=${encodeURIComponent(src)}&w=384&q=80`;
}

/** Recadre la texture en « cover » pour une vignette d'aspect donné. */
function applyCoverUV(texture: THREE.Texture, imageAspect: number, planeAspect: number) {
  if (imageAspect > planeAspect) {
    texture.repeat.set(planeAspect / imageAspect, 1);
    texture.offset.set((1 - planeAspect / imageAspect) / 2, 0);
  } else {
    texture.repeat.set(1, imageAspect / planeAspect);
    texture.offset.set(0, (1 - imageAspect / planeAspect) / 2);
  }
}

const PLANE_ASPECT = 248 / 392; // format affiche du hero
const SLOT_SPEED = 7; // secondes par affiche (rythme calme, lisible)

export function HeroScreen({
  posters,
  paused,
}: {
  posters: HeroScreenPoster[];
  paused: boolean;
}) {
  /* Sonde reportée hors du rendu : jamais de setState pendant un effet. */
  const setWebglFailedSafe = () => queueMicrotask(() => setWebglFailed(true));
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  /* La sonde WebGL s'exécute au premier rendu client uniquement. */

  /* Minimum 4 vignettes pour que la boucle reste dense à l'écran. */
  const loop = useMemo(() => {
    if (posters.length === 0) return [];
    const out: HeroScreenPoster[] = [];
    while (out.length < Math.max(4, posters.length)) {
      out.push(...posters);
    }
    return out.slice(0, Math.max(4, posters.length));
  }, [posters]);

  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || webglFailed || loop.length < 2) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true })
      ?? canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) {
      canvas.remove();
      setWebglFailedSafe();
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 20000);

    const group = new THREE.Group();
    scene.add(group);

    const plane = new THREE.PlaneGeometry(1, 1);
    const loader = new THREE.TextureLoader();

    /* --- état animé par GSAP -------------------------------------------- */
    const state = {
      rot: 0,
      speed: 0,
      targetSpeed: 1,
      dolly: 300,
      parallaxX: 0,
      parallaxY: 0,
    };

    let layout = {
      w: 0,
      h: 0,
      slotW: 0,
      slotH: 0,
      radius: 0,
      angleStep: 0,
      totalArc: 0,
      visibleHalf: 0,
      omega: 0,
    };

    const meshes: THREE.Mesh[] = [];
    const baseAngles: number[] = [];
    const materials: THREE.MeshBasicMaterial[] = [];
    const textures: THREE.Texture[] = [];

    /* Textures partagées : une seule par affiche unique. */
    const materialByPoster = new Map<string, THREE.MeshBasicMaterial>();
    for (const poster of loop) {
      const existing = materialByPoster.get(poster.src);
      if (existing) continue;

      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8dbc6") });
      materials.push(material);
      materialByPoster.set(poster.src, material);

      loader.load(
        textureUrl(poster.src),
        (loaded) => {
          loaded.colorSpace = THREE.SRGBColorSpace;
          const image = loaded.image as HTMLImageElement;
          applyCoverUV(loaded, image.naturalWidth / image.naturalHeight, PLANE_ASPECT);
          loaded.needsUpdate = true;
          material.map = loaded;
          material.color.set("#ffffff");
          material.needsUpdate = true;
          textures.push(loaded);
          gsap.fromTo(
            material,
            { opacity: 0 },
            { opacity: 1, duration: 0.8, ease: "power2.out" },
          );
        },
        undefined,
        () => {
          // Échec de chargement : la vignette reste dans le ton du papier.
        },
      );
    }

    /* --- disposition sur le cylindre ------------------------------------ */
    function layout_() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      const slotH = h * 0.94;
      const slotW = slotH * PLANE_ASPECT;
      const spacing = slotW + Math.max(18, w * 0.02);
      const sagitta = h * 0.16;
      const radius = (w * w) / 4 / (2 * sagitta) + sagitta / 2;
      const desiredStep = spacing / radius;
      /* Nombre de plans : couvrir l'arc visible + marge de recyclage, et un
         multiple du nombre d'affiches pour une boucle parfaite. */
      const visibleHalf = Math.asin(Math.min(w / 2, radius) / radius);
      const minCount = Math.ceil((2 * visibleHalf + 3 * desiredStep) / desiredStep);
      const count = Math.ceil(Math.max(minCount, 8) / loop.length) * loop.length;

      layout = {
        w,
        h,
        slotW,
        slotH,
        radius,
        angleStep: desiredStep,
        totalArc: count * desiredStep,
        visibleHalf: visibleHalf + desiredStep,
        omega: -(spacing / SLOT_SPEED) / radius,
      };

      /* Ajuste les plans existants / crée ceux qui manquent. */
      while (meshes.length < count) {
        const index = meshes.length;
        const poster = loop[index % loop.length]!;
        const material = materialByPoster.get(poster.src)!;
        const mesh = new THREE.Mesh(plane, material);
        group.add(mesh);
        meshes.push(mesh);
      }
      while (meshes.length > count) {
        const mesh = meshes.pop()!;
        group.remove(mesh);
      }

      meshes.forEach((mesh, index) => {
        const angle = (index - meshes.length / 2) * layout.angleStep;
        baseAngles[index] = angle;
        mesh.scale.set(layout.slotW, layout.slotH, 1);
      });

      camera.aspect = w / h;
      const focal = (slotH * 1.12) / 2 / Math.tan((camera.fov * Math.PI) / 360);
      camera.userData.focal = focal;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
    }

    function applyLayout() {
      const focal = (camera.userData.focal as number) ?? 1000;
      camera.position.set(state.parallaxX, state.parallaxY, layout.radius + focal + state.dolly);
      camera.lookAt(state.parallaxX * 0.4, state.parallaxY * 0.4, layout.radius);
    }

    /* --- boucle GSAP ------------------------------------------------------ */
    const tick = (_time: number, deltaTime: number) => {
      /* gsap.ticker fournit deltaTime en millisecondes : conversion en
         secondes pour que la vitesse du mur soit indépendante du framerate. */
      const dt = Math.min(deltaTime, 250) / 1000;
      state.speed += (state.targetSpeed - state.speed) * Math.min(deltaTime / 180, 1);
      state.rot += layout.omega * state.speed * dt;

      meshes.forEach((mesh, index) => {
        const base = baseAngles[index] ?? 0;
        /* Angle monde, ramené dans [-totalArc/2, totalArc/2[ : le plan qui
           sort à gauche est recyclé à droite, hors champ. */
        let a = base + state.rot;
        a = ((a % layout.totalArc) + layout.totalArc) % layout.totalArc;
        if (a > layout.totalArc / 2) a -= layout.totalArc;
        const visible = Math.abs(a) < layout.visibleHalf;
        mesh.visible = visible;
        if (!visible) return;
        mesh.position.set(Math.sin(a) * layout.radius, 0, Math.cos(a) * layout.radius);
        mesh.rotation.y = a;
      });

      applyLayout();
      renderer.render(scene, camera);
    };

    layout_();

    /* Léger recul initial puis dolly d'entrée (GSAP). */
    applyLayout();
    const intro = gsap.timeline();
    intro
      .fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0)
      .fromTo(state, { dolly: 320 }, { dolly: 0, duration: 1.6, ease: "power3.out" }, 0);

    gsap.ticker.add(tick);



    /* Parallaxe pointeur (quickTo = lerp GSAP sans re-render React). */
    const toX = gsap.quickTo(state, "parallaxX", { duration: 0.7, ease: "power2.out" });
    const toY = gsap.quickTo(state, "parallaxY", { duration: 0.7, ease: "power2.out" });
    const onPointer = (event: PointerEvent) => {
      const rect = host!.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      toX(nx * layout.slotW * 0.12);
      toY(ny * layout.slotH * 0.1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* Pause quand la scène sort de l'écran. */
    let inView = true;
    const observer = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(host);

    const visibilityTick = () => {
      const hidden = document.visibilityState === "hidden" || !inView;
      state.targetSpeed = hidden || pausedRef.current ? 0 : 1;
    };
    const visibilityId = window.setInterval(visibilityTick, 400);
    visibilityTick();

    /* --- resize ----------------------------------------------------------- */
    let resizeTimer: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout_();
        applyLayout();
      }, 120);
    });
    resizeObserver.observe(host);

    /* --- cleanup ------------------------------------------------------------ */
    return () => {
      gsap.ticker.remove(tick);
      intro.kill();
      window.clearInterval(visibilityId);
      window.removeEventListener("pointermove", onPointer);
      observer.disconnect();
      resizeObserver.disconnect();
      meshes.forEach((mesh) => group.remove(mesh));
      plane.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, [loop, webglFailed]);

  if (webglFailed || loop.length < 2) {
    /* Repli sans WebGL : rail tactile simple, images recadrées. */
    return (
      <div className={styles["strip-bleed"]}>
        <div className={styles.strip}>
          <div className={styles.track} style={{ animation: "none" }}>
            {loop.map((poster) => (
              <div key={poster.id} className={styles["strip-slide"]}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={textureUrl(poster.src)}
                  alt=""
                  className={styles["strip-image"]}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div ref={hostRef} className={styles.screen} aria-hidden="true" />;
}
