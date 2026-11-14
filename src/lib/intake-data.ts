import {
  Thermometer,
  Activity,
  Droplets,
  Wind,
  Eye,
  AlertTriangle,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { getDiseaseProfile, type DiseaseSlug } from "./diseases";

export type SymptomSpec = {
  k: string;
  label: string;
  icon: LucideIcon;
};

export const SYMPTOMS: SymptomSpec[] = [
  { k: "fever", label: "Fever > 38.5°C", icon: Thermometer },
  { k: "myalgia", label: "Myalgia", icon: Activity },
  { k: "cough", label: "Cough / dyspnea", icon: Wind },
  { k: "headache", label: "Headache", icon: Activity },
  { k: "nausea", label: "Nausea / vomiting", icon: Droplets },
  { k: "thrombo", label: "Thrombocytopenia", icon: Droplets },
  { k: "retro_orbital", label: "Retro-orbital pain", icon: Eye },
  { k: "rash", label: "Maculopapular / vesicular rash", icon: AlertTriangle },
  { k: "conjunctivitis", label: "Conjunctivitis", icon: Eye },
  { k: "hypoxia", label: "Hypoxia / ARDS", icon: Wind },
  { k: "lymphadenopathy", label: "Lymphadenopathy", icon: Activity },
  { k: "arthralgia", label: "Severe arthralgia", icon: Activity },
  { k: "watery_diarrhea", label: "Profuse watery diarrhea", icon: Droplets },
  { k: "dehydration", label: "Acute dehydration", icon: AlertTriangle },
  { k: "hypotension", label: "Hypotension / shock", icon: HeartPulse },
];

export function getSymptomsForDisease(diseaseSlug: DiseaseSlug): SymptomSpec[] {
  const allowed = new Set(getDiseaseProfile(diseaseSlug).symptoms);
  return SYMPTOMS.filter((s) => allowed.has(s.k));
}
