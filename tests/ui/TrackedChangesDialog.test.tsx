import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { TrackedChangesDialog } from "../../src/ui/TrackedChangesDialog";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("TrackedChangesDialog", () => {
  it("renders with change count", () => {
    wrap(
      <TrackedChangesDialog
        open={true}
        changes={[
          {
            ref: { id: "x", kind: "run" },
            kind: "insertion",
            author: "a",
            date: "2026-01-01T00:00:00Z",
          },
        ]}
        onDecide={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/what should Fair Copy do/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls onDecide('reject') when reject button clicked", () => {
    const onDecide = vi.fn();
    wrap(<TrackedChangesDialog open={true} changes={[]} onDecide={onDecide} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /reject & clean/i }));
    expect(onDecide).toHaveBeenCalledWith("reject");
  });
});
