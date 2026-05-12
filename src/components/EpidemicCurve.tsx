import { useMemo } from "react";
import { Line, ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useCases } from "@/hooks/use-surveillance";
import { REGIONS } from "@/lib/mock-data";

export function EpidemicCurve() {
  const { data: CASES } = useCases();
  const data = useMemo(() => {
    const buckets: Record<string, any> = {};
    const now = new Date();
    for (let i = 89; i >= 0; i -= 3) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      buckets[key] = { date: key };
      REGIONS.forEach(r => buckets[key][r.name] = 0);
    }
    CASES.forEach(c => {
      const cd = new Date(c.date);
      const days = Math.floor((+now - +cd) / 86400000);
      const i = Math.floor(days / 3) * 3;
      if (i > 89) return;
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (buckets[key]) buckets[key][c.region] = (buckets[key][c.region] || 0) + 1;
    });
    const arr = Object.values(buckets) as any[];
    arr.forEach((row: any, idx: number) => {
      const slice = arr.slice(Math.max(0, idx - 2), idx + 1);
      const avg = slice.reduce((s: number, r: any) => s + REGIONS.reduce((a, reg) => a + (r[reg.name] || 0), 0), 0) / slice.length;
      row.trend = +avg.toFixed(1);
    });
    return arr;
  }, [CASES]);

  const palette = ["var(--chart-3)", "var(--chart-2)", "var(--chart-1)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={3} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={8} />
        {REGIONS.map((r, i) => (
          <Bar key={r.name} dataKey={r.name} stackId="a" fill={palette[i]} radius={i === REGIONS.length - 1 ? [3, 3, 0, 0] : 0} />
        ))}
        <Line type="monotone" dataKey="trend" stroke="var(--alert)" strokeWidth={2} dot={false} name="Moving avg" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
