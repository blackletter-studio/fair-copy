import type { ReactElement } from "react";
import { Button, Text } from "@fluentui/react-components";

export function App(): ReactElement {
  return (
    <main style={{ padding: 24, fontFamily: "Fraunces, Georgia, serif" }}>
      <Text as="h1" size={600} weight="regular" style={{ marginBottom: 16 }}>
        Fair Copy <span style={{ color: "#6b1e2a", fontStyle: "italic" }}>&middot;</span> dev
      </Text>
      <Text as="p" size={300} style={{ marginBottom: 24, color: "#3a3a3a" }}>
        M0 scaffold. Clean button here in M2.
      </Text>
      <Button appearance="primary" disabled>
        Clean (coming in M2)
      </Button>
    </main>
  );
}
