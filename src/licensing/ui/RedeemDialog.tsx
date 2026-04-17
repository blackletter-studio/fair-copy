import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogActions,
  Field,
  Input,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { redeemCode } from "../api";

const CODE_RE = /^FC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

const useStyles = makeStyles({
  error: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: tokens.spacingVerticalS,
  },
});

export interface RedeemDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export function RedeemDialog({ open, onClose, onSuccess }: RedeemDialogProps): React.JSX.Element {
  const styles = useStyles();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const normalized = code.trim().toUpperCase();
    if (!CODE_RE.test(normalized)) {
      setError("Invalid code format. Expected FC-XXXX-XXXX-XXXX.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter the email address the code was issued to.");
      return;
    }
    setSubmitting(true);
    const result = await redeemCode(normalized, email);
    setSubmitting(false);
    if (result.ok) {
      onSuccess(result.token);
      return;
    }
    if (result.status === 404) setError("Code not found. Double-check and retry.");
    else if (result.status === 409)
      setError(
        "This code was redeemed by a different email address. Contact support@blackletter.studio if you believe this is an error.",
      );
    else if (result.status === 400) setError(result.message);
    else setError(`Something went wrong (${result.message}). Try again in a moment.`);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Activate Fair Copy</DialogTitle>
          <DialogContent>
            <Field label="License code">
              <Input
                value={code}
                onChange={(_, data) => setCode(data.value)}
                placeholder="FC-XXXX-XXXX-XXXX"
                aria-label="License code"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(_, data) => setEmail(data.value)}
                placeholder="you@firm.com"
                aria-label="Email"
              />
            </Field>
            {error !== null && <Text className={styles.error}>{error}</Text>}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={submitting} onClick={() => void handleSubmit()}>
              Activate
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
