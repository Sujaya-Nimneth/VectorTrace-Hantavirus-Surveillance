import type { LogEntry } from "@/hooks/use-infra";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogsTerminal({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-terminal-header px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-[12px] font-semibold">
          <Terminal className="size-3.5 text-terminal" /> system.log
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-alert" />
          <span className="size-2.5 rounded-full bg-warning" />
          <span className="size-2.5 rounded-full bg-success" />
        </div>
      </div>
      <div className="bg-terminal-bg p-4 font-mono text-[11.5px] h-72 overflow-y-auto leading-relaxed">
        {logs.length === 0 ? (
          <div className="text-white/40">No infra events recorded in the last 24h.</div>
        ) : (
          logs.map((l, i) => (
            <div key={`${l.ts}-${i}`} className="flex gap-3 py-0.5">
              <span className="text-white/40 shrink-0">{l.ts}</span>
              <span
                className={cn(
                  "shrink-0 font-bold w-10",
                  l.lvl === "ERR"
                    ? "text-alert"
                    : l.lvl === "WARN"
                      ? "text-warning"
                      : "text-terminal",
                )}
              >
                [{l.lvl}]
              </span>
              <span className="text-white/85">{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
