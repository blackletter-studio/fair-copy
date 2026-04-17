import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { ToolTabs } from "../../src/ui/ToolTabs";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("ToolTabs", () => {
  it("renders both Fair Copy and Proofmark tabs", () => {
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={vi.fn()} />);
    expect(screen.getByRole("tab", { name: /fair copy/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /proofmark/i })).toBeInTheDocument();
  });

  it("does not render a 'coming soon' badge (M3 enabled Proofmark)", () => {
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={vi.fn()} />);
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  it("fires onSelectTool('fair-copy') when the Fair Copy tab is clicked", () => {
    const onSelect = vi.fn();
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={onSelect} />);
    fireEvent.click(screen.getByRole("tab", { name: /fair copy/i }));
    expect(onSelect).toHaveBeenCalledWith("fair-copy");
  });

  it("fires onSelectTool('proofmark') when the Proofmark tab is clicked", () => {
    const onSelect = vi.fn();
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={onSelect} />);
    fireEvent.click(screen.getByRole("tab", { name: /proofmark/i }));
    expect(onSelect).toHaveBeenCalledWith("proofmark");
  });

  it("does not mark the Proofmark tab as disabled", () => {
    wrap(<ToolTabs activeTool="fair-copy" onSelectTool={vi.fn()} />);
    const proofTab = screen.getByRole("tab", { name: /proofmark/i });
    expect(proofTab).not.toHaveAttribute("aria-disabled", "true");
  });
});
