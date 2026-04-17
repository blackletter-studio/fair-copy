import React, { useCallback, useState } from "react";
import { Button, Tab, TabList, makeStyles, tokens } from "@fluentui/react-components";
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
import { spellingCheck, runSpelling } from "../engine/checks/spelling";
import { grammarCheck, runGrammar } from "../engine/checks/grammar";
import { legalUsageCheck } from "../engine/checks/legal-usage";
import { RegionBar } from "./RegionBar";
import { FindingsList } from "./FindingsList";
import { EmptyState } from "./EmptyState";
import { CustomWordsManager } from "./CustomWordsManager";

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
  spellingCheck,
  grammarCheck,
  legalUsageCheck,
];

type ProofmarkTab = "spelling" | "grammar" | "style";

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
  emptyTab: {
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
    padding: `${tokens.spacingVerticalS} 0`,
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
   * Used for persisting the custom spell-check dictionary across sessions.
   * When provided, "Add to dictionary" is enabled on spelling findings.
   */
  settingsStore?: ProofmarkSettingsStore;
}

type ScanState = "idle" | "scanning" | "done";

export function ProofmarkPanel({
  getDocument,
  settingsStore,
}: ProofmarkPanelProps): React.JSX.Element {
  const styles = useStyles();
  const [regions, setRegions] = useState<Region[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [activeTab, setActiveTab] = useState<ProofmarkTab>("spelling");
  // Mirror the persisted custom dictionary in React state so the manager UI
  // re-renders immediately on add/remove. The settings store is the source of
  // truth on disk; this state is the source of truth for UI rendering.
  const [customWords, setCustomWords] = useState<string[]>(
    () => settingsStore?.get<string[]>("proofmark-custom-dict") ?? [],
  );

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
    const checkFindings = runChecks(doc, ALL_CHECKS, detected, PROOFMARK_PRESETS.standard);
    const spellingFindings = await runSpelling(doc, customWords);
    const grammarFindings = await runGrammar(doc, customWords);
    const allFindings = [...checkFindings, ...spellingFindings, ...grammarFindings];
    setAppliedIds(new Set());
    setFindings(allFindings);
    setActiveTab("spelling");
    setScanState("done");
  }, [getDocument, customWords]);

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
      // eslint-disable-next-line no-console
      console.log("Proofmark: handleApply fired for", finding.checkName, finding.range.id);
      try {
        const doc = getDocument();
        await applyFindingsInBatch(doc, ALL_CHECKS, [finding]);
        // eslint-disable-next-line no-console
        console.log("Proofmark: applyFindingsInBatch resolved for", finding.id);
        setAppliedIds((prev) => {
          const next = new Set(prev);
          next.add(finding.id);
          return next;
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Proofmark: handleApply failed for", finding.id, err);
      }
    },
    [getDocument],
  );

  const handleDismiss = useCallback((finding: Finding) => {
    setFindings((prev) => prev.filter((f) => f.id !== finding.id));
  }, []);

  const handleAddToDictionary = useCallback(
    (finding: Finding) => {
      const word = (finding.metadata as { word?: string } | undefined)?.word;
      if (!word || !settingsStore) return;
      if (customWords.includes(word)) return;
      const next = [...customWords, word];
      setCustomWords(next);
      settingsStore.set("proofmark-custom-dict", next);
      void settingsStore.saveAsync();
      // Also clear the finding from the current list — the word is now
      // suppressed, so it shouldn't keep showing up on this scan.
      setFindings((prev) => prev.filter((f) => f.id !== finding.id));
    },
    [customWords, settingsStore],
  );

  const handleRemoveFromDictionary = useCallback(
    (word: string) => {
      if (!settingsStore) return;
      if (!customWords.includes(word)) return;
      const next = customWords.filter((w) => w !== word);
      setCustomWords(next);
      settingsStore.set("proofmark-custom-dict", next);
      void settingsStore.saveAsync();
      // Note: we don't re-flag the word on the current scan. The next
      // Proofread pass will surface it again if Word still flags it.
    },
    [customWords, settingsStore],
  );

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

  // Partition findings into the three tab buckets.
  const spellingFindings = findings.filter((f) => f.checkName === "spelling");
  const grammarFindings = findings.filter((f) => f.checkName === "grammar");
  const styleFindings = findings.filter(
    (f) => f.checkName !== "spelling" && f.checkName !== "grammar",
  );
  const activeFindings =
    activeTab === "spelling"
      ? spellingFindings
      : activeTab === "grammar"
        ? grammarFindings
        : styleFindings;

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
            <>
              <div style={{ display: "flex", gap: tokens.spacingHorizontalS }}>
                <Button appearance="primary" onClick={() => void handleApplySafe()}>
                  Apply safe changes
                </Button>
                <Button appearance="subtle" onClick={() => void handleApplyAll()}>
                  Apply all
                </Button>
              </div>
              <TabList
                selectedValue={activeTab}
                onTabSelect={(_, data) => {
                  if (
                    data.value === "spelling" ||
                    data.value === "grammar" ||
                    data.value === "style"
                  ) {
                    setActiveTab(data.value);
                  }
                }}
              >
                <Tab value="spelling">Spelling ({spellingFindings.length})</Tab>
                <Tab value="grammar">Grammar ({grammarFindings.length})</Tab>
                <Tab value="style">Style ({styleFindings.length})</Tab>
              </TabList>
              {activeFindings.length === 0 ? (
                <p className={styles.emptyTab}>No findings in this category.</p>
              ) : (
                <FindingsList
                  findings={activeFindings}
                  appliedIds={appliedIds}
                  onApply={(f) => void handleApply(f)}
                  onDismiss={handleDismiss}
                  onScrollTo={handleScrollTo}
                  onAddToDictionary={settingsStore ? handleAddToDictionary : undefined}
                />
              )}
              {activeTab === "spelling" && settingsStore && (
                <CustomWordsManager words={customWords} onRemove={handleRemoveFromDictionary} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
