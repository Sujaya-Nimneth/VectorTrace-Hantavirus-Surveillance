type EnvLike = Record<string, string | undefined>;

function viteEnv(): EnvLike {
  return (import.meta as unknown as { env?: EnvLike }).env ?? {};
}

function serverEnv(): EnvLike {
  return typeof process !== "undefined" && process.env ? (process.env as EnvLike) : {};
}

export type DemoModeEnv = {
  VITE_DEMO_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
};

/**
 * Demo mode serves the bundled mock dataset instead of querying Supabase.
 * Enabled explicitly via VITE_DEMO_MODE=true, or implicitly when Supabase
 * credentials are not configured (so the app still renders without a backend).
 */
export function computeDemoMode(env: DemoModeEnv): boolean {
  if (env.VITE_DEMO_MODE === "true") return true;
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  return !url || !key;
}

export function isDemoMode(): boolean {
  return computeDemoMode({ ...viteEnv(), ...serverEnv() });
}
