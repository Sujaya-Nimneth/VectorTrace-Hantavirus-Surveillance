import { describe, expect, it } from "vitest";
import { intakeSchema, DEFAULT_INTAKE_FORM } from "./intake-schema";

describe("intakeSchema", () => {
  it("accepts the default form", () => {
    expect(intakeSchema.safeParse(DEFAULT_INTAKE_FORM).success).toBe(true);
  });

  it("rejects out-of-range coordinates", () => {
    const res = intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, lat: "123" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Latitude must be between -90 and 90");
    }
  });

  it("rejects fractional or negative ages", () => {
    expect(intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, age: "34.5" }).success).toBe(false);
    expect(intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, age: "-1" }).success).toBe(false);
    expect(intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, age: "121" }).success).toBe(false);
    expect(intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, age: "0" }).success).toBe(true);
  });

  it("rejects malformed onset dates but accepts empty and ISO dates", () => {
    expect(
      intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, onsetDate: "not-a-date" }).success,
    ).toBe(false);
    expect(intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, onsetDate: "" }).success).toBe(true);
    expect(
      intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, onsetDate: "2026-10-01" }).success,
    ).toBe(true);
  });

  it("rejects future onset dates", () => {
    const res = intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, onsetDate: "2999-01-01" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Onset date cannot be in the future");
    }
  });

  it("rejects regions outside the known surveillance regions", () => {
    expect(intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, region: "Atlantis" }).success).toBe(
      false,
    );
  });

  it("rejects symptoms outside the clinical vocabulary", () => {
    expect(
      intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, symptoms: ["fever", "sneezing"] }).success,
    ).toBe(false);
  });

  it("treats whitespace-only age as empty instead of coercing it to 0", () => {
    expect(intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, age: " " }).success).toBe(true);
  });

  it("rejects exposure notes beyond 2000 characters", () => {
    expect(
      intakeSchema.safeParse({ ...DEFAULT_INTAKE_FORM, exposure: "x".repeat(2001) }).success,
    ).toBe(false);
  });
});
