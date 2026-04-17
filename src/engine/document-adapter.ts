/* global Word */
import type {
  DocumentAdapter,
  Paragraph,
  ImageInfo,
  TrackedChangeInfo,
  HyperlinkInfo,
  DocumentState,
  RangeRef,
  TextFormat,
  ParagraphFormat,
  HeadingLevel,
} from "./types";
import { minimalReplacements } from "./text-diff";

/**
 * Production DocumentAdapter backed by Office.js Word API.
 *
 * ## Architecture
 * Office.js is async (requires `await context.sync()` before reads), but the
 * `DocumentAdapter` interface exposes synchronous getters so rules stay simple.
 * We bridge this with three phases:
 *
 * 1. `load()` — one `Word.run` that eagerly loads every property every rule
 *    might touch, then caches the materialised snapshot on private fields.
 * 2. Sync getters return from the cache.
 * 3. Mutation methods push closures into `pendingMutations`; `commit()` replays
 *    them in one final `Word.run` + `context.sync()`.
 *
 * The orchestrator (M2 T9) calls `await doc.load?.()` before running rules and
 * `await doc.commit()` once all rules have queued their mutations.
 *
 * ## ref.id scheme
 * - Paragraphs:  `para-<idx>`
 * - Runs:        `para-<idx>-run-0`  (one run per paragraph for M2)
 * - Images:      `img-<idx>`
 *
 * `<idx>` is the position within `body.paragraphs.items` / `body.inlinePictures.items`
 * at load time. Mutations parse the id back to an index and re-fetch the object
 * in the commit context, so the index must remain valid between `load()` and
 * `commit()`. If a user edits the document between those calls, indexes may
 * drift — that's acceptable for v1.0 because rules run in a single batch.
 *
 * ## Not covered by unit tests
 * Office.js can't be mocked practically; this class is covered by the Playwright
 * E2E suite (M2 T12) running against real Word. Unit tests exercise
 * `FakeDocumentAdapter` exclusively.
 */
export class WordDocumentAdapter implements DocumentAdapter {
  private loadedParagraphs: Paragraph[] = [];
  private loadedImages: ImageInfo[] = [];
  private loadedTrackedChanges: TrackedChangeInfo[] = [];
  private loadedHyperlinks: HyperlinkInfo[] = [];
  private loadedState: DocumentState | null = null;
  private pendingMutations: Array<(ctx: Word.RequestContext) => void | Promise<void>> = [];
  // The comment collection pre-loaded by commit() before replaying mutations.
  // Closures reference `this.preloadedComments` instead of calling
  // `ctx.document.body.getComments()` because Office.js returns a fresh
  // (unloaded) proxy on each call — load state is per-proxy, not per-collection.
  private preloadedComments: Word.CommentCollection | null = null;

  /**
   * Wait for Office.js + Word host API to be ready. main.tsx already awaits
   * Office.onReady before the first render, but vite HMR can remount App in a
   * narrow window where the Word namespace hasn't been attached to the global
   * yet. Re-awaiting onReady is idempotent and cheap — resolves synchronously
   * if already ready. After it resolves, Word must be defined; otherwise the
   * task pane is hosted outside of Word and we fail loud.
   */
  private async waitForWordApi(): Promise<void> {
    await Office.onReady();
    if (typeof Word === "undefined") {
      throw new Error(
        "Office.onReady resolved but Word namespace is missing — add-in may be hosted outside Word.",
      );
    }
  }

  async load(): Promise<void> {
    await this.waitForWordApi();
    await Word.run(async (context) => {
      const body = context.document.body;

      const paragraphs = body.paragraphs;
      paragraphs.load([
        "text",
        "alignment",
        "styleBuiltIn",
        "style",
        "leftIndent",
        "firstLineIndent",
        "lineSpacing",
        "spaceBefore",
        "spaceAfter",
        "isListItem",
      ]);
      const inlinePictures = body.inlinePictures;
      inlinePictures.load(["width", "height", "altTextDescription"]);

      await context.sync();

      this.loadedParagraphs = paragraphs.items.map((p, idx) => {
        const styleFromCustom =
          typeof p.style === "string" && p.style.length > 0 ? p.style : undefined;
        const styleFromBuiltIn = typeof p.styleBuiltIn === "string" ? p.styleBuiltIn : undefined;
        const styleName: string | undefined = styleFromCustom ?? styleFromBuiltIn;
        const text = p.text;
        const paraRef: RangeRef = { id: `para-${idx}`, kind: "paragraph" };
        const runRef: RangeRef = { id: `para-${idx}-run-0`, kind: "run" };
        const paragraph: Paragraph = {
          ref: paraRef,
          text,
          paragraphFormat: {
            alignment: mapAlignment(p.alignment),
            ...(styleName !== undefined ? { styleName } : {}),
            leftIndent: p.leftIndent,
            firstLineIndent: p.firstLineIndent,
            lineSpacing: p.lineSpacing,
            spaceBefore: p.spaceBefore,
            spaceAfter: p.spaceAfter,
          },
          runs: [{ ref: runRef, text, format: {} }],
        };
        return paragraph;
      });

      this.loadedImages = inlinePictures.items.map((img, idx) => ({
        ref: { id: `img-${idx}`, kind: "run" },
        // Office.js task-pane APIs don't reliably expose page index.
        // TODO(M2.5): derive page from image location if a platform API lands.
        page: 0,
        width: img.width,
        height: img.height,
        detectedKind: "unknown" as const,
        altText: img.altTextDescription,
      }));

      // TODO(M2.5): detect "Mark as Final" (document protection mode) and
      //             password-protection. Office.js exposes partial info via
      //             `document.properties` / `document.protection`, but coverage
      //             is uneven across platforms. Leaving `false` is safe — the
      //             document-state rule only *warns*, it doesn't fail open.
      this.loadedState = {
        isMarkedFinal: false,
        isPasswordProtected: false,
        hasActiveComments: false,
        commentCount: 0,
      };

      // TODO(M2.5): populate hyperlinks via body.getHyperlinkRanges() when the
      //             API stabilises across Word platforms, and tracked changes
      //             via body.getTrackedChanges(). For M2 we leave these empty
      //             so the rules no-op on production until we widen load().
      this.loadedHyperlinks = [];
      this.loadedTrackedChanges = [];
    });
  }

  getAllParagraphs(): Paragraph[] {
    return this.loadedParagraphs;
  }

  getAllImages(): ImageInfo[] {
    return this.loadedImages;
  }

  getAllTrackedChanges(): TrackedChangeInfo[] {
    return this.loadedTrackedChanges;
  }

  getAllHyperlinks(): HyperlinkInfo[] {
    return this.loadedHyperlinks;
  }

  getDocumentState(): DocumentState {
    if (!this.loadedState) {
      throw new Error("WordDocumentAdapter: call load() before getDocumentState().");
    }
    return this.loadedState;
  }

  getHeadingStyle(ref: RangeRef): HeadingLevel {
    const match = /^para-(\d+)$/.exec(ref.id);
    if (!match) return null;
    const paraIdxStr = match[1];
    if (paraIdxStr === undefined) return null;
    const paraIdx = Number.parseInt(paraIdxStr, 10);
    // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
    const para = this.loadedParagraphs[paraIdx];
    if (!para) return null;
    return mapHeadingStyleName(para.paragraphFormat.styleName);
  }

  setTextFormat(ref: RangeRef, format: Partial<TextFormat>): void {
    const match = /^para-(\d+)-run-(\d+)$/.exec(ref.id);
    if (!match) return;
    const paraIdxStr = match[1];
    if (paraIdxStr === undefined) return;
    const paraIdx = Number.parseInt(paraIdxStr, 10);
    this.pendingMutations.push((ctx) => {
      // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
      const p = ctx.document.body.paragraphs.items[paraIdx];
      if (!p) return;
      const font = p.font;
      if (format.fontName !== undefined) font.name = format.fontName;
      if (format.fontSize !== undefined) font.size = format.fontSize;
      if (format.fontColor !== undefined) font.color = format.fontColor;
      if (format.highlight !== undefined) {
        // Clearing highlight: Word for Mac rejects "NoColor" with InvalidArgument
        // (works on Windows). Empty string is the cross-platform clear sentinel
        // per the Office.js docs. Non-null passes the color string through.
        font.highlightColor = format.highlight === null ? "" : format.highlight;
      }
      if (format.bold !== undefined) font.bold = format.bold;
      if (format.italic !== undefined) font.italic = format.italic;
      if (format.underline !== undefined) {
        font.underline = format.underline ? Word.UnderlineType.single : Word.UnderlineType.none;
      }
      if (format.strikethrough !== undefined) font.strikeThrough = format.strikethrough;
    });
  }

  setParagraphFormat(ref: RangeRef, format: Partial<ParagraphFormat>): void {
    const match = /^para-(\d+)$/.exec(ref.id);
    if (!match) return;
    const paraIdxStr = match[1];
    if (paraIdxStr === undefined) return;
    const paraIdx = Number.parseInt(paraIdxStr, 10);
    this.pendingMutations.push((ctx) => {
      // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
      const p = ctx.document.body.paragraphs.items[paraIdx];
      if (!p) return;
      if (format.alignment !== undefined) p.alignment = unmapAlignment(format.alignment);
      if (format.leftIndent !== undefined) p.leftIndent = format.leftIndent;
      if (format.firstLineIndent !== undefined) p.firstLineIndent = format.firstLineIndent;
      if (format.lineSpacing !== undefined) p.lineSpacing = format.lineSpacing;
      if (format.spaceBefore !== undefined) p.spaceBefore = format.spaceBefore;
      if (format.spaceAfter !== undefined) p.spaceAfter = format.spaceAfter;
      // TODO(M2.5): styleName is read-only in M2 — applying a named style
      //             would require assigning p.style / p.styleBuiltIn. Add it
      //             once a rule actually writes it.
    });
  }

  setParagraphText(ref: RangeRef, text: string): void {
    const match = /^para-(\d+)$/.exec(ref.id);
    if (!match) return;
    const paraIdxStr = match[1];
    if (paraIdxStr === undefined) return;
    const paraIdx = Number.parseInt(paraIdxStr, 10);
    // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
    const cachedPara = this.loadedParagraphs[paraIdx];
    const oldText = cachedPara?.text ?? "";
    if (oldText === "") {
      // No cached paragraph — likely because load() was never called on this
      // adapter instance, or a factory created a fresh adapter per call. We
      // cannot compute a minimal diff without oldText; fall back to whole-
      // paragraph replace. Logged so callers can fix the lifecycle bug.
      // eslint-disable-next-line no-console
      console.warn(
        `setParagraphText: no cached paragraph text for para-${paraIdx} — falling back to whole-paragraph replace. Was load() called on this adapter?`,
      );
      this.pendingMutations.push((ctx) => {
        // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
        const p = ctx.document.body.paragraphs.items[paraIdx];
        if (!p) return;
        p.insertText(text, Word.InsertLocation.replace);
      });
      return;
    }
    if (oldText === text) return;
    const edits = minimalReplacements(oldText, text);
    // Optimistically update the in-memory paragraph text so subsequent edits
    // to the same paragraph diff against the post-apply state rather than the
    // pre-apply state. If the Office.js write fails, the cache will drift
    // from reality — but that's the same "index drift if user edits mid-batch"
    // acceptable failure mode already documented on this class.
    if (cachedPara) {
      cachedPara.text = text;
      if (cachedPara.runs[0]) cachedPara.runs[0].text = text;
    }
    this.pendingMutations.push(async (ctx) => {
      // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
      const p = ctx.document.body.paragraphs.items[paraIdx];
      if (!p) {
        // eslint-disable-next-line no-console
        console.warn(`setParagraphText: paragraph ${paraIdx} not found in context`);
        return;
      }
      // Try targeted search-and-replace for each minimal edit. This preserves
      // per-run formatting on everything else in the paragraph. If search
      // misses any edit OR throws (short search strings like "3" are flaky on
      // Word for Mac), fall back to whole-paragraph replace. That flattens
      // formatting, but a formatting flatten is a much better failure mode
      // than a silent no-op — the user can SEE it worked.
      try {
        // eslint-disable-next-line no-console
        console.log(
          `setParagraphText: applying ${edits.length} targeted edit(s) to para-${paraIdx}`,
          edits.map((e) => ({ findLen: e.find.length, replaceLen: e.replace.length })),
        );
        let allEditsMatched = true;
        for (const edit of edits) {
          const results = p.search(edit.find, { matchCase: true });
          results.load("items");
          await ctx.sync();
          const first = results.items[0];
          if (first) {
            first.insertText(edit.replace, Word.InsertLocation.replace);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `setParagraphText: search found no match for "${edit.find}" in para-${paraIdx}`,
            );
            allEditsMatched = false;
          }
        }
        if (!allEditsMatched) {
          // eslint-disable-next-line no-console
          console.warn(
            `setParagraphText: some edits didn't match — falling back to whole-paragraph replace for para-${paraIdx}. Formatting may flatten.`,
          );
          p.insertText(text, Word.InsertLocation.replace);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          "setParagraphText: targeted search-and-replace failed; falling back to whole-paragraph replace. Formatting may flatten.",
          err,
        );
        p.insertText(text, Word.InsertLocation.replace);
      }
    });
  }

  rejectTrackedChange(ref: RangeRef): void {
    // M2 loads tracked changes as an empty list, so no rule queues a reject
    // today. When M2.5 populates loadedTrackedChanges with paragraph-scoped
    // refs (e.g. `tc-para-<paraIdx>-<tcIdx>`), this closure should fetch the
    // corresponding paragraph's TrackedChangeCollection and reject it.
    const match = /^tc-para-(\d+)-(\d+)$/.exec(ref.id);
    if (!match) return;
    const paraIdxStr = match[1];
    if (paraIdxStr === undefined) return;
    const paraIdx = Number.parseInt(paraIdxStr, 10);
    this.pendingMutations.push((ctx) => {
      // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
      const p = ctx.document.body.paragraphs.items[paraIdx];
      if (!p) return;
      const tracked = p.getTrackedChanges();
      // TODO(M2.5): need per-change rejection. rejectAll is close enough for
      //             the strip use case but loses granularity across authors.
      tracked.rejectAll();
    });
  }

  removeImage(ref: RangeRef): void {
    const match = /^img-(\d+)$/.exec(ref.id);
    if (!match) return;
    const imgIdxStr = match[1];
    if (imgIdxStr === undefined) return;
    const imgIdx = Number.parseInt(imgIdxStr, 10);
    this.pendingMutations.push((ctx) => {
      // eslint-disable-next-line security/detect-object-injection -- imgIdx parsed from an id we formatted ourselves in load()
      const img = ctx.document.body.inlinePictures.items[imgIdx];
      if (!img) return;
      img.delete();
    });
  }

  removeComments(): void {
    this.pendingMutations.push(() => {
      // Office.js gotcha: `body.getComments()` returns a NEW proxy on every
      // call; load state doesn't travel with the collection abstractly, only
      // with the specific proxy instance. So we read from `this.preloadedComments`
      // which was populated + sync'd in commit() before this closure ran.
      const comments = this.preloadedComments;
      if (!comments) return;
      for (const c of comments.items) {
        c.delete();
      }
    });
  }

  stripHyperlinkFormatting(ref: RangeRef): void {
    // Hyperlinks are an empty list in M2's load() so no rule queues this today.
    // When M2.5 populates loadedHyperlinks with `link-<idx>` refs pointing at
    // body hyperlink ranges, this closure should reset the run's font to the
    // paragraph's default (i.e. clear blue + underline) while preserving the
    // link target.
    const match = /^link-(\d+)$/.exec(ref.id);
    if (!match) return;
    // TODO(M2.5): implement once body.getHyperlinkRanges() lookup is wired up.
  }

  setListStyle(
    ref: RangeRef,
    style: { type: "bullet" | "number"; markerStyle?: "simple"; level?: number } | null,
  ): void {
    const match = /^para-(\d+)$/.exec(ref.id);
    if (!match) return;
    const paraIdxStr = match[1];
    if (paraIdxStr === undefined) return;
    const paraIdx = Number.parseInt(paraIdxStr, 10);
    this.pendingMutations.push((ctx) => {
      // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
      const p = ctx.document.body.paragraphs.items[paraIdx];
      if (!p) return;
      if (style === null) {
        // Remove the paragraph from any list.
        p.detachFromList();
        return;
      }
      // TODO(M2.5): normalising to a "simple" marker style requires looking up
      //             or creating a list template with the target bullet/number
      //             format, then calling p.attachToList(listId, level). Office.js
      //             doesn't expose a direct "simple bullet" preset, so for M2
      //             we leave the existing list in place — normalise is a no-op
      //             on production until the Playwright harness exercises this
      //             and we decide on a concrete preset.
      void style;
    });
  }

  setTableBorders(ref: RangeRef, borders: { style: "none" | "hairline" } | null): void {
    // Tables aren't yet enumerated by load() (the v1.0 rule is a no-op for
    // keep/normalise and throws on convert), so no rule queues this today.
    // Ref scheme for M2.5: `table-<idx>`.
    const match = /^table-(\d+)$/.exec(ref.id);
    if (!match) return;
    const tableIdxStr = match[1];
    if (tableIdxStr === undefined) return;
    const tableIdx = Number.parseInt(tableIdxStr, 10);
    this.pendingMutations.push((ctx) => {
      const tables = ctx.document.body.tables;
      // eslint-disable-next-line security/detect-object-injection -- tableIdx parsed from an id we formatted ourselves
      const table = tables.items[tableIdx];
      if (!table) return;
      const locations: Word.BorderLocation[] = [
        Word.BorderLocation.top,
        Word.BorderLocation.left,
        Word.BorderLocation.bottom,
        Word.BorderLocation.right,
        Word.BorderLocation.insideHorizontal,
        Word.BorderLocation.insideVertical,
      ];
      if (borders === null || borders.style === "none") {
        for (const loc of locations) {
          table.getBorder(loc).type = Word.BorderType.none;
        }
        return;
      }
      if (borders.style === "hairline") {
        for (const loc of locations) {
          const b = table.getBorder(loc);
          b.type = Word.BorderType.single;
          b.width = 0.25; // points — Word treats <0.5pt as hairline
        }
      }
    });
  }

  removeSectionBreaks(): void {
    // Office.js doesn't expose a direct "delete a section break" primitive.
    // The closest workaround is to search the body for the section-break
    // special character and delete each match's range, but body.search's
    // wildcard coverage is uneven across Word desktop / Mac / Online.
    this.pendingMutations.push((ctx) => {
      // TODO(M2.5): once the Playwright E2E (M2 T12) confirms behaviour across
      //             platforms, implement the search+delete pattern. For now
      //             we no-op so the method doesn't throw; the rule can still
      //             run without blocking the pipeline.
      void ctx;
    });
  }

  selectRange(ref: RangeRef): void {
    // Selection is a user-gesture UI action, not a batched mutation — it must
    // take effect immediately on click, not wait for the next commit(). So we
    // run our own Word.run + sync here rather than queueing into
    // pendingMutations (which is the batch pipeline used by Apply all / safe).
    const paraMatch = /^para-(\d+)$/.exec(ref.id);
    const spellMatch = /^spell-(\d+)-(\d+)-(\d+)$/.exec(ref.id);

    if (paraMatch) {
      const paraIdxStr = paraMatch[1];
      if (paraIdxStr === undefined) return;
      const paraIdx = Number.parseInt(paraIdxStr, 10);
      // Fire-and-forget; caller doesn't await. Log failures rather than throw so
      // a stuck-selection never corrupts the React state machine.
      void (async () => {
        try {
          await this.waitForWordApi();
          await Word.run(async (context) => {
            const paragraphs = context.document.body.paragraphs;
            paragraphs.load("items");
            await context.sync();
            // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted ourselves in load()
            const p = paragraphs.items[paraIdx];
            if (!p) return;
            p.select();
            await context.sync();
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("selectRange failed:", err);
        }
      })();
      return;
    }

    if (spellMatch) {
      const paraIdx = Number.parseInt(spellMatch[1]!, 10);
      const offset = Number.parseInt(spellMatch[2]!, 10);
      const len = Number.parseInt(spellMatch[3]!, 10);
      // eslint-disable-next-line security/detect-object-injection -- values parsed from ids we formatted
      const cachedPara = this.loadedParagraphs[paraIdx];
      if (!cachedPara) return;
      const word = cachedPara.text.slice(offset, offset + len);
      void (async () => {
        try {
          await this.waitForWordApi();
          await Word.run(async (context) => {
            const paragraphs = context.document.body.paragraphs;
            paragraphs.load("items");
            await context.sync();
            // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted
            const p = paragraphs.items[paraIdx];
            if (!p) return;
            // Fall back to paragraph-level selection if word is empty or search
            // is unreliable (e.g. word appears multiple times in paragraph).
            if (!word) {
              p.select();
              await context.sync();
              return;
            }
            try {
              const results = p.search(word, { matchCase: true });
              results.load("items");
              await context.sync();
              const first = results.items[0];
              if (first) {
                first.select();
              } else {
                // Word not found by search — fall back to paragraph selection.
                // eslint-disable-next-line no-console
                console.warn(
                  `selectRange(spell): word "${word}" not found in para-${paraIdx}; selecting paragraph`,
                );
                p.select();
              }
              await context.sync();
            } catch (searchErr) {
              // eslint-disable-next-line no-console
              console.warn(
                "selectRange(spell): search failed; falling back to paragraph select",
                searchErr,
              );
              p.select();
              await context.sync();
            }
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("selectRange(spell) failed:", err);
        }
      })();
    }
  }

  replaceRange(ref: RangeRef, newText: string): void {
    const match = /^spell-(\d+)-(\d+)-(\d+)$/.exec(ref.id);
    if (!match) return;
    const paraIdx = Number.parseInt(match[1]!, 10);
    const offset = Number.parseInt(match[2]!, 10);
    const len = Number.parseInt(match[3]!, 10);
    // eslint-disable-next-line security/detect-object-injection -- values parsed from ids we formatted
    const cachedPara = this.loadedParagraphs[paraIdx];
    if (!cachedPara) return;
    const oldWord = cachedPara.text.slice(offset, offset + len);
    // Optimistically update cache.
    const newFullText =
      cachedPara.text.slice(0, offset) + newText + cachedPara.text.slice(offset + len);
    cachedPara.text = newFullText;
    if (cachedPara.runs[0]) cachedPara.runs[0].text = newFullText;

    this.pendingMutations.push(async (ctx) => {
      // eslint-disable-next-line security/detect-object-injection -- paraIdx parsed from an id we formatted
      const p = ctx.document.body.paragraphs.items[paraIdx];
      if (!p) return;
      try {
        const results = p.search(oldWord, { matchCase: true });
        results.load("items");
        await ctx.sync();
        const first = results.items[0];
        if (first) {
          first.insertText(newText, Word.InsertLocation.replace);
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            `replaceRange: word "${oldWord}" not found in para-${paraIdx}; skipping replacement`,
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("replaceRange failed:", err);
      }
    });
  }

  /**
   * Returns all spelling errors from Word's own engine, as paragraph-scoped
   * ranges with character offsets. Backed by `Word.Document.spellingErrors`
   * (WordApiDesktop 1.4+). On older hosts the property is undefined; the outer
   * try/catch logs a warning and returns [].
   */
  async getSpellingErrorRanges(): Promise<
    Array<{ paragraphIndex: number; text: string; offset: number; length: number }>
  > {
    return this.getErrorRangesFromDocumentProperty("spellingErrors");
  }

  /**
   * Returns all grammar errors from Word's own engine. Same shape as
   * `getSpellingErrorRanges`. Backed by `Word.Document.grammaticalErrors`
   * (WordApiDesktop 1.4+).
   */
  async getGrammarErrorRanges(): Promise<
    Array<{ paragraphIndex: number; text: string; offset: number; length: number }>
  > {
    return this.getErrorRangesFromDocumentProperty("grammaticalErrors");
  }

  /**
   * Shared implementation for the two proofing-error queries. Office.js
   * exposes spelling + grammar errors as two separate `RangeCollection`s on
   * `Word.Document`; the only differences between the two code paths are the
   * property name and the logging tag.
   *
   * Mapping each error range back to our paragraph index uses the range's
   * parent paragraph + a text-match lookup. Office.js `Range` doesn't expose
   * a global character offset, so a text match is the pragmatic fallback.
   * If two paragraphs have identical text, the first match wins — acceptable
   * for realistic legal documents.
   *
   * Not covered by unit tests (Office.js can't be mocked); exercised by the
   * Playwright E2E suite.
   */
  private async getErrorRangesFromDocumentProperty(
    property: "spellingErrors" | "grammaticalErrors",
  ): Promise<Array<{ paragraphIndex: number; text: string; offset: number; length: number }>> {
    await this.waitForWordApi();
    const tag = `[proof:${property}]`;
    const results: Array<{ paragraphIndex: number; text: string; offset: number; length: number }> =
      [];
    try {
      await Word.run(async (context) => {
        const doc = context.document;
        // WordApiDesktop 1.4 properties — not in our @types/office-js so cast.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- property shape documented by Microsoft
        const docAny = doc as any;

        // Diagnostic 1: does the property exist on the document proxy at all?
        const rawProp: unknown = docAny[property];
        // eslint-disable-next-line no-console
        console.log(`${tag} property typeof=${typeof rawProp}, present=${rawProp != null}`);
        if (!rawProp) {
          // eslint-disable-next-line no-console
          console.warn(
            `${tag} property missing on Word.Document — requires WordApiDesktop 1.4. ` +
              `Either your Word build is older OR the property is Windows-only. Returning [].`,
          );
          return;
        }

        // Diagnostic 2: has the proofing engine actually run on this doc?
        // `isSpellingChecked` / `isGrammarChecked` are booleans that track
        // whether the engine has processed the document. If false, the
        // corresponding *Errors RangeCollection will be empty even when the
        // user can see red/green squiggles (the display layer is decoupled
        // from the API-exposed state).
        const checkedProp =
          property === "spellingErrors" ? "isSpellingChecked" : "isGrammarChecked";
        const runMethod = property === "spellingErrors" ? "checkSpelling" : "checkGrammar";
        // eslint-disable-next-line security/detect-object-injection
        const checkedHandle: unknown = docAny[checkedProp];
        // Properties on Office.js proxies need to be loaded before read.
        if (checkedHandle != null) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          doc.load(checkedProp);
          await context.sync();
          // eslint-disable-next-line security/detect-object-injection
          const checked = docAny[checkedProp] as boolean | undefined;
          // eslint-disable-next-line no-console
          console.log(`${tag} ${checkedProp}=${String(checked)}`);
          if (checked === false) {
            // eslint-disable-next-line no-console
            console.log(`${tag} proofing not yet run — calling ${runMethod}()`);
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              docAny[runMethod]();
              await context.sync();
              // eslint-disable-next-line no-console
              console.log(`${tag} ${runMethod}() completed`);
            } catch (runErr) {
              // eslint-disable-next-line no-console
              console.warn(`${tag} ${runMethod}() threw:`, runErr);
            }
          }
        } else {
          // eslint-disable-next-line no-console
          console.log(`${tag} ${checkedProp} not on proxy; skipping warm-up probe`);
        }

        // Re-read the property AFTER potential warm-up.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, security/detect-object-injection
        const errors = docAny[property] as Word.RangeCollection | undefined;
        if (!errors) {
          // eslint-disable-next-line no-console
          console.warn(`${tag} property vanished after warm-up — giving up`);
          return;
        }
        errors.load("items");

        const body = doc.body;
        const paragraphs = body.paragraphs;
        paragraphs.load("items");
        await context.sync();

        // Diagnostic 3: how many raw errors did Word surface?
        // eslint-disable-next-line no-console
        console.log(
          `${tag} post-sync: errors.items.length=${errors.items.length}, ` +
            `paragraphs.items.length=${paragraphs.items.length}`,
        );
        if (errors.items.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `${tag} zero items after sync. Either the doc is clean OR the engine ` +
              `still hasn't populated its API-exposed errors collection. If Word ` +
              `visibly shows squiggles in the doc, this is the bug.`,
          );
          return;
        }

        paragraphs.items.forEach((p) => p.load("text"));
        errors.items.forEach((err) => err.load("text"));
        const parentParas = errors.items.map((err) => err.paragraphs.getFirst());
        parentParas.forEach((p) => p.load("text"));
        await context.sync();

        // Build paragraph-text → first-matching-index map.
        const paraIdxByText = new Map<string, number>();
        paragraphs.items.forEach((p, i) => {
          if (!paraIdxByText.has(p.text)) paraIdxByText.set(p.text, i);
        });

        let unmatchedParent = 0;
        let unmatchedOffset = 0;
        for (let i = 0; i < errors.items.length; i++) {
          // eslint-disable-next-line security/detect-object-injection -- loop counter
          const err = errors.items[i];
          // eslint-disable-next-line security/detect-object-injection -- loop counter
          const parent = parentParas[i];
          if (!err || !parent) continue;
          const errText = err.text;
          const paraText = parent.text;
          const paraIdx = paraIdxByText.get(paraText);
          if (paraIdx === undefined) {
            unmatchedParent++;
            // eslint-disable-next-line no-console
            console.log(
              `${tag} no paragraph-index for err[${i}] "${errText}": ` +
                `parent text "${paraText.slice(0, 60)}${paraText.length > 60 ? "…" : ""}" ` +
                `not in our cached paragraphs`,
            );
            continue;
          }
          const offset = paraText.indexOf(errText);
          if (offset === -1) {
            unmatchedOffset++;
            // eslint-disable-next-line no-console
            console.log(
              `${tag} err[${i}] "${errText}" not found via indexOf in para-${paraIdx} text`,
            );
            continue;
          }
          results.push({
            paragraphIndex: paraIdx,
            text: errText,
            offset,
            length: errText.length,
          });
        }

        // eslint-disable-next-line no-console
        console.log(
          `${tag} mapped ${results.length}/${errors.items.length} errors ` +
            `(unmatched parent=${unmatchedParent}, unmatched offset=${unmatchedOffset})`,
        );
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`${tag} query failed:`, err);
    }
    return results;
  }

  async commit(): Promise<void> {
    if (this.pendingMutations.length === 0) return;
    await this.waitForWordApi();
    const mutations = this.pendingMutations;
    this.pendingMutations = [];
    await Word.run(async (context) => {
      // Load the collections every mutation might touch, once, so closures
      // can index into `.items` immediately.
      const body = context.document.body;
      body.paragraphs.load("items");
      body.inlinePictures.load("items");
      body.tables.load("items");
      // Pre-load comments and store the exact proxy on `this` so the
      // removeComments closure can reference it. Load state is per-proxy;
      // calling body.getComments() a second time inside the closure would
      // return a fresh unloaded proxy and throw PropertyNotLoaded.
      this.preloadedComments = body.getComments();
      this.preloadedComments.load("items");
      await context.sync();

      for (const mutate of mutations) {
        await mutate(context);
      }
      await context.sync();
    });
    // Keep loadedParagraphs/images/etc warm across commits. Proofmark's usage
    // pattern is scan-once, apply-many: the user clicks Proofread (load + scan),
    // then clicks Apply multiple times, each of which commits. If we cleared
    // the caches after each commit, the SECOND Apply would read empty text
    // from loadedParagraphs[idx], breaking setParagraphText's text-diff logic.
    // The caches may drift if the user edits the doc between commits — that's
    // acceptable and matches the existing M2 policy (see class docs).
    // We still clear preloadedComments because its proxy is bound to the
    // Word.run context we just exited.
    this.preloadedComments = null;
  }
}

function mapAlignment(
  a: Word.Alignment | "Mixed" | "Unknown" | "Left" | "Centered" | "Right" | "Justified",
): ParagraphFormat["alignment"] {
  // Office.js returns either the Word.Alignment enum value OR a string literal
  // depending on host version. Handle both.
  switch (a) {
    case Word.Alignment.left:
    case "Left":
      return "left";
    case Word.Alignment.right:
    case "Right":
      return "right";
    case Word.Alignment.centered:
    case "Centered":
      return "center";
    case Word.Alignment.justified:
    case "Justified":
      return "justified";
    default:
      return "left";
  }
}

function unmapAlignment(a: ParagraphFormat["alignment"]): Word.Alignment {
  switch (a) {
    case "left":
      return Word.Alignment.left;
    case "right":
      return Word.Alignment.right;
    case "center":
      return Word.Alignment.centered;
    case "justified":
      return Word.Alignment.justified;
    default:
      return Word.Alignment.left;
  }
}

function mapHeadingStyleName(styleName: string | undefined): HeadingLevel {
  if (!styleName) return null;
  const normalized = styleName.trim().toLowerCase();
  if (normalized === "title") return "title";
  const match = /^heading\s*([1-6])$/.exec(normalized);
  if (!match) return null;
  const level = match[1];
  switch (level) {
    case "1":
      return "heading-1";
    case "2":
      return "heading-2";
    case "3":
      return "heading-3";
    case "4":
      return "heading-4";
    case "5":
      return "heading-5";
    case "6":
      return "heading-6";
    default:
      return null;
  }
}
