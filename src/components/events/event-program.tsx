import { Avatar } from "@/components/ui/avatar";
import { truncate } from "@/lib/utils";
import type { EventSessionRow, EventSpeakerRow } from "@/types/database";

import styles from "@/components/editorial/editorial.module.css";

/* =============================================================================
   Programme et intervenants (version éditoriale)
   --------------------------------------------------------------------------
   Liste à filets plutôt que cartes : le programme se lit comme un ordre du
   jour, pas comme une grille de widgets.
   ========================================================================== */

function sessionTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Abidjan",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function sessionDay(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Abidjan",
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(/\./g, "");
}

export function EventProgram({ sessions }: { sessions: EventSessionRow[] }) {
  if (sessions.length === 0) return null;

  const talks = sessions.filter((session) => !session.is_break).length;

  return (
    <section aria-labelledby="programme" className={styles.block}>
      <h2 id="programme" className={styles.blockTitle}>
        Programme
        <span
          style={{
            marginLeft: 10,
            fontFamily: "var(--sans)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          {talks} session{talks > 1 ? "s" : ""}
        </span>
      </h2>

      <ol className={styles.programList}>
        {sessions.map((session) => (
          <li key={session.id} className={styles.programItem}>
            <div>
              <p className={styles.programTime}>{sessionTime(session.start_at)}</p>
              <p className={styles.programMeta}>{sessionDay(session.start_at)}</p>
            </div>
            <div>
              <p className={styles.programTitle}>
                {session.title}
                {session.is_break ? " — pause" : ""}
              </p>
              {session.room ? <p className={styles.programMeta}>Salle : {session.room}</p> : null}
              {session.description && !session.is_break ? (
                <p className={styles.programMeta}>{truncate(session.description, 180)}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function EventSpeakers({ speakers }: { speakers: EventSpeakerRow[] }) {
  if (speakers.length === 0) return null;

  return (
    <section aria-labelledby="intervenants" className={styles.block}>
      <h2 id="intervenants" className={styles.blockTitle}>
        Intervenants
      </h2>
      <ul className={styles.speakerList}>
        {speakers.map((speaker) => (
          <li key={speaker.id} className={styles.speaker}>
            <Avatar src={speaker.photo_url} name={speaker.name} />
            <div style={{ minWidth: 0 }}>
              <p className={styles.speakerName}>{speaker.name}</p>
              {speaker.role_title ? (
                <p className={styles.speakerRole}>
                  {speaker.role_title}
                  {speaker.organization ? ` · ${speaker.organization}` : ""}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
