import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { PreviewModeBanner } from "../../src/ui/PreviewModeBanner";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("PreviewModeBanner", () => {
  it("renders the heading, body, and both buttons", () => {
    wrap(<PreviewModeBanner onGetFairCopy={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/five documents cleaned/i)).toBeInTheDocument();
    expect(screen.getByText(/one-time \$49/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get fair copy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /not yet/i })).toBeInTheDocument();
  });

  it("calls onGetFairCopy when the primary CTA is clicked", () => {
    const onGetFairCopy = vi.fn();
    wrap(<PreviewModeBanner onGetFairCopy={onGetFairCopy} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /get fair copy/i }));
    expect(onGetFairCopy).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when 'Not yet' is clicked", () => {
    const onDismiss = vi.fn();
    wrap(<PreviewModeBanner onGetFairCopy={vi.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /not yet/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
