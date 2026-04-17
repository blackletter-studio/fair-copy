import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
} from "@fluentui/react-components";
import type { ReactElement } from "react";
import type { DocumentState } from "../engine/types";

export interface MarkedFinalDialogProps {
  open: boolean;
  state: DocumentState;
  onContinue: () => void;
  onCancel: () => void;
}

export function MarkedFinalDialog({
  open,
  state,
  onContinue,
  onCancel,
}: MarkedFinalDialogProps): ReactElement {
  const issues: string[] = [];
  if (state.isMarkedFinal) issues.push("The document is marked Final.");
  if (state.isPasswordProtected) issues.push("The document is password protected.");
  if (state.hasActiveComments) {
    issues.push(
      `The document has ${state.commentCount} active comment${state.commentCount === 1 ? "" : "s"}.`,
    );
  }

  return (
    <Dialog open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Pre-clean checks</DialogTitle>
          <DialogContent>
            <p>Before cleaning:</p>
            <ul>
              {issues.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <p>Continue anyway?</p>
          </DialogContent>
          <DialogActions>
            <Button appearance="subtle" onClick={onCancel}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={onContinue}>
              Continue
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
