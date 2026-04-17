import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { AdvancedPanel } from "../../src/ui/AdvancedPanel";
import { PRESETS } from "../../src/engine/presets";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("AdvancedPanel", () => {
  it("starts collapsed — no rule rows visible", () => {
    wrap(
      <AdvancedPanel
        preset={PRESETS.standard}
        overrides={{}}
        onOverrideChange={vi.fn()}
        theme="editorial"
        onThemeChange={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("rule-row-font-face")).not.toBeInTheDocument();
  });

  it("reveals the 5 category headings when the Advanced accordion opens", () => {
    wrap(
      <AdvancedPanel
        preset={PRESETS.standard}
        overrides={{}}
        onOverrideChange={vi.fn()}
        theme="editorial"
        onThemeChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /advanced settings/i }));
    expect(screen.getByRole("button", { name: /visual/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /emphasis/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /spacing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /structure/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /strip/i })).toBeInTheDocument();
  });

  it("fires onOverrideChange when a rule's dropdown value is picked", () => {
    const onOverrideChange = vi.fn();
    wrap(
      <AdvancedPanel
        preset={PRESETS.standard}
        overrides={{}}
        onOverrideChange={onOverrideChange}
        theme="editorial"
        onThemeChange={vi.fn()}
      />,
    );
    // Open Advanced, then Visual
    fireEvent.click(screen.getByRole("button", { name: /advanced settings/i }));
    fireEvent.click(screen.getByRole("button", { name: /^visual/i }));
    // Open the highlighting dropdown and pick "Keep highlights"
    const dropdown = screen.getByLabelText(/highlighting mode/i);
    fireEvent.click(dropdown);
    const keepOption = screen.getAllByText("Keep highlights")[0]!;
    fireEvent.click(keepOption);
    expect(onOverrideChange).toHaveBeenCalledWith(
      "highlighting",
      expect.objectContaining({ mode: "keep" }),
    );
  });
});
