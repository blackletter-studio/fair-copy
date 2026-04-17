import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { ProofmarkPanel } from "../../../src/proofmark/ui/ProofmarkPanel";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe("ProofmarkPanel", () => {
  it("renders the Proofread button", () => {
    const adapter = new FakeDocumentAdapter([]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    expect(screen.getByRole("button", { name: /proofread/i })).toBeInTheDocument();
  });

  it("does not render a preset selector (M3 simplified to a single scan mode)", () => {
    const adapter = new FakeDocumentAdapter([]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    // Quiet / Standard / Loud buttons must not appear — preset UI was removed.
    expect(screen.queryByRole("button", { name: /^quiet$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^standard$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^loud$/i })).toBeNull();
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

  it("clicking a finding's excerpt calls selectRange on the document adapter", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/hello/i));
    const selects = adapter.mutationsFor("selectRange");
    expect(selects).toHaveLength(1);
    expect(selects[0]?.ref?.id).toBe("p1");
  });
});
