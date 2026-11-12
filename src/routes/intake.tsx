import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldAlert, UserCheck } from "lucide-react";

import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { Stepper, Step } from "@astryxdesign/core/Stepper";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Grid } from "@astryxdesign/core/Grid";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Divider } from "@astryxdesign/core/Divider";

import { REGIONS, type Case } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { SYMPTOMS } from "@/lib/intake-data";
import { DEFAULT_INTAKE_FORM, intakeSchema, type IntakeForm } from "@/lib/intake-schema";
import { Step2Clinical } from "@/components/Step2Clinical";
import { QueryError } from "@/components/QueryError";
import { requireAuth } from "@/lib/auth-gate";
import { GateCard } from "@/components/GateCard";

export const Route = createFileRoute("/intake")({
  component: Intake,
  beforeLoad: async ({ location }) => requireAuth(location.href),
  head: () => ({ meta: [{ title: "Case Intake · VectorTrace" }] }),
});

const STEPS = [
  { n: 1, label: "Demographics" },
  { n: 2, label: "Clinical" },
  { n: 3, label: "Exposure" },
  { n: 4, label: "Review" },
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

  const [form, setForm] = useState<IntakeForm>(() => {
    if (typeof window === "undefined") return DEFAULT_INTAKE_FORM;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) return { ...DEFAULT_INTAKE_FORM, ...(JSON.parse(saved) as Partial<IntakeForm>) };
    } catch {
      // Malformed draft JSON — ignore and use default.
    }
    return DEFAULT_INTAKE_FORM;
  });

  const [draftRestored, setDraftRestored] = useState(() => {
    try {
      return !!localStorage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      return false;
    }
  });

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

  if (loading || rolesLoading) {
    return (
      <Layout padding={6} contentWidth={720} height="auto">
        <VStack gap={4}>
          <Skeleton width="45%" height={32} />
          <Skeleton width="100%" height={320} />
        </VStack>
      </Layout>
    );
  }

  if (!user) {
    return (
      <GateCard
        icon={UserCheck}
        title="Sign in required"
        body="Authenticated clinician or epidemiologist credentials are required to submit case notifications."
        action={{ to: "/login", label: "Go to sign in", primary: true }}
      />
    );
  }

  if (rolesError) {
    return (
      <Layout padding={6} contentWidth={720} height="auto">
        <QueryError what="your roles" error={rolesError} onRetry={() => window.location.reload()} />
      </Layout>
    );
  }

  if (!isClinician) {
    return (
      <GateCard
        icon={ShieldAlert}
        title="Clinician role required"
        body="Your account currently holds viewer access only. Contact a surveillance administrator to request field intake permissions."
        action={{ to: "/dashboard", label: "Back to dashboard" }}
      />
    );
  }

  const upd = <K extends keyof IntakeForm>(k: K, v: IntakeForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const setRegion = (regionName: string) => {
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
    const parsed = intakeSchema.safeParse(form);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setErr(firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid entry");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      const case_id = `HTV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
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
        date: reportedAt.slice(0, 10),
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
      void navigate({ to: "/dashboard" });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const symptomLabels = form.symptoms
    .map((k) => SYMPTOMS.find((s) => s.k === k)?.label ?? k)
    .join(", ");

  return (
    <Layout padding={6} contentWidth={720} height="auto">
      <LayoutHeader hasDivider>
        <VStack gap={1} paddingBlockEnd={4}>
          <Heading level={1}>Rapid Case Intake</Heading>
          <Text type="supporting">
            Submit a new hantavirus epidemiological case notification directly into the live
            registry.
          </Text>
        </VStack>
      </LayoutHeader>

      <LayoutContent>
        <VStack gap={5}>
          {draftRestored && (
            <Banner
              status="info"
              title="Saved draft restored from this browser"
              description="Review the prefilled fields below or discard to start a fresh notification."
              endContent={
                <Button
                  label="Discard draft"
                  variant="secondary"
                  size="sm"
                  onClick={discardDraft}
                />
              }
            />
          )}

          <Stepper
            label="Case intake progress"
            activeStep={step - 1}
            onStepClick={(idx) => setStep(idx + 1)}
          >
            {STEPS.map((s) => (
              <Step key={s.n} step={s.n - 1} label={s.label} />
            ))}
          </Stepper>

          <Card padding={6}>
            <VStack gap={5}>
              {step === 1 && (
                <FormLayout>
                  <NumberInput
                    label="Patient age"
                    isOptional
                    min={0}
                    max={120}
                    placeholder="Years"
                    value={form.age.trim() === "" ? null : Number(form.age)}
                    onChange={(val) =>
                      upd("age", val == null || Number.isNaN(val) ? "" : String(val))
                    }
                  />

                  <RadioList
                    label="Patient sex"
                    isOptional
                    orientation="horizontal"
                    value={form.sex}
                    onChange={(val) => upd("sex", val as "M" | "F")}
                  >
                    <RadioListItem value="M" label="Male (M)" />
                    <RadioListItem value="F" label="Female (F)" />
                  </RadioList>

                  <Selector
                    label="Reporting region"
                    isRequired
                    options={REGIONS.map((r) => ({ value: r.name, label: r.name }))}
                    value={form.region}
                    onChange={setRegion}
                  />

                  <Grid columns={{ minWidth: 180, max: 2, repeat: "fit" }} gap={3}>
                    <TextInput
                      label="Latitude"
                      isRequired
                      value={form.lat}
                      onChange={(val) => upd("lat", val)}
                    />
                    <TextInput
                      label="Longitude"
                      isRequired
                      value={form.lng}
                      onChange={(val) => upd("lng", val)}
                    />
                  </Grid>
                </FormLayout>
              )}

              {step === 2 && (
                <Step2Clinical
                  syndrome={form.syndrome}
                  symptoms={form.symptoms}
                  onsetDate={form.onsetDate}
                  onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                />
              )}

              {step === 3 && (
                <FormLayout>
                  <TextArea
                    label="Suspected exposure"
                    isOptional
                    rows={4}
                    placeholder="Rural lodging, rodent contact, agricultural site, etc."
                    value={form.exposure}
                    onChange={(val) => upd("exposure", val)}
                  />

                  <RadioList
                    label="Lab classification status"
                    orientation="horizontal"
                    value={form.status}
                    onChange={(val) => upd("status", val as IntakeForm["status"])}
                  >
                    <RadioListItem value="Suspected" label="Suspected" />
                    <RadioListItem value="Pending" label="Pending" />
                    <RadioListItem value="Confirmed" label="Confirmed" />
                  </RadioList>
                </FormLayout>
              )}

              {step === 4 && (
                <VStack gap={4}>
                  <MetadataList columns={2} title="Review case notification">
                    <MetadataListItem label="Patient age">
                      {form.age ? `${form.age} years` : "Not recorded"}
                    </MetadataListItem>
                    <MetadataListItem label="Sex">{form.sex || "Not recorded"}</MetadataListItem>
                    <MetadataListItem label="Region">{form.region}</MetadataListItem>
                    <MetadataListItem label="Coordinates">
                      {form.lat}, {form.lng}
                    </MetadataListItem>
                    <MetadataListItem label="Syndrome">{form.syndrome}</MetadataListItem>
                    <MetadataListItem label="Symptom onset">
                      {form.onsetDate || "Today"}
                    </MetadataListItem>
                    <MetadataListItem label="Lab status">{form.status}</MetadataListItem>
                    <MetadataListItem label="Symptoms">{symptomLabels || "None"}</MetadataListItem>
                    <MetadataListItem label="Exposure notes">
                      {form.exposure || "None recorded"}
                    </MetadataListItem>
                  </MetadataList>

                  {err && (
                    <Banner
                      status="error"
                      title="Validation or submission error"
                      description={err}
                    />
                  )}
                </VStack>
              )}

              <Divider />

              <HStack justify="between" align="center" gap={3} wrap="wrap">
                <Button
                  label="Back"
                  variant="secondary"
                  isDisabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                />

                <HStack gap={2} align="center">
                  <Button label="Save draft" variant="ghost" onClick={saveDraft} />
                  {step < 4 ? (
                    <Button
                      label="Continue"
                      variant="primary"
                      onClick={() => setStep((s) => Math.min(4, s + 1))}
                    />
                  ) : (
                    <Button
                      label="Submit notification"
                      variant="primary"
                      isLoading={busy}
                      onClick={() => {
                        void submit();
                      }}
                    />
                  )}
                </HStack>
              </HStack>
            </VStack>
          </Card>
        </VStack>
      </LayoutContent>
    </Layout>
  );
}
