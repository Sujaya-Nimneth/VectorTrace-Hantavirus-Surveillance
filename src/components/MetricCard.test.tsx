// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders value, label, and formatted delta without synthetic sparklines", () => {
    render(<MetricCard label="Active cases" value="24" delta={12} tone="alert" />);

    expect(screen.getByText("Active cases")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("+12% 30d")).toBeInTheDocument();
  });

  it("renders New when no prior baseline exists", () => {
    render(<MetricCard label="Pending labs" value="3" delta={null} tone="warning" />);

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("formats zero delta cleanly", () => {
    render(<MetricCard label="Rodent index" value="18.4%" delta={0} tone="teal" />);

    expect(screen.getByText("0% 30d")).toBeInTheDocument();
  });
});
