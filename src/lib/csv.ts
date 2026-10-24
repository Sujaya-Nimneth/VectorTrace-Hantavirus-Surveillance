/** Escape one CSV field and join rows into a RFC 4180-style document. */
function toCsv(fields: (string | number | null | undefined)[]): string {
  return fields
    .map((f) => {
      const v = f == null ? "" : String(f);
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    })
    .join(",");
}

export function buildCsv(
  header: (string | number)[],
  rows: (string | number | null | undefined)[][],
): string {
  return [toCsv(header), ...rows.map(toCsv)].join("\r\n");
}

/** Trigger a client-side download of the given content as a CSV file. */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
