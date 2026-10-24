import { z } from "zod";
import { REGIONS } from "@/lib/mock-data";
import { SYMPTOMS } from "@/lib/intake-data";

const REGION_NAMES = REGIONS.map((r) => r.name) as [string, ...string[]];
const SYMPTOM_KEYS = SYMPTOMS.map((s) => s.k) as [string, ...string[]];

export type IntakeForm = {
  age: string;
  sex: "M" | "F" | "";
  region: string;
  lat: string;
  lng: string;
  syndrome: "HPS" | "HFRS";
  status: "Pending" | "Suspected" | "Confirmed";
  symptoms: string[];
  onsetDate: string;
  exposure: string;
};

export const DEFAULT_INTAKE_FORM: IntakeForm = {
  age: "",
  sex: "",
  region: REGIONS[0].name,
  lat: String(REGIONS[0].lat),
  lng: String(REGIONS[0].lng),
  syndrome: "HPS",
  status: "Pending",
  symptoms: ["fever", "myalgia"],
  onsetDate: "",
  exposure: "",
};

export const intakeSchema = z.object({
  age: z
    .string()
    .refine(
      (v) => v.trim() === "" || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 120),
      "Age must be a whole number between 0 and 120",
    ),
  sex: z.enum(["M", "F", ""]),
  region: z.enum(REGION_NAMES, { message: "Region must be one of the known surveillance regions" }),
  lat: z.string().refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= -90 && n <= 90;
  }, "Latitude must be between -90 and 90"),
  lng: z.string().refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= -180 && n <= 180;
  }, "Longitude must be between -180 and 180"),
  syndrome: z.enum(["HPS", "HFRS"]),
  status: z.enum(["Pending", "Suspected", "Confirmed"]),
  symptoms: z.array(z.enum(SYMPTOM_KEYS)).max(SYMPTOM_KEYS.length),
  onsetDate: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), "Invalid onset date")
    .refine(
      (v) => v === "" || new Date(v).getTime() <= Date.now(),
      "Onset date cannot be in the future",
    ),
  exposure: z.string().max(2000, "Exposure notes are limited to 2000 characters"),
});
