import type { Case } from "@/lib/mock-data";

export type BucketRow = {
  date: string;
  trend?: number;
  [series: string]: string | number | undefined;
};

export const DAY_MS = 86_400_000;

const bucketKey = (now: Date, offsetDays: number): string => {
  const d = new Date(now);
  d.setDate(d.getDate() - offsetDays);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

/**
 * Core bucketing primitive: assigns each case to a day bucket using a custom
 * series key selector (`region` or `diseaseSlug`) and adds a 3-point moving
 * average `trend` line.
 */
export function buildGroupedCurveBuckets<T extends Pick<Case, "date">>(
  cases: T[],
  days: 7 | 30 | 90,
  seriesKeys: string[],
  selectKey: (item: T) => string,
  now: Date = new Date(),
): BucketRow[] {
  const step = days === 90 ? 3 : 1;
  const maxOffset = days - 1;
  const buckets: Record<string, BucketRow> = {};

  for (let i = maxOffset - (maxOffset % step); i >= 0; i -= step) {
    const key = bucketKey(now, i);
    const row: BucketRow = { date: key };
    for (const series of seriesKeys) {
      row[series] = 0;
    }
    buckets[key] = row;
  }

  for (const c of cases) {
    const cd = new Date(c.date);
    const ageDays = Math.floor((+now - +cd) / DAY_MS);
    if (ageDays < 0 || ageDays > maxOffset) continue;
    const bucketOffset = Math.floor(ageDays / step) * step;
    const row = buckets[bucketKey(now, bucketOffset)];
    const groupKey = selectKey(c);
    if (row && groupKey in row) {
      row[groupKey] = Number(row[groupKey] || 0) + 1;
    }
  }

  const arr = Object.values(buckets);
  arr.forEach((row, idx) => {
    const slice = arr.slice(Math.max(0, idx - 2), idx + 1);
    const avg =
      slice.reduce(
        (sum, r) => sum + seriesKeys.reduce((acc, key) => acc + Number(r[key] || 0), 0),
        0,
      ) / slice.length;
    row.trend = +avg.toFixed(1);
  });
  return arr;
}

/**
 * Buckets cases into day windows grouped by geographic region.
 */
export function buildEpidemicCurveBuckets(
  cases: Pick<Case, "date" | "region">[],
  days: 7 | 30 | 90,
  regionNames: string[],
  now: Date = new Date(),
): BucketRow[] {
  return buildGroupedCurveBuckets(cases, days, regionNames, (c) => c.region, now);
}

/**
 * Buckets cases into day windows grouped by pathogen (`diseaseSlug`).
 */
export function buildPathogenCurveBuckets(
  cases: Pick<Case, "date" | "diseaseSlug">[],
  days: 7 | 30 | 90,
  diseaseSlugs: string[],
  now: Date = new Date(),
): BucketRow[] {
  return buildGroupedCurveBuckets(
    cases,
    days,
    diseaseSlugs,
    (c) => c.diseaseSlug ?? "hantavirus",
    now,
  );
}
