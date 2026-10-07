import { CATEGORIES } from "@/lib/constants";

type DancerVariant = "one" | "two" | "three";

function DancingFigure({ variant }: { variant: DancerVariant }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 40"
      className={`site-dancer site-dancer--${variant}`}
      fill="none"
    >
      <g
        className="site-dancer__body"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.6"
      >
        <circle cx="16" cy="6.5" r="3.5" fill="currentColor" stroke="none" />
        <path d="M16 12v11" />
      </g>
      <g
        className="site-dancer__arm site-dancer__arm--left"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.6"
      >
        <path d="M16 14.5 7.5 9" />
      </g>
      <g
        className="site-dancer__arm site-dancer__arm--right"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.6"
      >
        <path d="m16 14.5 8.5-5.5" />
      </g>
      <g
        className="site-dancer__leg site-dancer__leg--left"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.6"
      >
        <path d="m16 23-7 11" />
      </g>
      <g
        className="site-dancer__leg site-dancer__leg--right"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.6"
      >
        <path d="m16 23 7 11" />
      </g>
    </svg>
  );
}

function CategoryRun() {
  return (
    <div className="site-motion-run">
      <DancingFigure variant="one" />
      {CATEGORIES.map((category, index) => (
        <span className="site-motion-word" key={category.slug}>
          {category.label}
          {index < CATEGORIES.length - 1 ? <span className="site-motion-separator" /> : null}
        </span>
      ))}
      <DancingFigure variant="two" />
      <span className="site-motion-word">À découvrir</span>
      <DancingFigure variant="three" />
    </div>
  );
}

export function SiteMotionTicker() {
  return (
    <div className="site-motion-ticker" aria-hidden="true">
      <div className="site-motion-track">
        <CategoryRun />
        <CategoryRun />
      </div>
    </div>
  );
}
