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
    | "rejectTrackedChange"
    | "removeImage"
    | "removeComments"
    | "stripHyperlinkFormatting"
    | "setListStyle"
    | "setTableBorders"
    | "removeSectionBreaks";
  ref?: RangeRef;
  payload?: unknown;
}

export class FakeDocumentAdapter implements DocumentAdapter {
  mutations: FakeMutation[] = [];
  committed = false;
  hyperlinks: HyperlinkInfo[] = [];
  headingStyles: Map<string, HeadingLevel> = new Map();

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
