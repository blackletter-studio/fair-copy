import type { ReactElement } from "react";
import { Badge, TabList, Tab } from "@fluentui/react-components";

export type ToolName = "fair-copy" | "proofmark";

export interface ToolTabsProps {
  activeTool: ToolName;
  onSelectTool: (tool: "fair-copy") => void;
}

/**
 * Top-of-pane tab strip. "Fair Copy" is active; "Proofmark" is disabled with a
 * "Coming soon" Fluent Badge. Only Fair Copy is selectable in M2.
 */
export function ToolTabs({ activeTool, onSelectTool }: ToolTabsProps): ReactElement {
  return (
    <TabList
      selectedValue={activeTool}
      onTabSelect={(_, data) => {
        if (data.value === "fair-copy") onSelectTool("fair-copy");
      }}
    >
      <Tab value="fair-copy">Fair Copy</Tab>
      <Tab value="proofmark" disabled aria-disabled="true">
        Proofmark{" "}
        <Badge appearance="tint" size="small" style={{ marginLeft: 6 }}>
          Coming soon
        </Badge>
      </Tab>
    </TabList>
  );
}
