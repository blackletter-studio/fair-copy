import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

export const orphanHeadingCheck: Check = {
  name: "orphan-heading",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const paragraphs = doc.getAllParagraphs();
    const findings: Finding[] = [];
    for (let i = 0; i < paragraphs.length - 1; i++) {
      const current = paragraphs[i];
      const next = paragraphs[i + 1];
      if (!current || !next) continue;
      if (doc.getHeadingStyle(current.ref) === null) continue;
      if (doc.getHeadingStyle(next.ref) === null) continue;
      findings.push({
        id: `orphan-heading::${current.ref.id}`,
        checkName: "orphan-heading",
        region: "document",
        range: current.ref,
        excerpt: current.text.slice(0, 140),
        severity: "info",
        confidence: "medium",
        message:
          "Heading has no body content before the next heading — add intro text or remove the heading.",
      });
    }
    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {},
};
