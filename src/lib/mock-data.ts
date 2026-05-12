export type Case = {
  id: string; region: string; lat: number; lng: number;
  date: string; syndrome: "HPS" | "HFRS";
  status: "Confirmed" | "Suspected" | "Pending"; age: number; sex: "M" | "F";
};
export type RodentSite = {
  id: string; region: string; lat: number; lng: number;
  date: string; positivity: number; species: string;
};
export type Alert = {
  id: string; ts: string; level: "critical" | "warning" | "info";
  title: string; region: string;
};

export const REGIONS = [
  { name: "Patagonia Norte", lat: -41.13, lng: -71.31, pop: 638645 },
  { name: "Cuyo", lat: -32.89, lng: -68.84, pop: 1738929 },
  { name: "NOA", lat: -24.79, lng: -65.41, pop: 1333365 },
  { name: "Pampeana", lat: -36.62, lng: -64.29, pop: 316940 },
  { name: "NEA", lat: -27.45, lng: -58.99, pop: 1055259 },
  { name: "Centro", lat: -31.42, lng: -64.18, pop: 3760450 },
];
