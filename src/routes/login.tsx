import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Activity, Lock, Mail } from "lucide-react";

import { Center } from "@astryxdesign/core/Center";
import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Switch } from "@astryxdesign/core/Switch";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in · VectorTrace" }] }),
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const { redirect: redirectTo } = useSearch({ from: "/login" });

  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";

  useEffect(() => {
    if (user) {
      if (safeRedirect === "/") {
        void navigate({ to: "/dashboard" });
      } else {
        router.history.push(safeRedirect);
      }
    }
  }, [user, navigate, router, safeRedirect]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Center minHeight="100vh" padding={6}>
      <Card width={420} maxWidth="100%" padding={6}>
        <VStack gap={5}>
          <HStack justify="between" align="center">
            <HStack gap={2} align="center">
              <Icon icon={Activity} size="md" color="accent" />
              <Text type="label" weight="semibold">
                VectorTrace
              </Text>
            </HStack>
            <Link href="/" isStandalone={false}>
              Back home
            </Link>
          </HStack>

          <VStack gap={1}>
            <Heading level={1}>
              {mode === "signin" ? "Sign in to console" : "Request operator access"}
            </Heading>
            <Text type="supporting">
              Authorized epidemiologists and surveillance administrators only.
            </Text>
          </VStack>

          <SegmentedControl
            label="Authentication mode"
            layout="fill"
            size="sm"
            value={mode}
            onChange={(val) => {
              setMode(val as "signin" | "signup");
              setErr(null);
            }}
          >
            <SegmentedControlItem value="signin" label="Sign in" />
            <SegmentedControlItem value="signup" label="Request access" />
          </SegmentedControl>

          <form onSubmit={submit}>
            <FormLayout>
              <TextInput
                type="email"
                label="Work email"
                isRequired
                startIcon={Mail}
                autoComplete="email"
                placeholder="epidemiologist@health.gov"
                value={email}
                onChange={setEmail}
              />

              <TextInput
                type={showPassword ? "text" : "password"}
                label="Password"
                isRequired
                startIcon={Lock}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={setPassword}
              />

              <Switch label="Show password" value={showPassword} onChange={setShowPassword} />

              {err && <Banner status="error" title="Authentication failed" description={err} />}

              <Button
                type="submit"
                variant="primary"
                width="100%"
                isLoading={busy}
                label={mode === "signin" ? "Sign in" : "Create account"}
              />
            </FormLayout>
          </form>
        </VStack>
      </Card>
    </Center>
  );
}
