import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { ToolTabs } from "../../src/ui/ToolTabs";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("ToolTabs", () => {
  it("renders both Fair Copy and Proofmark tabs with coming-soon badge", () => {
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={vi.fn()} />);
    expect(screen.getByRole("tab", { name: /fair copy/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /proofmark/i })).toBeInTheDocument();
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
  });

  it("fires onSelectTool('fair-copy') when the Fair Copy tab is clicked", () => {
    const onSelect = vi.fn();
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={onSelect} />);
    fireEvent.click(screen.getByRole("tab", { name: /fair copy/i }));
    expect(onSelect).toHaveBeenCalledWith("fair-copy");
  });

  it("marks the Proofmark tab as disabled", () => {
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={vi.fn()} />);
    const proofTab = screen.getByRole("tab", { name: /proofmark/i });
    expect(proofTab).toHaveAttribute("aria-disabled", "true");
  });
});
