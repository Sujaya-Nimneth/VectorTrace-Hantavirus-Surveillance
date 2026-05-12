import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronRight, ChevronLeft, User, Stethoscope, Bug, ClipboardCheck, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step2Clinical } from "@/components/Step2Clinical";

export const Route = createFileRoute("/intake")({
  component: Intake,
  head: () => ({ meta: [{ title: "Case Intake · VectorTrace" }] }),
});

const STEPS = [
  { n: 1, label: "Demographics", icon: User },
  { n: 2, label: "Clinical Presentation", icon: Stethoscope },
  { n: 3, label: "Exposure", icon: Bug },
  { n: 4, label: "Review", icon: ClipboardCheck },
];

function Intake() {
  const [step, setStep] = useState(2);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-teal">New Case Report</div>
        <h1 className="text-xl font-bold tracking-tight mt-0.5">Rapid Case Intake</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Submit a clinical hantavirus case for surveillance and lab routing.</p>
      </div>

      {/* Stepper */}
      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const active = step === s.n;
            const done = step > s.n;
            const Icon = s.icon;
            return (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn("size-9 rounded-full grid place-items-center transition-all",
                    active ? "bg-primary text-primary-foreground ring-4 ring-primary/15" :
                    done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </div>
                  <div className={cn("text-[11px] font-semibold",
                    active ? "text-foreground" : done ? "text-success" : "text-muted-foreground")}>
                    {s.label}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-3 mt-[-18px]",
                    done ? "bg-success" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Stethoscope className="size-4 text-primary" />
          <h2 className="text-[14px] font-semibold">Step {step} · {STEPS[step - 1].label}</h2>
        </div>

        {step === 2 ? <Step2Clinical /> : (
          <div className="text-[13px] text-muted-foreground py-12 text-center">
            <ClipboardCheck className="size-10 mx-auto mb-3 opacity-30" />
            Form fields for "{STEPS[step - 1].label}" would render here.
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <button onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
            <ChevronLeft className="size-4" /> Back
          </button>

          <div className="text-[11px] text-muted-foreground">Step {step} of {STEPS.length}</div>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 h-10 rounded-md text-[13px] font-medium border border-input hover:bg-muted">
              <Save className="size-3.5" /> Save draft
            </button>
            <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              className="inline-flex items-center gap-1.5 px-5 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              {step === STEPS.length ? "Submit case" : "Continue"} <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
