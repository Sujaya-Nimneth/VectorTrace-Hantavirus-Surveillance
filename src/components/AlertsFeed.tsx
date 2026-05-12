import { ALERTS } from "@/lib/mock-alerts";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const cfg = {
  critical: { icon: AlertTriangle, color: "text-alert", bg: "bg-alert/10", ring: "ring-alert/30" },
  warning: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/30" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10", ring: "ring-info/30" },
};

export function AlertsFeed() {
  return (
    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 -mr-1">
      {ALERTS.map(a => {
        const c = cfg[a.level];
        const I = c.icon;
        return (
          <div key={a.id} className={cn("flex gap-2.5 p-2.5 rounded-md ring-1 ring-inset", c.bg, c.ring)}>
            <div className={cn("size-7 shrink-0 rounded grid place-items-center bg-card", c.color)}>
              <I className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium leading-snug">{a.title}</div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span>{a.region}</span>
                <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                <span>{a.ts}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
