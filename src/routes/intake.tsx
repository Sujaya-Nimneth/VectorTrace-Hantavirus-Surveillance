import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Stethoscope,
  Bug,
  ClipboardCheck,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Step2Clinical } from "@/components/Step2Clinical";
import { QueryError } from "@/components/QueryError";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { REGIONS, type Case } from "@/lib/mock-data";
import { SYMPTOMS } from "@/lib/intake-data";
import { DEFAULT_INTAKE_FORM, intakeSchema, type IntakeForm } from "@/lib/intake-schema";
import { requireAuth } from "@/lib/auth-gate";
import { GateCard } from "@/components/GateCard";

export const Route = createFileRoute("/intake")({
  component: Intake,
  // Client-side auth redirect; role checks stay in the component because they
  // need a user_roles query. RLS remains the actual write enforcement.
  beforeLoad: async ({ location }) => requireAuth(location.href),
  head: () => ({ meta: [{ title: "Case Intake · VectorTrace" }] }),
});

const STEPS = [
  { n: 1, label: "Demographics", icon: User },
  { n: 2, label: "Clinical Presentation", icon: Stethoscope },
  { n: 3, label: "Exposure", icon: Bug },
  { n: 4, label: "Review", icon: ClipboardCheck },
];

const DRAFT_STORAGE_KEY = "vectortrace_intake_draft_v1";

function Intake() {
  const { user, loading } = useAuth();
  const { isClinician, error: rolesError, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<IntakeForm>(DEFAULT_INTAKE_FORM);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<IntakeForm>;
        setForm((prev) => ({ ...prev, ...parsed }));
        setDraftRestored(true);
      }
    } catch {
      // ignore invalid draft
    }
  }, []);

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    setForm(DEFAULT_INTAKE_FORM);
    setDraftRestored(false);
    toast.info("Draft discarded");
  };

  if (loading || (user && rolesLoading)) {
    return <div className="p-12 text-center text-muted-foreground text-[13px]">Loading…</div>;
  }
  if (!user) {
    return (
      <GateCard
        icon={ClipboardCheck}
        title="Authentication required"
        body="Case submission is restricted to the epidemiologist and admin roles."
        action={{ to: "/login", label: "Sign in to continue", primary: true }}
      />
    );
  }
  if (rolesError) {
    return (
      <div className="p-12 max-w-md mx-auto">
        <QueryError what="your roles" error={rolesError} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!isClinician) {
    return (
      <GateCard
        icon={ClipboardCheck}
        title="Insufficient privileges"
        body="Case submission is restricted to admin and epidemiologist roles."
        action={{ to: "/dashboard", label: "Back to dashboard" }}
      />
    );
  }

  const upd = <K extends keyof IntakeForm>(k: K, v: IntakeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleRegionChange = (regionName: string) => {
    const found = REGIONS.find((r) => r.name === regionName);
    setForm((prev) => ({
      ...prev,
      region: regionName,
      lat: found ? String(found.lat) : prev.lat,
      lng: found ? String(found.lng) : prev.lng,
    }));
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      toast.success("Case intake draft saved locally");
    } catch {
      toast.error("Unable to save draft to local storage");
    }
  };

  const submit = async () => {
    setErr(null);
    const parsed = intakeSchema.safeParse(form);
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Please review the form for errors");
      setStep(parsed.error.issues[0]?.path[0] === "age" ? 1 : 4);
      return;
    }
    setBusy(true);
    try {
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      const case_id = `HC-${crypto.randomUUID()}`;
      const reportedAt = form.onsetDate
        ? new Date(form.onsetDate).toISOString()
        : new Date().toISOString();

      const { error } = await supabase.from("hanta_cases").insert({
        case_id,
        region: form.region,
        lat,
        lng,
        syndrome: form.syndrome,
        status: form.status,
        age: form.age ? parseInt(form.age, 10) : null,
        sex: form.sex || null,
        symptoms: form.symptoms,
        exposure: form.exposure.trim() || null,
        reported_at: reportedAt,
      });
      if (error) throw error;

      const newCase: Case = {
        id: case_id,
        region: form.region,
        lat,
        lng,
        date: reportedAt,
        syndrome: form.syndrome,
        status: form.status,
        age: form.age ? parseInt(form.age, 10) : null,
        sex: form.sex || null,
        symptoms: form.symptoms,
        exposure: form.exposure.trim() || null,
      };

      queryClient.setQueryData<Case[]>(["hanta_cases"], (prev = []) => [
        newCase,
        ...prev.filter((c) => c.id !== newCase.id),
      ]);

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }

      toast.success(`Case ${case_id} submitted to surveillance registry`);
      navigate({ to: "/dashboard" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Submission failed";
      setErr(message);
    } finally {
      setBusy(false);
    }
  };

  const symptomLabels = form.symptoms
    .map((k) => SYMPTOMS.find((s) => s.k === k)?.label ?? k)
    .join(", ");

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-teal">
          New Case Report
        </div>
        <h1 className="text-xl font-bold tracking-tight mt-0.5">Rapid Case Intake</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">
          Submit a clinical hantavirus case for surveillance and lab routing.
        </p>
      </div>

      {draftRestored && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-[12.5px] text-foreground">
          <span>
            A saved draft was restored from this browser.
            <span className="text-muted-foreground"> Review it or start fresh.</span>
          </span>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 rounded border border-input px-2.5 py-1 text-[12px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Discard draft
          </button>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const active = step === s.n;
            const done = step > s.n;
            const Icon = s.icon;
            return (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => setStep(s.n)}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg px-2 py-1"
                >
                  <div
                    className={cn(
                      "size-9 rounded-full grid place-items-center transition-all",
                      active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : done
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                    )}
                  >
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </div>
                  <div
                    className={cn(
                      "text-[11px] font-semibold text-center",
                      active ? "text-foreground" : done ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 sm:mx-3 mt-[-18px]",
                      done ? "bg-success" : "bg-border",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          {(() => {
            const Icon = STEPS[step - 1].icon;
            return <Icon className="size-4 text-primary" />;
          })()}
          <h2 className="text-[14px] font-semibold">
            Step {step} · {STEPS[step - 1].label}
          </h2>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="intake-age" className="block text-[12px] font-semibold mb-1.5">
                Age
              </label>
              <input
                id="intake-age"
                type="number"
                min={0}
                max={120}
                value={form.age}
                onChange={(e) => upd("age", e.target.value)}
                placeholder="e.g. 34"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <fieldset>
              <legend className="block text-[12px] font-semibold mb-1.5">Sex</legend>
              <div className="flex gap-2">
                {(["M", "F"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={form.sex === s}
                    onClick={() => upd("sex", s)}
                    className={cn(
                      "flex-1 h-10 rounded-md border text-[13px] font-medium",
                      form.sex === s
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input hover:bg-muted",
                    )}
                  >
                    {s === "M" ? "Male" : "Female"}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="intake-region" className="block text-[12px] font-semibold mb-1.5">
                Region
              </label>
              <select
                id="intake-region"
                value={form.region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {REGIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="intake-lat" className="block text-[12px] font-semibold mb-1.5">
                  Latitude
                </label>
                <input
                  id="intake-lat"
                  value={form.lat}
                  onChange={(e) => upd("lat", e.target.value)}
                  placeholder="-41.13"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="intake-lng" className="block text-[12px] font-semibold mb-1.5">
                  Longitude
                </label>
                <input
                  id="intake-lng"
                  value={form.lng}
                  onChange={(e) => upd("lng", e.target.value)}
                  placeholder="-71.31"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <Step2Clinical
            syndrome={form.syndrome}
            symptoms={form.symptoms}
            onsetDate={form.onsetDate}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          />
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="intake-exposure" className="block text-[12px] font-semibold mb-1.5">
                Suspected exposure
              </label>
              <textarea
                id="intake-exposure"
                rows={5}
                value={form.exposure}
                onChange={(e) => upd("exposure", e.target.value)}
                placeholder="Rural lodging, rodent contact, agricultural site, etc."
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <fieldset>
              <legend className="block text-[12px] font-semibold mb-1.5">Lab status</legend>
              <div className="flex gap-2">
                {(["Pending", "Suspected", "Confirmed"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={form.status === s}
                    onClick={() => upd("status", s)}
                    className={cn(
                      "flex-1 h-10 rounded-md border text-[13px] font-medium",
                      form.status === s
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input hover:bg-muted",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-[13px]">
            <Row k="Age" v={form.age || "—"} />
            <Row k="Sex" v={form.sex || "—"} />
            <Row k="Region" v={form.region} />
            <Row k="Coordinates" v={`${form.lat || "—"}, ${form.lng || "—"}`} />
            <Row k="Syndrome" v={form.syndrome} />
            <Row k="Symptom onset" v={form.onsetDate || "Today"} />
            <Row k="Symptoms" v={symptomLabels || "—"} />
            <Row k="Lab status" v={form.status} />
            <Row k="Exposure notes" v={form.exposure || "—"} />
            {err && (
              <div className="text-[12px] text-alert bg-alert/10 border border-alert/30 rounded-md px-3 py-2">
                {err}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 border-t border-border">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
          <div className="text-[11px] text-muted-foreground">
            Step {step} of {STEPS.length}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-1.5 px-3 h-10 rounded-md text-[13px] font-medium border border-input hover:bg-muted"
            >
              <Save className="size-3.5" /> Save draft
            </button>
            {step === STEPS.length ? (
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" />} Submit case
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                className="inline-flex items-center gap-1.5 px-5 h-10 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
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
