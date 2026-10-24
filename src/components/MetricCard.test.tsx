// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Activity } from "lucide-react";
import { MetricCard } from "./MetricCard";

afterEach(cleanup);

describe("MetricCard", () => {
  const base = {
    label: "Active cases",
    value: "42",
    tone: "alert" as const,
    icon: Activity,
    spark: [1, 2, 3, 4],
  };

  it("renders the label and value", () => {
    render(<MetricCard {...base} delta={5} />);
    expect(screen.getByText("Active cases")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows a New badge when there is no prior baseline", () => {
    render(<MetricCard {...base} delta={null} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("shows a flat 0% delta when both windows are empty", () => {
    render(<MetricCard {...base} delta={0} />);
    expect(screen.getByText(/0% 30d/)).toBeInTheDocument();
  });

  it("shows the magnitude for a real delta", () => {
    render(<MetricCard {...base} delta={12} />);
    expect(screen.getByText(/12% 30d/)).toBeInTheDocument();
  });
});
