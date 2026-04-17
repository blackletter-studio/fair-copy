import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { CounterCard } from "../../src/ui/CounterCard";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("CounterCard", () => {
  it("renders 5 segments by default when unlicensed", () => {
    wrap(<CounterCard used={2} />);
    const segments = screen.getAllByTestId("counter-segment");
    expect(segments).toHaveLength(5);
    // First 2 filled, last 3 empty
    expect(segments.filter((s) => s.getAttribute("data-filled") === "true")).toHaveLength(2);
    expect(segments.filter((s) => s.getAttribute("data-filled") === "false")).toHaveLength(3);
  });

  it("renders 'Licensed — unlimited cleans' when licensed", () => {
    wrap(<CounterCard used={0} isLicensed={true} />);
    expect(screen.getByText(/licensed.*unlimited cleans/i)).toBeInTheDocument();
    // No segments when licensed
    expect(screen.queryAllByTestId("counter-segment")).toHaveLength(0);
  });

  it("exposes the remaining count via aria-label for tooltip fallback", () => {
    wrap(<CounterCard used={3} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-label", "2 of 5 free cleans remaining");
  });
});
