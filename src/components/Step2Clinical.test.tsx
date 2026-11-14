// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Step2Clinical } from "./Step2Clinical";

describe("Step2Clinical", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders syndromes and symptoms specific to the selected pathogen", () => {
    const onChange = vi.fn();
    render(
      <Step2Clinical
        diseaseSlug="dengue"
        syndrome="DF"
        symptoms={["fever"]}
        onsetDate=""
        onChange={onChange}
      />,
    );

    expect(screen.getByText("DENV — Severe")).toBeInTheDocument();
    expect(screen.getByText("Retro-orbital pain")).toBeInTheDocument();
    expect(screen.queryByText("Watery diarrhea")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Retro-orbital pain" }));
    expect(onChange).toHaveBeenCalledWith({ symptoms: ["fever", "retro_orbital"] });
  });
});
