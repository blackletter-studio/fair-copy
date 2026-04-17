import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { FluentProvider, Text } from "@fluentui/react-components";
import { WordDocumentAdapter } from "../engine/document-adapter";
import { runPreset, type DestructiveDecision, type RunPresetResult } from "../engine/run-preset";
import { PRESETS } from "../engine/presets";
import type {
  DetectionResult,
  DocumentAdapter,
  DocumentState,
  ImageInfo,
  Preset,
  PresetName,
  RuleName,
  TrackedChangeInfo,
} from "../engine/types";
import {
  incrementCounter,
  isTrialExhausted,
  MAX_FREE_CLEANS,
  remainingFreeCleans,
} from "../settings/counter";
import { OfficeRoamingSettingsStore } from "../settings/roaming-settings";
import { getTheme, type ThemeName } from "../ui/themes";
import { ToolTabs, type ToolName } from "../ui/ToolTabs";
import { PresetDropdown, type PresetKey } from "../ui/PresetDropdown";
import { PresetComparisonExpander } from "../ui/PresetComparisonExpander";
import { CleanButton } from "../ui/CleanButton";
import { CounterCard } from "../ui/CounterCard";
import { AdvancedPanel } from "../ui/AdvancedPanel";
import { PreviewModeBanner } from "../ui/PreviewModeBanner";
import { OnboardingCarousel } from "../ui/OnboardingCarousel";
import { TrackedChangesDialog } from "../ui/TrackedChangesDialog";
import { ImagesDialog } from "../ui/ImagesDialog";
import { MarkedFinalDialog } from "../ui/MarkedFinalDialog";
import { ProofmarkPanel } from "../proofmark/ui/ProofmarkPanel";

/** Kind of the dialog currently being shown to collect a destructive decision. */
type PendingDialogKind = "tracked-changes" | "images" | "marked-final" | null;

/**
 * Factory for the document adapter. Exposed separately so tests can inject a
 * fake adapter without mocking the entire module graph.
 */
export interface AppProps {
  /** Test-only seam — defaults to a real WordDocumentAdapter. */
  createAdapter?: () => DocumentAdapter;
}

export function App({ createAdapter }: AppProps = {}): ReactElement {
  const settingsStore = useMemo(() => new OfficeRoamingSettingsStore(), []);
  const [activeTool, setActiveTool] = useState<ToolName>("fair-copy");
  const [themeName, setThemeName] = useState<ThemeName>("editorial");
  const [presetName, setPresetName] = useState<PresetKey>("standard");
  const [overrides, setOverrides] = useState<Partial<Record<RuleName, unknown>>>({});
  const [remaining, setRemaining] = useState(MAX_FREE_CLEANS);
  const [exhausted, setExhausted] = useState(false);
  const [isLicensed, setIsLicensed] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [cleanState, setCleanState] = useState<"idle" | "cleaning" | "cleaned">("idle");
  const [pendingDialog, setPendingDialog] = useState<PendingDialogKind>(null);
  const [pendingDetections, setPendingDetections] = useState<DetectionResult[] | null>(null);
  const [pendingDecision, setPendingDecision] = useState<DestructiveDecision>({});

  // Bootstrap: load persisted state from roaming settings.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // main.tsx awaits Office.onReady before the first render, but on HMR
      // remounts (and occasionally on cold start under Word for Mac) the
      // useEffect body can execute before `Office.context.roamingSettings`
      // is populated, throwing `TypeError: undefined is not an object`.
      // Re-awaiting is idempotent and cheap.
      await Office.onReady();

      const remainingCount = await remainingFreeCleans(settingsStore);
      const isDone = await isTrialExhausted(settingsStore);
      const firstRunSeen = settingsStore.get<string>("first-run-seen") === "true";
      const licensed = !!settingsStore.get<string>("license-jwt");
      const storedTheme: ThemeName =
        settingsStore.get<ThemeName>("theme-preference") ?? "editorial";

      if (cancelled) return;
      setRemaining(remainingCount);
      setExhausted(isDone);
      setFirstRun(!firstRunSeen);
      setIsLicensed(licensed);
      setThemeName(storedTheme);
    })();
    return () => {
      cancelled = true;
    };
  }, [settingsStore]);

  const dismissOnboarding = async (): Promise<void> => {
    settingsStore.set("first-run-seen", "true");
    await settingsStore.saveAsync();
    setFirstRun(false);
  };

  const updateTheme = async (next: ThemeName): Promise<void> => {
    settingsStore.set("theme-preference", next);
    await settingsStore.saveAsync();
    setThemeName(next);
  };

  // Build the effective preset by layering overrides onto the named preset.
  const activePreset: Preset = {
    name: presetName as PresetName,
    // eslint-disable-next-line security/detect-object-injection -- presetName is constrained by the PresetKey union
    rules: { ...PRESETS[presetName].rules, ...overrides },
  };

  // Resetting to a new named preset clobbers user overrides — this is an
  // explicit UX decision documented in the brief.
  const handlePresetChange = (next: PresetKey): void => {
    setPresetName(next);
    setOverrides({});
  };

  const showFirstDetectionDialog = (detections: DetectionResult[]): void => {
    const first = detections[0];
    if (!first) return;
    setPendingDetections(detections);
    if (first.kind === "tracked-changes") setPendingDialog("tracked-changes");
    else if (first.kind === "images") setPendingDialog("images");
    else if (first.kind === "document-state") setPendingDialog("marked-final");
  };

  const cancelDialog = (): void => {
    setPendingDialog(null);
    setPendingDetections(null);
    setPendingDecision({});
    setCleanState("idle");
  };

  const finalizeCleanSuccess = async (): Promise<void> => {
    setPendingDialog(null);
    setPendingDetections(null);
    setPendingDecision({});
    if (!isLicensed) {
      const newCount = await incrementCounter(settingsStore);
      setRemaining(Math.max(0, MAX_FREE_CLEANS - newCount));
      setExhausted(newCount >= MAX_FREE_CLEANS);
    }
    setCleanState("cleaned");
    window.setTimeout(() => setCleanState("idle"), 1500);
  };

  /**
   * Run the clean orchestrator. If `decision` is omitted, the first call may
   * return `kind: "aborted"` carrying destructive detections. When that
   * happens, we show the first relevant dialog. When the user answers, the
   * dialog re-calls this function with the accumulated decision.
   */
  const handleClean = async (decision?: DestructiveDecision): Promise<void> => {
    setCleanState("cleaning");
    try {
      const adapter = createAdapter ? createAdapter() : new WordDocumentAdapter();
      const result: RunPresetResult = await runPreset(adapter, activePreset, decision);

      if (result.kind === "aborted") {
        showFirstDetectionDialog(result.detections);
        setCleanState("idle");
        return;
      }

      await finalizeCleanSuccess();
    } catch (err) {
      // Surface errors by reverting to idle; future work (M2.5) will show a
      // toast. For now, logging is enough to debug. Extract Office.js error
      // details — code, message, debugInfo — which are the actually useful
      // fields. The default .toString() just gives the function name.
      const e = err as {
        name?: string;
        message?: string;
        code?: string;
        debugInfo?: unknown;
        stack?: string;
      };
      console.error("runPreset failed:", {
        name: e.name,
        message: e.message,
        code: e.code,
        debugInfo: e.debugInfo,
        stack: e.stack,
      });
      setCleanState("idle");
    }
  };

  const handleTrackedChangesDecision = (choice: "review" | "reject" | "leave"): void => {
    const nextDecision: DestructiveDecision = { ...pendingDecision, trackedChanges: choice };
    setPendingDecision(nextDecision);
    setPendingDialog(null);
    setPendingDetections(null);
    void handleClean(nextDecision);
  };

  const handleImagesDecision = (
    choice: "keep-all" | "remove-all" | Record<string, "keep" | "remove">,
  ): void => {
    const mapped: DestructiveDecision["images"] =
      choice === "keep-all" ? "keep" : choice === "remove-all" ? "remove" : choice;
    const nextDecision: DestructiveDecision = { ...pendingDecision, images: mapped };
    setPendingDecision(nextDecision);
    setPendingDialog(null);
    setPendingDetections(null);
    void handleClean(nextDecision);
  };

  const handleMarkedFinalContinue = (): void => {
    const nextDecision: DestructiveDecision = {
      ...pendingDecision,
      continueDespiteMarkedFinal: true,
    };
    setPendingDecision(nextDecision);
    setPendingDialog(null);
    setPendingDetections(null);
    void handleClean(nextDecision);
  };

  const cleanButtonState = cleanState;

  const trackedChangeItems =
    pendingDialog === "tracked-changes" && pendingDetections
      ? ((pendingDetections.find((d) => d.kind === "tracked-changes")?.items as
          | TrackedChangeInfo[]
          | undefined) ?? [])
      : [];
  const imageItems =
    pendingDialog === "images" && pendingDetections
      ? ((pendingDetections.find((d) => d.kind === "images")?.items as ImageInfo[] | undefined) ??
        [])
      : [];
  const documentStateItem =
    pendingDialog === "marked-final" && pendingDetections
      ? (pendingDetections.find((d) => d.kind === "document-state")?.items[0] as
          | DocumentState
          | undefined)
      : undefined;

  return (
    <FluentProvider theme={getTheme(themeName)}>
      {firstRun ? (
        <OnboardingCarousel onDismiss={() => void dismissOnboarding()} />
      ) : (
        <main
          style={{
            padding: 16,
            fontFamily: themeName === "editorial" ? "Fraunces, Georgia, serif" : undefined,
            minHeight: "100vh",
          }}
        >
          <ToolTabs activeTool={activeTool} onSelectTool={setActiveTool} />

          {activeTool === "fair-copy" ? (
            <>
              {exhausted && !isLicensed ? (
                <PreviewModeBanner
                  onGetFairCopy={() =>
                    window.open("https://blackletter.studio/fair-copy", "_blank")
                  }
                  onDismiss={() => {
                    /* banner stays until purchased — intentionally a no-op */
                  }}
                />
              ) : (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <PresetDropdown
                    value={presetName}
                    onChange={handlePresetChange}
                    disabled={cleanState === "cleaning"}
                  />
                  <PresetComparisonExpander />
                  <CleanButton state={cleanButtonState} onClick={() => void handleClean()} />
                  <CounterCard used={MAX_FREE_CLEANS - remaining} isLicensed={isLicensed} />
                </div>
              )}

              <AdvancedPanel
                preset={activePreset}
                overrides={overrides}
                onOverrideChange={(rule, settings) =>
                  setOverrides({ ...overrides, [rule]: settings })
                }
                theme={themeName}
                onThemeChange={(t) => void updateTheme(t)}
              />
            </>
          ) : (
            <ProofmarkPanel
              getDocument={() => (createAdapter ? createAdapter() : new WordDocumentAdapter())}
              settingsStore={settingsStore}
            />
          )}

          {/* Dialog layer */}
          {pendingDialog === "tracked-changes" && (
            <TrackedChangesDialog
              open={true}
              changes={trackedChangeItems}
              onDecide={handleTrackedChangesDecision}
              onCancel={cancelDialog}
            />
          )}
          {pendingDialog === "images" && (
            <ImagesDialog
              open={true}
              images={imageItems}
              defaultChoice="keep"
              onDecide={handleImagesDecision}
              onCancel={cancelDialog}
            />
          )}
          {pendingDialog === "marked-final" && documentStateItem && (
            <MarkedFinalDialog
              open={true}
              state={documentStateItem}
              onContinue={handleMarkedFinalContinue}
              onCancel={cancelDialog}
            />
          )}
        </main>
      )}
    </FluentProvider>
  );
}
