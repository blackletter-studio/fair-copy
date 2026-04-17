import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { RegionBar } from "../../../src/proofmark/ui/RegionBar";
import type { Region } from "../../../src/proofmark/engine/types";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

const regions: Region[] = [
  {
    name: "recitals",
    range: [{ id: "p1", kind: "paragraph" }],
    confidence: "high",
    confirmed: false,
  },
  {
    name: "definitions",
    range: [{ id: "p2", kind: "paragraph" }],
    confidence: "medium",
    confirmed: false,
  },
];

describe("RegionBar", () => {
  it("renders a chip per region with its count", () => {
    renderWithTheme(
      <RegionBar
        regions={regions}
        onConfirm={() => {}}
        onDismiss={() => {}}
        onConfirmAll={() => {}}
      />,
    );
    expect(screen.getByText(/recitals \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/definitions \(1\)/i)).toBeInTheDocument();
  });

  it("fires onConfirm with the region name", () => {
    const onConfirm = vi.fn();
    renderWithTheme(
      <RegionBar
        regions={regions}
        onConfirm={onConfirm}
        onDismiss={() => {}}
        onConfirmAll={() => {}}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /confirm$/i })[0]!);
    expect(onConfirm).toHaveBeenCalledWith("recitals");
  });

  it("fires onConfirmAll for the batch button", () => {
    const onConfirmAll = vi.fn();
    renderWithTheme(
      <RegionBar
        regions={regions}
        onConfirm={() => {}}
        onDismiss={() => {}}
        onConfirmAll={onConfirmAll}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /confirm all/i }));
    expect(onConfirmAll).toHaveBeenCalled();
  });

  it("renders nothing when regions is empty", () => {
    const { container } = render(
      <RegionBar regions={[]} onConfirm={() => {}} onDismiss={() => {}} onConfirmAll={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
