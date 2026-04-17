import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { PresetComparisonExpander } from "../../src/ui/PresetComparisonExpander";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("PresetComparisonExpander", () => {
  it("starts collapsed — no comparison table rendered", () => {
    wrap(<PresetComparisonExpander />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("expands the comparison table when the link is clicked", () => {
    wrap(<PresetComparisonExpander />);
    fireEvent.click(screen.getByRole("button", { name: /what.*difference/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows all three preset rows when expanded", () => {
    wrap(<PresetComparisonExpander />);
    fireEvent.click(screen.getByRole("button", { name: /what.*difference/i }));
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Conservative")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();
  });
});
