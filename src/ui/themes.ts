import { createLightTheme, webLightTheme, type Theme } from "@fluentui/react-components";

/**
 * Editorial — V1 brand theme. Fraunces + IBM Plex Sans, ivory paper, oxblood accent.
 */
const editorialBrandRamp = {
  10: "#1a0608",
  20: "#2a0c10",
  30: "#3d1218",
  40: "#521720",
  50: "#6b1e2a", // oxblood
  60: "#883645",
  70: "#a65463",
  80: "#c47382",
  90: "#e093a2",
  100: "#fab4c3",
  110: "#fdcbd5",
  120: "#ffe1e8",
  130: "#fff0f4",
  140: "#fff5f8",
  150: "#fff9fb",
  160: "#fffcfd",
} as const;

const editorialBase = createLightTheme(editorialBrandRamp);

export const editorialTheme: Theme = {
  ...editorialBase,
  colorNeutralBackground1: "#faf6ef", // paper
  colorNeutralBackground2: "#f5f0e5", // slightly darker paper
  colorNeutralForeground1: "#1a1a1a", // ink
  colorNeutralForeground2: "#3a3a3a", // ink-soft
  colorBrandBackground: "#6b1e2a", // oxblood primary
  colorBrandBackgroundHover: "#5a1923",
  colorBrandBackgroundPressed: "#4a141d",
  fontFamilyBase: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "'IBM Plex Mono', 'SF Mono', Menlo, monospace",
};

export const neutralTheme: Theme = webLightTheme;

export type ThemeName = "editorial" | "neutral";

export function getTheme(name: ThemeName): Theme {
  return name === "editorial" ? editorialTheme : neutralTheme;
}
