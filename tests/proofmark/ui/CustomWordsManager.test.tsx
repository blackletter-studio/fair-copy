import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { CustomWordsManager } from "../../../src/proofmark/ui/CustomWordsManager";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

/**
 * The accordion starts collapsed, so tests that assert on words / dismiss
 * buttons have to open it first. This helper clicks the header button once.
 */
function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: /custom dictionary/i }));
}

describe("CustomWordsManager", () => {
  it("renders nothing when the word list is empty", () => {
    renderWithTheme(<CustomWordsManager words={[]} onRemove={() => {}} />);
    // The component returns null; the FluentProvider wrapper still renders but
    // the header text must NOT appear.
    expect(screen.queryByText(/custom dictionary/i)).toBeNull();
  });

  it("shows the word count in the collapsed header", () => {
    renderWithTheme(<CustomWordsManager words={["foo", "bar", "baz"]} onRemove={() => {}} />);
    expect(screen.getByText(/custom dictionary \(3\)/i)).toBeInTheDocument();
  });

  it("renders each word as a chip after the panel is opened", () => {
    renderWithTheme(<CustomWordsManager words={["alpha", "beta"]} onRemove={() => {}} />);
    openPanel();
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("fires onRemove with the word when the × button is clicked", () => {
    const onRemove = vi.fn();
    renderWithTheme(<CustomWordsManager words={["alpha", "beta"]} onRemove={onRemove} />);
    openPanel();
    const removeButton = screen.getByRole("button", {
      name: /remove alpha from custom dictionary/i,
    });
    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith("alpha");
  });

  it("renders one remove button per word", () => {
    renderWithTheme(<CustomWordsManager words={["a", "b", "c"]} onRemove={() => {}} />);
    openPanel();
    const buttons = screen.getAllByRole("button", {
      name: /remove .+ from custom dictionary/i,
    });
    expect(buttons).toHaveLength(3);
  });
});
