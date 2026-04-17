import type { Finding, FindingSeverity } from "../engine/types";

const SEVERITY_RANK: Record<FindingSeverity, number> = { info: 0, warn: 1, error: 2 };

/**
 * Merge overlapping findings.
 * - Same check + same range: keep the higher-severity one; break ties by array order.
 * - Different checks: keep both (they flag distinct concerns).
 * - Empty input: return empty array.
 */
export function deduplicateFindings(findings: Finding[]): Finding[] {
  const byKey = new Map<string, Finding>();
  for (const f of findings) {
    const key = `${f.checkName}::${f.range.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, f);
      continue;
    }
    const existingRank = SEVERITY_RANK[existing.severity];
    const incomingRank = SEVERITY_RANK[f.severity];
    if (incomingRank > existingRank) {
      byKey.set(key, f);
    }
  }
  return Array.from(byKey.values());
}
