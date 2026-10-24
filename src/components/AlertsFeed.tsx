import { useEffect, useMemo, useReducer, useState } from "react";
import { useAlerts } from "@/hooks/use-surveillance";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/time";
import { QueryError } from "./QueryError";
import { Skeleton } from "./Skeleton";

type Level = "critical" | "warning" | "info";

const cfg: Record<Level, { icon: typeof Info; color: string; bg: string; ring: string }> = {
  critical: { icon: AlertTriangle, color: "text-alert", bg: "bg-alert/10", ring: "ring-alert/30" },
  warning: {
    icon: AlertCircle,
    color: "text-warning",
    bg: "bg-warning/10",
    ring: "ring-warning/30",
  },
  info: { icon: Info, color: "text-info", bg: "bg-info/10", ring: "ring-info/30" },
};

const LEVELS: ("all" | Level)[] = ["all", "critical", "warning", "info"];

export function AlertsFeed() {
  const { data: alerts, loading, error, refetch } = useAlerts();
  const [levelFilter, setLevelFilter] = useState<"all" | Level>("all");
  // Re-render every 30s so relative timestamps stay current while mounted.
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(
    () => (levelFilter === "all" ? alerts : alerts.filter((a) => a.level === levelFilter)),
    [alerts, levelFilter],
  );

  if (error) {
    return <QueryError what="alerts" error={error} onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading alerts">
        <span className="sr-only">Loading alerts…</span>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="h-32 grid place-items-center text-muted-foreground text-[12px]">
        No active alerts reported.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2.5" role="group" aria-label="Filter by severity">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={levelFilter === l}
            onClick={() => setLevelFilter(l)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors",
              levelFilter === l
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="h-24 grid place-items-center text-muted-foreground text-[12px]">
          No {levelFilter} alerts in the current feed.
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 -mr-1">
          {visible.map((a) => {
            const c = cfg[a.level];
            const I = c.icon;
            return (
              <div
                key={a.id}
                className={cn("flex gap-2.5 p-2.5 rounded-md ring-1 ring-inset", c.bg, c.ring)}
              >
                <div
                  className={cn("size-7 shrink-0 rounded grid place-items-center bg-card", c.color)}
                >
                  <I className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium leading-snug">{a.title}</div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span>{a.region}</span>
                    <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                    <span>{relativeTime(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
