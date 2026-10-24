import { useMemo, useState } from "react";
import { useCases } from "@/hooks/use-surveillance";
import { useNow } from "@/hooks/use-now";
import { REGIONS } from "@/lib/mock-data";
import { TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { QueryError } from "./QueryError";
import { Skeleton } from "./Skeleton";

const DAY_MS = 86_400_000;

const WINDOWS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

type SortKey = "region" | "pop" | "total" | "confirmed" | "rate";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right"; bar?: boolean }[] = [
  { key: "region", label: "Region", align: "left" },
  { key: "pop", label: "Population", align: "right" },
  { key: "total", label: "Cases", align: "right" },
  { key: "confirmed", label: "Confirmed", align: "right" },
  { key: "rate", label: "Rate / 100k", align: "left", bar: true },
];

export function RiskTable() {
  const { data: CASES, loading, error, refetch } = useCases();
  const now = useNow();
  const [windowDays, setWindowDays] = useState<number>(90);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const cutoff = now - windowDays * DAY_MS;
    const regions =
      regionFilter === "all" ? REGIONS : REGIONS.filter((r) => r.name === regionFilter);
    return regions
      .map((r) => {
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
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "region") return a.region.localeCompare(b.region) * dir;
        return (a[sortKey] - b[sortKey]) * dir;
      });
  }, [CASES, now, windowDays, regionFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "region" ? "asc" : "desc");
    }
  };

  const exportCsv = () => {
    const csv = buildCsv(
      ["region", "cases", "confirmed", "rate_per_100k", "population", `window_days:${windowDays}`],
      rows.map((r) => [r.region, r.total, r.confirmed, r.rate, r.pop]),
    );
    downloadCsv(
      `vectortrace-risk-${windowDays}d-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
  };

  if (error) {
    return <QueryError what="risk ranking" error={error} onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div
        className="overflow-x-auto rounded-md border border-border"
        role="status"
        aria-label="Loading risk table"
      >
        <span className="sr-only">Loading risk table…</span>
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

  const max = Math.max(...rows.map((r) => r.rate), 1);
  const rankByRate = new Map(
    [...rows].sort((a, b) => b.rate - a.rate).map((r, i) => [r.region, i]),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex gap-1" role="group" aria-label="Time window">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              type="button"
              aria-pressed={windowDays === w.days}
              onClick={() => setWindowDays(w.days)}
              className={cn(
                "px-2.5 py-1 rounded text-[12px] font-semibold transition-colors",
                windowDays === w.days
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Region</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground"
          >
            <option value="all">All regions</option>
            {REGIONS.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={exportCsv}
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-input text-[12px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Download className="size-3.5" /> CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[560px] text-[12.5px]">
          <caption className="sr-only">
            Regions ranked by hantavirus infection rate per 100,000 population in the selected
            window
          </caption>
          <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                  }
                  className={cn("px-4 py-2.5 font-semibold", col.align === "right" && "text-right")}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {col.label === "Cases" ? `Cases (${windowDays}d)` : col.label}
                    {sortKey !== col.key ? (
                      <ArrowUpDown className="size-3 opacity-40" />
                    ) : sortDir === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = (r.rate / max) * 100;
              const hot = (rankByRate.get(r.region) ?? 99) < 2;
              return (
                <tr key={r.region} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-2.5 font-medium">
                    <span className="flex items-center gap-2">
                      {hot && <TrendingUp className="size-3.5 text-alert shrink-0" />}
                      {r.region}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {r.pop.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.total}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.confirmed}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <span
                          className={cn("block h-full rounded-full", hot ? "bg-alert" : "bg-teal")}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="tabular-nums font-semibold w-12 text-right">{r.rate}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
