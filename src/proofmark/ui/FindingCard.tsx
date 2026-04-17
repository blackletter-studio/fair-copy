import React from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import type { Finding } from "../engine/types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalS,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  excerpt: {
    fontFamily: "Fraunces, Georgia, serif",
    cursor: "pointer",
    padding: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
    justifyContent: "flex-end",
  },
  confidence: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

const CONFIDENCE_GLYPH: Record<Finding["confidence"], string> = {
  high: "\u25cf",
  medium: "\u25d0",
  low: "\u25cb",
};

export interface FindingCardProps {
  finding: Finding;
  applied?: boolean;
  onApply: (finding: Finding) => void;
  onDismiss: (finding: Finding) => void;
  onScrollTo: (finding: Finding) => void;
  /** When provided and finding.checkName === "spelling", renders an "Add to dictionary" button. */
  onAddToDictionary?: (finding: Finding) => void;
}

export function FindingCard({
  finding,
  applied = false,
  onApply,
  onDismiss,
  onScrollTo,
  onAddToDictionary,
}: FindingCardProps): React.JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Text weight="semibold">{finding.checkName}</Text>
        <Text className={styles.confidence}>
          {CONFIDENCE_GLYPH[finding.confidence]} {finding.confidence}
        </Text>
      </div>
      <Text className={styles.excerpt} onClick={() => onScrollTo(finding)}>
        {finding.excerpt}
      </Text>
      <Text size={200}>{finding.message}</Text>
      {applied ? (
        <Text size={200} italic>
          Applied
        </Text>
      ) : (
        <div className={styles.actions}>
          {finding.suggestedText !== undefined && (
            <Button appearance="primary" size="small" onClick={() => onApply(finding)}>
              Apply
            </Button>
          )}
          {finding.checkName === "spelling" && onAddToDictionary !== undefined && (
            <Button
              appearance="subtle"
              size="small"
              aria-label="Add to dictionary"
              onClick={() => onAddToDictionary(finding)}
            >
              Add word
            </Button>
          )}
          <Button appearance="subtle" size="small" onClick={() => onDismiss(finding)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
