import React, { useCallback, useEffect, useState } from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import type { DocumentAdapter } from "../../engine/types";
import { runChecks } from "../engine/check-engine";
import { detectRegions } from "../engine/region-detector";
import { applyFindingsInBatch } from "../findings/apply-batch";
import { PROOFMARK_PRESETS, resolvePreset, type PresetName } from "../presets";
import type { Check, ConfidenceTier, Finding, Region, RegionName } from "../engine/types";
import { straightQuotesCheck } from "../engine/checks/straight-quotes";
import { emEnDashesCheck } from "../engine/checks/em-en-dashes";
import { nonBreakingSectionSignCheck } from "../engine/checks/non-breaking-section-sign";
import { doubleSpaceAfterPeriodCheck } from "../engine/checks/double-space-after-period";
import { ordinalsSuperscriptCheck } from "../engine/checks/ordinals-superscript";
import { definedTermDriftCheck } from "../engine/checks/defined-term-drift";
import { legalHomophonesCheck } from "../engine/checks/legal-homophones";
import { citationFormatCheck } from "../engine/checks/citation-format";
import { crossReferenceIntegrityCheck } from "../engine/checks/cross-reference-integrity";
import { partyNameConsistencyCheck } from "../engine/checks/party-name-consistency";
import { numericVsWrittenCheck } from "../engine/checks/numeric-vs-written";
import { tenseConsistencyCheck } from "../engine/checks/tense-consistency";
import { orphanHeadingCheck } from "../engine/checks/orphan-heading";
import { PresetSelector } from "./PresetSelector";
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
  legalHomophonesCheck,
  citationFormatCheck,
  crossReferenceIntegrityCheck,
  partyNameConsistencyCheck,
  numericVsWrittenCheck,
  tenseConsistencyCheck,
  orphanHeadingCheck,
];

const CONFIDENCE_RANK: Record<ConfidenceTier, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

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
  settingsStore?: ProofmarkSettingsStore;
}

type ScanState = "idle" | "scanning" | "done";

export function ProofmarkPanel({
  getDocument,
  settingsStore,
}: ProofmarkPanelProps): React.JSX.Element {
  const styles = useStyles();
  const [presetName, setPresetName] = useState<Exclude<PresetName, "custom">>("standard");
  const [regions, setRegions] = useState<Region[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [scanState, setScanState] = useState<ScanState>("idle");

  useEffect(() => {
    if (!settingsStore) return;
    const stored = settingsStore.get<string>("proofmark-preset");
    if (stored === "quiet" || stored === "standard" || stored === "loud") {
      setPresetName(stored);
    }
  }, [settingsStore]);

  const handlePresetChange = useCallback(
    (next: Exclude<PresetName, "custom">) => {
      setPresetName(next);
      if (!settingsStore) return;
      settingsStore.set("proofmark-preset", next);
      void settingsStore.saveAsync();
    },
    [settingsStore],
  );

  const handleProofread = useCallback(async () => {
    setScanState("scanning");
    const doc = getDocument();
    if (doc.load) await doc.load();
    const detected = detectRegions(doc);
    setRegions(detected);
    const preset = resolvePreset(presetName);
    const allFindings = runChecks(doc, ALL_CHECKS, detected, preset);

    const threshold = preset.autoApplyThreshold;
    const autoApply: Finding[] = [];
    const remainder: Finding[] = [];
    if (threshold === "off") {
      remainder.push(...allFindings);
    } else {
      const minRank = CONFIDENCE_RANK[threshold];
      for (const f of allFindings) {
        const rank = CONFIDENCE_RANK[f.confidence];
        const check = ALL_CHECKS.find((c) => c.name === f.checkName);
        if (check?.category === "mechanical" && rank >= minRank) {
          autoApply.push(f);
        } else {
          remainder.push(f);
        }
      }
    }

    if (autoApply.length > 0) {
      await applyFindingsInBatch(doc, ALL_CHECKS, autoApply);
    }

    setAppliedIds(new Set(autoApply.map((f) => f.id)));
    setFindings([...autoApply, ...remainder]);
    setScanState("done");
  }, [getDocument, presetName]);

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

  const handleScrollTo = useCallback((_finding: Finding) => {
    // Production adapter exposes a range.select() primitive; fake no-ops.
  }, []);

  const buttonLabel =
    scanState === "scanning"
      ? "Scanning\u2026"
      : scanState === "done"
        ? "Proofread again"
        : "Proofread";

  return (
    <div className={styles.root}>
      <PresetSelector value={presetName} onChange={handlePresetChange} />
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
        <FindingsList
          findings={findings}
          appliedIds={appliedIds}
          onApply={(f) => void handleApply(f)}
          onDismiss={handleDismiss}
          onScrollTo={handleScrollTo}
        />
      )}
      <Text size={200}>Active preset: {PROOFMARK_PRESETS[presetName].name}</Text>
    </div>
  );
}
