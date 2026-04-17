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
import type { TrackedChangeInfo } from "../engine/types";

export interface TrackedChangesDialogProps {
  open: boolean;
  changes: TrackedChangeInfo[];
  onDecide: (decision: "review" | "reject" | "leave") => void;
  onCancel: () => void;
}

export function TrackedChangesDialog({
  open,
  changes,
  onDecide,
  onCancel,
}: TrackedChangesDialogProps): ReactElement {
  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) onCancel();
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Tracked changes present</DialogTitle>
          <DialogContent>
            <p>
              This document has <strong>{changes.length}</strong> tracked change
              {changes.length === 1 ? "" : "s"}. What should Fair Copy do before cleaning?
            </p>
            <ul
              style={{
                maxHeight: 200,
                overflow: "auto",
                fontSize: 13,
                color: "#3a3a3a",
                marginTop: 12,
              }}
            >
              {changes.slice(0, 20).map((c, i) => (
                <li key={`${c.ref.id}-${i}`}>
                  {c.kind} by {c.author} on {c.date.slice(0, 10)}
                </li>
              ))}
              {changes.length > 20 && <li>...and {changes.length - 20} more</li>}
            </ul>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onDecide("review")}>
              Review first
            </Button>
            <Button appearance="primary" onClick={() => onDecide("reject")}>
              Reject &amp; clean
            </Button>
            <Button appearance="subtle" onClick={() => onDecide("leave")}>
              Leave changes
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
