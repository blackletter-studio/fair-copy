import type { ReactElement } from "react";
import { Dropdown, Option } from "@fluentui/react-components";

export type PresetKey = "standard" | "conservative" | "aggressive";

export interface PresetDropdownProps {
  value: PresetKey;
  onChange: (name: PresetKey) => void;
  disabled?: boolean;
}

interface PresetMeta {
  name: string;
  description: string;
}

const PRESET_META: Record<PresetKey, PresetMeta> = {
  standard: {
    name: "Standard",
    description: "Clean but careful. The default.",
  },
  conservative: {
    name: "Conservative",
    description: "Lightest touch. Font and color only.",
  },
  aggressive: {
    name: "Aggressive",
    description: "Maximum flatten. Most formatting stripped.",
  },
};

/**
 * Preset selector. Collapsed row shows just the preset name. Open list shows
 * a bold name on the first line and a small gray description on the second.
 */
export function PresetDropdown({ value, onChange, disabled }: PresetDropdownProps): ReactElement {
  // eslint-disable-next-line security/detect-object-injection -- value is constrained by the PresetKey union
  const currentLabel = PRESET_META[value].name;
  return (
    <Dropdown
      value={currentLabel}
      selectedOptions={[value]}
      disabled={disabled}
      onOptionSelect={(_, data) => {
        if (data.optionValue) onChange(data.optionValue as PresetKey);
      }}
      style={{ width: "100%" }}
    >
      {(Object.keys(PRESET_META) as PresetKey[]).map((key) => {
        // eslint-disable-next-line security/detect-object-injection -- key is iterated from PRESET_META's own keys
        const meta = PRESET_META[key];
        return (
          <Option key={key} value={key} text={meta.name}>
            <div style={{ display: "flex", flexDirection: "column", padding: "2px 0" }}>
              <span style={{ fontWeight: 600 }}>{meta.name}</span>
              <span style={{ fontSize: 12, color: "#3a3a3a" }}>{meta.description}</span>
            </div>
          </Option>
        );
      })}
    </Dropdown>
  );
}
