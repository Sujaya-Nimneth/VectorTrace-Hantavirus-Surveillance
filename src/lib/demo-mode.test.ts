import { describe, expect, it } from "vitest";
import { computeDemoMode } from "./demo-mode";

const creds = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("computeDemoMode", () => {
  it("defaults to demo mode when no Supabase env is configured", () => {
    expect(computeDemoMode({})).toBe(true);
  });

  it("leaves demo mode when Supabase credentials are present", () => {
    expect(computeDemoMode(creds)).toBe(false);
  });

  it("accepts server-side env names as fallback", () => {
    expect(
      computeDemoMode({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toBe(false);
  });

  it("stays in demo mode with only one of the two credentials", () => {
    expect(computeDemoMode({ VITE_SUPABASE_URL: creds.VITE_SUPABASE_URL })).toBe(true);
    expect(
      computeDemoMode({ VITE_SUPABASE_PUBLISHABLE_KEY: creds.VITE_SUPABASE_PUBLISHABLE_KEY }),
    ).toBe(true);
  });

  it("forces demo mode via VITE_DEMO_MODE even with credentials set", () => {
    expect(computeDemoMode({ ...creds, VITE_DEMO_MODE: "true" })).toBe(true);
  });
});
