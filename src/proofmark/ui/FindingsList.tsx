import React from "react";
import { Text, makeStyles, tokens } from "@fluentui/react-components";
import type { Finding } from "../engine/types";
import { FindingCard } from "./FindingCard";

const VIRTUALIZATION_CAP = 100;

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  groupHeader: {
    fontWeight: tokens.fontWeightSemibold,
    textTransform: "capitalize",
    marginBottom: tokens.spacingVerticalXS,
  },
  capNote: {
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },
});

export interface FindingsListProps {
  findings: Finding[];
  appliedIds: Set<string>;
  onApply: (finding: Finding) => void;
  onDismiss: (finding: Finding) => void;
  onScrollTo: (finding: Finding) => void;
  onAddToDictionary?: (finding: Finding) => void;
}

export function FindingsList({
  findings,
  appliedIds,
  onApply,
  onDismiss,
  onScrollTo,
  onAddToDictionary,
}: FindingsListProps): React.JSX.Element {
  const styles = useStyles();
  const totalCount = findings.length;
  const visible = findings.slice(0, VIRTUALIZATION_CAP);

  const grouped = new Map<string, Finding[]>();
  for (const f of visible) {
    const key = f.region;
    const bucket = grouped.get(key) ?? [];
    bucket.push(f);
    grouped.set(key, bucket);
  }

  return (
    <div className={styles.root}>
      {Array.from(grouped.entries()).map(([region, items]) => (
        <section key={region}>
          <Text className={styles.groupHeader}>{region}</Text>
          {items.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              applied={appliedIds.has(finding.id)}
              onApply={onApply}
              onDismiss={onDismiss}
              onScrollTo={onScrollTo}
              onAddToDictionary={onAddToDictionary}
            />
          ))}
        </section>
      ))}
      {totalCount > VIRTUALIZATION_CAP && (
        <Text className={styles.capNote}>
          Showing {VIRTUALIZATION_CAP} of {totalCount}. Refine the preset or fix the top findings to
          see more.
        </Text>
      )}
    </div>
  );
}
