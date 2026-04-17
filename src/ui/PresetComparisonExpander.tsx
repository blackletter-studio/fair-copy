import { useState, type ReactElement } from "react";

export interface PresetComparisonExpanderProps {
  /** Optional controlled prop. If omitted, uses internal state. */
  open?: boolean;
  onToggle?: () => void;
}

interface ComparisonRow {
  preset: string;
  keeps: string;
  changes: string;
  strips: string;
}

const COMPARISON: ComparisonRow[] = [
  {
    preset: "Standard",
    keeps: "Bold, italic, underline, alignment",
    changes: "Font face, size, line spacing",
    strips: "Colors, highlights, comments",
  },
  {
    preset: "Conservative",
    keeps: "Almost everything — spacing, lists, tables",
    changes: "Font face",
    strips: "Colored text",
  },
  {
    preset: "Aggressive",
    keeps: "Bold, italic, underline, alignment",
    changes: "Font, size, spacing, indents",
    strips: "Lists, section breaks, strikethrough, colors, highlights",
  },
];

/**
 * "What's the difference?" text link. When clicked, expands an inline
 * comparison table showing what each of the three presets keeps, changes,
 * and strips.
 */
export function PresetComparisonExpander({
  open: controlledOpen,
  onToggle,
}: PresetComparisonExpanderProps): ReactElement {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleClick = (): void => {
    if (onToggle) onToggle();
    if (!isControlled) setInternalOpen(!internalOpen);
  };

  return (
    <div style={{ margin: "8px 0" }}>
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "#6b1e2a",
          textDecoration: "underline",
          fontSize: 13,
        }}
      >
        What{"'"}s the difference?
      </button>
      {open && (
        <table
          role="table"
          aria-label="Preset comparison"
          style={{
            width: "100%",
            marginTop: 8,
            fontSize: 12,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #00000022" }}>
              <th style={{ textAlign: "left", padding: 4 }}>Preset</th>
              <th style={{ textAlign: "left", padding: 4 }}>Keeps</th>
              <th style={{ textAlign: "left", padding: 4 }}>Changes</th>
              <th style={{ textAlign: "left", padding: 4 }}>Strips</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.preset} style={{ borderBottom: "1px solid #00000011" }}>
                <td style={{ padding: 4, fontWeight: 600 }}>{row.preset}</td>
                <td style={{ padding: 4 }}>{row.keeps}</td>
                <td style={{ padding: 4 }}>{row.changes}</td>
                <td style={{ padding: 4 }}>{row.strips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
