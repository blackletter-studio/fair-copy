import React from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import type { Region, RegionName } from "../engine/types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusCircular,
  },
});

export interface RegionBarProps {
  regions: Region[];
  onConfirm: (name: RegionName) => void;
  onDismiss: (name: RegionName) => void;
  onConfirmAll: () => void;
}

export function RegionBar({
  regions,
  onConfirm,
  onDismiss,
  onConfirmAll,
}: RegionBarProps): React.JSX.Element | null {
  const styles = useStyles();
  if (regions.length === 0) return null;
  return (
    <div className={styles.root}>
      <div className={styles.chipRow}>
        {regions.map((region) => (
          <div key={region.name} className={styles.chip}>
            <Text>
              {region.name} ({region.range.length})
            </Text>
            <Button size="small" appearance="subtle" onClick={() => onConfirm(region.name)}>
              Confirm
            </Button>
            <Button size="small" appearance="subtle" onClick={() => onDismiss(region.name)}>
              Dismiss
            </Button>
          </div>
        ))}
      </div>
      <Button appearance="primary" onClick={onConfirmAll}>
        Confirm all
      </Button>
    </div>
  );
}
