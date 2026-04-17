import type { ReactElement } from "react";
import { Tooltip, Text, tokens } from "@fluentui/react-components";

export interface CounterCardProps {
  used: number;
  total?: number;
  isLicensed?: boolean;
}

/**
 * 5-segment horizontal progress bar showing free cleans used. Oxblood-filled
 * segments for used cleans, neutral for remaining. Hover shows a Fluent
 * Tooltip with the remaining count. When `isLicensed` is true, the bar is
 * replaced with a short text label.
 */
export function CounterCard({
  used,
  total = 5,
  isLicensed = false,
}: CounterCardProps): ReactElement {
  if (isLicensed) {
    return (
      <div style={{ marginTop: 12, padding: 8 }}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Licensed — unlimited cleans
        </Text>
      </div>
    );
  }

  const remaining = Math.max(0, total - used);
  const tooltipContent = `${remaining} of ${total} free cleans remaining`;
  const segments = Array.from({ length: total }, (_, i) => i < used);

  return (
    <Tooltip content={tooltipContent} relationship="description">
      <div
        role="progressbar"
        aria-label={tooltipContent}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={total}
        style={{
          marginTop: 12,
          display: "flex",
          gap: 4,
          height: 8,
        }}
      >
        {segments.map((filled, i) => (
          <div
            key={i}
            data-testid="counter-segment"
            data-filled={filled ? "true" : "false"}
            style={{
              flex: 1,
              borderRadius: 2,
              backgroundColor: filled
                ? tokens.colorBrandBackground
                : tokens.colorNeutralBackground2,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
            }}
          />
        ))}
      </div>
    </Tooltip>
  );
}
