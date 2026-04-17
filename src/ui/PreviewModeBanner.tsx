import type { ReactElement } from "react";
import { Button, Text, tokens } from "@fluentui/react-components";

export interface PreviewModeBannerProps {
  onGetFairCopy: () => void;
  onDismiss: () => void;
}

/**
 * Shown when the user's 5 free cleans are exhausted and they aren't licensed.
 * Replaces the preset dropdown + Clean button with an upgrade prompt.
 */
export function PreviewModeBanner({
  onGetFairCopy,
  onDismiss,
}: PreviewModeBannerProps): ReactElement {
  return (
    <section
      aria-label="Upgrade prompt"
      style={{
        marginTop: 16,
        padding: 16,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: 4,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
      }}
    >
      <Text
        as="h2"
        size={500}
        weight="semibold"
        style={{
          display: "block",
          marginBottom: 8,
          fontFamily: "Fraunces, Georgia, serif",
        }}
      >
        Five documents cleaned. The trial is done.
      </Text>
      <Text as="p" size={300} style={{ marginBottom: 16, color: tokens.colorNeutralForeground2 }}>
        Fair Copy is a one-time $49 — perpetual license, no subscription, yours to own. Works
        offline. Works if we go out of business.
      </Text>
      <div style={{ display: "flex", gap: 8 }}>
        <Button appearance="primary" onClick={onGetFairCopy}>
          Get Fair Copy →
        </Button>
        <Button appearance="subtle" onClick={onDismiss}>
          Not yet
        </Button>
      </div>
    </section>
  );
}
