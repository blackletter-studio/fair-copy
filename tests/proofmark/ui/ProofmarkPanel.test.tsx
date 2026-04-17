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
    // straight-quotes is a Style finding — switch to Style tab to see it.
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /style/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("tab", { name: /style/i }));
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
    // straight-quotes is a Style finding — switch to Style tab to see it.
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /style/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("tab", { name: /style/i }));
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
    // straight-quotes / "hello" finding lives in the Style tab — switch there.
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /style/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("tab", { name: /style/i }));
    await waitFor(() => {
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/hello/i));
    const selects = adapter.mutationsFor("selectRange");
    expect(selects).toHaveLength(1);
    expect(selects[0]?.ref?.id).toBe("p1");
  });
});

describe("ProofmarkPanel — tabbed UI", () => {
  it("TabList is not rendered before a scan", () => {
    const adapter = new FakeDocumentAdapter([]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    expect(screen.queryByRole("tab", { name: /spelling/i })).toBeNull();
    expect(screen.queryByRole("tab", { name: /grammar/i })).toBeNull();
    expect(screen.queryByRole("tab", { name: /style/i })).toBeNull();
  });

  it("TabList renders after a scan that produces findings", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /spelling/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /grammar/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /style/i })).toBeInTheDocument();
    });
  });

  it("active tab defaults to Spelling after a scan", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      // The Spelling tab should be selected (aria-selected="true").
      const spellingTab = screen.getByRole("tab", { name: /spelling/i });
      expect(spellingTab).toHaveAttribute("aria-selected", "true");
    });
  });

  it("tab labels include finding counts", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      // Each tab label must contain a parenthesised count.
      expect(screen.getByRole("tab", { name: /spelling \(\d+\)/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /grammar \(\d+\)/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /style \(\d+\)/i })).toBeInTheDocument();
    });
  });

  it("Style tab shows only non-spelling, non-grammar findings", async () => {
    // straight-quotes findings have checkName "straight-quotes" → Style bucket.
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    // Wait for scan to finish and tabs to appear.
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /style/i })).toBeInTheDocument();
    });
    // Switch to Style tab.
    fireEvent.click(screen.getByRole("tab", { name: /style/i }));
    // The straight-quotes finding should be visible under Style.
    await waitFor(() => {
      expect(screen.getByText(/straight-quotes/i)).toBeInTheDocument();
    });
  });

  it("Spelling tab shows only spelling findings", async () => {
    // Seed a misspelling so the Spelling bucket is non-empty.
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      // Spelling tab should be selected by default and show the misspelling.
      expect(screen.getByRole("tab", { name: /spelling/i })).toBeInTheDocument();
    });
    // The spelling finding message contains the word "wittnes".
    await waitFor(() => {
      expect(screen.getByText(/wittnes/i)).toBeInTheDocument();
    });
    // straight-quotes findings should NOT appear in the Spelling tab view.
    expect(screen.queryByText(/straight-quotes/i)).toBeNull();
  });

  it("switching to Grammar tab with no grammar findings shows empty-tab message", async () => {
    // A straight-quotes paragraph produces only Style findings; Grammar stays empty.
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /grammar/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("tab", { name: /grammar/i }));
    await waitFor(() => {
      expect(screen.getByText(/no findings in this category/i)).toBeInTheDocument();
    });
  });

  it("Grammar tab shows grammar findings when present", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
    ]);
    // Stub Word proofing error for "there" — valid word, so grammar owns it.
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "there", offset: 10, length: 5 }]);
    renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /grammar/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("tab", { name: /grammar/i }));
    await waitFor(() => {
      expect(screen.getByText(/grammar issue flagged by word/i)).toBeInTheDocument();
    });
  });

  it("Apply safe / Apply all buttons appear ABOVE the TabList (scoped to all findings)", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    const { container } = renderWithTheme(<ProofmarkPanel getDocument={() => adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /proofread/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /apply safe changes/i })).toBeInTheDocument();
    });
    // The batch buttons should appear in the DOM before the TabList.
    const buttons = container.querySelectorAll('[role="button"], button');
    const buttonLabels = Array.from(buttons).map((b) => b.textContent?.trim() ?? "");
    const applyIdx = buttonLabels.findIndex((l) => /apply safe/i.test(l));
    const tabIdx = buttonLabels.findIndex((l) => /spelling/i.test(l));
    expect(applyIdx).toBeGreaterThanOrEqual(0);
    expect(tabIdx).toBeGreaterThanOrEqual(0);
    expect(applyIdx).toBeLessThan(tabIdx);
  });
});

describe("FakeDocumentAdapter — setProofingErrors stub", () => {
  it("returns empty array by default", async () => {
    const adapter = new FakeDocumentAdapter([]);
    const errors = await adapter.getProofingErrorRanges();
    expect(errors).toHaveLength(0);
  });

  it("returns seeded errors after setProofingErrors", async () => {
    const adapter = new FakeDocumentAdapter([]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "foo", offset: 0, length: 3 }]);
    const errors = await adapter.getProofingErrorRanges();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ paragraphIndex: 0, text: "foo", offset: 0, length: 3 });
  });

  it("can be called multiple times; last call wins", async () => {
    const adapter = new FakeDocumentAdapter([]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "foo", offset: 0, length: 3 }]);
    adapter.setProofingErrors([{ paragraphIndex: 1, text: "bar", offset: 4, length: 3 }]);
    const errors = await adapter.getProofingErrorRanges();
    expect(errors).toHaveLength(1);
    expect(errors[0]!.text).toBe("bar");
  });
});
