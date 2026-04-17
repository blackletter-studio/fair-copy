import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { PresetDropdown } from "../../src/ui/PresetDropdown";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("PresetDropdown", () => {
  it("renders with the given preset displayed in the collapsed trigger", () => {
    wrap(<PresetDropdown value="standard" onChange={vi.fn()} />);
    // Collapsed value visible
    expect(screen.getByRole("combobox")).toHaveValue("Standard");
  });

  it("fires onChange with the clicked option's preset key", () => {
    const onChange = vi.fn();
    wrap(<PresetDropdown value="standard" onChange={onChange} />);
    // Open the dropdown
    fireEvent.click(screen.getByRole("combobox"));
    // Click the Aggressive option (there may be more than one match if Fluent
    // renders phantom nodes, so use getAllByText)
    const options = screen.getAllByText("Aggressive");
    fireEvent.click(options[0]!);
    expect(onChange).toHaveBeenCalledWith("aggressive");
  });
});
