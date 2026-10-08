"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type HomeHeroMotionControls = {
  paused: boolean;
  toggle: () => void;
};

const HomeHeroMotionContext = createContext<HomeHeroMotionControls | null>(null);

export function HomeHeroMotionScope({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [motionActive, setMotionActive] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !("IntersectionObserver" in window)) return;

    let isInView = false;
    const syncMotionState = () => setMotionActive(isInView && !document.hidden);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isInView = entry.isIntersecting;
        syncMotionState();
      },
      { rootMargin: "80px" },
    );

    observer.observe(scope);
    document.addEventListener("visibilitychange", syncMotionState);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncMotionState);
    };
  }, []);

  return (
    <HomeHeroMotionContext.Provider
      value={{ paused, toggle: () => setPaused((current) => !current) }}
    >
      <div
        ref={scopeRef}
        className={className}
        data-motion-active={motionActive}
        data-motion-paused={paused}
      >
        {children}
      </div>
    </HomeHeroMotionContext.Provider>
  );
}

export function HomeHeroMotionToggle() {
  const controls = useContext(HomeHeroMotionContext);
  if (!controls) return null;

  return (
    <button
      type="button"
      aria-label={
        controls.paused ? "Reprendre l’animation du titre" : "Mettre en pause l’animation du titre"
      }
      aria-pressed={controls.paused}
      onClick={controls.toggle}
      className="home-hero-motion-toggle border-border-strong bg-surface text-fg-muted hover:text-primary focus-visible:outline-border-focus inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {controls.paused ? (
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
          <path d="M5 3.5a.5.5 0 0 1 .76-.43l6 4a.5.5 0 0 1 0 .86l-6 4A.5.5 0 0 1 5 11.5v-8Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
          <path d="M4.5 3.5A.5.5 0 0 1 5 3h1a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5v-9Zm5 0A.5.5 0 0 1 10 3h1a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-9Z" />
        </svg>
      )}
    </button>
  );
}
