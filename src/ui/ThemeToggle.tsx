import type { ReactElement } from "react";
import { Radio, RadioGroup, Label } from "@fluentui/react-components";
import type { ThemeName } from "./themes";

export interface ThemeToggleProps {
  theme: ThemeName;
  onChange: (theme: ThemeName) => void;
}

/**
 * Radio pair to switch between Editorial (brand) and Neutral (Fluent default)
 * themes. Rendered at the bottom of AdvancedPanel. The caller is responsible
 * for persisting the preference to roaming settings.
 */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps): ReactElement {
  return (
    <div style={{ marginTop: 12 }}>
      <Label id="theme-toggle-label" style={{ display: "block", marginBottom: 4 }}>
        Theme
      </Label>
      <RadioGroup
        aria-labelledby="theme-toggle-label"
        layout="horizontal"
        value={theme}
        onChange={(_, data) => onChange(data.value as ThemeName)}
      >
        <Radio value="editorial" label="Editorial" />
        <Radio value="neutral" label="Neutral" />
      </RadioGroup>
    </div>
  );
}
