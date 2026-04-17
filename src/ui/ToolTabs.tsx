import type { ReactElement } from "react";
import { TabList, Tab } from "@fluentui/react-components";

export type ToolName = "fair-copy" | "proofmark";

export interface ToolTabsProps {
  activeTool: ToolName;
  onSelectTool: (tool: ToolName) => void;
}

/**
 * Top-of-pane tab strip. Both Fair Copy and Proofmark are selectable.
 * Proofmark was gated behind a "Coming soon" Badge during M2; M3 enables it.
 */
export function ToolTabs({ activeTool, onSelectTool }: ToolTabsProps): ReactElement {
  return (
    <TabList
      selectedValue={activeTool}
      onTabSelect={(_, data) => {
        if (data.value === "fair-copy" || data.value === "proofmark") {
          onSelectTool(data.value);
        }
      }}
    >
      <Tab value="fair-copy">Fair Copy</Tab>
      <Tab value="proofmark">Proofmark</Tab>
    </TabList>
  );
}
