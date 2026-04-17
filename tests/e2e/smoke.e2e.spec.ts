import { test, expect } from "@playwright/test";
import { sideload, openDocument, clickCleanButton, getDocumentState } from "./helpers";

// These tests are SKIPPED in CI and local vitest — they only run when Matt
// invokes `pnpm playwright test` locally with a real Word install.
test.describe("Fair Copy E2E — happy path", () => {
  test("Standard preset cleans messy-brief.docx without confirmations", async () => {
    await sideload("./manifest.xml");
    await openDocument("./tests/e2e/fixtures/messy-brief.docx");
    await clickCleanButton();
    const state = await getDocumentState();
    // All body runs should now have font = IBM Plex Sans
    expect(state.runs.every((r) => r.font === "IBM Plex Sans" || r.isHeading)).toBe(true);
    // All body runs should have near-black color
    expect(
      state.runs.every((r) => r.color === "#1a1a1a" || r.color === "#000000" || r.isHeading),
    ).toBe(true);
  });

  test("document with tracked changes shows confirmation dialog", async ({ page }) => {
    await sideload("./manifest.xml");
    await openDocument("./tests/e2e/fixtures/tracked-changes-doc.docx");
    await clickCleanButton();
    // The TrackedChangesDialog should be visible — confirm by the button text
    expect(await page.isVisible("text=Reject & clean")).toBe(true);
  });

  test("clean-doc is idempotent", async () => {
    await sideload("./manifest.xml");
    await openDocument("./tests/e2e/fixtures/clean-doc.docx");
    await clickCleanButton();
    const state = await getDocumentState();
    // Already-clean doc should still have IBM Plex Sans and stay unchanged
    expect(state.runs.every((r) => r.font === "IBM Plex Sans")).toBe(true);
  });
});
