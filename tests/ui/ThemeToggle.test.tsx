import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { ThemeToggle } from "../../src/ui/ThemeToggle";

const wrap = (ui: ReactElement) =>
  render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);

describe("ThemeToggle", () => {
  it("renders with the current theme selected", () => {
    wrap(<ThemeToggle theme="editorial" onChange={vi.fn()} />);
    const editorial = screen.getByRole("radio", { name: /editorial/i });
    const neutral = screen.getByRole("radio", { name: /neutral/i });
    expect(editorial).toBeChecked();
    expect(neutral).not.toBeChecked();
  });

  it("fires onChange with the clicked theme", () => {
    const onChange = vi.fn();
    wrap(<ThemeToggle theme="editorial" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /neutral/i }));
    expect(onChange).toHaveBeenCalledWith("neutral");
  });
});
