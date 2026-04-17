import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Checkbox,
} from "@fluentui/react-components";
import type { ReactElement } from "react";
import { useState } from "react";
import type { ImageInfo } from "../engine/types";

export interface ImagesDialogProps {
  open: boolean;
  images: ImageInfo[];
  defaultChoice: "keep" | "remove";
  onDecide: (choice: "keep-all" | "remove-all" | Record<string, "keep" | "remove">) => void;
  onCancel: () => void;
}

export function ImagesDialog({
  open,
  images,
  defaultChoice,
  onDecide,
  onCancel,
}: ImagesDialogProps): ReactElement {
  const [perImage, setPerImage] = useState<Record<string, "keep" | "remove">>(() => {
    const init: Record<string, "keep" | "remove"> = {};
    for (const img of images) init[img.ref.id] = defaultChoice;
    return init;
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(_, d) => {
        if (!d.open) onCancel();
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Images in this document</DialogTitle>
          <DialogContent>
            <p>
              This document contains <strong>{images.length}</strong> image
              {images.length === 1 ? "" : "s"}.
            </p>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
              {images.map((img) => (
                <li
                  key={img.ref.id}
                  style={{ padding: "8px 0", borderBottom: "1px solid #00000014" }}
                >
                  <Checkbox
                    checked={perImage[img.ref.id] === "remove"}
                    onChange={(_, data) =>
                      setPerImage({
                        ...perImage,
                        [img.ref.id]: data.checked ? "remove" : "keep",
                      })
                    }
                    label={`${img.detectedKind} (${img.width}×${img.height})${img.altText ? ` — ${img.altText}` : ""}`}
                  />
                </li>
              ))}
            </ul>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onDecide("keep-all")}>
              Keep all
            </Button>
            <Button appearance="secondary" onClick={() => onDecide("remove-all")}>
              Remove all
            </Button>
            <Button appearance="primary" onClick={() => onDecide(perImage)}>
              Apply per-image choice
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
