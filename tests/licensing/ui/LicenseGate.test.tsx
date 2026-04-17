import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { LicenseGate } from "../../../src/licensing/ui/LicenseGate";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("LicenseGate", () => {
  it("shows the activation CTA", () => {
    renderWithTheme(<LicenseGate onActivate={() => {}} />);
    expect(screen.getByText(/activate fair copy/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter license code/i })).toBeInTheDocument();
  });

  it("calls onActivate when the CTA is clicked", () => {
    const onActivate = vi.fn();
    renderWithTheme(<LicenseGate onActivate={onActivate} />);
    fireEvent.click(screen.getByRole("button", { name: /enter license code/i }));
    expect(onActivate).toHaveBeenCalled();
  });
});
