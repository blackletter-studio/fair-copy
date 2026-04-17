import React, { useCallback, useState } from "react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import type { DocumentAdapter } from "../../engine/types";
import { runChecks } from "../engine/check-engine";
import { detectRegions } from "../engine/region-detector";
import { applyFindingsInBatch } from "../findings/apply-batch";
import { PROOFMARK_PRESETS } from "../presets";
import type { Check, Finding, Region, RegionName } from "../engine/types";
import { straightQuotesCheck } from "../engine/checks/straight-quotes";
import { emEnDashesCheck } from "../engine/checks/em-en-dashes";
import { nonBreakingSectionSignCheck } from "../engine/checks/non-breaking-section-sign";
import { doubleSpaceAfterPeriodCheck } from "../engine/checks/double-space-after-period";
import { ordinalsSuperscriptCheck } from "../engine/checks/ordinals-superscript";
import { definedTermDriftCheck } from "../engine/checks/defined-term-drift";
// legal-homophones is implemented but excluded from the default check set —
// a dictionary-based homophone detector fires on every occurrence of each
// confusable word (e.g., every "there" in the doc), which generates too many
// false positives to be useful. Re-add once we have a grammar-aware variant.
import { citationFormatCheck } from "../engine/checks/citation-format";
import { crossReferenceIntegrityCheck } from "../engine/checks/cross-reference-integrity";
import { partyNameConsistencyCheck } from "../engine/checks/party-name-consistency";
import { numericVsWrittenCheck } from "../engine/checks/numeric-vs-written";
import { tenseConsistencyCheck } from "../engine/checks/tense-consistency";
import { orphanHeadingCheck } from "../engine/checks/orphan-heading";
import { RegionBar } from "./RegionBar";
import { FindingsList } from "./FindingsList";
import { EmptyState } from "./EmptyState";

const ALL_CHECKS: Check[] = [
  straightQuotesCheck,
  emEnDashesCheck,
  nonBreakingSectionSignCheck,
  doubleSpaceAfterPeriodCheck,
  ordinalsSuperscriptCheck,
  definedTermDriftCheck,
  citationFormatCheck,
  crossReferenceIntegrityCheck,
  partyNameConsistencyCheck,
  numericVsWrittenCheck,
  tenseConsistencyCheck,
  orphanHeadingCheck,
];

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
  },
  runButton: {
    width: "100%",
  },
});

export interface ProofmarkSettingsStore {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  saveAsync(): Promise<void>;
}

export interface ProofmarkPanelProps {
  getDocument: () => DocumentAdapter;
  /**
   * Kept in the signature for App.tsx compatibility even though M3 no longer
   * persists any Proofmark state. Ignored by the current implementation.
   */
  settingsStore?: ProofmarkSettingsStore;
}

type ScanState = "idle" | "scanning" | "done";

export function ProofmarkPanel({ getDocument }: ProofmarkPanelProps): React.JSX.Element {
  const styles = useStyles();
  const [regions, setRegions] = useState<Region[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [scanState, setScanState] = useState<ScanState>("idle");

  const handleProofread = useCallback(async () => {
    setScanState("scanning");
    const doc = getDocument();
    if (doc.load) await doc.load();
    const detected = detectRegions(doc);
    setRegions(detected);
    // Single fixed preset — the UI-level preset selector was removed in favor
    // of a simpler read-only model. PROOFMARK_PRESETS.standard runs every
    // wired-in check with no overrides, which is what users expect from a
    // single Proofread button.
    const allFindings = runChecks(doc, ALL_CHECKS, detected, PROOFMARK_PRESETS.standard);
    setAppliedIds(new Set());
    setFindings(allFindings);
    setScanState("done");
  }, [getDocument]);

  const handleApplyAll = useCallback(async () => {
    const doc = getDocument();
    const applicable = findings.filter(
      (f) => !appliedIds.has(f.id) && f.suggestedText !== undefined,
    );
    if (applicable.length === 0) return;
    await applyFindingsInBatch(doc, ALL_CHECKS, applicable);
    setAppliedIds((prev) => {
      const next = new Set(prev);
      for (const f of applicable) next.add(f.id);
      return next;
    });
  }, [findings, appliedIds, getDocument]);

  const handleApplySafe = useCallback(async () => {
    const doc = getDocument();
    const applicable = findings.filter((f) => {
      if (appliedIds.has(f.id)) return false;
      if (f.suggestedText === undefined) return false;
      if (f.confidence !== "high") return false;
      const check = ALL_CHECKS.find((c) => c.name === f.checkName);
      return check?.category === "mechanical";
    });
    if (applicable.length === 0) return;
    await applyFindingsInBatch(doc, ALL_CHECKS, applicable);
    setAppliedIds((prev) => {
      const next = new Set(prev);
      for (const f of applicable) next.add(f.id);
      return next;
    });
  }, [findings, appliedIds, getDocument]);

  const handleConfirmRegion = useCallback((name: RegionName) => {
    setRegions((prev) => prev.map((r) => (r.name === name ? { ...r, confirmed: true } : r)));
  }, []);

  const handleDismissRegion = useCallback((name: RegionName) => {
    setRegions((prev) => prev.filter((r) => r.name !== name));
  }, []);

  const handleConfirmAllRegions = useCallback(() => {
    setRegions((prev) => prev.map((r) => ({ ...r, confirmed: true })));
  }, []);

  const handleApply = useCallback(
    async (finding: Finding) => {
      const doc = getDocument();
      await applyFindingsInBatch(doc, ALL_CHECKS, [finding]);
      setAppliedIds((prev) => {
        const next = new Set(prev);
        next.add(finding.id);
        return next;
      });
    },
    [getDocument],
  );

  const handleDismiss = useCallback((finding: Finding) => {
    setFindings((prev) => prev.filter((f) => f.id !== finding.id));
  }, []);

  const handleScrollTo = useCallback(
    (finding: Finding) => {
      const doc = getDocument();
      doc.selectRange(finding.range);
    },
    [getDocument],
  );

  const buttonLabel =
    scanState === "scanning"
      ? "Scanning\u2026"
      : scanState === "done"
        ? "Proofread again"
        : "Proofread";

  return (
    <div className={styles.root}>
      <Button
        className={styles.runButton}
        appearance="primary"
        disabled={scanState === "scanning"}
        onClick={() => void handleProofread()}
      >
        {buttonLabel}
      </Button>
      <RegionBar
        regions={regions.filter((r) => !r.confirmed)}
        onConfirm={handleConfirmRegion}
        onDismiss={handleDismissRegion}
        onConfirmAll={handleConfirmAllRegions}
      />
      {scanState === "done" && findings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {scanState === "done" && findings.length > 0 && (
            <div style={{ display: "flex", gap: tokens.spacingHorizontalS }}>
              <Button appearance="primary" onClick={() => void handleApplySafe()}>
                Apply safe changes
              </Button>
              <Button appearance="subtle" onClick={() => void handleApplyAll()}>
                Apply all
              </Button>
            </div>
          )}
          <FindingsList
            findings={findings}
            appliedIds={appliedIds}
            onApply={(f) => void handleApply(f)}
            onDismiss={handleDismiss}
            onScrollTo={handleScrollTo}
          />
        </>
      )}
    </div>
  );
}
