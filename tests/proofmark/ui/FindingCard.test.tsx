import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { FindingCard } from "../../../src/proofmark/ui/FindingCard";
import type { Finding } from "../../../src/proofmark/engine/types";

const finding: Finding = {
  id: "f1",
  checkName: "straight-quotes",
  region: "document",
  range: { id: "para-1", kind: "paragraph" },
  excerpt: 'He said "hello" to the court.',
  severity: "info",
  confidence: "high",
  message: "Replace straight quotes.",
  suggestedText: "He said \u201chello\u201d to the court.",
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("FindingCard", () => {
  it("renders the check name, excerpt, and message", () => {
    renderWithTheme(
      <FindingCard
        finding={finding}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    expect(screen.getByText(/straight-quotes/i)).toBeInTheDocument();
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
    expect(screen.getByText(/replace straight quotes/i)).toBeInTheDocument();
  });

  it("fires onApply when Apply is clicked", () => {
    const onApply = vi.fn();
    renderWithTheme(
      <FindingCard
        finding={finding}
        onApply={onApply}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(finding);
  });

  it("fires onDismiss when Dismiss is clicked", () => {
    const onDismiss = vi.fn();
    renderWithTheme(
      <FindingCard
        finding={finding}
        onApply={() => {}}
        onDismiss={onDismiss}
        onScrollTo={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledWith(finding);
  });

  it("fires onScrollTo when excerpt is clicked", () => {
    const onScrollTo = vi.fn();
    renderWithTheme(
      <FindingCard
        finding={finding}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={onScrollTo}
      />,
    );
    fireEvent.click(screen.getByText(/hello/i));
    expect(onScrollTo).toHaveBeenCalledWith(finding);
  });

  it("shows 'Applied' indicator instead of buttons when applied=true", () => {
    renderWithTheme(
      <FindingCard
        finding={finding}
        applied
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    expect(screen.getByText(/applied/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /apply/i })).toBeNull();
  });

  it("hides the Apply button when finding has no suggestedText (advisory-only)", () => {
    const advisoryFinding = { ...finding, suggestedText: undefined };
    renderWithTheme(
      <FindingCard
        finding={advisoryFinding}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /^apply$/i })).toBeNull();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });
});
