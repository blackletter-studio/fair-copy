import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { ProofmarkPanel } from "../../../src/proofmark/ui/ProofmarkPanel";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("ProofmarkPanel", () => {
  it("renders the preset selector and Proofread button", () => {
    const adapter = new FakeDocumentAdapter([]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    expect(screen.getByRole("button", { name: /proofread/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /standard/i })).toBeInTheDocument();
  });

  it("shows the empty state after a clean scan", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Already clean text."),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/no findings/i);
    });
  });

  it("renders a finding card for a flagged paragraph", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByText(/straight-quotes/i)).toBeInTheDocument();
    });
  });

  it("does NOT auto-apply findings on scan — adapter has no mutations after proofread", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByText(/straight-quotes/i)).toBeInTheDocument();
    });
    // No setParagraphText or other write mutations should have been recorded
    expect(adapter.mutationsFor("setParagraphText")).toHaveLength(0);
  });

  it("shows Apply safe changes and Apply all buttons after scan with findings", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /apply safe changes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /apply all/i })).toBeInTheDocument();
    });
  });

  it("persists the chosen preset via the provided settingsStore", async () => {
    const adapter = new FakeDocumentAdapter([]);
    const store = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
      saveAsync: vi.fn().mockResolvedValue(undefined),
    };
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} settingsStore={store} />);
    fireEvent.click(screen.getByRole("button", { name: /loud/i }));
    await waitFor(() => {
      expect(store.set).toHaveBeenCalledWith("proofmark-preset", "loud");
      expect(store.saveAsync).toHaveBeenCalled();
    });
  });
});
