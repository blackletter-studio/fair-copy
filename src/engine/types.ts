/** Typography of a text run, as our rules observe and mutate it. */
export interface TextFormat {
  fontName?: string;
  fontSize?: number; // points
  fontColor?: string; // CSS hex like "#1a1a1a"
  highlight?: string | null; // CSS color name or null for "no highlight"
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

/** Paragraph-level formatting. */
export interface ParagraphFormat {
  alignment?: "left" | "right" | "center" | "justified";
  lineSpacing?: number; // e.g. 1, 1.15, 1.5, 2
  spaceBefore?: number; // points
  spaceAfter?: number; // points
  leftIndent?: number; // points
  firstLineIndent?: number; // points
  styleName?: string; // e.g. "Normal", "Heading 1", "Title"
}

/** A handle to a range of content in the document. */
export interface RangeRef {
  readonly id: string; // opaque; only meaningful to the adapter
  readonly kind: "paragraph" | "run" | "cell" | "list-item";
}

export interface Paragraph {
  ref: RangeRef;
  text: string;
  paragraphFormat: ParagraphFormat;
  runs: TextRun[];
  listInfo?: { type: "bullet" | "number"; level: number };
}

export interface TextRun {
  ref: RangeRef;
  text: string;
  format: TextFormat;
}

export interface ImageInfo {
  ref: RangeRef;
  page: number;
  width: number;
  height: number;
  detectedKind: "signature" | "letterhead" | "exhibit" | "unknown";
  altText?: string;
}

export interface TrackedChangeInfo {
  ref: RangeRef;
  kind: "insertion" | "deletion" | "format-change";
  author: string;
  date: string; // ISO
}

export interface HyperlinkInfo {
  ref: RangeRef;
  url: string;
  text: string;
}

export interface DocumentState {
  isMarkedFinal: boolean;
  isPasswordProtected: boolean;
  hasActiveComments: boolean;
  commentCount: number;
}

export type HeadingLevel =
  | "title"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "heading-5"
  | "heading-6"
  | null;

export interface DetectionResult {
  kind: "tracked-changes" | "images" | "document-state";
  count: number;
  items: Array<TrackedChangeInfo | ImageInfo | DocumentState>;
}

export interface Detector<T extends "tracked-changes" | "images" | "document-state"> {
  kind: T;
  detect(doc: DocumentAdapter): DetectionResult | null;
}

/** What a rule needs from the document. */
export interface DocumentAdapter {
  /**
   * Optional: populate the adapter's cached view of the document. Production
   * (Office.js) adapters need this because Word APIs require an async
   * context.sync() before reads; the fake does all its work synchronously and
   * can omit it. Orchestrators MUST call `await doc.load?.()` before invoking
   * any getter on a production adapter.
   */
  load?(): Promise<void>;
  getAllParagraphs(): Paragraph[];
  getAllImages(): ImageInfo[];
  getAllTrackedChanges(): TrackedChangeInfo[];
  getAllHyperlinks(): HyperlinkInfo[];
  getDocumentState(): DocumentState;
  /** Heading style for this paragraph, or null if it is body text. */
  getHeadingStyle(ref: RangeRef): HeadingLevel;
  setTextFormat(ref: RangeRef, format: Partial<TextFormat>): void;
  setParagraphFormat(ref: RangeRef, format: Partial<ParagraphFormat>): void;
  /** Replace the entire text of a paragraph range with new text. */
  setParagraphText(ref: RangeRef, text: string): void;
  rejectTrackedChange(ref: RangeRef): void;
  removeImage(ref: RangeRef): void;
  removeComments(): void;
  stripHyperlinkFormatting(ref: RangeRef): void;
  setListStyle(
    ref: RangeRef,
    style: { type: "bullet" | "number"; markerStyle?: "simple"; level?: number } | null,
  ): void;
  setTableBorders(ref: RangeRef, borders: { style: "none" | "hairline" } | null): void;
  removeSectionBreaks(): void;
  /** Scroll the document view to the paragraph identified by ref and select it. */
  selectRange(ref: RangeRef): void;
  /** Replace text at a specific sub-paragraph range (by ref). Used by spelling. */
  replaceRange(ref: RangeRef, newText: string): void;
  commit(): Promise<void>;
  /**
   * Optional: return all proofing errors (spelling + grammar) from the host's
   * own proofing engine. Each entry includes the zero-based paragraph index,
   * flagged text, character offset within that paragraph, and the run length.
   *
   * Implementations backed by older Office.js builds that lack
   * `Paragraph.getProofingErrors()` should omit this method entirely (leave it
   * undefined) — callers guard with `typeof doc.getProofingErrorRanges !== "function"`.
   */
  getProofingErrorRanges?(): Promise<
    Array<{ paragraphIndex: number; text: string; offset: number; length: number }>
  >;
}

export type RuleName =
  | "font-face"
  | "font-size"
  | "colored-text"
  | "highlighting"
  | "bold-italic-underline"
  | "strikethrough"
  | "alignment"
  | "line-spacing"
  | "paragraph-spacing"
  | "indents-and-tabs"
  | "bullet-lists"
  | "numbered-lists"
  | "tables"
  | "comments"
  | "hyperlinks"
  | "section-breaks";

export interface RuleSettings {
  [ruleName: string]: unknown;
}

export interface Rule {
  name: RuleName;
  apply(doc: DocumentAdapter, settings: unknown): void | Promise<void>;
}

export type PresetName = "standard" | "conservative" | "aggressive" | "custom";

export interface Preset {
  name: PresetName;
  rules: Partial<Record<RuleName, unknown>>;
}
