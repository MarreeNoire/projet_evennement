import { Clock } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { formatDate, truncate } from "@/lib/utils";
import type { EventSessionRow, EventSpeakerRow } from "@/types/database";

/* Programme interactif de l'événement. */

export function EventProgram({ sessions }: { sessions: EventSessionRow[] }) {
  if (sessions.length === 0) return null;

  const talks = sessions.filter((s) => !s.is_break).length;

  return (
    <section aria-labelledby="programme" className="flex flex-col gap-4">
      <h2 id="programme" className="font-display text-xl font-bold">
        Programme
        <span className="ml-2 text-sm font-normal text-fg-subtle">
          {talks} session{talks > 1 ? "s" : ""}
        </span>
      </h2>
      <ol className="flex flex-col gap-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className={
              session.is_break
                ? "rounded-xl border border-dashed border-border bg-bg-muted px-4 py-3 text-sm text-fg-muted"
                : "rounded-xl border border-border bg-surface p-4"
            }
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-bg-muted px-2 py-1 text-xs font-medium tabular-nums">
                <Clock className="size-3.5" aria-hidden="true" />
                {formatDate(session.start_at).split(" ").slice(0, 3).join(" ")}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{session.title}</p>
                {session.room ? <p className="text-xs text-fg-subtle">Salle : {session.room}</p> : null}
                {session.description && !session.is_break ? (
                  <p className="mt-1 text-sm text-fg-muted">{truncate(session.description, 180)}</p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* Intervenants de l'événement. */

export function EventSpeakers({ speakers }: { speakers: EventSpeakerRow[] }) {
  if (speakers.length === 0) return null;

  return (
    <section aria-labelledby="intervenants" className="flex flex-col gap-4">
      <h2 id="intervenants" className="font-display text-xl font-bold">
        Intervenants
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {speakers.map((speaker) => (
          <li
            key={speaker.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <Avatar src={speaker.photo_url} name={speaker.name} />
            <div className="min-w-0">
              <p className="truncate font-medium">{speaker.name}</p>
              {speaker.role_title ? (
                <p className="truncate text-sm text-fg-muted">
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
