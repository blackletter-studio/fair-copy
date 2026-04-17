import type { DocumentAdapter } from "../../engine/types";
import type { ProofmarkPreset } from "../presets";
import { deduplicateFindings } from "../findings/dedup";
import type { Check, CheckMode, CheckName, Finding, Region } from "./types";

/** Which checks want a region arg rather than null. */
const REGION_SCOPED_CHECKS: ReadonlySet<CheckName> = new Set<CheckName>(["tense-consistency"]);

function resolveMode(check: Check, preset: ProofmarkPreset): CheckMode {
  const override = preset.checkOverrides[check.name];
  return override ?? check.defaultMode;
}

export function runChecks(
  doc: DocumentAdapter,
  checks: Check[],
  regions: Region[],
  preset: ProofmarkPreset,
): Finding[] {
  const collected: Finding[] = [];
  for (const check of checks) {
    const mode = resolveMode(check, preset);
    if (mode === "off") continue;
    const settings = { mode };
    if (REGION_SCOPED_CHECKS.has(check.name)) {
      for (const region of regions) {
        collected.push(...check.run(doc, region, settings));
      }
    } else {
      collected.push(...check.run(doc, null, settings));
    }
  }
  return deduplicateFindings(collected);
}
