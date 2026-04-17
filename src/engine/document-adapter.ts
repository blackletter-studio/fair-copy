/* global Word */
import type {
  DocumentAdapter,
  Paragraph,
  ImageInfo,
  TrackedChangeInfo,
  DocumentState,
  RangeRef,
  TextFormat,
  ParagraphFormat,
} from "./types";

/**
 * Production DocumentAdapter backed by Office.js Word API.
 * Methods are stubbed in M2 Task 1; filled in by M2 Task 8.
 * Early rule tasks (Tasks 3-6) exercise FakeDocumentAdapter only.
 */
export class WordDocumentAdapter implements DocumentAdapter {
  private pendingMutations: Array<(ctx: Word.RequestContext) => void> = [];

  getAllParagraphs(): Paragraph[] {
    throw new Error("WordDocumentAdapter.getAllParagraphs: implement in M2 Task 8");
  }

  getAllImages(): ImageInfo[] {
    throw new Error("WordDocumentAdapter.getAllImages: implement in M2 Task 8");
  }

  getAllTrackedChanges(): TrackedChangeInfo[] {
    throw new Error("WordDocumentAdapter.getAllTrackedChanges: implement in M2 Task 8");
  }

  getDocumentState(): DocumentState {
    throw new Error("WordDocumentAdapter.getDocumentState: implement in M2 Task 8");
  }

  setTextFormat(_ref: RangeRef, _format: Partial<TextFormat>): void {
    throw new Error("WordDocumentAdapter.setTextFormat: implement in M2 Task 8");
  }

  setParagraphFormat(_ref: RangeRef, _format: Partial<ParagraphFormat>): void {
    throw new Error("WordDocumentAdapter.setParagraphFormat: implement in M2 Task 8");
  }

  rejectTrackedChange(_ref: RangeRef): void {
    throw new Error("WordDocumentAdapter.rejectTrackedChange: implement in M2 Task 8");
  }

  removeImage(_ref: RangeRef): void {
    throw new Error("WordDocumentAdapter.removeImage: implement in M2 Task 8");
  }

  removeComments(): void {
    throw new Error("WordDocumentAdapter.removeComments: implement in M2 Task 8");
  }

  stripHyperlinkFormatting(_ref: RangeRef): void {
    throw new Error("WordDocumentAdapter.stripHyperlinkFormatting: implement in M2 Task 8");
  }

  setListStyle(
    _ref: RangeRef,
    _style: { type: "bullet" | "number"; markerStyle?: "simple"; level?: number } | null,
  ): void {
    throw new Error("WordDocumentAdapter.setListStyle: implement in M2 Task 8");
  }

  setTableBorders(_ref: RangeRef, _borders: { style: "none" | "hairline" } | null): void {
    throw new Error("WordDocumentAdapter.setTableBorders: implement in M2 Task 8");
  }

  async commit(): Promise<void> {
    if (this.pendingMutations.length === 0) return;
    await Word.run(async (context) => {
      for (const mutation of this.pendingMutations) {
        mutation(context);
      }
      await context.sync();
    });
    this.pendingMutations = [];
  }
}
