import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { CleanButton } from "../../src/ui/CleanButton";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("CleanButton", () => {
  it("renders 'Clean document' when idle and fires onClick when clicked", () => {
    const onClick = vi.fn();
    wrap(<CleanButton state="idle" onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /clean document/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders 'Cleaning…' and is disabled while cleaning", () => {
    wrap(<CleanButton state="cleaning" onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /cleaning/i })).toBeDisabled();
  });

  it("renders '✓ Cleaned' in the cleaned state", () => {
    wrap(<CleanButton state="cleaned" onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /cleaned/i })).toBeInTheDocument();
  });

  it("renders 'Upgrade' in the upgrade state", () => {
    wrap(<CleanButton state="upgrade" onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /upgrade/i })).toBeInTheDocument();
  });
});
