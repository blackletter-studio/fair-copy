import React from "react";
import { Text, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
  },
  glyph: {
    fontSize: tokens.fontSizeHero700,
  },
});

export function EmptyState(): React.JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root} role="status">
      <span className={styles.glyph} aria-hidden>
        {"\u2713"}
      </span>
      <Text size={400} weight="semibold">
        No findings in this pass.
      </Text>
      <Text size={300}>
        This isn&apos;t a guarantee — Proofmark flags what it can, but a human reader is still the
        authority.
      </Text>
    </div>
  );
}
