import { useState } from "react";
import { SYMPTOMS } from "@/lib/intake-data";
import { cn } from "@/lib/utils";

export function Step2Clinical() {
  const [symps, setSymps] = useState<Set<string>>(new Set(["fever", "myalgia"]));
  const [syndrome, setSyndrome] = useState("HPS");
  const [date, setDate] = useState("");
  const toggle = (k: string) => {
    const n = new Set(symps); n.has(k) ? n.delete(k) : n.add(k); setSymps(n);
  };
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[12px] font-semibold mb-2">Symptom onset date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full md:w-auto h-10 px-3 rounded-md border border-input bg-card text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div>
        <label className="block text-[12px] font-semibold mb-2">Reported symptoms</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SYMPTOMS.map(s => {
            const on = symps.has(s.k);
            const Icon = s.icon;
            return (
              <button key={s.k} type="button" onClick={() => toggle(s.k)}
                className={cn("flex items-center gap-3 px-3.5 py-3 rounded-md border text-[13px] transition-all text-left",
                  on
                    ? "border-primary bg-primary/5 text-primary font-semibold ring-2 ring-primary/15"
                    : "border-border hover:border-primary/40 hover:bg-muted/40")}>
                <div className={cn("size-8 rounded grid place-items-center",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="size-4" />
                </div>
                <span className="flex-1">{s.label}</span>
                <div className={cn("size-4 rounded border grid place-items-center",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                  {on && <span className="text-[10px]">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-semibold mb-2">Syndrome suspected</label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {[
            { k: "HPS", title: "HPS", sub: "Hantavirus Pulmonary Syndrome" },
            { k: "HFRS", title: "HFRS", sub: "Hemorrhagic Fever w/ Renal Syndrome" },
          ].map(o => {
            const on = syndrome === o.k;
            return (
              <button key={o.k} type="button" onClick={() => setSyndrome(o.k)}
                className={cn("p-4 rounded-md border text-left transition-all",
                  on ? "border-teal bg-teal/5 ring-2 ring-teal/20" : "border-border hover:border-teal/40")}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("size-4 rounded-full border-2 grid place-items-center",
                    on ? "border-teal" : "border-border")}>
                    {on && <div className="size-1.5 rounded-full bg-teal" />}
                  </div>
                  <div className="font-bold text-[14px]">{o.title}</div>
                </div>
                <div className="text-[11px] text-muted-foreground ml-6">{o.sub}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
