import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { PresetSelector } from "../../../src/proofmark/ui/PresetSelector";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("PresetSelector", () => {
  it("renders Quiet / Standard / Loud", () => {
    renderWithTheme(<PresetSelector value="standard" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /quiet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /standard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /loud/i })).toBeInTheDocument();
  });

  it("fires onChange with the clicked preset name", () => {
    const onChange = vi.fn();
    renderWithTheme(<PresetSelector value="standard" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /loud/i }));
    expect(onChange).toHaveBeenCalledWith("loud");
  });

  it("marks the active preset with aria-pressed=true", () => {
    renderWithTheme(<PresetSelector value="quiet" onChange={() => {}} />);
    const quiet = screen.getByRole("button", { name: /quiet/i });
    expect(quiet.getAttribute("aria-pressed")).toBe("true");
    const loud = screen.getByRole("button", { name: /loud/i });
    expect(loud.getAttribute("aria-pressed")).toBe("false");
  });
});
