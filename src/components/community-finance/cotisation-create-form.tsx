"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { CommunityCoverPicker } from "@/components/community-finance/community-cover-picker";
import { removeCommunityCover, uploadCommunityCover } from "@/lib/community-finance/covers";

export function CotisationCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [target, setTarget] = useState(true);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    let coverPath: string | null = null;
    const form = new FormData(event.currentTarget);
    try {
      if (coverFile) {
        setUploading(true);
        ({ path: coverPath } = await uploadCommunityCover(coverFile, "cotisations"));
        setUploading(false);
      }
      const endValue = String(form.get("endsAt") ?? "");
      const response = await fetch("/api/cotisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          targetAmount: target ? Number(form.get("targetAmount")) : null,
          fixedAmount: fixed ? Number(form.get("fixedAmount")) : null,
          endsAt: endValue ? new Date(endValue).toISOString() : null,
          coverPath,
        }),
      });
      const data = (await response.json()) as { campaign?: { id: string }; error?: string };
      if (!response.ok || !data.campaign)
        throw new Error(data.error ?? "La collecte n’a pas pu être créée.");
      router.push(`/cotisations/${data.campaign.id}`);
      router.refresh();
    } catch (cause) {
      if (coverPath) await removeCommunityCover(coverPath).catch(() => {});
      setError(cause instanceof Error ? cause.message : "La collecte n’a pas pu être créée.");
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="campaign-title" required>
          Titre de la collecte
        </Label>
        <Input
          id="campaign-title"
          name="title"
          minLength={3}
          maxLength={120}
          required
          placeholder="Ex. Soutien à la famille de…"
        />
      </div>
      <CommunityCoverPicker onChange={setCoverFile} disabled={loading} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="campaign-description" required>
          Description de la cause ou du projet
        </Label>
        <Textarea
          id="campaign-description"
          name="description"
          minLength={10}
          maxLength={5000}
          required
          rows={6}
          placeholder="Explique à quoi servira la collecte et comment les fonds seront utilisés."
        />
      </div>

      <fieldset className="border-border border-t pt-4">
        <legend className="text-sm font-semibold">Objectif financier</legend>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={target}
            onChange={(event) => setTarget(event.target.checked)}
            className="accent-primary mt-0.5 size-4"
          />
          <span>Définir un montant cible</span>
        </label>
        {target ? (
          <div className="mt-3 flex flex-col gap-1.5">
            <Label htmlFor="target-amount" required>
              Objectif en francs CFA
            </Label>
            <Input
              id="target-amount"
              name="targetAmount"
              type="number"
              min={1}
              step={1}
              required
              placeholder="500 000"
            />
          </div>
        ) : (
          <p className="text-fg-muted mt-2 text-xs">
            La collecte restera ouverte aux dons libres jusqu’à sa clôture.
          </p>
        )}
      </fieldset>

      <fieldset className="border-border border-t pt-4">
        <legend className="text-sm font-semibold">Montant des contributions</legend>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={fixed}
            onChange={(event) => setFixed(event.target.checked)}
            className="accent-primary mt-0.5 size-4"
          />
          <span>Imposer un montant fixe à chaque cotisant</span>
        </label>
        {fixed ? (
          <div className="mt-3 flex flex-col gap-1.5">
            <Label htmlFor="fixed-amount" required>
              Montant fixe en francs CFA
            </Label>
            <Input
              id="fixed-amount"
              name="fixedAmount"
              type="number"
              min={100}
              step={1}
              required
              placeholder="10 000"
            />
          </div>
        ) : (
          <p className="text-fg-muted mt-2 text-xs">
            Chaque participant choisira le montant de sa contribution (minimum 100 F CFA).
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ends-at">
          Date de fin <span className="text-fg-subtle font-normal">(facultative)</span>
        </Label>
        <Input
          id="ends-at"
          name="endsAt"
          type="datetime-local"
          min={new Date().toISOString().slice(0, 16)}
        />
      </div>
      <p className="text-fg-muted text-xs leading-relaxed">
        Les contributions sont encaissées via le prestataire de paiement actif. Seuls les paiements
        confirmés sont ajoutés au montant récolté.
      </p>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        loading={loading}
        loadingLabel={uploading ? "Envoi de l’image…" : "Publication…"}
      >
        Publier la collecte
      </Button>
    </form>
  );
}
