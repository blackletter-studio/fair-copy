import type { ReactElement } from "react";
import { Button, Spinner } from "@fluentui/react-components";

export type CleanButtonState = "idle" | "cleaning" | "cleaned" | "disabled" | "upgrade";

export interface CleanButtonProps {
  onClick: () => void;
  state: CleanButtonState;
  disabled?: boolean;
}

/**
 * Primary action button for the task pane. States:
 *  - idle:     "Clean document"
 *  - cleaning: "Cleaning…" + inline spinner
 *  - cleaned:  "✓ Cleaned" (flash, caller flips back to idle after ~1.5s)
 *  - disabled: "Clean document" rendered with disabled=true
 *  - upgrade:  "Upgrade" — caller should wire onClick to open the upgrade URL
 */
export function CleanButton({ onClick, state, disabled }: CleanButtonProps): ReactElement {
  const isBusy = state === "cleaning";
  const isDone = state === "cleaned";
  const isDisabled = disabled || state === "disabled" || isBusy;

  let label: ReactElement | string;
  if (state === "cleaning") {
    label = (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Spinner size="tiny" />
        Cleaning…
      </span>
    );
  } else if (state === "cleaned") {
    label = "✓ Cleaned";
  } else if (state === "upgrade") {
    label = "Upgrade";
  } else {
    label = "Clean document";
  }

  return (
    <Button
      appearance="primary"
      disabled={isDisabled}
      onClick={onClick}
      style={{ width: "100%", marginTop: 12 }}
      aria-live={isBusy || isDone ? "polite" : undefined}
    >
      {label}
    </Button>
  );
}
