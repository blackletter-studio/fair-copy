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

const spellingFinding: Finding = {
  id: "spell-1",
  checkName: "spelling",
  region: "document",
  range: { id: "spell-0-4-7", kind: "run" },
  excerpt: "The wittnes testified.",
  severity: "info",
  confidence: "medium",
  message: "Unknown word. Suggestions: witness.",
  suggestedText: "witness",
  metadata: { word: "wittnes", offset: 4, suggestions: ["witness"], legalConfusion: null },
};

describe("FindingCard — spelling-specific behaviour", () => {
  it("shows 'Add to dictionary' button for spelling findings when onAddToDictionary is provided", () => {
    renderWithTheme(
      <FindingCard
        finding={spellingFinding}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
        onAddToDictionary={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /add to dictionary/i })).toBeInTheDocument();
  });

  it("does NOT show 'Add to dictionary' button when onAddToDictionary is not provided", () => {
    renderWithTheme(
      <FindingCard
        finding={spellingFinding}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /add to dictionary/i })).toBeNull();
  });

  it("does NOT show 'Add to dictionary' button for non-spelling findings even when handler provided", () => {
    renderWithTheme(
      <FindingCard
        finding={finding}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
        onAddToDictionary={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /add to dictionary/i })).toBeNull();
  });

  it("fires onAddToDictionary with the finding when button is clicked", () => {
    const onAddToDictionary = vi.fn();
    renderWithTheme(
      <FindingCard
        finding={spellingFinding}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
        onAddToDictionary={onAddToDictionary}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add to dictionary/i }));
    expect(onAddToDictionary).toHaveBeenCalledWith(spellingFinding);
  });
});
