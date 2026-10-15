"use client";

import { useMemo, useState } from "react";
import { Download, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, AccessLevelBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

export interface ParticipantRow {
  id: string;
  name: string;
  eventName: string;
  ticketType: string;
  reference: string;
  accessLevel: "standard" | "vip" | "vvip";
  checkedIn: boolean;
}

export function OrgParticipantsTable({ participants }: { participants: ParticipantRow[] }) {
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("");
  const events = useMemo(() => [...new Set(participants.map((item) => item.eventName))].sort((a, b) => a.localeCompare(b, "fr")), [participants]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");
    return participants.filter((item) =>
      (!event || item.eventName === event) &&
      (!term || `${item.name} ${item.reference} ${item.eventName} ${item.ticketType}`.toLocaleLowerCase("fr").includes(term)),
    );
  }, [participants, search, event]);

  function exportCsv() {
    const rows = [
      ["Participant", "Événement", "Billet", "Référence", "Accès", "Check-in"],
      ...filtered.map((item) => [item.name, item.eventName, item.ticketType, item.reference, item.accessLevel, item.checkedIn ? "Effectué" : "En attente"]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "participants-evenements.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Participants</h1>
          <p className="mt-1 text-sm text-fg-muted">Recherche, suivi du contrôle d’accès et export des billets payés.</p>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="mr-2 size-4" /> Exporter {filtered.length} ligne{filtered.length > 1 ? "s" : ""}
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <span className="sr-only">Rechercher un participant</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="search" placeholder="Nom, événement, référence…" className="w-full rounded-md border border-border bg-transparent py-2 pl-9 pr-3 text-sm focus:border-border-focus focus:outline-none" />
          </label>
          <label className="w-full sm:w-auto">
            <span className="sr-only">Filtrer par événement</span>
            <select value={event} onChange={(e) => setEvent(e.target.value)} className="min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg sm:min-w-56">
              <option value="">Tous les événements</option>
              {events.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        </CardHeader>
        <CardContent className="p-0">
          {!filtered.length ? (
            <div className="p-5"><EmptyState icon={<Users />} title={participants.length ? "Aucun résultat" : "Aucun billet payé"} description={participants.length ? "Modifie la recherche ou le filtre d’événement." : "Les billets payés apparaîtront ici."} /></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-y border-border bg-bg-muted/50 text-xs uppercase text-fg-muted"><tr><th className="p-3 pl-5">Participant</th><th className="p-3">Événement</th><th className="p-3">Billet</th><th className="p-3">Référence</th><th className="p-3">Accès</th><th className="p-3 pr-5">Contrôle</th></tr></thead>
                  <tbody className="divide-y divide-border">{filtered.map((item) => <tr key={item.id}><td className="p-3 pl-5 font-semibold text-fg">{item.name}</td><td className="p-3 text-fg-muted">{item.eventName}</td><td className="p-3">{item.ticketType}</td><td className="p-3 font-mono text-xs">{item.reference}</td><td className="p-3"><AccessLevelBadge level={item.accessLevel} /></td><td className="p-3 pr-5"><Badge variant={item.checkedIn ? "success" : "neutral"}>{item.checkedIn ? "Scanné" : "À contrôler"}</Badge></td></tr>)}</tbody>
                </table>
              </div>
              <ul className="divide-y divide-border md:hidden">{filtered.map((item) => <li key={item.id} className="space-y-2 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-fg">{item.name}</p><p className="text-xs text-fg-muted">{item.eventName}</p></div><Badge variant={item.checkedIn ? "success" : "neutral"}>{item.checkedIn ? "Scanné" : "À contrôler"}</Badge></div><div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted"><span>{item.ticketType}</span><AccessLevelBadge level={item.accessLevel} /><code>{item.reference}</code></div></li>)}</ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
