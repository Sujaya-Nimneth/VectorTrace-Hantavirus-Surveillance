// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const NOW = new Date("2026-10-24T12:00:00Z").getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const CASES = [
  {
    id: "HC-1",
    region: "Pampeana",
    lat: -36.62,
    lng: -64.29,
    date: daysAgo(2),
    syndrome: "HPS" as const,
    status: "Confirmed" as const,
    age: 40,
    sex: "M" as const,
    symptoms: [],
    exposure: null,
  },
  {
    id: "HC-2",
    region: "Pampeana",
    lat: -36.62,
    lng: -64.29,
    date: daysAgo(4),
    syndrome: "HPS" as const,
    status: "Suspected" as const,
    age: 30,
    sex: "F" as const,
    symptoms: [],
    exposure: null,
  },
  {
    id: "HC-3",
    region: "Cuyo",
    lat: -32.89,
    lng: -68.84,
    date: daysAgo(3),
    syndrome: "HPS" as const,
    status: "Confirmed" as const,
    age: 50,
    sex: null,
    symptoms: [],
    exposure: null,
  },
  {
    id: "HC-4",
    region: "Cuyo",
    lat: -32.89,
    lng: -68.84,
    date: daysAgo(1),
    syndrome: "HPS" as const,
    status: "Pending" as const,
    age: null,
    sex: null,
    symptoms: [],
    exposure: null,
  },
  {
    id: "HC-5",
    region: "Pampeana",
    lat: -36.62,
    lng: -64.29,
    date: daysAgo(6),
    syndrome: "HPS" as const,
    status: "Confirmed" as const,
    age: 22,
    sex: "M" as const,
    symptoms: [],
    exposure: null,
  },
];

vi.mock("@/hooks/use-surveillance", () => ({
  useCases: () => ({ data: CASES, loading: false, error: null, refetch: vi.fn() }),
}));

vi.mock("@/hooks/use-now", () => ({
  useNow: () => NOW,
}));

import { RiskTable } from "./RiskTable";

afterEach(cleanup);

function tableRows() {
  const tbody = document.querySelector("tbody");
  if (!tbody) throw new Error("no table body");
  return within(tbody);
}

function rowFor(region: string) {
  const row = tableRows().getByText(region).closest("tr");
  if (!row) throw new Error(`no row for ${region}`);
  return within(row);
}

describe("RiskTable", () => {
  it("renders every region with its case counts", () => {
    render(<RiskTable />);
    expect(tableRows().getByText("Pampeana")).toBeInTheDocument();
    expect(tableRows().getByText("Cuyo")).toBeInTheDocument();
    expect(rowFor("Pampeana").getAllByText("2").length).toBeGreaterThan(0);
  });

  it("sorts by a clicked column and toggles direction", async () => {
    const user = userEvent.setup();
    render(<RiskTable />);

    const casesHeader = screen.getByRole("button", { name: /Cases/ });
    await user.click(casesHeader); // descending: Pampeana has the most cases
    expect(document.querySelector("tbody tr td")?.textContent).toContain("Pampeana");

    await user.click(casesHeader); // ascending: a zero-case region leads
    expect(document.querySelector("tbody tr td")?.textContent).toContain("Patagonia Norte");
  });

  it("filters rows by region", async () => {
    const user = userEvent.setup();
    render(<RiskTable />);

    await user.selectOptions(screen.getByRole("combobox"), "Cuyo");
    expect(tableRows().queryByText("Pampeana")).not.toBeInTheDocument();
    expect(tableRows().getByText("Cuyo")).toBeInTheDocument();
  });

  it("exposes a CSV export button", () => {
    render(<RiskTable />);
    expect(screen.getByRole("button", { name: /csv/i })).toBeInTheDocument();
  });
});
