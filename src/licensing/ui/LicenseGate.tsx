import React from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    textAlign: "center",
  },
  headline: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  body: {
    color: tokens.colorNeutralForeground2,
  },
});

export interface LicenseGateProps {
  onActivate: () => void;
}

export function LicenseGate({ onActivate }: LicenseGateProps): React.JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <Text className={styles.headline}>Activate Fair Copy</Text>
      <Text className={styles.body}>
        Fair Copy is the paid toolset for clause, citation, and layout cleanup. Proofmark stays
        free. Enter a license code to unlock Fair Copy on this device.
      </Text>
      <Button appearance="primary" onClick={onActivate}>
        Enter license code
      </Button>
    </div>
  );
}
