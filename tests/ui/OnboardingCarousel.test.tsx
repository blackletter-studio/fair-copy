import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { OnboardingCarousel } from "../../src/ui/OnboardingCarousel";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("OnboardingCarousel", () => {
  it("starts on slide 0 with the welcome headline", () => {
    wrap(<OnboardingCarousel onDismiss={vi.fn()} />);
    expect(screen.getByText(/welcome to fair copy/i)).toBeInTheDocument();
    // 'Skip' present on non-last slides; 'Got it' absent
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /got it/i })).not.toBeInTheDocument();
  });

  it("advances through slides via 'Next' and ends on 'Got it'", () => {
    wrap(<OnboardingCarousel onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/three presets, one button/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/find it again in your ribbon/i)).toBeInTheDocument();
    // Last slide: 'Got it' present, 'Skip' gone
    expect(screen.getByRole("button", { name: /got it/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
  });

  it("calls onDismiss when Skip is clicked on slide 0", () => {
    const onDismiss = vi.fn();
    wrap(<OnboardingCarousel onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when 'Got it' is clicked on slide 2", () => {
    const onDismiss = vi.fn();
    wrap(<OnboardingCarousel onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
