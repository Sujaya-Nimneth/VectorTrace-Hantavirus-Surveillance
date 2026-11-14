import { useSyncExternalStore } from "react";
import { isDiseaseSlug, type DiseaseSlug } from "@/lib/diseases";

export type DiseaseFilter = "all" | DiseaseSlug;

let currentDisease: DiseaseFilter = "all";
const listeners = new Set<() => void>();

export function setGlobalDiseaseFilter(next: DiseaseFilter) {
  if (currentDisease === next) return;
  currentDisease = next;
  for (const listener of listeners) listener();
}

export function setGlobalDiseaseFromParam(param: string | undefined | null) {
  if (!param || param === "all") {
    setGlobalDiseaseFilter("all");
  } else if (isDiseaseSlug(param)) {
    setGlobalDiseaseFilter(param);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DiseaseFilter {
  return currentDisease;
}

function getServerSnapshot(): DiseaseFilter {
  return "all";
}

export function useDiseaseFilter() {
  const disease = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    disease,
    setDisease: setGlobalDiseaseFilter,
  };
}
