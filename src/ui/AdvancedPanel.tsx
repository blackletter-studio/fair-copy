import type { ReactElement } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Dropdown,
  Option,
  Text,
  tokens,
} from "@fluentui/react-components";
import type { Preset, RuleName } from "../engine/types";
import { ThemeToggle } from "./ThemeToggle";
import type { ThemeName } from "./themes";

export interface AdvancedPanelProps {
  preset: Preset;
  overrides: Partial<Record<RuleName, unknown>>;
  onOverrideChange: (rule: RuleName, settings: unknown) => void;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}

interface RuleMeta {
  displayName: string;
  description: string;
  /** The option list the dropdown offers. Each option knows how to produce the
   * new settings object for the rule. */
  options: Array<{
    label: string;
    /** Stable string used as the dropdown value and as the matching key. */
    value: string;
    /** Build the full settings object for this rule from the current settings
     *  (so non-mode fields like `target`, `targetPt`, etc. are preserved). */
    build: (current: unknown) => unknown;
    /** Given the current settings for this rule, does the option match? */
    matches: (current: unknown) => boolean;
  }>;
}

function hasMode(s: unknown): s is { mode: string } {
  return typeof s === "object" && s !== null && "mode" in s;
}

const modeOption = (label: string, value: string): RuleMeta["options"][number] => ({
  label,
  value,
  build: (current) => ({ ...(current as object | undefined), mode: value }),
  matches: (current) => hasMode(current) && current.mode === value,
});

const RULE_META: Record<RuleName, RuleMeta> = {
  "font-face": {
    displayName: "Font face",
    description: "Replace the body font across the document.",
    options: [modeOption("Keep existing", "keep"), modeOption("Change to IBM Plex Sans", "change")],
  },
  "font-size": {
    displayName: "Font size",
    description: "Normalize to a single body size.",
    options: [
      modeOption("Keep existing", "keep"),
      modeOption("One body size", "one-body-size"),
      modeOption("Specific size", "specific"),
    ],
  },
  "colored-text": {
    displayName: "Colored text",
    description: "Convert colored text to black.",
    options: [
      modeOption("Keep colors", "keep"),
      modeOption("Convert to black", "convert-to-black"),
    ],
  },
  highlighting: {
    displayName: "Highlighting",
    description: "Remove highlight colors.",
    options: [modeOption("Keep highlights", "keep"), modeOption("Remove highlights", "remove")],
  },
  "bold-italic-underline": {
    displayName: "Bold / italic / underline",
    description: "Keep or strip character emphasis.",
    options: [
      {
        label: "Keep all",
        value: "keep-all",
        build: () => ({ bold: "keep", italic: "keep", underline: "keep" }),
        matches: (c) => {
          const s = c as { bold?: string; italic?: string; underline?: string } | undefined;
          return s?.bold === "keep" && s?.italic === "keep" && s?.underline === "keep";
        },
      },
      {
        label: "Strip all",
        value: "strip-all",
        build: () => ({ bold: "strip", italic: "strip", underline: "strip" }),
        matches: (c) => {
          const s = c as { bold?: string; italic?: string; underline?: string } | undefined;
          return s?.bold === "strip" && s?.italic === "strip" && s?.underline === "strip";
        },
      },
    ],
  },
  strikethrough: {
    displayName: "Strikethrough",
    description: "Keep or strip strikethrough.",
    options: [modeOption("Keep", "keep"), modeOption("Strip", "strip")],
  },
  alignment: {
    displayName: "Alignment",
    description: "Keep or normalize paragraph alignment.",
    options: [modeOption("Keep", "keep"), modeOption("Set uniform", "set")],
  },
  "line-spacing": {
    displayName: "Line spacing",
    description: "Set consistent line spacing.",
    options: [modeOption("Keep", "keep"), modeOption("Set to 1.15", "set")],
  },
  "paragraph-spacing": {
    displayName: "Paragraph spacing",
    description: "Normalize space before and after paragraphs.",
    options: [modeOption("Keep", "keep"), modeOption("Consistent", "consistent")],
  },
  "indents-and-tabs": {
    displayName: "Indents and tabs",
    description: "Normalize paragraph indents.",
    options: [modeOption("Keep", "keep"), modeOption("Normalize", "normalize")],
  },
  "bullet-lists": {
    displayName: "Bullet lists",
    description: "Normalize or strip bullet list styling.",
    options: [
      modeOption("Keep", "keep"),
      modeOption("Normalize", "normalize"),
      modeOption("Strip", "strip"),
    ],
  },
  "numbered-lists": {
    displayName: "Numbered lists",
    description: "Normalize or strip numbered list styling.",
    options: [
      modeOption("Keep", "keep"),
      modeOption("Normalize", "normalize"),
      modeOption("Strip", "strip"),
    ],
  },
  tables: {
    displayName: "Tables",
    description: "Normalize table borders.",
    options: [
      modeOption("Keep", "keep"),
      modeOption("Normalize", "normalize"),
      modeOption("Convert to text", "convert"),
    ],
  },
  comments: {
    displayName: "Comments",
    description: "Keep or strip document comments.",
    options: [modeOption("Keep", "keep"), modeOption("Strip", "strip")],
  },
  hyperlinks: {
    displayName: "Hyperlinks",
    description: "Keep or strip hyperlink styling.",
    options: [
      modeOption("Keep", "keep"),
      modeOption("Strip formatting", "strip-formatting"),
      modeOption("Strip entirely", "strip-entirely"),
    ],
  },
  "section-breaks": {
    displayName: "Section breaks",
    description: "Keep or strip section breaks.",
    options: [modeOption("Keep", "keep"), modeOption("Strip", "strip")],
  },
};

const CATEGORIES: Array<{ title: string; rules: RuleName[] }> = [
  {
    title: "Visual",
    rules: ["font-face", "font-size", "colored-text", "highlighting"],
  },
  {
    title: "Emphasis",
    rules: ["bold-italic-underline", "strikethrough", "alignment"],
  },
  {
    title: "Spacing",
    rules: ["line-spacing", "paragraph-spacing"],
  },
  {
    title: "Structure",
    rules: ["indents-and-tabs", "bullet-lists", "numbered-lists", "tables"],
  },
  {
    title: "Strip",
    rules: ["comments", "hyperlinks", "section-breaks"],
  },
];

/**
 * Default-collapsed accordion. When opened, reveals 5 sub-accordions of rule
 * rows. Each rule row = display name + one-line description + compact mode
 * dropdown. Theme toggle is pinned to the bottom.
 *
 * When the preset changes upstream, the active preset's rule settings flow
 * in through the `preset` prop and all dropdowns refresh to match (overrides
 * that no longer match an option also refresh visually since we compute the
 * selected option from {...preset, ...overrides}).
 */
export function AdvancedPanel({
  preset,
  overrides,
  onOverrideChange,
  theme,
  onThemeChange,
}: AdvancedPanelProps): ReactElement {
  const effectiveSettings = (rule: RuleName): unknown =>
    // eslint-disable-next-line security/detect-object-injection -- rule comes from the RuleName union
    rule in overrides ? overrides[rule] : preset.rules[rule];

  const renderRuleRow = (rule: RuleName): ReactElement => {
    // eslint-disable-next-line security/detect-object-injection -- rule comes from the RuleName union
    const meta = RULE_META[rule];
    const current = effectiveSettings(rule);
    const selectedOption = meta.options.find((o) => o.matches(current));
    return (
      <div
        key={rule}
        data-testid={`rule-row-${rule}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "8px 0",
          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        }}
      >
        <Text weight="semibold" size={200}>
          {meta.displayName}
        </Text>
        <Text size={100} style={{ color: tokens.colorNeutralForeground2 }}>
          {meta.description}
        </Text>
        <Dropdown
          size="small"
          value={selectedOption?.label ?? ""}
          selectedOptions={selectedOption ? [selectedOption.value] : []}
          onOptionSelect={(_, data) => {
            const opt = meta.options.find((o) => o.value === data.optionValue);
            if (opt) onOverrideChange(rule, opt.build(current));
          }}
          aria-label={`${meta.displayName} mode`}
          style={{ marginTop: 4 }}
        >
          {meta.options.map((opt) => (
            <Option key={opt.value} value={opt.value} text={opt.label}>
              {opt.label}
            </Option>
          ))}
        </Dropdown>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Accordion collapsible>
        <AccordionItem value="advanced">
          <AccordionHeader>Advanced settings</AccordionHeader>
          <AccordionPanel>
            <Accordion multiple collapsible>
              {CATEGORIES.map((cat) => (
                <AccordionItem key={cat.title} value={cat.title}>
                  <AccordionHeader>{cat.title}</AccordionHeader>
                  <AccordionPanel>{cat.rules.map(renderRuleRow)}</AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
            <ThemeToggle theme={theme} onChange={onThemeChange} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
