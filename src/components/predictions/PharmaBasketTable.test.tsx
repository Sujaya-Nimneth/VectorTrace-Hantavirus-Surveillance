// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PharmaBasketTable } from "./PharmaBasketTable";
import type { TickerSignalSummary } from "@/lib/mock-data";

const SAMPLE_TICKERS: TickerSignalSummary[] = [
  {
    ticker: "TAK",
    companyName: "Takeda Pharmaceutical",
    exchange: "NYSE",
    sectorRole: "vaccine",
    isPurePlay: false,
    weight: 0.3,
    leadRole: "Qdenga vaccine",
    rationale: "Primary dengue vaccine supplier.",
    lastPrice: 15.82,
    return7d: 0.094,
    car7d: 0.081,
    volumeZScore: 2.34,
    signalLabel: "Outbreak Accumulation",
  },
  {
    ticker: "ABT",
    companyName: "Abbott Laboratories",
    exchange: "NYSE",
    sectorRole: "diagnostics",
    isPurePlay: false,
    weight: 0.2,
    leadRole: "Panbio NS1 rapid tests",
    rationale: "Diagnostic antigen procurement.",
    lastPrice: 118.4,
    return7d: 0.045,
    car7d: 0.032,
    volumeZScore: 1.45,
    signalLabel: "Supply Stress",
  },
];

describe("PharmaBasketTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders ticker rows with market-neutral alpha and filters by role", () => {
    render(
      <PharmaBasketTable
        diseaseSlug="dengue"
        diseaseName="Dengue Fever"
        tickers={SAMPLE_TICKERS}
      />,
    );

    expect(screen.getByText("Dengue Fever Pharma & Diagnostics Basket")).toBeInTheDocument();
    expect(screen.getByText("TAK")).toBeInTheDocument();
    expect(screen.getByText("ABT")).toBeInTheDocument();
    expect(screen.getByText("+8.1%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Diagnostics" }));
    expect(screen.queryByText("TAK")).not.toBeInTheDocument();
    expect(screen.getByText("ABT")).toBeInTheDocument();
  });
});
