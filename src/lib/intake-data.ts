import { Thermometer, Activity, Droplets } from "lucide-react";

export const SYMPTOMS = [
  { k: "fever", label: "Fever > 38.5°C", icon: Thermometer },
  { k: "myalgia", label: "Myalgia", icon: Activity },
  { k: "cough", label: "Cough / dyspnea", icon: Droplets },
  { k: "headache", label: "Headache", icon: Activity },
  { k: "nausea", label: "Nausea / vomiting", icon: Droplets },
  { k: "thrombo", label: "Thrombocytopenia", icon: Droplets },
];
