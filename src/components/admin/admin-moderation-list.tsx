"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportActions } from "@/components/admin/report-actions";

const PAGE_SIZE = 8;

export interface AdminReportItem {
  id: string;
  targetLabel: string;
  status: string;
  reason: string;
  details: string | null;
  targetId: string;
  createdAt: string;
  canHide: boolean;
}

export function AdminModerationList({ reports }: { reports: AdminReportItem[] }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageReports = reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-subtle text-success"><Flag className="size-5" aria-hidden="true" /></span>
          <h2 className="font-semibold text-fg">Aucun signalement en attente</h2>
          <p className="max-w-md text-sm text-fg-muted">Les nouveaux signalements envoyés par les utilisateurs apparaîtront ici.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <ul className="space-y-2.5">
        {pageReports.map((report) => (
          <li key={report.id}>
            <Card className="overflow-hidden rounded-lg">
              <CardContent className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-start sm:justify-between sm:p-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="warning">{report.targetLabel}</Badge>
                    <Badge variant="neutral">{report.status === "reviewing" ? "En examen" : "Nouveau"}</Badge>
                    <span className="text-xs text-fg-subtle">{new Date(report.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-fg">{report.reason}</h2>
                  {report.details ? (
                    <details className="text-sm">
                      <summary className="min-h-10 cursor-pointer py-2 font-medium text-primary">Lire le détail du signalement</summary>
                      <p className="whitespace-pre-wrap break-words pb-2 text-fg-muted">{report.details}</p>
                      <p className="break-all text-xs text-fg-subtle">Cible : {report.targetId}</p>
                    </details>
                  ) : <p className="text-xs text-fg-subtle">Aucun détail fourni.</p>}
                </div>
                <ReportActions reportId={report.id} canHide={report.canHide} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {reports.length > PAGE_SIZE ? (
        <nav aria-label="Pagination des signalements" className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-xs text-fg-muted" role="status" aria-live="polite">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, reports.length)} sur {reports.length}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Page précédente" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowLeft className="size-4" aria-hidden="true" /></button>
            <span className="text-xs tabular-nums text-fg-muted">{currentPage}/{pageCount}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Page suivante" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border disabled:opacity-45"><ArrowRight className="size-4" aria-hidden="true" /></button>
          </div>
        </nav>
      ) : null}
    </>
  );
}
