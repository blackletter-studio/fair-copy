import React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

/**
 * CustomWordsManager — shows the user's custom spelling dictionary in a
 * collapsible section, with a × button on each word to remove it.
 *
 * ## Why this exists
 * The Spelling tab has an "Add word" button that appends to the custom dict
 * (which is really a suppression list — Word's engine still has its own red
 * squiggle on the word, we just skip listing it in Proofmark). Without a way
 * to see and undo those additions, a fat-fingered "Add" becomes permanent.
 * This manager gives users that control.
 *
 * Renders nothing when the dictionary is empty — no point showing an empty
 * accordion that does nothing.
 */

const useStyles = makeStyles({
  help: {
    display: "block",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    paddingBottom: tokens.spacingVerticalXS,
  },
  panel: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXS,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    fontSize: tokens.fontSizeBase200,
  },
  removeButton: {
    minWidth: "auto",
    padding: 0,
    height: tokens.lineHeightBase200,
  },
});

export interface CustomWordsManagerProps {
  words: readonly string[];
  onRemove: (word: string) => void;
}

export function CustomWordsManager({
  words,
  onRemove,
}: CustomWordsManagerProps): React.JSX.Element | null {
  const styles = useStyles();
  if (words.length === 0) return null;
  return (
    <Accordion collapsible>
      <AccordionItem value="custom-dict">
        <AccordionHeader>Custom dictionary ({words.length})</AccordionHeader>
        <AccordionPanel>
          <span className={styles.help}>
            Proofmark skips these words. Word's own spellcheck is unaffected — to add a word to
            Word's dictionary, right-click it in the document.
          </span>
          <div className={styles.panel}>
            {words.map((word) => (
              <span key={word} className={styles.chip}>
                <span>{word}</span>
                <Button
                  className={styles.removeButton}
                  appearance="subtle"
                  size="small"
                  icon={<DismissRegular />}
                  aria-label={`Remove ${word} from custom dictionary`}
                  onClick={() => onRemove(word)}
                />
              </span>
            ))}
          </div>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
