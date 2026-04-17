import type { DocumentAdapter } from "../../engine/types";
import type { Check, Finding } from "../engine/types";

/**
 * Apply a batch of findings. Each finding is dispatched to the Check whose
 * `name` matches `finding.checkName`; findings whose check is not in the list
 * are skipped. After every apply call, `doc.commit()` is awaited once so that
 * the production adapter performs a single Office.js `context.sync()` per
 * batch (the fake adapter commits synchronously).
 */
export async function applyFindingsInBatch(
  doc: DocumentAdapter,
  checks: Check[],
  findings: Finding[],
): Promise<void> {
  if (findings.length === 0) return;
  const byName = new Map<string, Check>();
  for (const c of checks) {
    byName.set(c.name, c);
  }
  let appliedAny = false;
  for (const finding of findings) {
    const check = byName.get(finding.checkName);
    if (!check) continue;
    check.apply(doc, finding);
    appliedAny = true;
  }
  if (appliedAny) {
    await doc.commit();
  }
}
