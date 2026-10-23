import type { SourceStatus } from "@/hooks/use-infra";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/Skeleton";

function panelBadge(sources: SourceStatus[]) {
  if (sources.length === 0) {
    return { label: "No data", cls: "bg-muted text-muted-foreground" };
  }
  if (sources.some((s) => s.status === "down")) {
    return { label: "Outage", cls: "bg-alert/15 text-alert" };
  }
  if (sources.some((s) => s.status === "warn")) {
    return { label: "Degraded", cls: "bg-warning/15 text-warning" };
  }
  return { label: "Operational", cls: "bg-success/15 text-success" };
}

export function SourcesPanel({ sources }: { sources: SourceStatus[] }) {
  const badge = panelBadge(sources);

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold">Data Engine · Ingest Feeds &amp; APIs</h2>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold",
            badge.cls,
          )}
        >
          {badge.label}
        </span>
      </div>
      {sources.length === 0 ? (
        <div className="h-[220px] grid place-items-center text-[12px] text-muted-foreground text-center px-6">
          No ingest runs or uptime probes recorded yet. Schedule ingest-don-feed and
          infra-health-check to populate this panel.
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.src} className="flex items-center gap-3 text-[12px]">
              <div
                className={cn(
                  "size-2 rounded-full",
                  s.status === "ok"
                    ? "bg-success"
                    : s.status === "down"
                      ? "bg-alert"
                      : "bg-warning",
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.src}</div>
                <div className="text-[10.5px] text-muted-foreground">
                  {s.lastCheckedAt ? `Last sync ${relativeTime(s.lastCheckedAt)}` : "Never ran"}
                </div>
              </div>
              <div
                className={cn(
                  "text-[11px] font-semibold",
                  s.status === "ok"
                    ? "text-muted-foreground"
                    : s.status === "down"
                      ? "text-alert"
                      : "text-warning",
                )}
              >
                {s.recordsIngested != null
                  ? `+${s.recordsIngested} records`
                  : s.latencyMs != null
                    ? `${s.latencyMs}ms`
                    : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SourcesPanelSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <Skeleton className="h-4 w-56 mb-4" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
