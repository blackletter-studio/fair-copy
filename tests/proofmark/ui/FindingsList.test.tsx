import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { FindingsList } from "../../../src/proofmark/ui/FindingsList";
import type { Finding } from "../../../src/proofmark/engine/types";

function makeFinding(overrides: Partial<Finding>): Finding {
  return {
    id: "f-default",
    checkName: "straight-quotes",
    region: "document",
    range: { id: "para-0", kind: "paragraph" },
    excerpt: "excerpt text",
    severity: "info",
    confidence: "high",
    message: "message",
    ...overrides,
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("FindingsList", () => {
  it("renders a group header per region", () => {
    const findings = [
      makeFinding({ id: "a", region: "document", checkName: "straight-quotes" }),
      makeFinding({ id: "b", region: "recitals", checkName: "straight-quotes" }),
    ];
    renderWithTheme(
      <FindingsList
        findings={findings}
        appliedIds={new Set()}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    expect(screen.getByText(/document/i)).toBeInTheDocument();
    expect(screen.getByText(/recitals/i)).toBeInTheDocument();
  });

  it("renders all findings when under the virtualization cap", () => {
    const findings = Array.from({ length: 5 }, (_, i) =>
      makeFinding({ id: `f-${i}`, excerpt: `excerpt-${i}` }),
    );
    renderWithTheme(
      <FindingsList
        findings={findings}
        appliedIds={new Set()}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`excerpt-${i}`)).toBeInTheDocument();
    }
  });

  it("caps rendered cards at 100 when the list is huge", () => {
    const findings = Array.from({ length: 200 }, (_, i) =>
      makeFinding({ id: `f-${i}`, excerpt: `e-${i}` }),
    );
    renderWithTheme(
      <FindingsList
        findings={findings}
        appliedIds={new Set()}
        onApply={() => {}}
        onDismiss={() => {}}
        onScrollTo={() => {}}
      />,
    );
    expect(screen.queryByText("e-150")).toBeNull();
    expect(screen.getByText(/showing 100 of 200/i)).toBeInTheDocument();
  });
});
