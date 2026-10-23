import { z } from "zod";
import { REGIONS } from "@/lib/mock-data";

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
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 120),
      "Age must be a whole number between 0 and 120",
    ),
  sex: z.enum(["M", "F", ""]),
  region: z.string().min(1, "Region is required"),
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
  symptoms: z.array(z.string()),
  onsetDate: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), "Invalid onset date"),
  exposure: z.string(),
});
