"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, CheckCircle2, Clock3, ShieldCheck, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

type Contribution = {
  id: string;
  amount: number;
  currency: string;
  is_anonymous: boolean;
  paid_at: string | null;
  profile: { display_name: string; avatar_url: string | null } | null;
};
type CampaignData = {
  campaign: {
    id: string;
    creator_id: string;
    title: string;
    description: string;
    target_amount: number | null;
    fixed_amount: number | null;
    ends_at: string | null;
    currency: string;
    status: "open" | "closed" | "completed";
  };
  isOwner: boolean;
  totalAmount: number;
  contributorCount: number;
  contributions: Contribution[];
  myContributions: { id: string; status: string; amount: number }[];
};

export function CotisationDetail({ id, contributionId }: { id: string; contributionId?: string }) {
  const [data, setData] = useState<CampaignData | null>(null);
  const [amount, setAmount] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [closing, setClosing] = useState(false);
  const returnContribution = contributionId ?? null;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/cotisations/${id}`, { cache: "no-store" });
        const result = await response.json() as CampaignData & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Cette collecte n’est pas disponible.");
        if (active) {
          setData(result);
          setError("");
          const status = returnContribution
            ? result.myContributions.find((entry) => entry.id === returnContribution)?.status
            : null;
          if (status === "paid") setMessage("Paiement confirmé. Ta contribution a été ajoutée à la collecte.");
          if (status === "failed" || status === "cancelled") setMessage("Le paiement n’a pas été confirmé. Tu peux réessayer.");
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const interval = window.setInterval(() => { void load(); }, returnContribution ? 5_000 : 20_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [id, returnContribution]);

  async function contribute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaying(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/cotisations/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(data?.campaign.fixed_amount ?? amount), anonymous }),
      });
      const result = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error ?? "Le paiement n’a pas pu démarrer.");
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le paiement n’a pas pu démarrer.");
    } finally {
      setPaying(false);
    }
  }

  async function closeCampaign() {
    if (!data) return;
    setClosing(true);
    setError("");
    try {
      const response = await fetch(`/api/cotisations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "La collecte n’a pas pu être clôturée.");
      setData((current) => current ? { ...current, campaign: { ...current.campaign, status: "closed" } } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La collecte n’a pas pu être clôturée.");
    } finally {
      setClosing(false);
    }
  }

  if (loading) return <p className="py-12 text-sm text-fg-muted">Chargement de la collecte…</p>;
  if (!data) return <p role="alert" className="py-8 text-sm text-danger">{error || "Collecte introuvable."}</p>;

  const campaign = data.campaign;
  const target = campaign.target_amount ? Number(campaign.target_amount) : null;
  const progress = target ? Math.min(100, Math.round(data.totalAmount / target * 100)) : null;
  const canContribute = campaign.status === "open" && (!campaign.ends_at || new Date(campaign.ends_at) > new Date());
  const currentContributionStatus = returnContribution
    ? data.myContributions.find((entry) => entry.id === returnContribution)?.status
    : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.75fr)]">
      <div className="flex flex-col gap-8">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={canContribute ? "success" : "neutral"}>{canContribute ? "Collecte ouverte" : campaign.status === "completed" ? "Objectif terminé" : "Collecte clôturée"}</Badge>
            {campaign.fixed_amount ? <Badge variant="neutral">{Number(campaign.fixed_amount).toLocaleString("fr-FR")} F CFA par contribution</Badge> : <Badge variant="neutral">Montant libre</Badge>}
          </div>
          <h1 className="mt-4 font-display text-3xl leading-tight font-semibold md:text-4xl">{campaign.title}</h1>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-2"><Users className="size-4" aria-hidden="true" />{data.contributorCount} cotisant{data.contributorCount === 1 ? "" : "s"}</span>
            {campaign.ends_at ? <span className="inline-flex items-center gap-2"><CalendarClock className="size-4" aria-hidden="true" />Fin le {new Date(campaign.ends_at).toLocaleDateString("fr-FR")}</span> : null}
          </div>
          {data.isOwner && campaign.status === "open" ? <Button className="mt-4" size="sm" variant="secondary" loading={closing} onClick={() => void closeCampaign()}>Clôturer la collecte</Button> : null}
          <p className="mt-6 max-w-3xl whitespace-pre-wrap text-base leading-relaxed">{campaign.description}</p>
        </section>

        <section aria-labelledby="contributors-title">
          <header className="border-t border-border pt-4"><h2 id="contributors-title" className="font-display text-2xl font-semibold">Les cotisants</h2><p className="mt-1 text-sm text-fg-muted">Seules les contributions confirmées sont affichées.</p></header>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {data.contributions.map((contribution) => (
              <li key={contribution.id} className="flex min-h-16 items-center gap-3 py-2">
                {contribution.is_anonymous ? <span className="flex size-9 items-center justify-center border border-border text-fg-subtle"><ShieldCheck className="size-4" aria-hidden="true" /></span> : <Avatar src={contribution.profile?.avatar_url} name={contribution.profile?.display_name ?? "Cotisant"} size="sm" />}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{contribution.is_anonymous ? "Cotisant anonyme" : contribution.profile?.display_name ?? "Cotisant"}</span>
                <span className="text-sm font-semibold tabular-nums">{Number(contribution.amount).toLocaleString("fr-FR")} F</span>
                {contribution.paid_at ? <time className="hidden text-xs text-fg-subtle sm:inline" dateTime={contribution.paid_at}>{new Date(contribution.paid_at).toLocaleDateString("fr-FR")}</time> : null}
              </li>
            ))}
            {!data.contributions.length ? <li className="py-5 text-sm text-fg-muted">Les premiers cotisants apparaîtront après confirmation de leur paiement.</li> : null}
          </ul>
        </section>
      </div>

      <aside className="h-fit border-t border-border pt-4 lg:sticky lg:top-24">
        <p className="text-xs font-medium text-fg-subtle">Montant récolté</p>
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{Number(data.totalAmount).toLocaleString("fr-FR")} <span className="text-base font-medium">F CFA</span></p>
        {target ? (
          <>
            <div role="progressbar" aria-label="Progression de la collecte" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0} className="mt-4 h-2 overflow-hidden bg-bg-muted">
              <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${progress ?? 0}%` }} />
            </div>
            <p className="mt-2 flex justify-between gap-3 text-xs text-fg-muted"><span>{progress}% atteint</span><span>Objectif {target.toLocaleString("fr-FR")} F</span></p>
          </>
        ) : <p className="mt-2 text-sm text-fg-muted">Cette collecte n’a pas de montant cible.</p>}

        {canContribute ? (
          <form onSubmit={contribute} className="mt-6 flex flex-col gap-4 border-t border-border pt-5">
            {campaign.fixed_amount ? (
              <div><p className="text-sm font-medium">Ta contribution</p><p className="mt-1 text-lg font-semibold">{Number(campaign.fixed_amount).toLocaleString("fr-FR")} F CFA</p></div>
            ) : (
              <div className="flex flex-col gap-1.5"><Label htmlFor="contribution-amount" required>Montant en francs CFA</Label><Input id="contribution-amount" type="number" min={100} max={10_000_000} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="5 000" /></div>
            )}
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
              <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="mt-0.5 size-4 accent-primary" />
              <span>Afficher ma contribution comme anonyme</span>
            </label>
            <Button type="submit" loading={paying} loadingLabel="Préparation du paiement…">Contribuer maintenant</Button>
            <p className="text-xs leading-relaxed text-fg-subtle">Tu seras redirigé vers la page sécurisée du prestataire de paiement. Le montant sera comptabilisé après confirmation.</p>
          </form>
        ) : <p className="mt-5 border-t border-border pt-4 text-sm text-fg-muted">Cette collecte n’accepte plus de contributions.</p>}

        {returnContribution && currentContributionStatus === "pending" ? <p role="status" className="mt-4 flex items-center gap-2 text-sm text-fg-muted"><Clock3 className="size-4" aria-hidden="true" />Confirmation du paiement en cours…</p> : null}
        {returnContribution && currentContributionStatus === "paid" ? <p role="status" className="mt-4 flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" aria-hidden="true" />Paiement confirmé, merci.</p> : null}
        {message ? <p role="status" className="mt-3 text-sm text-success">{message}</p> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}{error.includes("Connecte-toi") ? <ButtonLink className="mt-2" variant="link" href={`/connexion?redirect=/cotisations/${id}`}>Se connecter</ButtonLink> : null}</p> : null}
      </aside>
    </div>
  );
}
