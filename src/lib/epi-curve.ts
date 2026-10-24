import type { Case } from "@/lib/mock-data";

export type BucketRow = {
  date: string;
  trend?: number;
  [region: string]: string | number | undefined;
};

export const DAY_MS = 86_400_000;

const bucketKey = (now: Date, offsetDays: number): string => {
  const d = new Date(now);
  d.setDate(d.getDate() - offsetDays);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

/**
 * Buckets cases into day windows for the epidemic curve.
 * Bucket offsets are generated with the same `floor(age / step) * step`
 * formula used to assign cases, so every window in range is reachable.
 */
export function buildEpidemicCurveBuckets(
  cases: Pick<Case, "date" | "region">[],
  days: 7 | 30 | 90,
  regionNames: string[],
  now: Date = new Date(),
): BucketRow[] {
  const step = days === 90 ? 3 : 1;
  const maxOffset = days - 1;
  const buckets: Record<string, BucketRow> = {};

  for (let i = maxOffset - (maxOffset % step); i >= 0; i -= step) {
    const key = bucketKey(now, i);
    const row: BucketRow = { date: key };
    for (const region of regionNames) {
      row[region] = 0;
    }
    buckets[key] = row;
  }

  for (const c of cases) {
    const cd = new Date(c.date);
    const ageDays = Math.floor((+now - +cd) / DAY_MS);
    if (ageDays < 0 || ageDays > maxOffset) continue;
    const bucketOffset = Math.floor(ageDays / step) * step;
    const row = buckets[bucketKey(now, bucketOffset)];
    if (row) {
      row[c.region] = Number(row[c.region] || 0) + 1;
    }
  }

  const arr = Object.values(buckets);
  arr.forEach((row, idx) => {
    const slice = arr.slice(Math.max(0, idx - 2), idx + 1);
    const avg =
      slice.reduce(
        (sum, r) => sum + regionNames.reduce((acc, reg) => acc + Number(r[reg] || 0), 0),
        0,
      ) / slice.length;
    row.trend = +avg.toFixed(1);
  });
  return arr;
}
