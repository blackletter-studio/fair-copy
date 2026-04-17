/**
 * Helpers for driving the Fair Copy add-in during E2E tests.
 *
 * DEFERRED: The Word-automation bodies are stubs. They are filled in during
 * manual-verification when Matt is at the keyboard with Word installed and
 * `office-addin-test-server` / `office-addin-test-helpers` running. See
 * tests/e2e/README.md.
 */

export interface DocumentState {
  runs: Array<{
    text: string;
    font?: string;
    color?: string;
    size?: number;
    isHeading?: boolean;
  }>;
}

/** Sideload the add-in via `office-addin-debugging` + test server. */
// eslint-disable-next-line @typescript-eslint/require-await
export async function sideload(manifestPath: string): Promise<void> {
  // TODO(M2-T12-manual): wire office-addin-debugging to start a test server
  // and invoke Word with the manifest. Reference:
  //   https://github.com/OfficeDev/office-addin-test-server
  //   https://www.npmjs.com/package/office-addin-test-helpers
  throw new Error(
    `sideload() not yet wired — manifest at ${manifestPath}. See tests/e2e/README.md.`,
  );
}

/** Open a DOCX fixture in the running Word instance. */
// eslint-disable-next-line @typescript-eslint/require-await
export async function openDocument(docxPath: string): Promise<void> {
  // TODO(M2-T12-manual): use `office-addin-test-helpers` or AppleScript (macOS)
  // to open the docx in the sideloaded Word instance.
  throw new Error(`openDocument() not yet wired — path ${docxPath}. See tests/e2e/README.md.`);
}

/** Click the Clean button in the task pane. */
// eslint-disable-next-line @typescript-eslint/require-await
export async function clickCleanButton(): Promise<void> {
  // TODO(M2-T12-manual): get a reference to the task pane <iframe> via CDP,
  // find the button by role+name, click it, wait for the "Cleaned" state.
  throw new Error("clickCleanButton() not yet wired. See tests/e2e/README.md.");
}

/** Read back the document's current state for assertions. */
// eslint-disable-next-line @typescript-eslint/require-await
export async function getDocumentState(): Promise<DocumentState> {
  // TODO(M2-T12-manual): invoke an Office.js read-only script in the task
  // pane to collect paragraph/run state and return via postMessage.
  throw new Error("getDocumentState() not yet wired. See tests/e2e/README.md.");
}
