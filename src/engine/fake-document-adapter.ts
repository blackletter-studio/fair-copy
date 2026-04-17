import type {
  DocumentAdapter,
  Paragraph,
  TextRun,
  ImageInfo,
  TrackedChangeInfo,
  HyperlinkInfo,
  DocumentState,
  RangeRef,
  TextFormat,
  ParagraphFormat,
  HeadingLevel,
} from "./types";

export interface FakeMutation {
  op:
    | "setTextFormat"
    | "setParagraphFormat"
    | "setParagraphText"
    | "rejectTrackedChange"
    | "removeImage"
    | "removeComments"
    | "stripHyperlinkFormatting"
    | "setListStyle"
    | "setTableBorders"
    | "removeSectionBreaks"
    | "selectRange"
    | "replaceRange";
  ref?: RangeRef;
  payload?: unknown;
}

export class FakeDocumentAdapter implements DocumentAdapter {
  mutations: FakeMutation[] = [];
  committed = false;
  hyperlinks: HyperlinkInfo[] = [];
  headingStyles: Map<string, HeadingLevel> = new Map();
  private _spellingErrors: Array<{
    paragraphIndex: number;
    text: string;
    offset: number;
    length: number;
  }> = [];
  private _grammarErrors: Array<{
    paragraphIndex: number;
    text: string;
    offset: number;
    length: number;
  }> = [];

  constructor(
    public paragraphs: Paragraph[] = [],
    public images: ImageInfo[] = [],
    public trackedChanges: TrackedChangeInfo[] = [],
    public state: DocumentState = {
      isMarkedFinal: false,
      isPasswordProtected: false,
      hasActiveComments: false,
      commentCount: 0,
    },
  ) {
    // Seed the heading map from any paragraphs whose factory attached a
    // `__headingStyle` sentinel on paragraphFormat.
    for (const p of paragraphs) {
      const sentinel = (p.paragraphFormat as ParagraphFormat & { __headingStyle?: HeadingLevel })
        .__headingStyle;
      if (sentinel !== undefined) {
        this.headingStyles.set(p.ref.id, sentinel);
      }
    }
  }

  getAllParagraphs(): Paragraph[] {
    return this.paragraphs;
  }
  getAllImages(): ImageInfo[] {
    return this.images;
  }
  getAllTrackedChanges(): TrackedChangeInfo[] {
    return this.trackedChanges;
  }
  getAllHyperlinks(): HyperlinkInfo[] {
    return this.hyperlinks;
  }
  setHyperlinks(links: HyperlinkInfo[]): void {
    this.hyperlinks = links;
  }

  /**
   * Stub helper for tests: seed the spelling errors that
   * `getSpellingErrorRanges()` will return.
   */
  setSpellingErrors(
    errors: Array<{ paragraphIndex: number; text: string; offset: number; length: number }>,
  ): void {
    this._spellingErrors = errors;
  }

  /**
   * Stub helper for tests: seed the grammar errors that
   * `getGrammarErrorRanges()` will return.
   */
  setGrammarErrors(
    errors: Array<{ paragraphIndex: number; text: string; offset: number; length: number }>,
  ): void {
    this._grammarErrors = errors;
  }

  /**
   * Back-compat for tests that used the pre-WordApiDesktop-1.4 single-list
   * API. Splits by whitespace: multi-word → grammar, single-word → spelling.
   * Matches the classifier we used to hand-roll in the checks.
   */
  setProofingErrors(
    errors: Array<{ paragraphIndex: number; text: string; offset: number; length: number }>,
  ): void {
    this._spellingErrors = errors.filter((e) => !/\s/.test(e.text));
    this._grammarErrors = errors.filter((e) => /\s/.test(e.text));
  }

  getSpellingErrorRanges(): Promise<
    Array<{ paragraphIndex: number; text: string; offset: number; length: number }>
  > {
    return Promise.resolve(this._spellingErrors);
  }

  getGrammarErrorRanges(): Promise<
    Array<{ paragraphIndex: number; text: string; offset: number; length: number }>
  > {
    return Promise.resolve(this._grammarErrors);
  }
  getDocumentState(): DocumentState {
    return this.state;
  }

  getHeadingStyle(ref: RangeRef): HeadingLevel {
    return this.headingStyles.get(ref.id) ?? null;
  }

  setTextFormat(ref: RangeRef, format: Partial<TextFormat>): void {
    this.mutations.push({ op: "setTextFormat", ref, payload: format });
  }
  setParagraphFormat(ref: RangeRef, format: Partial<ParagraphFormat>): void {
    this.mutations.push({ op: "setParagraphFormat", ref, payload: format });
  }
  setParagraphText(ref: RangeRef, text: string): void {
    this.mutations.push({ op: "setParagraphText", ref, payload: text });
    // Also mutate the in-memory paragraph so subsequent reads see the change.
    const para = this.paragraphs.find((p) => p.ref.id === ref.id);
    if (para) {
      para.text = text;
      if (para.runs[0]) para.runs[0].text = text;
    }
  }
  rejectTrackedChange(ref: RangeRef): void {
    this.mutations.push({ op: "rejectTrackedChange", ref });
  }
  removeImage(ref: RangeRef): void {
    this.mutations.push({ op: "removeImage", ref });
  }
  removeComments(): void {
    this.mutations.push({ op: "removeComments" });
  }
  stripHyperlinkFormatting(ref: RangeRef): void {
    this.mutations.push({ op: "stripHyperlinkFormatting", ref });
  }
  setListStyle(
    ref: RangeRef,
    style: { type: "bullet" | "number"; markerStyle?: "simple"; level?: number } | null,
  ): void {
    this.mutations.push({ op: "setListStyle", ref, payload: style });
  }
  setTableBorders(ref: RangeRef, borders: { style: "none" | "hairline" } | null): void {
    this.mutations.push({ op: "setTableBorders", ref, payload: borders });
  }
  removeSectionBreaks(): void {
    this.mutations.push({ op: "removeSectionBreaks" });
  }

  selectRange(ref: RangeRef): void {
    this.mutations.push({ op: "selectRange", ref });
  }

  replaceRange(ref: RangeRef, newText: string): void {
    this.mutations.push({ op: "replaceRange", ref, payload: newText });
    // Parse spell-<paraIdx>-<offset>-<len> and mutate in-memory text.
    const spellMatch = /^spell-(\d+)-(\d+)-(\d+)$/.exec(ref.id);
    if (!spellMatch) return;
    const paraIdx = Number.parseInt(spellMatch[1]!, 10);
    const offset = Number.parseInt(spellMatch[2]!, 10);
    const len = Number.parseInt(spellMatch[3]!, 10);
    // eslint-disable-next-line security/detect-object-injection -- values parsed from ids we formatted
    const para = this.paragraphs[paraIdx];
    if (!para) return;
    const newFullText = para.text.slice(0, offset) + newText + para.text.slice(offset + len);
    para.text = newFullText;
    if (para.runs[0]) para.runs[0].text = newFullText;
  }

  commit(): Promise<void> {
    this.committed = true;
    return Promise.resolve();
  }

  static makeParagraph(
    id: string,
    text: string,
    overrides: Partial<Paragraph> & { headingStyle?: HeadingLevel } = {},
  ): Paragraph {
    const defaultRun: TextRun = {
      ref: { id: `${id}-run-0`, kind: "run" },
      text,
      format: {},
    };
    const paragraphFormat: ParagraphFormat & { __headingStyle?: HeadingLevel } = {
      ...(overrides.paragraphFormat ?? {}),
    };
    if (overrides.headingStyle !== undefined) {
      paragraphFormat.__headingStyle = overrides.headingStyle;
    }
    return {
      ref: { id, kind: "paragraph" },
      text,
      paragraphFormat,
      runs: overrides.runs ?? [defaultRun],
      listInfo: overrides.listInfo,
    };
  }

  mutationsFor(op: FakeMutation["op"]): FakeMutation[] {
    return this.mutations.filter((m) => m.op === op);
  }
}
