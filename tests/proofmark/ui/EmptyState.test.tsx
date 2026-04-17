import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { EmptyState } from "../../../src/proofmark/ui/EmptyState";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("EmptyState", () => {
  it("renders the 'no findings' message", () => {
    renderWithTheme(<EmptyState />);
    expect(screen.getByText(/no findings/i)).toBeInTheDocument();
  });

  it("includes the 'human reader is still the authority' caveat", () => {
    renderWithTheme(<EmptyState />);
    expect(screen.getByText(/human reader/i)).toBeInTheDocument();
  });
});
