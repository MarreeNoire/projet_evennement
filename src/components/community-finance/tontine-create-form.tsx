"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { CommunityCoverPicker } from "@/components/community-finance/community-cover-picker";
import { removeCommunityCover, uploadCommunityCover } from "@/lib/community-finance/covers";

type Invitee = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
};

export function TontineCreateForm() {
  const router = useRouter();
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [startsOn, setStartsOn] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  });

  useEffect(() => {
    void fetch("/api/tontines/invitees").then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as { invitees?: Invitee[] };
      setInvitees(data.invitees ?? []);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    let coverPath: string | null = null;
    const form = new FormData(event.currentTarget);
    try {
      if (coverFile) {
        setUploading(true);
        ({ path: coverPath } = await uploadCommunityCover(coverFile, "tontines"));
        setUploading(false);
      }
      const response = await fetch("/api/tontines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          contributionAmount: Number(form.get("amount")),
          startsOn,
          memberIds: selected,
          coverPath,
        }),
      });
      const data = (await response.json()) as { tontine?: { id: string }; error?: string };
      if (!response.ok || !data.tontine) throw new Error(data.error ?? "Création impossible.");
      router.push(`/tontines/${data.tontine.id}`);
      router.refresh();
    } catch (cause) {
      if (coverPath) await removeCommunityCover(coverPath).catch(() => {});
      setError(cause instanceof Error ? cause.message : "La tontine n’a pas pu être créée.");
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="tontine-title" required>
            Nom de la tontine
          </Label>
          <Input
            id="tontine-title"
            name="title"
            minLength={3}
            maxLength={120}
            required
            placeholder="Ex. Épargne de la famille"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tontine-amount" required>
            Contribution mensuelle par membre
          </Label>
          <Input
            id="tontine-amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            required
            placeholder="25 000"
          />
          <p className="text-fg-muted text-xs">
            Montant en francs CFA, identique pour chaque échéance.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tontine-start" required>
            Date de début
          </Label>
          <Input
            id="tontine-start"
            name="startsOn"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            required
            value={startsOn}
            onChange={(event) => setStartsOn(event.target.value)}
          />
          <p className="text-fg-muted text-xs">Les tirages ont lieu à chaque échéance mensuelle.</p>
        </div>
      </div>

      <CommunityCoverPicker onChange={setCoverFile} disabled={loading} />

      <fieldset className="border-border border-t pt-5">
        <legend className="text-sm font-semibold">Inviter des connexions</legend>
        <p className="text-fg-muted mb-3 text-xs">
          Les membres choisis recevront une notification et devront accepter.
        </p>
        {invitees.length ? (
          <ul className="divide-border border-border flex max-h-64 flex-col divide-y overflow-y-auto border-y">
            {invitees.map((person) => (
              <li key={person.id}>
                <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
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
                    className="accent-primary size-4"
                  />
                  <Avatar src={person.avatar_url} name={person.display_name} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {person.display_name}
                  </span>
                  {person.username ? (
                    <span className="text-fg-subtle truncate text-xs">@{person.username}</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-border text-fg-muted border-y py-4 text-sm">
            Aucune connexion disponible. Tu peux en ajouter après avoir développé ton réseau.
          </p>
        )}
        {selected.length < 1 ? (
          <p className="text-fg-subtle mt-2 text-xs">
            Sélectionne au moins une personne, en plus de toi.
          </p>
        ) : null}
      </fieldset>

      <p className="text-fg-muted text-xs leading-relaxed">
        Les règlements sont suivis dans Event. Le créateur confirme manuellement les paiements reçus
        hors de l’application avant le tirage du mois.
      </p>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        loading={loading}
        loadingLabel={uploading ? "Envoi de l’image…" : "Création…"}
        disabled={selected.length === 0}
      >
        Créer la tontine
      </Button>
    </form>
  );
}
