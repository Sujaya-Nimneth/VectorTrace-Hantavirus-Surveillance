import { useMemo } from "react";
import { useCases } from "@/hooks/use-surveillance";
import { useNow } from "@/hooks/use-now";
import { REGIONS } from "@/lib/mock-data";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { QueryError } from "./QueryError";
import { Skeleton } from "./Skeleton";

const WINDOW_DAYS = 90;

export function RiskTable() {
  const { data: CASES, loading, error, refetch } = useCases();
  const now = useNow();

  const rows = useMemo(() => {
    const cutoff = now - WINDOW_DAYS * 86400000;
    return REGIONS.map((r) => {
      const cases = CASES.filter((c) => c.region === r.name && +new Date(c.date) >= cutoff);
      const conf = cases.filter((c) => c.status === "Confirmed").length;
      const rate = (cases.length / r.pop) * 100000;
      return {
        region: r.name,
        total: cases.length,
        confirmed: conf,
        rate: +rate.toFixed(2),
        pop: r.pop,
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [CASES, now]);

  if (error) {
    return <QueryError what="risk ranking" error={error} onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div
        className="overflow-x-auto rounded-md border border-border"
        aria-label="Loading risk table"
      >
        <div className="w-full min-w-[560px] space-y-0 p-0">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-t border-border first:border-t-0 px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const max = rows[0]?.rate || 1;

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[560px] text-[12.5px]">
        <caption className="sr-only">
          Regions ranked by hantavirus infection rate per 100,000 population in the last 90 days
        </caption>
        <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-2.5 font-semibold">Region</th>
            <th className="text-right px-4 py-2.5 font-semibold">Population</th>
            <th scope="col" className="text-right px-4 py-2.5 font-semibold">
              Cases (90d)
            </th>
            <th className="text-right px-4 py-2.5 font-semibold">Confirmed</th>
            <th className="text-left px-4 py-2.5 font-semibold w-[34%]">Rate / 100k</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pct = (r.rate / max) * 100;
            const hot = i < 2;
            return (
              <tr key={r.region} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                  {hot && <TrendingUp className="size-3.5 text-alert shrink-0" />}
                  {r.region}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {r.pop.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.total}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.confirmed}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", hot ? "bg-alert" : "bg-teal")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="tabular-nums font-semibold w-12 text-right">{r.rate}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
