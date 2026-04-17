import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { MarkedFinalDialog } from "../../src/ui/MarkedFinalDialog";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("MarkedFinalDialog", () => {
  it("renders each issue derived from document state", () => {
    wrap(
      <MarkedFinalDialog
        open={true}
        state={{
          isMarkedFinal: true,
          isPasswordProtected: false,
          hasActiveComments: true,
          commentCount: 3,
        }}
        onContinue={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/marked Final/i)).toBeInTheDocument();
    expect(screen.getByText(/3 active comments/i)).toBeInTheDocument();
  });

  it("calls onContinue when Continue is clicked", () => {
    const onContinue = vi.fn();
    wrap(
      <MarkedFinalDialog
        open={true}
        state={{
          isMarkedFinal: true,
          isPasswordProtected: false,
          hasActiveComments: false,
          commentCount: 0,
        }}
        onContinue={onContinue}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onContinue).toHaveBeenCalled();
  });
});
