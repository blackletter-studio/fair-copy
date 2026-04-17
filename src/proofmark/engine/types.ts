import type { DocumentAdapter, RangeRef } from "../../engine/types";

export type CheckName =
  | "straight-quotes"
  | "em-en-dashes"
  | "non-breaking-section-sign"
  | "double-space-after-period"
  | "ordinals-superscript"
  | "defined-term-drift"
  | "legal-homophones"
  | "citation-format"
  | "cross-reference-integrity"
  | "party-name-consistency"
  | "numeric-vs-written"
  | "tense-consistency"
  | "orphan-heading"
  | "spelling";

export type RegionName =
  | "recitals"
  | "definitions"
  | "indemnification"
  | "line-items"
  | "signature-block";

export type ConfidenceTier = "high" | "medium" | "low";
export type FindingSeverity = "info" | "warn" | "error";
export type CheckMode = "destructive" | "interactive" | "off";

/** A detected structural region of the document. */
export interface Region {
  name: RegionName;
  range: RangeRef[];
  confidence: ConfidenceTier;
  confirmed: boolean;
}

/** A single flagged range produced by a Check. */
export interface Finding {
  id: string;
  checkName: CheckName;
  region: RegionName | "document";
  range: RangeRef;
  excerpt: string;
  severity: FindingSeverity;
  confidence: ConfidenceTier;
  message: string;
  suggestedText?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckSettings {
  mode: CheckMode;
}

/** The contract every Proofmark check implements. */
export interface Check {
  readonly name: CheckName;
  readonly category: "mechanical" | "semantic";
  readonly defaultMode: CheckMode;
  run(doc: DocumentAdapter, region: Region | null, settings: CheckSettings): Finding[];
  apply(doc: DocumentAdapter, finding: Finding): void;
}
