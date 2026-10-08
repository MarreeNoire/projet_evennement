"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function HomeHeroMotionScope({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [motionActive, setMotionActive] = useState(true);

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
    <div ref={scopeRef} className={className} data-motion-active={motionActive}>
      {children}
    </div>
  );
}
