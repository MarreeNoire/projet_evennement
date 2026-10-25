import content from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

function CardSkeleton() {
  return (
    <div>
      <div className={`${content.skeleton} ${content.skeletonArt}`} />
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <div className={content.skeleton} style={{ height: 18, width: "72%" }} />
        <div className={content.skeleton} style={{ height: 12, width: "48%" }} />
      </div>
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <div className={shell.editorial}>
      <div className={shell.grain} aria-hidden="true" />
      <div
        className={`${shell.wrap} ${shell.page}`}
        aria-busy="true"
        aria-label="Chargement des événements"
        style={{ display: "grid", gap: 32 }}
      >
        <div style={{ paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <div className={content.skeleton} style={{ height: 11, width: 70 }} />
          <div className={content.skeleton} style={{ height: 52, width: 320, marginTop: 16 }} />
          <div className={content.skeleton} style={{ height: 14, width: 280, marginTop: 16 }} />
        </div>
        <div className={content.skeleton} style={{ height: 150 }} />
        <div className={content.grid}>
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
