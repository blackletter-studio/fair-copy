import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface TablesSettings {
  mode: "keep" | "normalize" | "convert";
}

export const tablesRule: Rule = {
  name: "tables" as RuleName,
  apply(_doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as TablesSettings;
    if (settings.mode === "keep" || settings.mode === "normalize") {
      // Real table-border normalization lands in M2 Task 8 alongside
      // WordDocumentAdapter.getAllTables() enumeration. For now: no-op.
      return;
    }
    if (settings.mode === "convert") {
      throw new Error(
        "Rule 'tables': mode 'convert' is not supported in v1.0 — use 'keep' or 'normalize'.",
      );
    }
  },
};
