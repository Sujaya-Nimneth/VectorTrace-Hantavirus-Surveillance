import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronRight, ChevronLeft, User, Stethoscope, Bug, ClipboardCheck, Save, Loader2, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step2Clinical } from "@/components/Step2Clinical";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";

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

const REGIONS = ["Patagonia", "Andes", "Pampas", "Atacama", "Amazonia", "Sierra Madre"];

type FormState = {
  age: string; sex: "M" | "F" | "";
  region: string; lat: string; lng: string;
  syndrome: "HPS" | "HFRS";
  status: "Pending" | "Suspected" | "Confirmed";
  symptoms: string[]; onsetDate: string;
  exposure: string;
};

function Intake() {
  const { user, loading } = useAuth();
  const { isClinician, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    age: "", sex: "",
    region: REGIONS[0], lat: "", lng: "",
    syndrome: "HPS", status: "Pending",
    symptoms: ["fever", "myalgia"], onsetDate: "",
    exposure: "",
  });

  if (loading || (user && rolesLoading)) {
    return <div className="p-12 text-center text-muted-foreground text-[13px]">Loading…</div>;
  }
  if (!user) {
    return (
      <div className="p-12 max-w-md mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <ClipboardCheck className="size-10 mx-auto mb-3 text-primary" />
          <h2 className="font-bold text-[15px]">Authentication required</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">Case submission is restricted to authorized clinicians.</p>
          <Link to="/login"
            className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            <LogIn className="size-4" /> Sign in to continue
          </Link>
        </div>
      </div>
    );
  }
  if (!isClinician) {
    return (
      <div className="p-12 max-w-md mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <ClipboardCheck className="size-10 mx-auto mb-3 text-primary" />
          <h2 className="font-bold text-[15px]">Insufficient privileges</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">Case submission is restricted to admin and epidemiologist roles.</p>
          <Link to="/" className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-semibold border border-input hover:bg-muted">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const upd = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      const lat = parseFloat(form.lat); const lng = parseFloat(form.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error("Latitude and longitude are required");
      const case_id = `HC-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("hanta_cases").insert({
        case_id,
        region: form.region,
        lat, lng,
        syndrome: form.syndrome,
        status: form.status,
        age: form.age ? parseInt(form.age) : null,
        sex: form.sex || null,
      });
      if (error) throw error;
      navigate({ to: "/" });
    } catch (e: any) {
      setErr(e.message ?? "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-teal">New Case Report</div>
        <h1 className="text-xl font-bold tracking-tight mt-0.5">Rapid Case Intake</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Submit a clinical hantavirus case for surveillance and lab routing.</p>
      </div>

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
                  <div className={cn("flex-1 h-0.5 mx-3 mt-[-18px]", done ? "bg-success" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="size-4 text-primary" />; })()}
          <h2 className="text-[14px] font-semibold">Step {step} · {STEPS[step - 1].label}</h2>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5">Age</label>
              <input type="number" min={0} max={120} value={form.age} onChange={e => upd("age", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5">Sex</label>
              <div className="flex gap-2">
                {(["M", "F"] as const).map(s => (
                  <button key={s} type="button" onClick={() => upd("sex", s)}
                    className={cn("flex-1 h-10 rounded-md border text-[13px] font-medium",
                      form.sex === s ? "border-primary bg-primary/5 text-primary" : "border-input hover:bg-muted")}>
                    {s === "M" ? "Male" : "Female"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5">Region</label>
              <select value={form.region} onChange={e => upd("region", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5">Latitude</label>
                <input value={form.lat} onChange={e => upd("lat", e.target.value)} placeholder="-41.13"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5">Longitude</label>
                <input value={form.lng} onChange={e => upd("lng", e.target.value)} placeholder="-71.31"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && <Step2Clinical />}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5">Suspected exposure</label>
              <textarea rows={5} value={form.exposure} onChange={e => upd("exposure", e.target.value)}
                placeholder="Rural lodging, rodent contact, agricultural site, etc."
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5">Lab status</label>
              <div className="flex gap-2">
                {(["Pending", "Suspected", "Confirmed"] as const).map(s => (
                  <button key={s} type="button" onClick={() => upd("status", s)}
                    className={cn("flex-1 h-10 rounded-md border text-[13px] font-medium",
                      form.status === s ? "border-primary bg-primary/5 text-primary" : "border-input hover:bg-muted")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-[13px]">
            <Row k="Age" v={form.age || "—"} />
            <Row k="Sex" v={form.sex || "—"} />
            <Row k="Region" v={form.region} />
            <Row k="Coordinates" v={`${form.lat || "—"}, ${form.lng || "—"}`} />
            <Row k="Syndrome" v={form.syndrome} />
            <Row k="Lab status" v={form.status} />
            <Row k="Exposure notes" v={form.exposure || "—"} />
            {err && <div className="text-[12px] text-alert bg-alert/10 border border-alert/30 rounded-md px-3 py-2">{err}</div>}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent">
            <ChevronLeft className="size-4" /> Back
          </button>
          <div className="text-[11px] text-muted-foreground">Step {step} of {STEPS.length}</div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 h-10 rounded-md text-[13px] font-medium border border-input hover:bg-muted">
              <Save className="size-3.5" /> Save draft
            </button>
            {step === STEPS.length ? (
              <button onClick={submit} disabled={busy}
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-60">
                {busy && <Loader2 className="size-4 animate-spin" />} Submit case
              </button>
            ) : (
              <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                Continue <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
