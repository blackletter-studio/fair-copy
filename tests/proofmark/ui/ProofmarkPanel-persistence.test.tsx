import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import {
  ProofmarkPanel,
  type ProofmarkSettingsStore,
} from "../../../src/proofmark/ui/ProofmarkPanel";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("ProofmarkPanel preset persistence", () => {
  it("reads the stored preset on mount", () => {
    const store: ProofmarkSettingsStore = {
      get: vi.fn((key: string) =>
        key === "proofmark-preset" ? "loud" : undefined,
      ) as ProofmarkSettingsStore["get"],
      set: vi.fn(),
      saveAsync: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = new FakeDocumentAdapter([]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} settingsStore={store} />);
    expect(store.get).toHaveBeenCalledWith("proofmark-preset");
    const loud = screen.getByRole("button", { name: /loud/i });
    expect(loud.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls saveAsync after every preset change", async () => {
    const store: ProofmarkSettingsStore = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
      saveAsync: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = new FakeDocumentAdapter([]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} settingsStore={store} />);
    fireEvent.click(screen.getByRole("button", { name: /quiet/i }));
    fireEvent.click(screen.getByRole("button", { name: /loud/i }));
    await waitFor(() => {
      expect(store.saveAsync).toHaveBeenCalledTimes(2);
    });
    expect(store.set).toHaveBeenNthCalledWith(1, "proofmark-preset", "quiet");
    expect(store.set).toHaveBeenNthCalledWith(2, "proofmark-preset", "loud");
  });

  it("falls back to 'standard' when the stored value is unrecognized", () => {
    const store: ProofmarkSettingsStore = {
      get: vi.fn(() => "garbage") as ProofmarkSettingsStore["get"],
      set: vi.fn(),
      saveAsync: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = new FakeDocumentAdapter([]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} settingsStore={store} />);
    const standard = screen.getByRole("button", { name: /standard/i });
    expect(standard.getAttribute("aria-pressed")).toBe("true");
  });
});
