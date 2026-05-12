import { useMemo } from "react";
import { CASES } from "@/lib/mock-cases";
import { REGIONS } from "@/lib/mock-data";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function RiskTable() {
  const rows = useMemo(() => {
    return REGIONS.map(r => {
      const cases = CASES.filter(c => c.region === r.name);
      const conf = cases.filter(c => c.status === "Confirmed").length;
      const rate = (cases.length / r.pop) * 100000;
      return { region: r.name, total: cases.length, confirmed: conf, rate: +rate.toFixed(2), pop: r.pop };
    }).sort((a, b) => b.rate - a.rate);
  }, []);

  const max = rows[0]?.rate || 1;

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-[12.5px]">
        <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-2.5 font-semibold">Region</th>
            <th className="text-right px-4 py-2.5 font-semibold">Population</th>
            <th className="text-right px-4 py-2.5 font-semibold">Cases (90d)</th>
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
                  {hot && <TrendingUp className="size-3.5 text-alert" />}
                  {r.region}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.pop.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.total}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.confirmed}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", hot ? "bg-alert" : "bg-teal")} style={{ width: `${pct}%` }} />
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
