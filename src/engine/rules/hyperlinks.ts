import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface HyperlinksSettings {
  mode: "keep" | "strip-formatting" | "strip-entirely";
}

export const hyperlinksRule: Rule = {
  name: "hyperlinks" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as HyperlinksSettings;
    if (s.mode === "keep") return;
    if (s.mode === "strip-entirely") {
      throw new Error("Rule 'hyperlinks': mode 'strip-entirely' not supported in v1.0.");
    }
    // strip-formatting
    for (const link of doc.getAllHyperlinks()) {
      doc.stripHyperlinkFormatting(link.ref);
    }
  },
};
