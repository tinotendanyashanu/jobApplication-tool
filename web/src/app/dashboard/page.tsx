"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";

import type { ApplicationRecord, ApplicationStatus, ApplicationsSort } from "@/types/application";
import { ApplicationCard } from "@/components/applications/application-card";
import { ApplicationDetailDialog } from "@/components/applications/application-detail-dialog";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { FilterBar } from "@/components/applications/filter-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { deleteApplication, listApplications, updateApplication } from "@/lib/api-applications";
import { getOrCreateUserId } from "@/lib/user-id";

export default function DashboardPage() {
  const userIdRef = useRef<string | null>(null);
  if (!userIdRef.current) {
    userIdRef.current = getOrCreateUserId();
  }

  const userId = userIdRef.current;

  const [rows, setRows] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [sort, setSort] = useState<ApplicationsSort>("date_desc");
  const [view, setView] = useState<"table" | "cards">("table");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<ApplicationRecord | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 200);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        q: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        sort,
      };
      const data = await listApplications(userId, params);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh applications.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sort, statusFilter, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const subtitle = useMemo(
    () =>
      "Track every posting snapshot with Phase 4 scores, recruiter outcomes for future calibration, " +
      "and a transparent Phase 5 response outlook anchored in your latest workspace save.",
    []
  );

  function setBusy(id: string, value: boolean) {
    setBusyIds((prev) => {
      const next = { ...prev };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
  }

  function patchLocalRow(updated: ApplicationRecord) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function handleStatus(row: ApplicationRecord, next: ApplicationStatus) {
    setBusy(row.id, true);
    try {
      const extras: Partial<Pick<ApplicationRecord, "applied_at">> = {};
      const shouldStampApplied =
        next === "applied" && row.status !== "applied" && !row.applied_at;
      if (shouldStampApplied) {
        extras.applied_at = new Date().toISOString();
      }
      const updated = await updateApplication(userId, row.id, {
        status: next,
        ...extras,
      });
      patchLocalRow(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setBusy(row.id, false);
    }
  }

  async function handleDelete(row: ApplicationRecord) {
    const ok = window.confirm(`Remove ${row.job_title} @ ${row.company}?`);
    if (!ok) return;
    setBusy(row.id, true);
    try {
      await deleteApplication(userId, row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (detailRow?.id === row.id) {
        setDetailOpen(false);
        setDetailRow(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(row.id, false);
    }
  }

  function openDetail(row: ApplicationRecord) {
    setDetailRow(row);
    setDetailOpen(true);
  }

  return (
    <main className="relative flex flex-1 flex-col bg-muted/35">
      <div className="pointer-events-none absolute inset-x-0 top-[-26%] isolate -z-10 h-[520px] overflow-hidden blur-3xl">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted/55 via-accent/65 to-muted/85 opacity-90" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-5">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Workspace
            </Link>
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-primary/35 bg-muted/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Phase 4–5 · Tracking + outlook
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl flex items-center gap-2">
                  <ClipboardList className="size-8 shrink-0" />
                  Application dashboard
                </h1>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-[1rem]">{subtitle}</p>
            </div>
          </div>
          <dl className="rounded-3xl border border-border/70 bg-background/90 px-4 py-3 text-xs shadow-sm backdrop-blur-sm sm:w-[320px]">
            <dt className="font-semibold uppercase tracking-[0.28em] text-muted-foreground">Browser profile id</dt>
            <dd className="mt-3 break-all font-mono text-[0.75rem] text-foreground/90">{userId}</dd>
          </dl>
        </header>

        <FilterBar
          search={searchInput}
          onSearchChange={setSearchInput}
          status={statusFilter}
          onStatusChange={(v) => setStatusFilter(v)}
          sort={sort}
          onSortChange={(v) => setSort(v)}
          view={view}
          onViewChange={(v) => setView(v)}
        />

        {error ? (
          <Alert variant="destructive" className="animate-in fade-in-0">
            <AlertTitle>Could not sync tracker</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        ) : null}

        {!error && loading && rows.length === 0 ? (
          <div className="rounded-3xl border border-border/65 bg-muted/30 p-6 text-sm text-muted-foreground animate-pulse">
            Syncing Postgres snapshot…
          </div>
        ) : view === "table" ? (
          <ApplicationsTable
            rows={rows}
            busyIds={busyIds}
            onView={openDetail}
            onDelete={(row) => void handleDelete(row)}
            onStatusChange={(row, next) => void handleStatus(row, next)}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.length === 0 ? (
              <div className="rounded-3xl border border-border/65 bg-muted/30 p-6 text-sm text-muted-foreground lg:col-span-2">
                No cards yet — generate documents in Workspace, save to tracker, and they populate here instantly.
              </div>
            ) : (
              rows.map((row) => (
                <ApplicationCard
                  key={row.id}
                  row={row}
                  busy={Boolean(busyIds[row.id])}
                  onView={openDetail}
                  onDelete={(r) => void handleDelete(r)}
                  onStatusChange={(r, next) => void handleStatus(r, next)}
                />
              ))
            )}
          </div>
        )}

        <footer className="text-sm text-muted-foreground">
          <p>
            Need more signal? Capture match scores whenever you regenerate — the Workspace now attaches Phase 3 context to every save gesture.
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex font-medium underline-offset-4 hover:text-foreground hover:underline"
          >
            Return to landing narrative
          </Link>
        </footer>
      </section>

      <ApplicationDetailDialog
        open={detailOpen}
        onOpenChange={(openState) => {
          setDetailOpen(openState);
          if (!openState) {
            setDetailRow(null);
          }
        }}
        application={detailRow}
        userId={userId}
        onApplicationPatched={(next) => {
          patchLocalRow(next);
          setDetailRow(next);
        }}
      />
    </main>
  );
}
