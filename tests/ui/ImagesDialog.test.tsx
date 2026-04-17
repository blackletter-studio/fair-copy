import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { ImagesDialog } from "../../src/ui/ImagesDialog";
import type { ImageInfo } from "../../src/engine/types";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

const sampleImages: ImageInfo[] = [
  {
    ref: { id: "img1", kind: "run" },
    page: 1,
    width: 100,
    height: 100,
    detectedKind: "signature",
  },
  {
    ref: { id: "img2", kind: "run" },
    page: 1,
    width: 200,
    height: 150,
    detectedKind: "exhibit",
  },
];

describe("ImagesDialog", () => {
  it("renders with image count", () => {
    wrap(
      <ImagesDialog
        open={true}
        images={sampleImages}
        defaultChoice="keep"
        onDecide={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/images\./i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onDecide('remove-all') when Remove all clicked", () => {
    const onDecide = vi.fn();
    wrap(
      <ImagesDialog
        open={true}
        images={sampleImages}
        defaultChoice="keep"
        onDecide={onDecide}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /remove all/i }));
    expect(onDecide).toHaveBeenCalledWith("remove-all");
  });
});
