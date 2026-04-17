import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { App } from "../src/taskpane/App";
import type { DocumentAdapter } from "../src/engine/types";

/**
 * Minimal smoke test for the wired-up task pane App.
 *
 * We pre-seed the Office roaming-settings stub to mark onboarding as seen
 * (so the carousel doesn't take over the pane) and inject a fake adapter
 * via the `createAdapter` prop. End-to-end coverage of dialogs + runPreset
 * lives in the Playwright suite planned for M2 T12.
 */

function fakeAdapter(): DocumentAdapter {
  return {
    load: async () => {},
    getAllParagraphs: () => [],
    getAllImages: () => [],
    getAllTrackedChanges: () => [],
    getAllHyperlinks: () => [],
    getDocumentState: () => ({
      isMarkedFinal: false,
      isPasswordProtected: false,
      hasActiveComments: false,
      commentCount: 0,
    }),
    setTextFormat: () => {},
    setParagraphFormat: () => {},
    rejectTrackedChange: () => {},
    removeImage: () => {},
    removeComments: () => {},
    stripHyperlinkFormatting: () => {},
    setListStyle: () => {},
    setTableBorders: () => {},
    removeSectionBreaks: () => {},
    commit: async () => {},
  };
}

describe("App smoke test", () => {
  beforeEach(() => {
    // Mark onboarding seen so the first-run carousel doesn't take over.
    Office.context.roamingSettings.set("bl-first-run-seen", "true");
  });

  it("renders the Clean document button once onboarding is dismissed", async () => {
    render(<App createAdapter={fakeAdapter} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /clean document/i })).toBeInTheDocument();
    });
  });

  it("shows the Fair Copy and Proofmark tabs", async () => {
    render(<App createAdapter={fakeAdapter} />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /fair copy/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: /proofmark/i })).toBeInTheDocument();
  });
});
