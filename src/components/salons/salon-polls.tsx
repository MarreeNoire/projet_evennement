"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Check, Circle, LoaderCircle, LockKeyhole, Plus, X } from "lucide-react";

import { Alert } from "@/components/ui/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { closeSalonPoll, createSalonPoll, voteSalonPoll } from "@/lib/salons/actions";
import type { SalonPollWithResults } from "@/lib/salons/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SalonProfile = { id: string; display_name: string };

export function SalonPolls({
  salonId,
  polls,
  profile,
}: {
  salonId: string;
  polls: SalonPollWithResults[];
  profile: SalonProfile | null;
}) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingPoll, setPendingPoll] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`salon-polls:${salonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "salon_polls", filter: `salon_id=eq.${salonId}` },
        () => router.refresh(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "salon_poll_options" }, () =>
        router.refresh(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "salon_poll_votes" }, () =>
        router.refresh(),
      )
      .subscribe((status) => setIsRealtimeConnected(status === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, salonId]);

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createSalonPoll(salonId, question, options);
      if (!result.success) {
        setError(result.error ?? "Le sondage n’a pas pu être créé.");
        return;
      }
      setQuestion("");
      setOptions(["", ""]);
      setIsCreating(false);
    });
  }

  function handleVote(poll: SalonPollWithResults) {
    const optionId = selections[poll.id] ?? poll.myOptionId;
    if (!optionId) {
      setError("Choisis une réponse avant de voter.");
      return;
    }
    setError(null);
    setPendingPoll(poll.id);
    startTransition(async () => {
      const result = await voteSalonPoll(poll.id, optionId);
      setPendingPoll(null);
      if (!result.success) setError(result.error ?? "Ton vote n’a pas pu être enregistré.");
    });
  }

  function handleClose(pollId: string) {
    setError(null);
    setPendingPoll(pollId);
    startTransition(async () => {
      const result = await closeSalonPoll(pollId);
      setPendingPoll(null);
      if (!result.success) setError(result.error ?? "Le sondage n’a pas pu être clôturé.");
    });
  }

  return (
    <section aria-labelledby="salon-polls-title" className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">La parole au groupe</p>
          <h2 id="salon-polls-title" className="font-display mt-1 text-3xl font-semibold">
            Sondages
          </h2>
          <p className="text-fg-muted mt-2 max-w-2xl text-sm">
            Pose une question, recueille les avis et suis les résultats en direct.
          </p>
        </div>
        {profile ? (
          <Button
            type="button"
            variant={isCreating ? "secondary" : "primary"}
            onClick={() => {
              setError(null);
              setIsCreating((open) => !open);
            }}
          >
            {isCreating ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {isCreating ? "Annuler" : "Créer un sondage"}
          </Button>
        ) : null}
      </header>

      {error ? (
        <Alert tone="danger" title="Action impossible">
          {error}
        </Alert>
      ) : null}

      {isCreating ? (
        <form
          onSubmit={handleCreate}
          className="border-border bg-surface-raised grid gap-5 rounded-lg border p-4 sm:p-6"
        >
          <div>
            <label htmlFor="poll-question" className="text-sm font-semibold">
              Ta question
            </label>
            <textarea
              id="poll-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={280}
              rows={2}
              required
              placeholder="Quel atelier vous intéresse le plus ?"
              className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus mt-2 min-h-20 w-full rounded-md border px-3 py-2 text-base focus:ring-1 focus:outline-none"
            />
            <p className="text-fg-subtle mt-1 text-xs">{question.length}/280 caractères</p>
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold">Réponses possibles</legend>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`poll-option-${index}`}>
                  Réponse {index + 1}
                </label>
                <input
                  id={`poll-option-${index}`}
                  value={option}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((value, optionIndex) =>
                        optionIndex === index ? event.target.value : value,
                      ),
                    )
                  }
                  maxLength={120}
                  required
                  placeholder={`Choix ${index + 1}`}
                  className="border-border-strong bg-surface focus:border-border-focus focus:ring-border-focus min-h-11 min-w-0 flex-1 rounded-md border px-3 text-base focus:ring-1 focus:outline-none"
                />
                {options.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Supprimer le choix ${index + 1}`}
                    className="text-fg-muted hover:text-danger focus-visible:ring-border-focus inline-flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ))}
            {options.length < 6 ? (
              <button
                type="button"
                onClick={() => setOptions((current) => [...current, ""])}
                className="text-primary focus-visible:ring-border-focus inline-flex min-h-11 w-fit items-center gap-2 rounded-md text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
              >
                <Plus className="size-4" aria-hidden="true" /> Ajouter un choix
              </button>
            ) : null}
            <p className="text-fg-subtle text-xs">
              Deux à six réponses distinctes, 120 caractères maximum chacune.
            </p>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={pending} loadingLabel="Création…">
              Publier le sondage
            </Button>
            <span className="text-fg-subtle text-xs">
              Les membres pourront modifier leur vote tant que le sondage reste ouvert.
            </span>
          </div>
        </form>
      ) : null}

      {polls.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-lg border border-dashed px-5 py-10 text-center">
          <span className="bg-primary-subtle text-primary inline-flex size-12 items-center justify-center rounded-full">
            <BarChart3 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold">Pas encore de sondage</h3>
            <p className="text-fg-muted mt-1 max-w-md text-sm">
              Lance une question pour aider le groupe à choisir son programme ou partager ses
              préférences.
            </p>
          </div>
          {!profile ? (
            <>
              <p className="text-fg-subtle text-sm">
                Connecte-toi pour participer aux sondages de ce salon.
              </p>
              <ButtonLink
                href={`${ROUTES.login}?redirect=${encodeURIComponent(`/salons/${salonId}?tab=sondages`)}`}
                size="sm"
              >
                Se connecter
              </ButtonLink>
            </>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {polls.map((poll) => {
            const selectedOption = selections[poll.id] ?? poll.myOptionId ?? "";
            const isPollPending = pending && pendingPoll === poll.id;
            return (
              <article
                key={poll.id}
                className="border-border bg-surface-raised flex flex-col gap-5 rounded-lg border p-4 sm:p-5"
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-snug font-semibold">
                      {poll.question}
                    </h3>
                    <p className="text-fg-muted mt-2 flex items-center gap-2 text-xs">
                      {poll.is_closed ? (
                        <>
                          <LockKeyhole className="size-3.5" aria-hidden="true" /> Sondage clôturé
                        </>
                      ) : (
                        <>
                          <span className="bg-success size-2 rounded-full" aria-hidden="true" />{" "}
                          Ouvert aux votes
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      {poll.totalVotes} vote{poll.totalVotes === 1 ? "" : "s"}
                    </p>
                  </div>
                  <BarChart3 className="text-primary mt-1 size-5 shrink-0" aria-hidden="true" />
                </header>

                <ul className="grid gap-3">
                  {poll.options.map((option) => {
                    const percent = poll.totalVotes
                      ? Math.round((option.voteCount / poll.totalVotes) * 100)
                      : 0;
                    const isSelected = selectedOption === option.id;
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          disabled={!profile || poll.is_closed || pending}
                          aria-pressed={isSelected}
                          onClick={() =>
                            setSelections((current) => ({ ...current, [poll.id]: option.id }))
                          }
                          className={`border-border focus-visible:ring-border-focus relative flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-md border px-3 text-left focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default ${isSelected ? "border-primary" : "hover:border-border-strong"}`}
                        >
                          <span
                            aria-hidden="true"
                            className="bg-primary-subtle absolute inset-y-0 left-0 transition-[width] duration-300"
                            style={{ width: `${percent}%` }}
                          />
                          <span className="text-primary relative z-10">
                            {isSelected ? (
                              <Check className="size-4" aria-hidden="true" />
                            ) : (
                              <Circle className="size-4" aria-hidden="true" />
                            )}
                          </span>
                          <span className="relative z-10 min-w-0 flex-1 text-sm font-medium">
                            {option.label}
                          </span>
                          <span className="text-fg-muted relative z-10 text-xs tabular-nums">
                            {option.voteCount} · {percent}%
                          </span>
                          <span
                            className="sr-only"
                            role="progressbar"
                            aria-label={`Résultat pour ${option.label}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  {profile && !poll.is_closed ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={!selectedOption || pending}
                      loading={isPollPending}
                      loadingLabel="Enregistrement…"
                      onClick={() => handleVote(poll)}
                    >
                      {poll.myOptionId ? "Modifier mon vote" : "Voter"}
                    </Button>
                  ) : poll.myOptionId ? (
                    <p className="text-fg-muted text-xs">Ton vote a été pris en compte.</p>
                  ) : (
                    <span />
                  )}
                  {poll.canClose && !poll.is_closed ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleClose(poll.id)}
                      className="text-fg-muted hover:text-fg focus-visible:ring-border-focus inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                    >
                      {isPollPending ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <LockKeyhole className="size-4" aria-hidden="true" />
                      )}
                      Clôturer
                    </button>
                  ) : null}
                </footer>
              </article>
            );
          })}
        </div>
      )}
      <p className="text-fg-subtle text-xs" role="status" aria-live="polite">
        <span
          className={`mr-2 inline-block size-2 rounded-full ${isRealtimeConnected ? "bg-success" : "bg-fg-subtle"}`}
          aria-hidden="true"
        />
        {isRealtimeConnected
          ? "Les réponses et résultats s’actualisent en direct."
          : "Connexion aux résultats en direct…"}
      </p>
    </section>
  );
}
