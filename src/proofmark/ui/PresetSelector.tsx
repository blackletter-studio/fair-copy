import React from "react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import type { PresetName } from "../presets";

const useStyles = makeStyles({
  root: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalXS,
  },
  button: {
    flex: 1,
  },
});

const VISIBLE: Array<Exclude<PresetName, "custom">> = ["quiet", "standard", "loud"];

export interface PresetSelectorProps {
  value: Exclude<PresetName, "custom">;
  onChange: (name: Exclude<PresetName, "custom">) => void;
}

export function PresetSelector({ value, onChange }: PresetSelectorProps): React.JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root} role="group" aria-label="Proofmark preset">
      {VISIBLE.map((name) => {
        const selected = value === name;
        return (
          <Button
            key={name}
            className={styles.button}
            appearance={selected ? "primary" : "subtle"}
            aria-pressed={selected}
            onClick={() => onChange(name)}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </Button>
        );
      })}
    </div>
  );
}
