"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Clock3, RefreshCw, UserPlus, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicStorageImage } from "@/components/ui/public-storage-image";

type Person = {
  id: string;
  display_name: string;
  username?: string | null;
  avatar_url: string | null;
};
type Member = { id: string; user_id: string; role: string; status: string; profile: Person | null };
type Payment = {
  id: string;
  user_id: string;
  amount: number;
  status: "pending" | "paid";
  paid_at: string | null;
  profile: Person | null;
};
type Cycle = {
  id: string;
  cycle_number: number;
  due_on: string;
  status: "pending" | "drawn";
  beneficiary_user_id: string | null;
  beneficiary: Person | null;
  drawn_at: string | null;
  payments: Payment[];
};
type Payload = {
  tontine: {
    id: string;
    title: string;
    cover_url: string | null;
    contribution_amount: number;
    currency: string;
    starts_on: string;
    status: string;
  };
  isOwner: boolean;
  membership: { status: string; role: string };
  members: Member[];
  cycles: Cycle[];
};

export function TontineDetail({ id }: { id: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [invitees, setInvitees] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/tontines/${id}`, { cache: "no-store" });
    const result = (await response.json()) as Payload & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Impossible de charger la tontine.");
    setData(result);
  }, [id]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [detailResponse, inviteesResponse] = await Promise.all([
          fetch(`/api/tontines/${id}`, { cache: "no-store" }),
          fetch("/api/tontines/invitees", { cache: "no-store" }),
        ]);
        const detail = (await detailResponse.json()) as Payload & { error?: string };
        if (!detailResponse.ok)
          throw new Error(detail.error ?? "Impossible de charger la tontine.");
        const people = inviteesResponse.ok
          ? (((await inviteesResponse.json()) as { invitees?: Person[] }).invitees ?? [])
          : [];
        if (active) {
          setData(detail);
          setInvitees(people);
          setError("");
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id, refresh]);

  const activeMemberIds = useMemo(
    () => new Set(data?.members.map((member) => member.user_id) ?? []),
    [data?.members],
  );
  const availableInvitees = invitees.filter((person) => !activeMemberIds.has(person.id));
  const currentCycle = data?.cycles[0] ?? null;

  async function payOnline(paymentId: string) {
    setBusy(`pay-${paymentId}`);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/tontines/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl)
        throw new Error(result.error ?? "Le paiement n'a pas pu démarrer.");
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le paiement n'a pas pu démarrer.");
    } finally {
      setBusy("");
    }
  }

  async function action(
    key: string,
    path: string,
    method: "POST" | "PATCH" | "DELETE",
    body: unknown,
  ) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "L’action n’a pas abouti.");
      setNotice("Mise à jour enregistrée.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’action n’a pas abouti.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <p className="text-fg-muted py-12 text-sm">Chargement de la tontine…</p>;
  if (error && !data)
    return (
      <p role="alert" className="text-danger py-8 text-sm">
        {error}
      </p>
    );
  if (!data) return null;

  const activeMembers = data.members.filter((member) => member.status === "active");
  const allPaid = Boolean(
    currentCycle &&
    currentCycle.payments.length > 0 &&
    currentCycle.payments.every((payment) => payment.status === "paid"),
  );
  const pot = Number(data.tontine.contribution_amount) * activeMembers.length;

  return (
    <div className="flex flex-col gap-9">
      {data.membership.status === "invited" ? (
        <section className="border-primary/40 bg-primary-subtle/30 border-y px-4 py-5 sm:px-6">
          <h2 className="font-semibold">Tu es invité à rejoindre cette tontine</h2>
          <p className="text-fg-muted mt-1 text-sm">
            Confirme ton adhésion pour participer aux échéances et aux tirages.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              loading={busy === "accept"}
              onClick={() =>
                void action("accept", `/api/tontines/${id}/members`, "POST", {
                  action: "respond",
                  accept: true,
                })
              }
            >
              Accepter l’invitation
            </Button>
            <Button
              variant="secondary"
              disabled={Boolean(busy)}
              onClick={() =>
                void action("decline", `/api/tontines/${id}/members`, "POST", {
                  action: "respond",
                  accept: false,
                })
              }
            >
              Décliner
            </Button>
          </div>
        </section>
      ) : null}

      {data.tontine.cover_url ? (
        <div className="bg-bg-muted relative aspect-[16/7] overflow-hidden rounded-xl">
          <PublicStorageImage
            src={data.tontine.cover_url}
            alt={`Couverture de ${data.tontine.title}`}
            fill
            sizes="(max-width: 1024px) 100vw, 72rem"
            className="object-cover"
            preload
          />
        </div>
      ) : null}

      <section className="border-border grid gap-6 border-y py-5 sm:grid-cols-3">
        <div>
          <p className="text-fg-subtle text-xs font-medium">Contribution mensuelle</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {Number(data.tontine.contribution_amount).toLocaleString("fr-FR")}{" "}
            <span className="text-sm font-medium">F CFA</span>
          </p>
        </div>
        <div>
          <p className="text-fg-subtle text-xs font-medium">Pot distribué à chaque tirage</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {pot.toLocaleString("fr-FR")} <span className="text-sm font-medium">F CFA</span>
          </p>
        </div>
        <div>
          <p className="text-fg-subtle text-xs font-medium">Rotation</p>
          <p className="mt-1 text-2xl font-semibold">{activeMembers.length} membres</p>
        </div>
      </section>
      {data.isOwner && data.tontine.status === "active" ? (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            loading={cancelling}
            onClick={async () => {
              setCancelling(true);
              await action("cancel", `/api/tontines/${id}`, "PATCH", { status: "cancelled" });
              setCancelling(false);
            }}
          >
            Annuler la tontine
          </Button>
        </div>
      ) : null}

      {currentCycle ? (
        <section
          aria-labelledby="current-cycle-title"
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]"
        >
          <div>
            <div className="text-fg-muted flex items-center gap-2 text-sm">
              <CalendarClock className="size-4" aria-hidden="true" /> Échéance du{" "}
              {new Date(`${currentCycle.due_on}T12:00:00`).toLocaleDateString("fr-FR")}
            </div>
            <h2 id="current-cycle-title" className="font-display mt-2 text-2xl font-semibold">
              {currentCycle.status === "drawn"
                ? `Bénéficiaire du mois ${currentCycle.cycle_number}`
                : `Mois ${currentCycle.cycle_number}`}
            </h2>
            {currentCycle.beneficiary ? (
              <div className="border-border mt-4 flex items-center gap-3 border-y py-4">
                <Avatar
                  src={currentCycle.beneficiary.avatar_url}
                  name={currentCycle.beneficiary.display_name}
                  size="md"
                />
                <div>
                  <p className="font-semibold">{currentCycle.beneficiary.display_name}</p>
                  <p className="text-fg-muted text-sm">Tirage aléatoire confirmé</p>
                </div>
                <Badge variant="success" className="ml-auto">
                  {pot.toLocaleString("fr-FR")} F CFA
                </Badge>
              </div>
            ) : (
              <p className="text-fg-muted mt-2 max-w-lg text-sm leading-relaxed">
                Le tirage sera lancé à l’échéance quand chaque membre actif aura réglé sa
                contribution mensuelle.
              </p>
            )}
          </div>

          <div className="border-border border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Règlements du mois</h3>
              <Badge variant={allPaid ? "success" : "warning"}>
                {allPaid ? "À jour" : "En attente"}
              </Badge>
            </div>
            <ul className="divide-border border-border mt-3 divide-y border-y">
              {currentCycle.payments.map((payment) => (
                <li key={payment.id} className="flex min-h-14 items-center gap-3 py-2">
                  <span
                    className={payment.status === "paid" ? "text-success" : "text-fg-subtle"}
                    aria-hidden="true"
                  >
                    {payment.status === "paid" ? (
                      <Check className="size-4" />
                    ) : (
                      <Clock3 className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {payment.profile?.display_name ?? "Membre"}
                  </span>
                  <span className="text-fg-muted text-xs">
                    {payment.status === "paid" ? "Réglé" : "En attente"}
                  </span>
                  {payment.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        loading={busy === `pay-${payment.id}`}
                        onClick={() => void payOnline(payment.id)}
                      >
                        Payer
                      </Button>
                      {data.isOwner ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busy === payment.id}
                          onClick={() =>
                            void action(payment.id, `/api/tontines/${id}/payments`, "PATCH", {
                              paymentId: payment.id,
                              status: "paid",
                            })
                          }
                        >
                          Confirmer
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
              {currentCycle.payments.length === 0 ? (
                <li className="text-fg-muted py-3 text-sm">
                  Aucun membre actif pour cette échéance.
                </li>
              ) : null}
            </ul>
            {data.isOwner ? (
              <p className="text-fg-subtle mt-2 text-xs leading-relaxed">
                Confirme uniquement les règlements reçus. Le tirage se lance automatiquement quand
                l’échéance est due et que tout le monde est à jour.
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="border-border border-y py-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="size-4" aria-hidden="true" />
            Début prévu le{" "}
            {new Date(`${data.tontine.starts_on}T12:00:00`).toLocaleDateString("fr-FR")}
          </div>
          <p className="text-fg-muted mt-2 text-sm">
            La première échéance apparaîtra ici au démarrage de la tontine.
          </p>
        </section>
      )}

      <section aria-labelledby="members-title">
        <header className="border-border flex flex-wrap items-end justify-between gap-3 border-t pt-4">
          <div>
            <h2 id="members-title" className="font-display text-2xl font-semibold">
              Membres et invitations
            </h2>
            <p className="text-fg-muted mt-1 text-sm">
              Chaque participant ne peut recevoir le pot qu’une fois par rotation.
            </p>
          </div>
          <span className="text-fg-muted inline-flex items-center gap-2 text-sm">
            <Users className="size-4" aria-hidden="true" />
            {activeMembers.length} actifs
          </span>
        </header>
        <ul className="divide-border border-border mt-4 divide-y border-y">
          {data.members.map((member) => {
            const hasWon = data.cycles.some(
              (cycle) => cycle.beneficiary_user_id === member.user_id,
            );
            return (
              <li key={member.id} className="flex min-h-16 items-center gap-3 py-2">
                <Avatar
                  src={member.profile?.avatar_url}
                  name={member.profile?.display_name ?? "Membre"}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {member.profile?.display_name ?? "Membre"}
                  {member.role === "owner" ? (
                    <span className="text-fg-subtle ml-2 text-xs font-normal">Créateur</span>
                  ) : null}
                </span>
                <Badge
                  variant={
                    member.status === "active"
                      ? hasWon
                        ? "neutral"
                        : "success"
                      : member.status === "invited"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {member.status === "invited"
                    ? "Invitation envoyée"
                    : member.status === "declined"
                      ? "A décliné"
                      : hasWon
                        ? "A déjà reçu le pot"
                        : "Dans la rotation"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </section>

      {data.isOwner && availableInvitees.length ? (
        <section className="border-border border-t pt-4">
          <h2 className="font-display text-2xl font-semibold">Ajouter des membres</h2>
          <p className="text-fg-muted mt-1 text-sm">
            Seules les connexions acceptées peuvent être invitées.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableInvitees.map((person) => (
              <label
                key={person.id}
                className="border-border hover:bg-bg-muted inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(person.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, person.id]
                        : current.filter((id) => id !== person.id),
                    )
                  }
                  className="accent-primary"
                />
                {person.display_name}
              </label>
            ))}
          </div>
          {selected.length ? (
            <Button
              className="mt-3"
              size="sm"
              loading={busy === "invite"}
              onClick={() =>
                void action("invite", `/api/tontines/${id}/members`, "POST", {
                  action: "invite",
                  userIds: selected,
                }).then(() => setSelected([]))
              }
            >
              <UserPlus className="size-4" />
              Inviter {selected.length} membre{selected.length > 1 ? "s" : ""}
            </Button>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="history-title">
        <header className="border-border border-t pt-4">
          <h2 id="history-title" className="font-display text-2xl font-semibold">
            Historique des tirages
          </h2>
          <p className="text-fg-muted mt-1 text-sm">
            Un tirage validé reste visible pendant toute la rotation.
          </p>
        </header>
        <ol className="divide-border border-border mt-4 divide-y border-y">
          {data.cycles
            .filter((cycle) => cycle.status === "drawn")
            .map((cycle) => (
              <li key={cycle.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <span className="w-24 text-sm font-semibold">Mois {cycle.cycle_number}</span>
                <span className="min-w-0 flex-1 text-sm">
                  {cycle.beneficiary?.display_name ?? "Bénéficiaire"}
                </span>
                <time dateTime={cycle.drawn_at ?? undefined} className="text-fg-subtle text-xs">
                  {new Date(`${cycle.due_on}T12:00:00`).toLocaleDateString("fr-FR")}
                </time>
              </li>
            ))}
          {!data.cycles.some((cycle) => cycle.status === "drawn") ? (
            <li className="text-fg-muted py-4 text-sm">
              Le premier bénéficiaire sera affiché après le tirage de la première échéance.
            </li>
          ) : null}
        </ol>
      </section>

      <div className="text-fg-subtle flex items-center gap-2 text-xs">
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Les paiements sont confirmés manuellement par le créateur après réception.
      </div>
      {notice ? (
        <p role="status" className="text-success text-sm">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
