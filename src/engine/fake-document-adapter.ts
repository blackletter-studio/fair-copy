import type {
  DocumentAdapter,
  Paragraph,
  TextRun,
  ImageInfo,
  TrackedChangeInfo,
  DocumentState,
  RangeRef,
  TextFormat,
  ParagraphFormat,
} from "./types";

export interface FakeMutation {
  op:
    | "setTextFormat"
    | "setParagraphFormat"
    | "rejectTrackedChange"
    | "removeImage"
    | "removeComments"
    | "stripHyperlinkFormatting";
  ref?: RangeRef;
  payload?: unknown;
}

export class FakeDocumentAdapter implements DocumentAdapter {
  mutations: FakeMutation[] = [];
  committed = false;

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
  ) {}

  getAllParagraphs(): Paragraph[] {
    return this.paragraphs;
  }
  getAllImages(): ImageInfo[] {
    return this.images;
  }
  getAllTrackedChanges(): TrackedChangeInfo[] {
    return this.trackedChanges;
  }
  getDocumentState(): DocumentState {
    return this.state;
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

  commit(): Promise<void> {
    this.committed = true;
    return Promise.resolve();
  }

  static makeParagraph(id: string, text: string, overrides: Partial<Paragraph> = {}): Paragraph {
    const defaultRun: TextRun = {
      ref: { id: `${id}-run-0`, kind: "run" },
      text,
      format: {},
    };
    return {
      ref: { id, kind: "paragraph" },
      text,
      paragraphFormat: overrides.paragraphFormat ?? {},
      runs: overrides.runs ?? [defaultRun],
      listInfo: overrides.listInfo,
    };
  }

  mutationsFor(op: FakeMutation["op"]): FakeMutation[] {
    return this.mutations.filter((m) => m.op === op);
  }
}
