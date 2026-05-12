import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Sparklines, } from "./Spark";
import { cn } from "@/lib/utils";

type Tone = "alert" | "warning" | "info" | "success";
const toneRing: Record<Tone, string> = {
  alert: "before:bg-alert",
  warning: "before:bg-warning",
  info: "before:bg-info",
  success: "before:bg-success",
};
const toneText: Record<Tone, string> = {
  alert: "text-alert",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

export function MetricCard({
  label, value, delta, tone, icon: Icon, spark,
}: {
  label: string; value: string; delta: number; tone: Tone;
  icon: LucideIcon; spark: number[];
}) {
  const up = delta >= 0;
  return (
    <div className={cn(
      "relative bg-card border border-border rounded-lg p-4 overflow-hidden",
      "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1",
      toneRing[tone],
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
        </div>
        <div className={cn("size-8 rounded-md grid place-items-center bg-muted", toneText[tone])}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className={cn(
          "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded",
          up ? "text-alert bg-alert/10" : "text-success bg-success/10",
        )}>
          {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta)}% wk
        </div>
        <Sparklines data={spark} tone={tone} />
      </div>
    </div>
  );
}
