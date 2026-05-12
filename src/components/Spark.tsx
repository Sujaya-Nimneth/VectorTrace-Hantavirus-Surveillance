import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  alert: "stroke-alert",
  warning: "stroke-warning",
  info: "stroke-info",
  success: "stroke-success",
};

export function Sparklines({ data, tone = "info", className }: { data: number[]; tone?: string; className?: string }) {
  const w = 80, h = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-20 h-7", className)} fill="none">
      <polyline points={pts} className={cn(colors[tone], "stroke-2")} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
