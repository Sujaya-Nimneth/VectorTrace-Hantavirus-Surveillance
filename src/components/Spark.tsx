import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  alert: "stroke-alert",
  warning: "stroke-warning",
  info: "stroke-info",
  success: "stroke-success",
};

export function Sparklines({
  data,
  tone = "info",
  className,
}: {
  data: number[];
  tone?: string;
  className?: string;
}) {
  const w = 80;
  const h = 28;
  const pad = 3;
  const safeData = data.length >= 2 ? data : [data[0] ?? 0, data[0] ?? 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min;
  const innerH = h - pad * 2;

  const pts = safeData
    .map((v, i) => {
      const x = (i / (safeData.length - 1)) * w;
      const y = range === 0 ? h / 2 : pad + innerH - ((v - min) / range) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-20 h-7 shrink-0", className)} fill="none">
      <polyline
        points={pts}
        className={cn(colors[tone] ?? colors.info, "stroke-2")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
